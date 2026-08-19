/**
 * GreenOps AI - Phase 10 Unit Tests
 * 
 * Unit tests for Green Score Engine covering:
 * 1. Deterministic baseline scoring
 * 2. Penalty impact from static findings (High, Medium, Low)
 * 3. Verification boost elevating score
 * 4. Dimensional breakdown (Energy, Compute, Memory, Quality)
 * 5. Grade mappings (A+, A, B, C, D, F)
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import type { VerificationResult } from "../../verification/types";
import { GreenScoreEngine, greenScoreEngine } from "../greenScoreEngine";

describe("Phase 10: Green Score Engine Unit Tests", () => {
  it("should calculate baseline score deterministically for clean code", () => {
    const result1 = greenScoreEngine.calculateScore({ findings: [] });
    const result2 = greenScoreEngine.calculateScore({ findings: [] });

    assert.strictEqual(result1.score, result2.score);
    assert.strictEqual(result1.grade, result2.grade);
    assert.ok(result1.score >= 80, `Expected >= 80 for clean code, got ${result1.score}`);
    assert.strictEqual(result1.breakdown.codeQuality, 100);
  });

  it("should apply severe penalties for multiple HIGH severity static findings", () => {
    const result = greenScoreEngine.calculateScore({
      findings: [
        { category: "NESTED_ITERATION", severity: "HIGH", description: "", file: "", line: 1, recommendation: "" },
        { category: "N_PLUS_ONE_QUERY", severity: "HIGH", description: "", file: "", line: 2, recommendation: "" },
        { category: "REPEATED_API_CALL", severity: "HIGH", description: "", file: "", line: 3, recommendation: "" },
      ],
    });

    assert.ok(result.score < 70, `Expected penalized score < 70, got ${result.score}`);
    assert.ok(result.breakdown.codeQuality <= 55, `Expected codeQuality <= 55, got ${result.breakdown.codeQuality}`);
  });

  it("should elevate score when verified optimization is present", () => {
    const mockVerification: VerificationResult = {
      verificationId: "ver-123",
      status: "VERIFIED",
      passed: true,
      summary: "Verified 67% reduction",
      energyReductionPercent: 67.2,
      carbonReductionPercent: 67.2,
      runtimeReductionPercent: 69.7,
      cpuReductionPercent: 52.4,
      memoryReductionPercent: 47.8,
      metrics: {} as any,
      checks: [],
      verifiedBy: "GreenOps Verification Engine",
      verifiedAt: new Date().toISOString(),
    };

    const result = greenScoreEngine.calculateScore({
      findings: [
        { category: "NESTED_ITERATION", severity: "HIGH", description: "", file: "", line: 1, recommendation: "" },
      ],
      originalBenchmark: { executionTimeMs: 2410, cpuUsagePercent: 82, memoryMb: 184 } as any,
      originalEnergy: { energyWh: 0.061 } as any,
      originalCarbon: { carbonEmissionsGrams: 0.043 } as any,
      verificationResult: mockVerification,
    });

    assert.ok(result.optimizedScore > result.originalScore, "Optimized score should be higher than original");
    assert.strictEqual(result.score, result.optimizedScore);
    assert.ok(result.improvement > 0, "Improvement should be positive");
    assert.ok(result.summary.includes("boost"), "Summary should mention boost");
  });

  it("should map scores to correct letter grades", () => {
    const engine = new GreenScoreEngine();
    assert.strictEqual(engine.scoreToGrade(95), "A+");
    assert.strictEqual(engine.scoreToGrade(85), "A");
    assert.strictEqual(engine.scoreToGrade(75), "B");
    assert.strictEqual(engine.scoreToGrade(65), "C");
    assert.strictEqual(engine.scoreToGrade(55), "D");
    assert.strictEqual(engine.scoreToGrade(35), "F");
  });
});
