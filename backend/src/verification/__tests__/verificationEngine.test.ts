/**
 * GreenOps AI - Phase 9 Unit Tests
 * 
 * Unit tests for Verification Engine covering:
 * 1. Genuine improvement -> VERIFIED status & reduction calculation
 * 2. Worse implementation (regression) -> REJECTED status
 * 3. Improvement below threshold -> REJECTED status
 * 4. Functional correctness mismatch -> REJECTED status
 * 5. Benchmark failure in optimized code -> REJECTED status
 * 6. Zero denominator & division safety
 * 7. Percentage reduction formula precision
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { VerificationEngine, verificationEngine } from "../verificationEngine.ts";

describe("Phase 9: Verification Engine Unit Tests", () => {
  // Test 1: Genuine Improvement -> VERIFIED
  it("should mark optimization as VERIFIED when energy reduction exceeds threshold and functionality passes", async () => {
    const originalCode = "import time\ntime.sleep(0.1)\nprint('DONE')";
    const optimizedCode = "import time\ntime.sleep(0.01)\nprint('DONE')";

    const result = await verificationEngine.verifyOptimization({
      originalCode,
      optimizedCode,
      language: "python",
      energyReductionThresholdPercent: 5.0,
      warmupRuns: 1,
      measuredRuns: 2
    });

    assert.strictEqual(result.status, "VERIFIED");
    assert.strictEqual(result.functionalityPassed, true);
    assert.ok(result.reductions.energyReductionPercent > 5.0, "Energy reduction must exceed 5%");
    assert.ok(result.reductions.runtimeReductionPercent > 0);
    assert.ok(result.before.energyWh > result.after.energyWh);
    assert.ok(result.before.carbonGrams > result.after.carbonGrams);
  });

  // Test 2: Worse Implementation (Regression) -> REJECTED
  it("should REJECT optimization when energy consumption increases (regression)", async () => {
    const originalCode = "import time\ntime.sleep(0.01)\nprint('FAST')";
    const optimizedCode = "import time\ntime.sleep(0.1)\nprint('FAST')";

    const result = await verificationEngine.verifyOptimization({
      originalCode,
      optimizedCode,
      language: "python",
      energyReductionThresholdPercent: 5.0,
      warmupRuns: 1,
      measuredRuns: 2
    });

    assert.strictEqual(result.status, "REJECTED");
    assert.ok(result.reason.includes("REJECTED"));
    assert.ok(result.reductions.energyReductionPercent < 0, "Energy reduction should be negative for regression");
    assert.ok(result.after.energyWh > result.before.energyWh);
  });

  // Test 3: Improvement Below Threshold -> REJECTED
  it("should REJECT optimization when energy reduction is below configured threshold", async () => {
    const originalCode = "import time\ntime.sleep(0.05)\nprint('OK')";
    const optimizedCode = "import time\ntime.sleep(0.048)\nprint('OK')"; // Tiny ~4% improvement

    const result = await verificationEngine.verifyOptimization({
      originalCode,
      optimizedCode,
      language: "python",
      energyReductionThresholdPercent: 20.0, // High threshold
      warmupRuns: 1,
      measuredRuns: 2
    });

    assert.strictEqual(result.status, "REJECTED");
    assert.ok(result.reason.includes("did not meet the required threshold"));
  });

  // Test 4: Functional Correctness Mismatch -> REJECTED
  it("should REJECT optimization when output/behavior does not match expected output", async () => {
    const originalCode = "print('EXPECTED_OUTPUT_A')";
    const optimizedCode = "print('WRONG_OUTPUT_B')";

    const result = await verificationEngine.verifyOptimization({
      originalCode,
      optimizedCode,
      language: "python",
      expectedStdout: "EXPECTED_OUTPUT_A",
      warmupRuns: 1,
      measuredRuns: 2
    });

    assert.strictEqual(result.status, "REJECTED");
    assert.strictEqual(result.functionalityPassed, false);
    assert.ok(result.reason.includes("Functional validation failed"));
  });

  // Test 5: Benchmark Failure in Optimized Code -> REJECTED
  it("should REJECT optimization when optimized code contains syntax/runtime error", async () => {
    const originalCode = "print('VALID')";
    const optimizedCode = "def invalid_syntax(:::";

    const result = await verificationEngine.verifyOptimization({
      originalCode,
      optimizedCode,
      language: "python",
      warmupRuns: 1,
      measuredRuns: 2
    });

    assert.strictEqual(result.status, "REJECTED");
    assert.ok(result.reason.includes("failed"));
  });

  // Test 6: Zero Denominator & Division Safety
  it("should handle zero denominator safely in reduction formula without returning NaN", () => {
    const percent = verificationEngine.calculateReductionPercent(0, 50);

    assert.strictEqual(percent, 0.0);
    assert.ok(!isNaN(percent));
  });

  // Test 7: Percentage Reduction Formula Math Precision Check
  it("should compute exact reduction percentage: ((100 - 32.8) / 100) * 100 = 67.2%", () => {
    const percent = verificationEngine.calculateReductionPercent(100, 32.8);

    assert.strictEqual(percent, 67.2);
  });
});
