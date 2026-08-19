/**
 * GreenOps AI - Phase 7: Carbon Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Converts estimated energy consumption (Wh) into operational CO2e (grams).
 */

import type { EnergyCalculationResult } from "../energy/energyEngine.ts";
import { staticCarbonProvider, type CarbonIntensityProvider } from "./carbonIntensityProvider.ts";

export interface CarbonCalculationResult {
  carbonEmissionsGrams: number;  // Operational CO2e in grams (gCO2e)
  carbonEmissionsKg: number;     // Operational CO2e in kilograms (kgCO2e)
  
  // Energy Inputs & Conversion Metadata
  energyWh: number;              // Original energy input in Watt-hours
  energyKwh: number;             // Explicit unit conversion: Energy(kWh) = Energy(Wh) / 1000
  carbonIntensity: number;       // Grid emissions factor in g CO2e / kWh
  region: string;                // Cloud/grid region used for calculation
  timestamp?: string;            // Timestamp associated with calculation
  
  // Trust Disambiguation & Metadata
  measurementType: "ESTIMATED";
  estimationMethod: string;
  isEstimate: boolean;           // Explicitly true for model-based estimations
  unit: "gCO2e";
  providerName: string;
  createdAt: string;
}

export class CarbonEngine {
  private provider: CarbonIntensityProvider;

  constructor(provider?: CarbonIntensityProvider) {
    this.provider = provider || staticCarbonProvider;
  }

  /**
   * Calculates operational CO2e from Energy Engine calculation result.
   * Formula: CO2e (g) = Energy (kWh) * Carbon Intensity (g CO2e / kWh)
   */
  public async calculateCarbon(
    energyResult: EnergyCalculationResult,
    region: string = "global",
    timestamp?: string | Date
  ): Promise<CarbonCalculationResult> {
    this.validateEnergyInput(energyResult);

    const safeRegion = (region || "global").toLowerCase();
    const energyWh = Math.max(0, energyResult.energyWh);

    // 1. Explicit Unit Conversion: Wh -> kWh
    const energyKwh = energyWh / 1000;

    // 2. Obtain Carbon Intensity from Provider
    const intensity = timestamp
      ? await this.provider.getIntensity(timestamp, safeRegion)
      : await this.provider.getCurrentIntensity(safeRegion);

    const carbonIntensity = Math.max(0, Number(intensity));

    // 3. Operational CO2e Calculation
    const rawEmissionsGrams = energyKwh * carbonIntensity;
    const carbonEmissionsGrams = Number(rawEmissionsGrams.toFixed(8));
    const carbonEmissionsKg = Number((carbonEmissionsGrams / 1000).toFixed(10));

    return {
      carbonEmissionsGrams,
      carbonEmissionsKg,
      energyWh,
      energyKwh: Number(energyKwh.toFixed(10)),
      carbonIntensity,
      region: safeRegion,
      timestamp: timestamp ? new Date(timestamp).toISOString() : energyResult.createdAt,

      measurementType: "ESTIMATED",
      estimationMethod: "static_grid_emission_factor",
      isEstimate: true,
      unit: "gCO2e",
      providerName: "StaticCarbonIntensityProvider",
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Synchronous calculation variant for static provider usages
   */
  public calculateCarbonSync(
    energyResult: EnergyCalculationResult,
    region: string = "global"
  ): CarbonCalculationResult {
    this.validateEnergyInput(energyResult);

    const safeRegion = (region || "global").toLowerCase();
    const energyWh = Math.max(0, energyResult.energyWh);

    const energyKwh = energyWh / 1000;
    const carbonIntensity = Math.max(0, Number(this.provider.getCurrentIntensity(safeRegion)));

    const rawEmissionsGrams = energyKwh * carbonIntensity;
    const carbonEmissionsGrams = Number(rawEmissionsGrams.toFixed(8));
    const carbonEmissionsKg = Number((carbonEmissionsGrams / 1000).toFixed(10));

    return {
      carbonEmissionsGrams,
      carbonEmissionsKg,
      energyWh,
      energyKwh: Number(energyKwh.toFixed(10)),
      carbonIntensity,
      region: safeRegion,

      measurementType: "ESTIMATED",
      estimationMethod: "static_grid_emission_factor",
      isEstimate: true,
      unit: "gCO2e",
      providerName: "StaticCarbonIntensityProvider",
      createdAt: new Date().toISOString()
    };
  }

  private validateEnergyInput(energyResult: EnergyCalculationResult): void {
    if (!energyResult || typeof energyResult !== "object") {
      throw new Error("Energy calculation result must be a valid object.");
    }
    if (typeof energyResult.energyWh !== "number" || isNaN(energyResult.energyWh) || !isFinite(energyResult.energyWh)) {
      throw new Error("Invalid energyWh input: must be a finite number.");
    }
    if (energyResult.energyWh < 0) {
      throw new Error("energyWh cannot be negative.");
    }
  }
}

export const carbonEngine = new CarbonEngine();
