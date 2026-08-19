/**
 * GreenOps AI - Phase 10: Green Score Service
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Service layer wrapping Green Score calculations and comparisons for backend API integration.
 */

import { greenScoreEngine, GreenScoreEngine } from "./greenScoreEngine.ts";
import type {
  GreenScoreComparisonResult,
  GreenScoreInput,
  GreenScoreOptions,
  GreenScoreResult
} from "./types.ts";

export class GreenScoreService {
  private engine: GreenScoreEngine;

  constructor(engine?: GreenScoreEngine) {
    this.engine = engine || greenScoreEngine;
  }

  /**
   * Calculates Green Score for a given workload input
   */
  public calculateScore(input: GreenScoreInput, options?: GreenScoreOptions): GreenScoreResult {
    if (options) {
      const customEngine = new GreenScoreEngine(options);
      return customEngine.calculateScore(input);
    }
    return this.engine.calculateScore(input);
  }

  /**
   * Compares baseline vs optimized workload Green Scores
   */
  public compareScores(
    beforeInput: GreenScoreInput,
    afterInput: GreenScoreInput,
    options?: GreenScoreOptions
  ): GreenScoreComparisonResult {
    if (options) {
      const customEngine = new GreenScoreEngine(options);
      return customEngine.compareScores(beforeInput, afterInput);
    }
    return this.engine.compareScores(beforeInput, afterInput);
  }
}

export const greenScoreService = new GreenScoreService();
