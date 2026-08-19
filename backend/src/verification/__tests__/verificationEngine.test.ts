/**
 * GreenOps AI - Phase 9 Unit Tests
 * 
 * Unit tests for Verification Engine covering:
 * 1. Verification of valid optimization with energy & carbon reduction
 * 2. Rejection of optimizations where energy consumption worsens (regression)
 * 3. Rejection when benchmark execution fails
 * 4. Verification rules checklist evaluation
 * 5. Deterministic metric comparison & reduction percentage calculations
 * 6. Edge cases: zero metrics, missing fields validation
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import type { BenchmarkResult } from "../../benchmark/types";
import type { CarbonCalculationResult } from "../../carbon/carbonEngine";
import type { EnergyCalculationResult } from "../../energy/energyEngine";
import type { VerificationInputContext } from "../types";
import { VerificationEngine, verificationEngine } from "../verificationEngine";

function createMockBenchmark(overrides: Partial<BenchmarkResult> = {}): BenchmarkResult {
  return {
    benchmarkId: "bm-mock-1",
    status: "COMPLETED",
    language: "python",
    fileName: "service.py",
    codeVersion: "BASE",
    executionTimeMs: 2410,
    cpuUsagePercent: 82,
    memoryMb: 184,
    statistics: {
      executionTimeMs: { median: 2410, average: 2410, min: 2400, max: 2420 },
      cpuUsagePercent: { median: 82, average: 82, min: 80, max: 84 },
      memoryMb: { median: 184, average: 184, min: 180, max: 188 },
    },
    warmupRuns: 2,
    measuredRuns: 5,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockEnergy(overrides: Partial<EnergyCalculationResult> = {}): EnergyCalculationResult {
  return {
    energyWh: 0.061,
    energyJoules: 219.6,
    estimatedPowerWatts: 91.08,
    executionTimeMs: 2410,
    durationHours: 0.00066944,
    measurementType: "ESTIMATED",
    estimationMethod: "power_model_interpolation",
    confidence: 0.75,
    confidenceLabel: "MEDIUM",
    isEstimate: true,
    powerModelId: "server-epyc-cloud",
    powerModelName: "Cloud AMD EPYC Server Instance",
    breakdown: {
      baselinePowerWatts: 50,
      dynamicPowerWatts: 41,
      memoryPowerWatts: 0.08,
    },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCarbon(overrides: Partial<CarbonCalculationResult> = {}): CarbonCalculationResult {
  return {
    carbonEmissionsGrams: 0.043,
    carbonEmissionsKg: 0.000043,
    energyWh: 0.061,
    energyKwh: 0.000061,
    carbonIntensity: 700,
    region: "global",
    measurementType: "ESTIMATED",
    estimationMethod: "static_grid_emission_factor",
    isEstimate: true,
    unit: "gCO2e",
    providerName: "StaticCarbonIntensityProvider",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Phase 9: Verification Engine Unit Tests", () => {
  it("should VERIFY valid optimization with measured energy and carbon reductions", () => {
    const originalBenchmark = createMockBenchmark({ executionTimeMs: 2410, cpuUsagePercent: 82, memoryMb: 184 });
    const optimizedBenchmark = createMockBenchmark({ executionTimeMs: 730, cpuUsagePercent: 39, memoryMb: 96, codeVersion: "OPTIMIZED" });

    const originalEnergy = createMockEnergy({ energyWh: 0.061 });
    const optimizedEnergy = createMockEnergy({ energyWh: 0.020, executionTimeMs: 730 });

    const originalCarbon = createMockCarbon({ carbonEmissionsGrams: 0.043 });
    const optimizedCarbon = createMockCarbon({ carbonEmissionsGrams: 0.014 });

    const context: VerificationInputContext = {
      originalCode: "for i in items: for j in items: total += j",
      optimizedCode: "lookup = set(items)\ntotal = sum(lookup)",
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
    };

    const result = verificationEngine.verify(context);

    assert.strictEqual(result.status, "VERIFIED");
    assert.strictEqual(result.passed, true);
    assert.ok(result.energyReductionPercent > 60, `Expected >60% reduction, got ${result.energyReductionPercent}%`);
    assert.ok(result.carbonReductionPercent > 60, `Expected >60% carbon reduction, got ${result.carbonReductionPercent}%`);
    assert.ok(result.runtimeReductionPercent > 60, `Expected >60% runtime reduction, got ${result.runtimeReductionPercent}%`);

    // Verify checks
    const executionCheck = result.checks.find((c) => c.id === "execution_success");
    assert.ok(executionCheck?.passed);

    const energyCheck = result.checks.find((c) => c.id === "energy_reduction");
    assert.ok(energyCheck?.passed);
  });

  it("should REJECT optimization that causes energy or performance regression", () => {
    const originalBenchmark = createMockBenchmark({ executionTimeMs: 1000, cpuUsagePercent: 40 });
    const optimizedBenchmark = createMockBenchmark({ executionTimeMs: 3000, cpuUsagePercent: 90, codeVersion: "OPTIMIZED" });

    const originalEnergy = createMockEnergy({ energyWh: 0.020 });
    const optimizedEnergy = createMockEnergy({ energyWh: 0.065 }); // Energy increased!

    const originalCarbon = createMockCarbon({ carbonEmissionsGrams: 0.014 });
    const optimizedCarbon = createMockCarbon({ carbonEmissionsGrams: 0.045 });

    const context: VerificationInputContext = {
      originalCode: "x = 1",
      optimizedCode: "x = 1\nwhile True: pass",
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
    };

    const result = verificationEngine.verify(context);

    assert.strictEqual(result.status, "REJECTED");
    assert.strictEqual(result.passed, false);
    assert.ok(result.energyReductionPercent < 0, "Energy reduction should be negative");
    assert.ok(result.summary.includes("rejected"), "Summary should state rejected");
  });

  it("should REJECT optimization when optimized benchmark execution failed", () => {
    const originalBenchmark = createMockBenchmark();
    const optimizedBenchmark = createMockBenchmark({
      status: "FAILED",
      error: "SyntaxError: unexpected EOF while parsing",
    });

    const originalEnergy = createMockEnergy({ energyWh: 0.060 });
    const optimizedEnergy = createMockEnergy({ energyWh: 0.000 });

    const originalCarbon = createMockCarbon({ carbonEmissionsGrams: 0.040 });
    const optimizedCarbon = createMockCarbon({ carbonEmissionsGrams: 0.000 });

    const context: VerificationInputContext = {
      originalCode: "print('hello')",
      optimizedCode: "print('broken",
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
    };

    const result = verificationEngine.verify(context);

    assert.strictEqual(result.status, "REJECTED");
    assert.strictEqual(result.passed, false);
    const execCheck = result.checks.find((c) => c.id === "execution_success");
    assert.strictEqual(execCheck?.passed, false);
  });

  it("should REJECT optimization when code is unchanged", () => {
    const originalBenchmark = createMockBenchmark();
    const optimizedBenchmark = createMockBenchmark({ codeVersion: "OPTIMIZED" });

    const originalEnergy = createMockEnergy();
    const optimizedEnergy = createMockEnergy();

    const originalCarbon = createMockCarbon();
    const optimizedCarbon = createMockCarbon();

    const context: VerificationInputContext = {
      originalCode: "def compute(): return 42",
      optimizedCode: "def compute(): return 42", // Unchanged
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
    };

    const result = verificationEngine.verify(context);

    assert.strictEqual(result.status, "REJECTED");
    const codeCheck = result.checks.find((c) => c.id === "code_validity");
    assert.strictEqual(codeCheck?.passed, false);
  });

  it("should calculate reduction percent accurately without NaN on edge cases", () => {
    const engine = new VerificationEngine();

    const c1 = engine.compareMetric(100, 50, "ms");
    assert.strictEqual(c1.reductionPercent, 50);
    assert.strictEqual(c1.delta, 50);

    const c2 = engine.compareMetric(100, 150, "ms");
    assert.strictEqual(c2.reductionPercent, -50);
    assert.strictEqual(c2.delta, -50);

    const c3 = engine.compareMetric(0, 0, "ms");
    assert.strictEqual(c3.reductionPercent, 0);

    const c4 = engine.compareMetric(0, 10, "ms");
    assert.strictEqual(c4.reductionPercent, -100);
  });

  it("should throw validation error when required context objects are missing", () => {
    assert.throws(() => {
      // @ts-ignore
      verificationEngine.verify(null);
    }, /Verification context must be a valid object/);

    assert.throws(() => {
      // @ts-ignore
      verificationEngine.verify({});
    }, /Both original and optimized benchmark results are required/);
  });
});
