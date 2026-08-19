/**
 * GreenOps AI - Phase 6: Energy Persistence Service
 * 
 * Manages calculating and persisting energy measurements in PostgreSQL energy_measurements table.
 */

import { pool } from "../db/index";
import { energyEngine, type EnergyCalculationResult, type EnergyTelemetryInput } from "./energyEngine";
import { DEMO_POWER_PROFILE, type PowerModel } from "./powerModel";

export async function calculateAndRecordEnergy(
  analysisId: string,
  telemetry: EnergyTelemetryInput,
  powerModel?: PowerModel
): Promise<EnergyCalculationResult & { dbId?: string }> {
  const result = energyEngine.calculateEnergy(telemetry, powerModel || DEMO_POWER_PROFILE);

  // If database is connected, persist to energy_measurements table
  try {
    const dbRes = await pool.query(
      `INSERT INTO energy_measurements 
       (analysis_id, estimated_power, energy_wh, estimation_method, confidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        analysisId,
        result.estimatedPowerWatts,
        result.energyWh,
        result.estimationMethod,
        result.confidence
      ]
    );

    const dbId = dbRes.rows[0]?.id;
    return { ...result, dbId };
  } catch (error) {
    // Database save fallback (for offline/in-memory mode)
    console.warn(`[EnergyService] DB persistence warning (proceeding in-memory): ${(error as Error).message}`);
    return result;
  }
}
