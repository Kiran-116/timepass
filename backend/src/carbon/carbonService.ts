/**
 * GreenOps AI - Phase 7: Carbon Persistence Service
 * 
 * Manages calculating and persisting operational CO2e in PostgreSQL carbon_measurements table.
 */

import { pool } from "../db/index.ts";
import type { EnergyCalculationResult } from "../energy/energyEngine.ts";
import { carbonEngine, type CarbonCalculationResult } from "./carbonEngine.ts";
import { staticCarbonProvider } from "./carbonIntensityProvider.ts";

export async function calculateAndRecordCarbon(
  energyMeasurementDbId: string,
  energyResult: EnergyCalculationResult,
  region: string = "global"
): Promise<CarbonCalculationResult & { dbId?: string }> {
  const result = await carbonEngine.calculateCarbon(energyResult, region);

  try {
    const dbRes = await pool.query(
      `INSERT INTO carbon_measurements 
       (energy_measurement_id, carbon_intensity, carbon_emissions_g, region)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        energyMeasurementDbId,
        result.carbonIntensity,
        result.carbonEmissionsGrams,
        result.region
      ]
    );

    const dbId = dbRes.rows[0]?.id;
    return { ...result, dbId };
  } catch (error) {
    console.warn(`[CarbonService] DB persistence warning (proceeding in-memory): ${(error as Error).message}`);
    return result;
  }
}
