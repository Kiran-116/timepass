/**
 * GreenOps AI - Phase 6: Energy Estimation Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Converts runtime telemetry into estimated energy consumption in Watt-hours (Wh).
 */

import { DEMO_POWER_PROFILE, type PowerModel } from "./powerModel";

export interface EnergyTelemetryInput {
  executionTimeMs: number;
  cpuUsagePercent: number; // 0 to 100
  memoryMb?: number;
  cpuTimeMs?: number;
  networkBytes?: number;
  apiCalls?: number;
  dbQueries?: number;
}

export type MeasurementType = "ESTIMATED" | "MEASURED" | "PREDICTED";
export type ConfidenceCategory = "HIGH" | "MEDIUM" | "LOW";

export interface EnergyCalculationResult {
  energyWh: number;             // Energy consumption in Watt-hours
  energyJoules: number;         // Energy in Joules (1 Wh = 3600 J)
  estimatedPowerWatts: number;  // Estimated average power draw during workload
  executionTimeMs: number;      // Original execution runtime in milliseconds
  durationHours: number;        // Execution time in hours
  
  // Metadata & Disambiguation
  measurementType: MeasurementType;
  estimationMethod: string;
  confidence: number;           // Numeric 0.0 - 1.0 (0.75 for MEDIUM)
  confidenceLabel: ConfidenceCategory;
  isEstimate: boolean;          // Explicitly true for model-based estimations
  powerModelId: string;
  powerModelName: string;
  
  breakdown: {
    baselinePowerWatts: number;
    dynamicPowerWatts: number;
    memoryPowerWatts: number;
  };
  createdAt: string;
}

export class EnergyEngine {
  private defaultPowerModel: PowerModel;

  constructor(powerModel?: PowerModel) {
    this.defaultPowerModel = powerModel || DEMO_POWER_PROFILE;
  }

  /**
   * Primary Energy Calculation Function
   * Formula: Energy (Wh) = Estimated Power (W) * Runtime (Hours)
   */
  public calculateEnergy(
    telemetry: EnergyTelemetryInput,
    customPowerModel?: PowerModel
  ): EnergyCalculationResult {
    // 1. Validation & Input Sanitization
    this.validateTelemetryInput(telemetry);

    const model = customPowerModel || this.defaultPowerModel;
    const executionTimeMs = Math.max(0, telemetry.executionTimeMs);
    const cpuUsagePercent = Math.min(Math.max(telemetry.cpuUsagePercent, 0), 100);
    const memoryMb = Math.max(0, telemetry.memoryMb ?? 256);

    // 2. Power Model Calculation
    const estimatedPowerWatts = model.calculatePower(cpuUsagePercent, memoryMb);

    // 3. Energy Calculation
    // Duration in hours = ms / (1000 * 3600)
    const durationHours = executionTimeMs / 3600000;
    const rawEnergyWh = estimatedPowerWatts * durationHours;
    const energyWh = Number(rawEnergyWh.toFixed(8));
    const energyJoules = Number((rawEnergyWh * 3600).toFixed(6));

    // 4. Power Breakdown Calculation
    const cpuFraction = cpuUsagePercent / 100;
    const dynamicPowerWatts = Number(((model.activePowerW - model.idlePowerW) * cpuFraction).toFixed(4));
    const baselinePowerWatts = model.idlePowerW;
    const memoryPowerWatts = Number((estimatedPowerWatts - baselinePowerWatts - dynamicPowerWatts).toFixed(4));

    // 5. Metadata Tagging
    // Model-based estimation defaults to MEDIUM confidence (0.75) as required by spec
    const confidenceLabel: ConfidenceCategory = "MEDIUM";
    const confidence = 0.75; // Numeric representation for database compatibility

    return {
      energyWh,
      energyJoules,
      estimatedPowerWatts,
      executionTimeMs,
      durationHours: Number(durationHours.toFixed(8)),

      measurementType: "ESTIMATED",
      estimationMethod: "power_model_interpolation",
      confidence,
      confidenceLabel,
      isEstimate: true,
      powerModelId: model.id,
      powerModelName: model.name,

      breakdown: {
        baselinePowerWatts,
        dynamicPowerWatts,
        memoryPowerWatts: Math.max(0, memoryPowerWatts)
      },
      createdAt: new Date().toISOString()
    };
  }

  private validateTelemetryInput(telemetry: EnergyTelemetryInput): void {
    if (!telemetry || typeof telemetry !== "object") {
      throw new Error("Telemetry input must be a valid object.");
    }
    if (typeof telemetry.executionTimeMs !== "number" || isNaN(telemetry.executionTimeMs) || !isFinite(telemetry.executionTimeMs)) {
      throw new Error("Invalid executionTimeMs: must be a finite number.");
    }
    if (telemetry.executionTimeMs < 0) {
      throw new Error("executionTimeMs cannot be negative.");
    }
    if (typeof telemetry.cpuUsagePercent !== "number" || isNaN(telemetry.cpuUsagePercent) || !isFinite(telemetry.cpuUsagePercent)) {
      throw new Error("Invalid cpuUsagePercent: must be a finite number.");
    }
    if (telemetry.cpuUsagePercent < 0 || telemetry.cpuUsagePercent > 100) {
      throw new Error("cpuUsagePercent must be between 0 and 100.");
    }
  }
}

export const energyEngine = new EnergyEngine();
