/**
 * GreenOps AI - Phase 10: Green Score Service
 */

import type { GreenScoreInputContext, GreenScoreResult } from "./types";
import { greenScoreEngine } from "./greenScoreEngine";

export function calculateGreenScore(context: GreenScoreInputContext): GreenScoreResult {
  return greenScoreEngine.calculateScore(context);
}
