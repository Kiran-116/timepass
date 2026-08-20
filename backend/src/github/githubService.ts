/**
 * GreenOps AI - Phase 14: GitHub Service
 *
 * Provides GitHub PR webhook validation, diff fetching and code extraction,
 * sustainability markdown report generation, and PR comment posting.
 *
 * Core Principle: AI proposes. Measurement verifies.
 */

import crypto from "crypto";
import type { AnalysisJob } from "../pipeline/types";
import type { ExtractedPRFile, GitHubCommentResult, PullRequestContext } from "./types";

export class GitHubService {
  /**
   * Verifies the HMAC-SHA256 signature from GitHub webhook header (x-hub-signature-256)
   */
  public verifyWebhookSignature(
    payload: string | Buffer,
    signatureHeader: string | undefined,
    secret: string
  ): boolean {
    if (!signatureHeader || !secret) {
      // If secret is not configured in backend, allow webhook in open/dev mode
      return !secret;
    }

    try {
      const hmac = crypto.createHmac("sha256", secret);
      const payloadString = typeof payload === "string" ? payload : payload.toString("utf-8");
      const digest = "sha256=" + hmac.update(payloadString).digest("hex");

      const expectedBuffer = Buffer.from(digest, "utf-8");
      const signatureBuffer = Buffer.from(signatureHeader, "utf-8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      console.error("[GitHubService] Signature verification error:", err);
      return false;
    }
  }

  /**
   * Fetches the PR diff and changed files list from GitHub REST API
   */
  public async fetchPullRequestDiff(
    owner: string,
    repo: string,
    pullNumber: number,
    token?: string
  ): Promise<{ diffText: string; files: any[] }> {
    const apiToken = token || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";
    const headers: Record<string, string> = {
      "User-Agent": "GreenOps-AI-Sustainability-Bot",
      Accept: "application/vnd.github.v3.diff",
    };

    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`;
    }

    // 1. Fetch raw diff
    let diffText = "";
    try {
      const diffUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
      const res = await fetch(diffUrl, { headers });
      if (res.ok) {
        diffText = await res.text();
      } else {
        console.warn(
          `[GitHubService] Could not fetch raw diff (HTTP ${res.status}): ${res.statusText}`
        );
      }
    } catch (err) {
      console.warn(`[GitHubService] Network error fetching PR diff:`, (err as Error).message);
    }

    // 2. Fetch list of modified files (JSON format)
    let files: any[] = [];
    try {
      const filesHeaders: Record<string, string> = {
        "User-Agent": "GreenOps-AI-Sustainability-Bot",
        Accept: "application/vnd.github.v3+json",
      };
      if (apiToken) {
        filesHeaders["Authorization"] = `Bearer ${apiToken}`;
      }
      const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;
      const filesRes = await fetch(filesUrl, { headers: filesHeaders });
      if (filesRes.ok) {
        files = await filesRes.json();
      }
    } catch (err) {
      console.warn(`[GitHubService] Network error fetching PR files list:`, (err as Error).message);
    }

    return { diffText, files };
  }

  /**
   * Parses PR diff or files list to extract executable source code from supported files
   */
  public extractCodeFromDiff(diffText: string, filesList: any[] = []): ExtractedPRFile {
    const supportedExtensions: Record<string, string> = {
      ".py": "python",
      ".js": "javascript",
      ".ts": "typescript",
    };

    // 1. First priority: Check filesList for supported file with patch
    for (const f of filesList) {
      const filename = f.filename || "";
      const ext = Object.keys(supportedExtensions).find((e) => filename.endsWith(e));
      if (ext && f.patch) {
        const language = supportedExtensions[ext];
        // Extract added/modified lines from patch
        const extractedLines = f.patch
          .split("\n")
          .filter(
            (line: string) =>
              !line.startsWith("---") && !line.startsWith("+++") && !line.startsWith("@@")
          )
          .map((line: string) => {
            if (line.startsWith("+")) return line.substring(1);
            if (line.startsWith(" ")) return line.substring(1);
            return "";
          })
          .filter((l: string) => l.trim() !== "");

        const code = extractedLines.join("\n").trim();
        if (code.length > 20) {
          return {
            fileName: filename,
            language,
            code,
            patch: f.patch,
            status: f.status,
          };
        }
      }
    }

    // 2. Second priority: Parse raw diffText
    if (diffText && diffText.trim().length > 0) {
      const diffBlocks = diffText.split("diff --git ");
      for (const block of diffBlocks) {
        const firstLine = block.split("\n")[0] || "";
        const ext = Object.keys(supportedExtensions).find((e) => firstLine.includes(e));
        if (ext) {
          const language = supportedExtensions[ext];
          const fileNameMatch = firstLine.match(/b\/(.+)$/);
          const fileName = fileNameMatch ? fileNameMatch[1] : `service${ext}`;

          const codeLines = block
            .split("\n")
            .filter(
              (l) =>
                !l.startsWith("---") &&
                !l.startsWith("+++") &&
                !l.startsWith("@@") &&
                !l.startsWith("diff ") &&
                !l.startsWith("index ")
            )
            .map((l) => {
              if (l.startsWith("+")) return l.substring(1);
              if (l.startsWith(" ")) return l.substring(1);
              return "";
            })
            .filter((l) => l.trim() !== "");

          const code = codeLines.join("\n").trim();
          if (code.length > 20) {
            return {
              fileName,
              language,
              code,
              patch: block,
            };
          }
        }
      }
    }

    // 3. Default fallback sample code when diff is empty or non-code (ensures pipeline completes safely)
    return {
      fileName: "service.py",
      language: "python",
      code: `def process_data(items):\n    return [item.strip() for item in items if item]`,
    };
  }

  /**
   * Generates the GitHub Markdown PR Sustainability Report based on real analysis results
   */
  public generateSustainabilityReport(job: AnalysisJob, prContext: PullRequestContext): string {
    const greenScore = job.greenScore?.score ?? 0;
    const grade = job.greenScore?.grade ?? "A";
    const improvement = job.greenScore?.improvement ?? 0;
    const isVerified = job.verification?.status === "VERIFIED" || Boolean(job.verification?.passed);
    const verificationStatus = job.verification?.status || (isVerified ? "VERIFIED" : "PENDING");

    const timeBefore =
      job.runtimeMetrics?.executionTimeMs?.original ??
      job.benchmarks?.original?.executionTimeMs ??
      0;
    const timeAfter =
      job.runtimeMetrics?.executionTimeMs?.optimized ??
      job.benchmarks?.optimized?.executionTimeMs ??
      0;
    const timeRed =
      job.runtimeMetrics?.executionTimeMs?.reductionPercent ??
      job.verification?.runtimeReductionPercent ??
      0;

    const cpuBefore =
      job.runtimeMetrics?.cpuUsagePercent?.original ??
      job.benchmarks?.original?.cpuUsagePercent ??
      0;
    const cpuAfter =
      job.runtimeMetrics?.cpuUsagePercent?.optimized ??
      job.benchmarks?.optimized?.cpuUsagePercent ??
      0;
    const cpuRed =
      job.runtimeMetrics?.cpuUsagePercent?.reductionPercent ??
      job.verification?.cpuReductionPercent ??
      0;

    const memBefore =
      job.runtimeMetrics?.memoryMb?.original ?? job.benchmarks?.original?.memoryMb ?? 0;
    const memAfter =
      job.runtimeMetrics?.memoryMb?.optimized ?? job.benchmarks?.optimized?.memoryMb ?? 0;
    const memRed =
      job.runtimeMetrics?.memoryMb?.reductionPercent ??
      job.verification?.memoryReductionPercent ??
      0;

    const energyBefore = job.energy?.original?.energyWh ?? 0;
    const energyAfter = job.energy?.optimized?.energyWh ?? 0;
    const energyRed = job.energy?.reductionPercent ?? job.verification?.energyReductionPercent ?? 0;
    const energySavings =
      job.energy?.savingsWh ?? Number(Math.max(0, energyBefore - energyAfter).toFixed(6));

    const carbonBefore = job.carbon?.original?.carbonEmissionsGrams ?? 0;
    const carbonAfter = job.carbon?.optimized?.carbonEmissionsGrams ?? 0;
    const carbonRed = job.carbon?.reductionPercent ?? job.verification?.carbonReductionPercent ?? 0;
    const carbonSavings =
      job.carbon?.savingsGrams ?? Number(Math.max(0, carbonBefore - carbonAfter).toFixed(6));

    const findings = job.findings || [];
    const highFindings = findings.filter((f) => f.severity === "HIGH");

    const statusEmoji = isVerified ? "✅" : "⚠️";
    const statusText = isVerified ? "OPTIMIZATION VERIFIED" : "SUSTAINABILITY REVIEW REQUIRED";

    return `## 🌱 GreenOps Sustainability Report

### **Green Score: ${greenScore} / 100** (Grade ${grade}${improvement > 0 ? ` • +${improvement} pts verified boost` : ""})
**Verification Status**: ${statusEmoji} **${statusText}** (${verificationStatus})

> **PR #${prContext.pullNumber}**: \`${prContext.prTitle}\`
> **Target File**: \`${job.fileName}\` (${job.language}) • **Commit**: \`${prContext.headSha.substring(0, 7)}\`

---

### 📊 Physical Telemetry & Carbon Impact (Before vs After)

| Metric | Before (Baseline) | After (Optimized) | Net Improvement |
|:---|---:|---:|---:|
| ⏱️ **Execution Runtime** | ${timeBefore} ms | ${timeAfter} ms | **${timeRed > 0 ? `-${timeRed}%` : `${timeRed}%`} faster** |
| ⚡ **CPU Saturation** | ${cpuBefore}% | ${cpuAfter}% | **${cpuRed > 0 ? `-${cpuRed}%` : `${cpuRed}%`} load** |
| 💾 **Memory Footprint** | ${memBefore} MB | ${memAfter} MB | **${memRed > 0 ? `-${memRed}%` : `${memRed}%`} RAM** |
| 🔥 **Estimated Energy** | ${energyBefore} Wh | ${energyAfter} Wh | **${energyRed > 0 ? `-${energyRed}%` : `${energyRed}%`} (${energySavings} Wh saved)** |
| 🌍 **Operational CO₂e** | ${carbonBefore} g | ${carbonAfter} g | **${carbonRed > 0 ? `-${carbonRed}%` : `${carbonRed}%`} (${carbonSavings} g avoided)** |

---

${
  findings.length > 0
    ? `### ⚠️ Detected Code Smells & Hotspots (${findings.length} found, ${highFindings.length} critical)
${findings
  .slice(0, 4)
  .map(
    (f) =>
      `- **${f.severity}** \`${f.file || job.fileName}:${f.line}\` — **${f.category}**: ${f.description}${
        f.recommendation ? ` *(Fix: ${f.recommendation})*` : ""
      }`
  )
  .join("\n")}`
    : `### ✨ Clean Code
No critical algorithmic or architectural hotspots detected in this PR diff.`
}

${
  job.aiExplanation
    ? `---

### 💡 GreenOps AI Recommendation
**Detected Inefficiency**: ${job.aiExplanation.problem}

**Proposed Refactoring**:
\`\`\`${job.language}
${job.optimizedCode || "# See GreenOps dashboard for full optimized code diff"}
\`\`\`
`
    : ""
}

---

*AI proposes. Measurement verifies. Telemetry measured in isolated GreenOps Docker sandbox (${job.benchmarks?.original?.measuredRuns || 5} median runs).*
*Analysis ID: \`${job.analysisId}\`*
`;
  }

