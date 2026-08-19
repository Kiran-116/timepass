/**
 * GreenOps AI - Phase 10 Unit Tests
 * 
 * Unit tests for Green Score Engine covering:
 * 1. Same input -> same score (Determinism)
 * 2. Score bounds enforcement (0 to 100)
 * 3. Workload improvement increases score
 * 4. Workload regression decreases score
 * 5. Missing data -> INSUFFICIENT_DATA status
 * 6. Invalid / NaN / Infinity inputs -> INVALID_INPUT status
 * 7. Breakdown consistency
 * 8. Methodology version tracking
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { GreenScoreEngine, greenScoreEngine } from "../greenScoreEngine.ts";
import type { GreenScoreInput } from "../types.ts";

describe("Phase 10: Green Score Engine Unit Tests", () => {
  const sampleInput: GreenScoreInput = {
    telemetry: {
      executionTimeMs: 150,
      cpuUsagePercent: 35,
      memoryMb: 128
    },
    energy: {
      energyWh: 0.005
    } as any,
    carbon: {
      carbonEmissionsGrams: 0.002
    } as any
  };

  // Test 1: Determinism (Same input -> Same output score)
  it("should generate identical scores for identical workload inputs (Determinism)", () => {
    const result1 = greenScoreEngine.calculateScore(sampleInput);
    const result2 = greenScoreEngine.calculateScore(sampleInput);

    assert.strictEqual(result1.status, "CALCULATED");
    assert.strictEqual(result2.status, "CALCULATED");
    assert.strictEqual(result1.score, result2.score);
    assert.strictEqual(result1.rating, result2.rating);
    assert.deepStrictEqual(result1.breakdown, result2.breakdown);
  });

  // Test 2: Valid Score Range Enforcement (0 to 100)
  it("should enforce strict bounds (0 <= score <= 100) across extreme inputs", () => {
    const heavyWorkload: GreenScoreInput = {
      telemetry: { executionTimeMs: 100000, cpuUsagePercent: 100, memoryMb: 16384 },
      energy: { energyWh: 50.0 } as any,
      carbon: { carbonEmissionsGrams: 25.0 } as any
    };

    const tinyWorkload: GreenScoreInput = {
      telemetry: { executionTimeMs: 1, cpuUsagePercent: 1, memoryMb: 10 },
      energy: { energyWh: 0.00001 } as any,
      carbon: { carbonEmissionsGrams: 0.000004 } as any
    };

    const heavyResult = greenScoreEngine.calculateScore(heavyWorkload);
    const tinyResult = greenScoreEngine.calculateScore(tinyWorkload);

    assert.ok(heavyResult.score! >= 0 && heavyResult.score! <= 100);
    assert.ok(tinyResult.score! >= 0 && tinyResult.score! <= 100);
    assert.ok(tinyResult.score! > heavyResult.score!);
  });

  // Test 3: Improved Workload Score Increase
  it("should report IMPROVED status and score delta when optimization reduces energy/runtime", () => {
    const baselineInput: GreenScoreInput = {
      telemetry: { executionTimeMs: 2500, cpuUsagePercent: 85, memoryMb: 512 },
      energy: { energyWh: 0.08 } as any,
      carbon: { carbonEmissionsGrams: 0.032 } as any
    };

    const optimizedInput: GreenScoreInput = {
      telemetry: { executionTimeMs: 400, cpuUsagePercent: 30, memoryMb: 128 },
      energy: { energyWh: 0.012 } as any,
      carbon: { carbonEmissionsGrams: 0.0048 } as any
    };

    const comparison = greenScoreEngine.compareScores(baselineInput, optimizedInput);

    assert.strictEqual(comparison.status, "IMPROVED");
    assert.ok(comparison.scoreDelta! > 0, "Score delta must be positive for optimization");
    assert.ok(comparison.afterScore.score! > comparison.beforeScore.score!);
  });

  // Test 4: Regressed Workload Score Decrease
  it("should report REGRESSED status and negative delta when optimization increases energy", () => {
    const baselineInput: GreenScoreInput = {
      telemetry: { executionTimeMs: 200, cpuUsagePercent: 20, memoryMb: 128 },
      energy: { energyWh: 0.005 } as any,
      carbon: { carbonEmissionsGrams: 0.002 } as any
    };

    const regressedInput: GreenScoreInput = {
      telemetry: { executionTimeMs: 3500, cpuUsagePercent: 90, memoryMb: 1024 },
      energy: { energyWh: 0.12 } as any,
      carbon: { carbonEmissionsGrams: 0.048 } as any
    };

    const comparison = greenScoreEngine.compareScores(baselineInput, regressedInput);

    assert.strictEqual(comparison.status, "REGRESSED");
    assert.ok(comparison.scoreDelta! < 0, "Score delta must be negative for regression");
    assert.ok(comparison.afterScore.score! < comparison.beforeScore.score!);
  });

  // Test 5: Missing Data -> INSUFFICIENT_DATA Status
  it("should return INSUFFICIENT_DATA status when metrics are empty or missing", () => {
    const result = greenScoreEngine.calculateScore({});

    assert.strictEqual(result.status, "INSUFFICIENT_DATA");
    assert.strictEqual(result.score, null);
    assert.strictEqual(result.rating, "N/A");
    assert.strictEqual(result.breakdown, null);
    assert.ok(result.explanation.includes("Insufficient telemetry"));
  });

  // Test 6: Invalid / NaN / Negative Inputs -> INVALID_INPUT Status
  it("should return INVALID_INPUT status when metrics contain NaN or negative values", () => {
    const invalidInput: GreenScoreInput = {
      telemetry: { executionTimeMs: NaN, cpuUsagePercent: -10, memoryMb: 512 }
    };

    const result = greenScoreEngine.calculateScore(invalidInput);

    assert.strictEqual(result.status, "INVALID_INPUT");
    assert.strictEqual(result.score, null);
  });

  // Test 7: Breakdown Consistency & Product Metric Notice
  it("should provide transparent dimension breakdown and product metric notice", () => {
    const result = greenScoreEngine.calculateScore(sampleInput);

    assert.ok(result.breakdown !== null);
    assert.ok(typeof result.breakdown.energyEfficiency === "number");
    assert.ok(typeof result.breakdown.computeEfficiency === "number");
    assert.ok(typeof result.breakdown.memoryEfficiency === "number");
    assert.ok(typeof result.breakdown.carbonEfficiency === "number");
    assert.ok(result.isProductMetricNotice.includes("product metric"));
  });

  // Test 8: Methodology Version Tracking
  it("should include methodology version v1.0 in output", () => {
    const result = greenScoreEngine.calculateScore(sampleInput);

    assert.strictEqual(result.methodologyVersion, "v1.0");
  });
});
