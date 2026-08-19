/**
 * GreenOps AI - Phase 11 Integration Tests
 * 
 * End-to-End Analysis Pipeline Integration Tests:
 * 1. Full pipeline execution: Code -> Static Analyzer -> AI Explanation -> AI Optimization
 *    -> Original Benchmark -> Optimized Benchmark -> Energy -> Carbon -> Verification -> Green Score
 * 2. Async job lifecycle & stage progress tracking
 * 3. Validation error handling for empty/invalid code input
 * 4. PipelineStore caching & recent jobs lookup
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { analysisPipeline } from "../analysisPipeline";
import { pipelineStore } from "../pipelineStore";

describe("Phase 11: End-to-End Analysis Pipeline Integration Tests", () => {
  it("should execute complete analysis workflow end-to-end and generate unified results", async () => {
    const pythonCode = `def find_matching_pairs(users, items):
    results = []
    for i in range(len(users)):
        for j in range(len(items)):
            if users[i] == items[j]:
                results.append((users[i], items[j]))
    return results`;

    const job = await analysisPipeline.executePipeline(
      {
        code: pythonCode,
        language: "python",
        fileName: "matching.py",
        region: "global",
        warmupRuns: 1,
        measuredRuns: 2,
        timeoutMs: 5000,
      },
      { sync: true }
    );

    // 1. Check Job Metadata
    assert.ok(job.analysisId.startsWith("analysis-"));
    assert.strictEqual(job.status, "COMPLETED");
    assert.strictEqual(job.stage, "COMPLETED");
    assert.strictEqual(job.stageProgress, 100);
    assert.strictEqual(job.language, "python");
    assert.strictEqual(job.originalCode, pythonCode);
    assert.ok(typeof job.optimizedCode === "string" && job.optimizedCode.length > 0);

    // 2. Check Static Findings
    assert.ok(Array.isArray(job.findings));
    assert.ok(job.findings.length > 0, "Should detect nested loop hotspot");
    assert.strictEqual(job.findings[0].category, "NESTED_ITERATION");

    // 3. Check AI Explanation
    assert.ok(job.aiExplanation);
    assert.ok(job.aiExplanation.problem.length > 0);
    assert.ok(job.aiExplanation.whyItMatters.length > 0);
    assert.ok(job.aiExplanation.optimization.length > 0);
    assert.ok(["lower", "similar", "higher"].includes(job.aiExplanation.expectedImpact.cpu));

    // 4. Check Benchmarks & Runtime Metrics
    assert.ok(job.benchmarks);
    assert.ok(job.benchmarks.original);
    assert.ok(job.benchmarks.optimized);
    assert.strictEqual(job.benchmarks.original.status, "COMPLETED");
    assert.strictEqual(job.benchmarks.optimized.status, "COMPLETED");

    assert.ok(job.runtimeMetrics);
    assert.ok(job.runtimeMetrics.executionTimeMs.original >= 0);
    assert.ok(job.runtimeMetrics.cpuUsagePercent.original >= 0);
    assert.ok(job.runtimeMetrics.memoryMb.original >= 0);

    // 5. Check Energy Measurements
    assert.ok(job.energy);
    assert.ok(job.energy.original.energyWh >= 0);
    assert.ok(job.energy.optimized.energyWh >= 0);
    assert.strictEqual(job.energy.original.measurementType, "ESTIMATED");

    // 6. Check Carbon Emissions
    assert.ok(job.carbon);
    assert.ok(job.carbon.original.carbonEmissionsGrams >= 0);
    assert.ok(job.carbon.optimized.carbonEmissionsGrams >= 0);
    assert.strictEqual(job.carbon.region, "global");

    // 7. Check Verification Engine Results
    assert.ok(job.verification);
    assert.ok(["VERIFIED", "REJECTED"].includes(job.verification.status));
    assert.ok(job.verification.checks.length >= 4);

    // 8. Check Green Score
    assert.ok(job.greenScore);
    assert.ok(job.greenScore.score >= 0 && job.greenScore.score <= 100);
    assert.ok(["A+", "A", "B", "C", "D", "F"].includes(job.greenScore.grade));
    assert.ok(job.greenScore.breakdown.energyEfficiency >= 0);
    assert.ok(job.greenScore.breakdown.computeEfficiency >= 0);
    assert.ok(job.greenScore.breakdown.memoryEfficiency >= 0);
    assert.ok(job.greenScore.breakdown.codeQuality >= 0);

    // 9. Check Summary
    assert.ok(job.summary);
    assert.ok(job.summary.totalFindings > 0);
    assert.strictEqual(job.summary.greenScore, job.greenScore.score);
  });

  it("should create queued job for asynchronous execution and store in pipelineStore", async () => {
    const jsCode = `function processItems(items) {
      return items.map(item => item * 2);
    }`;

    const job = await analysisPipeline.executePipeline({
      code: jsCode,
      language: "javascript",
      fileName: "process.js",
    });

    assert.ok(job.analysisId);
    assert.ok(["QUEUED", "PROCESSING", "COMPLETED"].includes(job.status));

    // Lookup in store
    const retrieved = pipelineStore.getJob(job.analysisId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved?.analysisId, job.analysisId);
  });

  it("should throw validation error when code is empty or missing", async () => {
    await assert.rejects(
      async () => {
        await analysisPipeline.executePipeline({ code: "" });
      },
      /Code is required/
    );
  });

  it("should track recent jobs in pipeline store", () => {
    const recent = pipelineStore.getRecentJobs(10);
    assert.ok(Array.isArray(recent));
    assert.ok(recent.length > 0);
  });
});
