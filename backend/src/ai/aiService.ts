/**
 * GreenOps AI - Phase 8: AI Optimization Persistence Service
 * 
 * Manages persisting AI recommendations into PostgreSQL optimizations table.
 */

import { pool } from "../db/index.ts";
import { aiAgentEngine } from "./aiAgent.ts";
import type { AiAgentInputContext, AiAgentOutput } from "./types.ts";

export async function generateAndRecordOptimization(
  analysisId: string,
  context: AiAgentInputContext
): Promise<AiAgentOutput & { dbId?: string }> {
  const result = await aiAgentEngine.generateOptimization(context);

  try {
    const explanationText = JSON.stringify({
      problem: result.problem,
      whyItMatters: result.whyItMatters,
      optimization: result.optimization,
      expectedImpact: result.expectedImpact,
      modelMetadata: result.modelMetadata
    });

    const dbRes = await pool.query(
      `INSERT INTO optimizations 
       (analysis_id, original_code, optimized_code, ai_explanation, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        analysisId,
        context.code,
        result.optimizedCode,
        explanationText,
        "PENDING"
      ]
    );

    const dbId = dbRes.rows[0]?.id;
    return { ...result, dbId };
  } catch (error) {
    console.warn(`[AiService] DB persistence warning (proceeding in-memory): ${(error as Error).message}`);
    return result;
  }
}
