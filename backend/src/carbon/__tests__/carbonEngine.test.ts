/**
 * GreenOps AI - Phase 7 Unit Tests
 * 
 * Unit tests for Carbon Engine covering:
 * 1. Correct Wh -> kWh conversion & exact PRD formula (0.05 Wh * 600 g/kWh = 0.03 g CO2e)
 * 2. Zero energy handling
 * 3. Different carbon intensities & regional lookups
 * 4. Deterministic calculations (100 repeated runs)
 * 5. Invalid/negative/NaN input validation
 * 6. CarbonIntensityProvider interface & timestamp lookup behavior
 * 7. Fallback to global intensity for unmapped regions
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { energyEngine } from "../../energy/energyEngine.ts";
import { DEMO_POWER_PROFILE } from "../../energy/powerModel.ts";
import { CarbonEngine, carbonEngine } from "../carbonEngine.ts";
import { StaticCarbonIntensityProvider } from "../carbonIntensityProvider.ts";

describe("Phase 7: Carbon Engine Unit Tests", () => {
  // Test 1: Exact PRD Example Formula Check (0.05 Wh * 600 g/kWh = 0.03 g CO2e)
  it("should calculate CO2e matching exact PRD formula: 0.05 Wh @ 600 g/kWh -> 0.03 g CO2e", async () => {
    const mockEnergyResult = {
      energyWh: 0.05,
      energyJoules: 180,
      estimatedPowerWatts: 80,
      executionTimeMs: 2250,
      durationHours: 0.000625,
      measurementType: "ESTIMATED" as const,
      estimationMethod: "power_model_interpolation",
      confidence: 0.75,
      confidenceLabel: "MEDIUM" as const,
      isEstimate: true,
      powerModelId: "demo-profile",
      powerModelName: "Demo Server Profile",
      breakdown: { baselinePowerWatts: 30, dynamicPowerWatts: 50, memoryPowerWatts: 0 },
      createdAt: new Date().toISOString()
    };

    const customProvider = new StaticCarbonIntensityProvider({ "test-region": 600 });
    const customEngine = new CarbonEngine(customProvider);

    const result = await customEngine.calculateCarbon(mockEnergyResult, "test-region");

    assert.strictEqual(result.energyWh, 0.05);
    assert.strictEqual(result.energyKwh, 0.00005); // 0.05 / 1000 = 0.00005 kWh
    assert.strictEqual(result.carbonIntensity, 600);
    assert.strictEqual(result.carbonEmissionsGrams, 0.03); // 0.00005 * 600 = 0.03 g
    assert.strictEqual(result.carbonEmissionsKg, 0.00003); // 0.03 / 1000 = 0.00003 kg
    assert.strictEqual(result.isEstimate, true);
    assert.strictEqual(result.measurementType, "ESTIMATED");
  });

  // Test 2: Zero energy handling
  it("should handle zero energy gracefully without NaN or negative outputs", () => {
    const zeroEnergy = energyEngine.calculateEnergy({ executionTimeMs: 0, cpuUsagePercent: 50 }, DEMO_POWER_PROFILE);

    const result = carbonEngine.calculateCarbonSync(zeroEnergy, "us-east-1");

    assert.strictEqual(result.energyWh, 0);
    assert.strictEqual(result.energyKwh, 0);
    assert.strictEqual(result.carbonEmissionsGrams, 0);
    assert.strictEqual(result.carbonEmissionsKg, 0);
    assert.ok(!isNaN(result.carbonEmissionsGrams));
  });

  // Test 3: Different carbon intensities & regional lookups
  it("should produce different carbon emissions for different cloud grid regions", async () => {
    const telemetry = { executionTimeMs: 5000, cpuUsagePercent: 80, memoryMb: 512 };
    const energy = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);

    const oregonResult = await carbonEngine.calculateCarbon(energy, "us-west-2"); // 150 g/kWh
    const mumbaiResult = await carbonEngine.calculateCarbon(energy, "ap-south-1"); // 708 g/kWh

    assert.strictEqual(oregonResult.carbonIntensity, 150);
    assert.strictEqual(mumbaiResult.carbonIntensity, 708);
    assert.ok(oregonResult.carbonEmissionsGrams < mumbaiResult.carbonEmissionsGrams);
    assert.strictEqual(oregonResult.region, "us-west-2");
    assert.strictEqual(mumbaiResult.region, "ap-south-1");
  });

  // Test 4: Deterministic calculations
  it("should produce 100% deterministic carbon results for identical inputs", async () => {
    const telemetry = { executionTimeMs: 3450, cpuUsagePercent: 67.5, memoryMb: 512 };
    const energy = energyEngine.calculateEnergy(telemetry, DEMO_POWER_PROFILE);

    const firstRun = await carbonEngine.calculateCarbon(energy, "eu-west-1");

    for (let i = 0; i < 100; i++) {
      const currentRun = await carbonEngine.calculateCarbon(energy, "eu-west-1");
      assert.strictEqual(currentRun.carbonEmissionsGrams, firstRun.carbonEmissionsGrams, `Iteration ${i} mismatch`);
      assert.strictEqual(currentRun.energyKwh, firstRun.energyKwh, `Iteration ${i} energyKwh mismatch`);
    }
  });

  // Test 5: Invalid/negative/NaN input validation
  it("should throw explicit validation errors for invalid or negative energy inputs", async () => {
    await assert.rejects(async () => {
      await carbonEngine.calculateCarbon({ energyWh: -10 } as any);
    }, /energyWh cannot be negative/);

    await assert.rejects(async () => {
      await carbonEngine.calculateCarbon({ energyWh: NaN } as any);
    }, /Invalid energyWh input/);

    await assert.rejects(async () => {
      await carbonEngine.calculateCarbon({ energyWh: Infinity } as any);
    }, /Invalid energyWh input/);
  });

  // Test 6: CarbonIntensityProvider interface & timestamp lookup
  it("should support getIntensity with timestamp in CarbonIntensityProvider", async () => {
    const provider = new StaticCarbonIntensityProvider();
    const timestamp = new Date("2026-08-19T12:00:00Z");

    const intensity = await provider.getIntensity(timestamp, "us-east-1");

    assert.strictEqual(intensity, 385);
  });

  // Test 7: Fallback to global intensity for unknown regions
  it("should fall back safely to global carbon intensity for unknown regions", async () => {
    const provider = new StaticCarbonIntensityProvider();

    const unknownIntensity = await provider.getCurrentIntensity("unknown-mars-region");

    assert.strictEqual(unknownIntensity, 475); // Global fallback 475 g/kWh
  });
});
