/**
 * GreenOps AI - Phase 9: Verification Persistence Service
 * 
 * Manages calculating and persisting verification results into PostgreSQL verification_results table.
 */

import { pool } from "../db/index.ts";
import type { VerificationOptions, VerificationResult } from "./types.ts";
import { verificationEngine } from "./verificationEngine.ts";

export async function verifyAndRecordOptimization(
  optimizationDbId: string,
  options: VerificationOptions
): Promise<VerificationResult & { dbId?: string }> {
  const result = await verificationEngine.verifyOptimization(options);

  try {
    const dbRes = await pool.query(
      `INSERT INTO verification_results 
       (optimization_id, before_energy, after_energy, before_carbon, after_carbon, energy_reduction_percent, carbon_reduction_percent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        optimizationDbId,
        result.before.energyWh,
        result.after.energyWh,
        result.before.carbonGrams,
        result.after.carbonGrams,
        result.reductions.energyReductionPercent,
        result.reductions.carbonReductionPercent,
        result.status
      ]
    );

    const dbId = dbRes.rows[0]?.id;

    // Update status in optimizations table as well
    await pool.query(
      `UPDATE optimizations SET status = $1 WHERE id = $2`,
      [result.status, optimizationDbId]
    );

    return { ...result, dbId };
  } catch (error) {
    console.warn(`[VerificationService] DB persistence warning (proceeding in-memory): ${(error as Error).message}`);
    return result;
  }
}
