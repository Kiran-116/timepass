/**
 * GreenOps AI - Phase 9: Verification Persistence Service
 * 
 * Manages persisting verification results into PostgreSQL verification_results table.
 */

import { pool } from "../db/index";
import type { VerificationInputContext, VerificationResult } from "./types";
import { verificationEngine } from "./verificationEngine";

export async function verifyAndRecordOptimization(
  optimizationDbId: string,
  context: VerificationInputContext
): Promise<VerificationResult & { dbId?: string }> {
  const result = verificationEngine.verify(context);

  try {
    const dbRes = await pool.query(
      `INSERT INTO verification_results 
       (optimization_id, before_energy, after_energy, before_carbon, after_carbon, 
        energy_reduction_percent, carbon_reduction_percent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        optimizationDbId,
        context.originalEnergy.energyWh,
        context.optimizedEnergy.energyWh,
        context.originalCarbon.carbonEmissionsGrams,
        context.optimizedCarbon.carbonEmissionsGrams,
        result.energyReductionPercent,
        result.carbonReductionPercent,
        result.status,
      ]
    );

    const dbId = dbRes.rows[0]?.id;
    return { ...result, optimizationId: optimizationDbId, dbId };
  } catch (error) {
    console.warn(`[VerificationService] DB persistence warning (proceeding in-memory): ${(error as Error).message}`);
    return { ...result, optimizationId: optimizationDbId };
  }
}