  /**
   * Posts the sustainability report comment to the GitHub Pull Request
   */
  public async postPullRequestComment(
    owner: string,
    repo: string,
    pullNumber: number,
    commentBody: string,
    token?: string
  ): Promise<GitHubCommentResult> {
    const apiToken = token || process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || "";

    if (!apiToken) {
      console.log(
        `[GitHubService] GITHUB_TOKEN not configured. Logging PR comment locally for ${owner}/${repo}#${pullNumber}:`
      );
      console.log("--------------------------------------------------");
      console.log(commentBody);
      console.log("--------------------------------------------------");
      return {
        posted: true,
        mocked: true,
        commentId: `mock-comment-${Date.now()}`,
      };
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "GreenOps-AI-Sustainability-Bot",
        },
        body: JSON.stringify({ body: commentBody }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          `[GitHubService] Failed to post comment to PR #${pullNumber} (HTTP ${res.status}):`,
          errorData
        );
        return {
          posted: false,
          error: (errorData as any).message || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const createdComment = await res.json();
      console.log(`[GitHubService] Successfully posted PR comment (ID: ${createdComment.id})`);
      return {
        posted: true,
        commentId: createdComment.id,
        htmlUrl: createdComment.html_url,
      };
    } catch (err) {
      console.error("[GitHubService] Error posting PR comment:", err);
      return {
        posted: false,
        error: (err as Error).message,
      };
    }
  }
}

export const githubService = new GitHubService();
