/**
 * GreenOps AI - Phase 6 Unit Tests
 * 
 * Unit tests for Energy Estimation Engine covering:
 * 1. Normal runtime calculation
 * 2. Zero runtime
 * 3. Different power profiles
 * 4. Deterministic repeated calculations
 * 5. Correct Wh unit conversion
 * 6. Invalid/negative input handling
 * 7. Confidence and estimation-method metadata
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { energyEngine } from "../energyEngine";
import { ARM_EFFICIENT_PROFILE, CLOUD_STANDARD_PROFILE, ConfigurablePowerModel, DEMO_POWER_PROFILE } from "../powerModel";

describe("Phase 6: Energy Estimation Engine Unit Tests", () => {
  // Test 1: Normal runtime calculation
  it("should calculate energy correctly for normal runtime telemetry", () => {
    const telemetry = {
      executionTimeMs: 2410, // 2.41 seconds
      cpuUsagePercent: 100,  // 100% CPU
      memoryMb: 256
    };

    const result = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);

    assert.strictEqual(result.measurementType, "ESTIMATED");
    assert.strictEqual(result.isEstimate, true);
    assert.ok(result.energyWh > 0, "Energy Wh must be greater than 0");
    assert.ok(result.energyJoules > 0, "Energy Joules must be greater than 0");
    assert.strictEqual(result.durationHours, Number((2410 / 3600000).toFixed(8)));
  });

  // Test 2: Zero runtime
  it("should handle zero runtime gracefully without errors or NaN", () => {
    const telemetry = {
      executionTimeMs: 0,
      cpuUsagePercent: 50,
      memoryMb: 512
    };

    const result = energyEngine.calculateEnergy(telemetry);

    assert.strictEqual(result.energyWh, 0);
    assert.strictEqual(result.energyJoules, 0);
    assert.strictEqual(result.executionTimeMs, 0);
    assert.strictEqual(result.durationHours, 0);
    assert.ok(!isNaN(result.estimatedPowerWatts), "Power watts must not be NaN");
  });

  // Test 3: Different power profiles
  it("should produce different power and energy results for different power profiles", () => {
    const telemetry = {
      executionTimeMs: 5000, // 5 seconds
      cpuUsagePercent: 80,
      memoryMb: 1024
    };

    const demoResult = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);
    const armResult = energyEngine.calculateEnergy(telemetry, ARM_EFFICIENT_PROFILE);
    const cloudResult = energyEngine.calculateEnergy(telemetry, CLOUD_STANDARD_PROFILE);

    assert.notStrictEqual(demoResult.estimatedPowerWatts, armResult.estimatedPowerWatts);
    assert.ok(armResult.estimatedPowerWatts < demoResult.estimatedPowerWatts, "ARM profile should use less power");
    assert.strictEqual(demoResult.powerModelId, "demo-profile");
    assert.strictEqual(armResult.powerModelId, "arm-efficient");
    assert.strictEqual(cloudResult.powerModelId, "cloud-standard");
  });

  // Test 4: Deterministic repeated calculations
  it("should produce 100% deterministic results for identical telemetry and power profile", () => {
    const telemetry = {
      executionTimeMs: 3450,
      cpuUsagePercent: 67.5,
      memoryMb: 512
    };

    const firstRun = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);

    for (let i = 0; i < 100; i++) {
      const currentRun = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);
      assert.strictEqual(currentRun.energyWh, firstRun.energyWh, `Iteration ${i} energyWh mismatch`);
      assert.strictEqual(currentRun.estimatedPowerWatts, firstRun.estimatedPowerWatts, `Iteration ${i} power mismatch`);
      assert.strictEqual(currentRun.energyJoules, firstRun.energyJoules, `Iteration ${i} joules mismatch`);
    }
  });

  // Test 5: Correct Wh unit conversion
  it("should maintain precise mathematical relationship: Energy (Wh) = Power (W) * (TimeMs / 3,600,000)", () => {
    const timeMs = 7200000; // Exactly 2 hours
    const telemetry = {
      executionTimeMs: timeMs,
      cpuUsagePercent: 0,
      memoryMb: 256
    };

    const customProfile = new ConfigurablePowerModel({
      id: "exact-test",
      name: "Exact Test Profile",
      idlePowerW: 100.0,
      activePowerW: 100.0,
      memoryPowerPerGbW: 0
    });

    const result = energyEngine.calculateEnergy(telemetry, customProfile);

    assert.strictEqual(result.estimatedPowerWatts, 100);
    assert.strictEqual(result.durationHours, 2);
    assert.strictEqual(result.energyWh, 200);
    assert.strictEqual(result.energyJoules, 720000); // 200 * 3600
  });

  // Test 6: Invalid/negative input handling
  it("should throw explicit validation errors for invalid or negative inputs", () => {
    assert.throws(() => {
      energyEngine.calculateEnergy({ executionTimeMs: -500, cpuUsagePercent: 50 });
    }, /executionTimeMs cannot be negative/);

    assert.throws(() => {
      energyEngine.calculateEnergy({ executionTimeMs: 1000, cpuUsagePercent: 150 });
    }, /cpuUsagePercent must be between 0 and 100/);

    assert.throws(() => {
      energyEngine.calculateEnergy({ executionTimeMs: NaN, cpuUsagePercent: 50 });
    }, /Invalid executionTimeMs/);

    assert.throws(() => {
      energyEngine.calculateEnergy({ executionTimeMs: 1000, cpuUsagePercent: Infinity });
    }, /Invalid cpuUsagePercent/);
  });

  // Test 7: Confidence and estimation-method metadata
  it("should attach explicit estimation metadata, method, and MEDIUM confidence rating", () => {
    const telemetry = {
      executionTimeMs: 1200,
      cpuUsagePercent: 45,
      memoryMb: 256
    };

    const result = energyEngine.calculateEnergy(telemetry);

    assert.strictEqual(result.measurementType, "ESTIMATED");
    assert.strictEqual(result.estimationMethod, "power_model_interpolation");
    assert.strictEqual(result.confidence, 0.75);
    assert.strictEqual(result.confidenceLabel, "MEDIUM");
    assert.strictEqual(result.isEstimate, true);
  });
});
