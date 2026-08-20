import { Request, Response, Router } from "express";
import { analysisPipeline } from "../pipeline/analysisPipeline";
import { pipelineStore } from "../pipeline/pipelineStore";
import { githubService } from "../github/githubService";
import type { GitHubWebhookPayload, PullRequestContext } from "../github/types";

const router = Router();

// Idempotency cache: stores delivery IDs and PR event hashes processed in recent 10 minutes
const processedDeliveries = new Map<string, { timestamp: number; analysisId?: string }>();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

// Periodic cleanup of stale idempotency keys
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of processedDeliveries.entries()) {
    if (now - val.timestamp > CLEANUP_INTERVAL_MS) {
      processedDeliveries.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * POST /api/github/webhook - Receive and process GitHub PR webhook events
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const event = (req.headers["x-github-event"] as string) || "unknown";
    const deliveryId = (req.headers["x-github-delivery"] as string) || `delivery-${Date.now()}`;
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "";

    // 1. Signature Validation (if secret configured)
    if (webhookSecret) {
      const rawPayload = JSON.stringify(req.body);
      const isValid = githubService.verifyWebhookSignature(rawPayload, signature, webhookSecret);
      if (!isValid) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid GitHub webhook HMAC-SHA256 signature",
        });
        return;
      }
    }

    // 2. Handle ping event
    if (event === "ping") {
      res.status(200).json({
        status: "ok",
        message: "Pong! GreenOps AI GitHub webhook connection verified.",
        zen: req.body.zen,
        hookId: req.body.hook_id,
      });
      return;
    }

    // 3. Filter for pull_request events
    if (event !== "pull_request") {
      res.status(200).json({
        status: "ignored",
        event,
        message: `Event type '${event}' is received but ignored. GreenOps analyzes 'pull_request' events.`,
      });
      return;
    }

    const payload: GitHubWebhookPayload = req.body;
    const action = payload.action || "opened";
    const pr = payload.pull_request;
    const repo = payload.repository;

    // Supported PR actions
    const supportedActions = ["opened", "synchronize", "reopened", "labeled"];
    if (!supportedActions.includes(action)) {
      res.status(200).json({
        status: "ignored",
        action,
        message: `Pull request action '${action}' ignored. Supported actions: ${supportedActions.join(", ")}`,
      });
      return;
    }

    if (!pr || !repo) {
      res.status(400).json({
        error: "Bad Request",
        message: "Missing pull_request or repository information in webhook payload.",
      });
      return;
    }

    const owner = repo.owner?.login || "owner";
    const repoName = repo.name || "repo";
    const pullNumber = pr.number || payload.number || 1;
    const headSha = pr.head?.sha || "0000000";
    const baseSha = pr.base?.sha || "0000000";
    const prTitle = pr.title || `Pull Request #${pullNumber}`;
    const prUrl = pr.html_url || `https://github.com/${owner}/${repoName}/pull/${pullNumber}`;

    const prContext: PullRequestContext = {
      owner,
      repo: repoName,
      pullNumber,
      prTitle,
      prUrl,
      headSha,
      baseSha,
      action,
      deliveryId,
    };

    // 4. Idempotency Check (prevent duplicate processing for same delivery or PR commit)
    const idempotencyKey = `${deliveryId}:${owner}/${repoName}#${pullNumber}@${headSha}`;
    if (processedDeliveries.has(idempotencyKey)) {
      const existing = processedDeliveries.get(idempotencyKey)!;
      res.status(200).json({
        status: "duplicate",
        message: "Duplicate webhook delivery detected. Analysis already executed or in progress.",
        analysisId: existing.analysisId,
      });
      return;
    }

    processedDeliveries.set(idempotencyKey, { timestamp: Date.now() });

    // 5. Code extraction from PR diff or direct override
    let extractedCode = "";
    let language = "python";
    let fileName = "service.py";

    // Direct code override support (useful for direct testing or mocked webhooks)
    if (typeof (req.body as any).code === "string" && (req.body as any).code.trim().length > 0) {
      extractedCode = (req.body as any).code;
      language = (req.body as any).language || "python";
      fileName = (req.body as any).fileName || "service.py";
    } else {
      // Fetch real diff from GitHub API
      const { diffText, files } = await githubService.fetchPullRequestDiff(
        owner,
        repoName,
        pullNumber
      );
      const extracted = githubService.extractCodeFromDiff(diffText, files);
      extractedCode = extracted.code;
      language = extracted.language;
      fileName = extracted.fileName;
    }

    const isSync = req.query.sync === "true";

    // 6. Workflow Execution Function
    const executePRWorkflow = async (): Promise<any> => {
      // Trigger complete Phase 11 verified pipeline
      const job = await analysisPipeline.executePipeline(
        {
          code: extractedCode,
          language,
          fileName,
          type: "PR",
          prNumber: pullNumber,
          repoFullName: repo.full_name || `${owner}/${repoName}`,
          commitSha: headSha,
          prTitle,
          prUrl,
          warmupRuns: 2,
          measuredRuns: 5,
        },
        { sync: true }
      );

      // Generate markdown report
      const reportMarkdown = githubService.generateSustainabilityReport(job, prContext);

      // Save report in pipeline store
      pipelineStore.updateJob(job.analysisId, {
        reportMarkdown,
        prNumber: pullNumber,
        repoFullName: repo.full_name || `${owner}/${repoName}`,
        commitSha: headSha,
      });

      // Post comment back to PR
      const commentResult = await githubService.postPullRequestComment(
        owner,
        repoName,
        pullNumber,
        reportMarkdown
      );

      return {
        job,
        reportMarkdown,
        commentResult,
      };
    };

    if (isSync) {
      const result = await executePRWorkflow();
      processedDeliveries.set(idempotencyKey, {
        timestamp: Date.now(),
        analysisId: result.job.analysisId,
      });
      res.status(200).json({
        status: "completed",
        message: "PR Sustainability analysis completed and report generated.",
        analysisId: result.job.analysisId,
        score: result.job.greenScore?.score ?? 0,
        verificationStatus: result.job.verification?.status,
        energyReductionPercent: result.job.energy?.reductionPercent ?? 0,
        carbonReductionPercent: result.job.carbon?.reductionPercent ?? 0,
        commentResult: result.commentResult,
        reportMarkdown: result.reportMarkdown,
      });
    } else {
      // Async: Initiate pipeline in background and return 202 Accepted immediately
      setImmediate(() => {
        executePRWorkflow()
          .then((res) => {
            processedDeliveries.set(idempotencyKey, {
              timestamp: Date.now(),
              analysisId: res.job.analysisId,
            });
            console.log(
              `[GitHub PR Webhook] PR #${pullNumber} analysis completed. Job: ${res.job.analysisId}`
            );
          })
          .catch((err) => {
            console.error(`[GitHub PR Webhook] PR #${pullNumber} analysis failed:`, err);
          });
      });

      res.status(202).json({
        status: "accepted",
        event: "pull_request",
        action,
        prNumber: pullNumber,
        repository: `${owner}/${repoName}`,
        commitSha: headSha,
        message: "GitHub PR webhook accepted. GreenOps analysis pipeline initiated in background.",
      });
    }
  } catch (error) {
    console.error("[GitHub Webhook Error]:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: (error as Error).message || "Failed to process GitHub webhook",
    });
  }
});

// POST /api/github/connect - Connect repository
router.post("/connect", (req: Request, res: Response) => {
  const { repositoryUrl } = req.body;
  res.status(200).json({
    message: "GitHub repository connection endpoint",
    connected: Boolean(repositoryUrl),
    repositoryUrl: repositoryUrl || null,
  });
});

// GET /api/github/repos - List accessible repositories
router.get("/repos", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "GitHub repositories listing endpoint",
    repositories: [
      {
        id: 101,
        name: "greenops-demo-service",
        full_name: "greenops-ai/greenops-demo-service",
        language: "python",
        default_branch: "main",
      },
    ],
  });
});

// GET /api/github/repos/:owner/:repo/pulls - List pull requests
router.get("/repos/:owner/:repo/pulls", (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  res.status(200).json({
    message: `GitHub pull requests endpoint for ${owner}/${repo}`,
    pullRequests: [
      {
        number: 42,
        title: "perf: Optimize nested data aggregation loop",
        state: "open",
        head: { ref: "perf/optimize-loop", sha: "e4a8f9c" },
        base: { ref: "main", sha: "1a2b3c4" },
      },
    ],
  });
});

export default router;
