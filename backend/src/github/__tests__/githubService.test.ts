/**
 * GreenOps AI - Phase 14: GitHub PR Integration Tests
 *
 * Validates:
 * 1. HMAC-SHA256 signature generation and validation
 * 2. Diff extraction from GitHub patch formats
 * 3. Sustainability Markdown report formatting & table generation
 * 4. Comment posting in mock and local environments
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import crypto from "node:crypto";
import { githubService } from "../githubService";
import type { AnalysisJob } from "../../pipeline/types";
import type { PullRequestContext } from "../types";

describe("Phase 14: GitHub PR Integration Tests", () => {
  const testSecret = "greenops-test-secret-12345";

  it("should correctly verify valid HMAC-SHA256 webhook signatures", () => {
    const payload = JSON.stringify({ action: "opened", number: 42 });
    const hmac = crypto.createHmac("sha256", testSecret);
    const signature = "sha256=" + hmac.update(payload).digest("hex");

    const isValid = githubService.verifyWebhookSignature(payload, signature, testSecret);
    assert.strictEqual(isValid, true, "Signature verification should pass for matching hash");
  });

  it("should reject invalid webhook signatures", () => {
    const payload = JSON.stringify({ action: "opened", number: 42 });
    const fakeSignature = "sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    const isValid = githubService.verifyWebhookSignature(payload, fakeSignature, testSecret);
    assert.strictEqual(isValid, false, "Signature verification should fail for invalid signature");
  });

  it("should extract modified code lines from patch diff", () => {
    const patch = `@@ -1,5 +1,6 @@
 def compute(items):
-    res = []
+    result = set()
+    for x in items:
+        result.add(x * 2)
+    return list(result)`;

    const files = [
      {
        filename: "src/algorithm.py",
        patch,
        status: "modified",
      },
    ];

    const extracted = githubService.extractCodeFromDiff("", files);
    assert.strictEqual(extracted.fileName, "src/algorithm.py");
    assert.strictEqual(extracted.language, "python");
    assert.ok(extracted.code.includes("result = set()"));
    assert.ok(extracted.code.includes("result.add(x * 2)"));
  });

  it("should generate a complete, formatted Sustainability Report markdown", () => {
    const mockJob: AnalysisJob = {
      analysisId: "test-analysis-14",
      type: "PR",
      status: "COMPLETED",
      stage: "COMPLETED",
      stageProgress: 100,
      language: "python",
      fileName: "payment_processor.py",
      originalCode: "def process(): pass",
      optimizedCode: "def process_optimized(): pass",
      greenScore: {
        score: 84,
        grade: "B",
        improvement: 16,
        scoreBefore: 68,
        scoreAfter: 84,
        breakdown: {
          runtimeScore: 85,
          cpuScore: 80,
          memoryScore: 90,
          energyScore: 82,
          carbonScore: 83,
        },
      },
      verification: {
        status: "VERIFIED",
        passed: true,
        runtimeReductionPercent: 45.2,
        cpuReductionPercent: 38.0,
        memoryReductionPercent: 22.5,
        energyReductionPercent: 42.1,
        carbonReductionPercent: 42.1,
      },
      benchmarks: {
        original: {
          executionTimeMs: 120.5,
          cpuUsagePercent: 65.0,
          memoryMb: 85.0,
          measuredRuns: 5,
        },
        optimized: {
          executionTimeMs: 66.0,
          cpuUsagePercent: 40.3,
          memoryMb: 65.8,
          measuredRuns: 5,
        },
      },
      energy: {
        original: { energyWh: 0.082 },
        optimized: { energyWh: 0.047 },
        reductionPercent: 42.1,
        savingsWh: 0.035,
      },
      carbon: {
        original: { carbonEmissionsGrams: 0.041 },
        optimized: { carbonEmissionsGrams: 0.024 },
        reductionPercent: 42.1,
        savingsGrams: 0.017,
      },
      findings: [
        {
          id: "smell-1",
          severity: "HIGH",
          category: "ALGORITHMIC_COMPLEXITY",
          description: "O(n^2) nested lookup detected in payment reconciliation loop",
          recommendation: "Use dictionary key index lookup",
          line: 18,
          file: "payment_processor.py",
        },
      ],
      aiExplanation: {
        problem: "Quadratic time complexity in transaction matching loop",
        solution: "Pre-indexed hash map for instant key matching",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prContext: PullRequestContext = {
      owner: "acme-corp",
      repo: "fintech-service",
      pullNumber: 99,
      prTitle: "Optimize payment processor transaction matching",
      prUrl: "https://github.com/acme-corp/fintech-service/pull/99",
      headSha: "a1b2c3d4e5f6",
      baseSha: "f6e5d4c3b2a1",
      action: "opened",
    };

    const report = githubService.generateSustainabilityReport(mockJob, prContext);

    assert.ok(report.includes("🌱 GreenOps Sustainability Report"), "Should include title header");
    assert.ok(report.includes("Green Score: 84 / 100"), "Should include Green Score");
    assert.ok(report.includes("PR #99"), "Should reference PR number");
    assert.ok(report.includes("payment_processor.py"), "Should reference analyzed file");
    assert.ok(report.includes("Physical Telemetry & Carbon Impact"), "Should include telemetry table");
    assert.ok(report.includes("Execution Runtime"), "Should include runtime row");
    assert.ok(report.includes("Operational CO₂e"), "Should include carbon row");
    assert.ok(report.includes("Detected Inefficiency"), "Should include AI recommendation section");
  });

  it("should post or mock comment when GITHUB_TOKEN is omitted in local dev", async () => {
    const result = await githubService.postPullRequestComment(
      "test-owner",
      "test-repo",
      42,
      "## Test Comment Body"
    );

    assert.strictEqual(result.posted, true);
    assert.strictEqual(result.mocked, true);
    assert.ok(result.commentId);
  });

  it("should successfully execute full end-to-end PR analysis pipeline via GitHub webhook payload", async () => {
    const { analysisPipeline } = await import("../../pipeline/analysisPipeline");
    const testCode = `def find_duplicates(numbers):
    duplicates = []
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] == numbers[j] and numbers[i] not in duplicates:
                duplicates.append(numbers[i])
    return duplicates`;

    const job = await analysisPipeline.executePipeline(
      {
        code: testCode,
        language: "python",
        fileName: "duplicates.py",
        type: "PR",
        prNumber: 55,
        repoFullName: "greenops-ai/demo-repo",
        commitSha: "c0ffee123456",
        prTitle: "Optimize duplicate checking algorithm",
        prUrl: "https://github.com/greenops-ai/demo-repo/pull/55",
        warmupRuns: 1,
        measuredRuns: 3,
      },
      { sync: true }
    );

    assert.strictEqual(job.type, "PR");
    assert.strictEqual(job.status, "COMPLETED");
    assert.ok(job.greenScore && job.greenScore.score > 0);
    assert.ok(job.energy);
    assert.ok(job.carbon);
    assert.ok(job.verification);

    const prContext: PullRequestContext = {
      owner: "greenops-ai",
      repo: "demo-repo",
      pullNumber: 55,
      prTitle: "Optimize duplicate checking algorithm",
      prUrl: "https://github.com/greenops-ai/demo-repo/pull/55",
      headSha: "c0ffee123456",
      baseSha: "base123456",
      action: "opened",
    };

    const report = githubService.generateSustainabilityReport(job, prContext);
    assert.ok(report.includes("🌱 GreenOps Sustainability Report"));
    assert.ok(report.includes("PR #55"));
  });
});
