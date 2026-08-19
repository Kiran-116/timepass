/**
 * GreenOps AI - Phase 10: Green Score Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Calculates a deterministic, explainable product metric (0-100) representing software workload sustainability.
 */

import type { CarbonCalculationResult } from "../carbon/carbonEngine.ts";
import type { EnergyCalculationResult } from "../energy/energyEngine.ts";
import type { VerificationMetrics, VerificationResult } from "../verification/types.ts";
import type {
  ComparisonStatus,
  GreenScoreComparisonResult,
  GreenScoreDimensions,
  GreenScoreInput,
  GreenScoreOptions,
  GreenScoreRating,
  GreenScoreResult,
  GreenScoreStatus,
  GreenScoreWeights
} from "./types.ts";

export const PRODUCT_METRIC_NOTICE =
  "Green Score is a GreenOps product metric for comparative software sustainability benchmarking and is not an official carbon rating or universal industry standard.";

export const DEFAULT_WEIGHTS: GreenScoreWeights = {
  energy: 0.35,
  compute: 0.25,
  memory: 0.20,
  carbon: 0.20
};

export const METHODOLOGY_VERSION = "v1.0";

export class GreenScoreEngine {
  private weights: GreenScoreWeights;
  private version: string;

  constructor(options?: GreenScoreOptions) {
    this.weights = { ...DEFAULT_WEIGHTS, ...options?.weights };
    this.version = options?.methodologyVersion || METHODOLOGY_VERSION;
  }

  /**
   * Primary Green Score Calculation
   * Evaluates workload telemetry, energy, and carbon metrics into a deterministic score (0-100).
   */
  public calculateScore(input: GreenScoreInput): GreenScoreResult {
    // 1. Data Sufficiency Check
    if (!this.hasSufficientData(input)) {
      return {
        status: "INSUFFICIENT_DATA",
        score: null,
        rating: "N/A",
        methodologyVersion: this.version,
        breakdown: null,
        explanation: "Insufficient telemetry, energy, or execution metrics to calculate a Green Score.",
        isProductMetricNotice: PRODUCT_METRIC_NOTICE,
        createdAt: new Date().toISOString()
      };
    }

    // Extract telemetry & calculated results safely
    const metrics = this.extractMetrics(input);

    // Guard against NaN, Infinity, negative values
    if (this.hasInvalidMetricValues(metrics)) {
      return {
        status: "INVALID_INPUT",
        score: null,
        rating: "N/A",
        methodologyVersion: this.version,
        breakdown: null,
        explanation: "Input metrics contained invalid, negative, NaN, or non-finite values.",
        isProductMetricNotice: PRODUCT_METRIC_NOTICE,
        createdAt: new Date().toISOString()
      };
    }

    // 2. Compute Individual Dimension Scores (0 - 100)
    const energyEfficiency = this.computeEnergyEfficiency(metrics.energyWh);
    const computeEfficiency = this.computeComputeEfficiency(metrics.cpuUsagePercent, metrics.runtimeSeconds);
    const memoryEfficiency = this.computeMemoryEfficiency(metrics.memoryMb);
    const carbonEfficiency = this.computeCarbonEfficiency(metrics.carbonGrams);

    const breakdown: GreenScoreDimensions = {
      energyEfficiency,
      computeEfficiency,
      memoryEfficiency,
      carbonEfficiency
    };

    // 3. Calculate Composite Weighted Score
    const rawScore =
      energyEfficiency * this.weights.energy +
      computeEfficiency * this.weights.compute +
      memoryEfficiency * this.weights.memory +
      carbonEfficiency * this.weights.carbon;

    // 4. Strict Boundary Enforcement (0 to 100)
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
    const rating = this.deriveRating(finalScore);
    const explanation = this.generateExplanation(finalScore, breakdown);

    return {
      status: "CALCULATED",
      score: finalScore,
      rating,
      methodologyVersion: this.version,
      breakdown,
      explanation,
      isProductMetricNotice: PRODUCT_METRIC_NOTICE,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Compares BEFORE vs AFTER Green Scores (e.g. baseline vs verified optimization)
   */
  public compareScores(
    beforeInput: GreenScoreInput,
    afterInput: GreenScoreInput
  ): GreenScoreComparisonResult {
    const beforeScore = this.calculateScore(beforeInput);
    const afterScore = this.calculateScore(afterInput);

    if (beforeScore.status !== "CALCULATED" || afterScore.status !== "CALCULATED") {
      return {
        status: "INSUFFICIENT_DATA",
        beforeScore,
        afterScore,
        scoreDelta: null,
        ratingChange: "N/A",
        summary: "Comparison could not be computed due to insufficient baseline or optimized data.",
        createdAt: new Date().toISOString()
      };
    }

    const bScore = beforeScore.score!;
    const aScore = afterScore.score!;
    const delta = aScore - bScore;

    let status: ComparisonStatus = "UNCHANGED";
    if (delta > 0) status = "IMPROVED";
    if (delta < 0) status = "REGRESSED";

    const ratingChange = `${beforeScore.rating} -> ${afterScore.rating}`;
    const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;

    const summary = status === "IMPROVED"
      ? `Green Score improved by ${deltaSign} points (${ratingChange}). Energy and resource efficiency increased.`
      : status === "REGRESSED"
      ? `Green Score regressed by ${deltaSign} points (${ratingChange}). Optimization consumed more energy or compute resources.`
      : `Green Score remained unchanged (${bScore}/100, Rating: ${beforeScore.rating}).`;

    return {
      status,
      beforeScore,
      afterScore,
      scoreDelta: delta,
      ratingChange,
      summary,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Helper to compute comparison directly from Phase 9 VerificationResult
   */
  public calculateFromVerification(verificationResult: VerificationResult): GreenScoreComparisonResult {
    if (!verificationResult || !verificationResult.before || !verificationResult.after) {
      const emptyResult: GreenScoreResult = {
        status: "INSUFFICIENT_DATA",
        score: null,
        rating: "N/A",
        methodologyVersion: this.version,
        breakdown: null,
        explanation: "Verification result contained invalid or incomplete metrics.",
        isProductMetricNotice: PRODUCT_METRIC_NOTICE,
        createdAt: new Date().toISOString()
      };
      return {
        status: "INSUFFICIENT_DATA",
        beforeScore: emptyResult,
        afterScore: emptyResult,
        scoreDelta: null,
        ratingChange: "N/A",
        summary: "Insufficient verification metric data.",
        createdAt: new Date().toISOString()
      };
    }

    const beforeInput: GreenScoreInput = {
      telemetry: {
        executionTimeMs: verificationResult.before.executionTimeMs,
        cpuUsagePercent: verificationResult.before.cpuUsagePercent,
        memoryMb: verificationResult.before.memoryMb
      },
      energy: { energyWh: verificationResult.before.energyWh } as EnergyCalculationResult,
      carbon: { carbonEmissionsGrams: verificationResult.before.carbonGrams } as CarbonCalculationResult
    };

    const afterInput: GreenScoreInput = {
      telemetry: {
        executionTimeMs: verificationResult.after.executionTimeMs,
        cpuUsagePercent: verificationResult.after.cpuUsagePercent,
        memoryMb: verificationResult.after.memoryMb
      },
      energy: { energyWh: verificationResult.after.energyWh } as EnergyCalculationResult,
      carbon: { carbonEmissionsGrams: verificationResult.after.carbonGrams } as CarbonCalculationResult
    };

    return this.compareScores(beforeInput, afterInput);
  }

  // --- Dimension Scoring Formulas ---

  private computeEnergyEfficiency(energyWh: number): number {
    // Energy Efficiency Curve: 100 * exp(-5 * energyWh)
    // 0.001 Wh -> ~99.5, 0.05 Wh -> ~77.8, 0.2 Wh -> ~36.8, 0.5 Wh -> ~8.2
    const score = 100 * Math.exp(-5 * Math.max(0, energyWh));
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private computeComputeEfficiency(cpuPercent: number, runtimeSeconds: number): number {
    // Compute penalty = (cpu% / 100) * min(runtimeSeconds, 10) * 8
    const clampedCpu = Math.min(100, Math.max(0, cpuPercent));
    const clampedRuntime = Math.max(0, runtimeSeconds);
    const penalty = (clampedCpu / 100) * Math.min(clampedRuntime, 10) * 8;
    const score = 100 - penalty;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private computeMemoryEfficiency(memoryMb: number): number {
    // Memory penalty = min(memoryMb * 0.05, 90)
    const clampedMem = Math.max(0, memoryMb);
    const penalty = Math.min(clampedMem * 0.05, 90);
    const score = 100 - penalty;
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private computeCarbonEfficiency(carbonGrams: number): number {
    // Carbon Efficiency Curve: 100 * exp(-8 * carbonGrams)
    const score = 100 * Math.exp(-8 * Math.max(0, carbonGrams));
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private deriveRating(score: number): GreenScoreRating {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  }

  private generateExplanation(score: number, breakdown: GreenScoreDimensions): string {
    const strongest = Object.entries(breakdown).reduce((max, curr) => (curr[1] > max[1] ? curr : max));
    const weakest = Object.entries(breakdown).reduce((min, curr) => (curr[1] < min[1] ? curr : min));

    return `Workload achieved a Green Score of ${score}/100 (Rating: ${this.deriveRating(score)}). ` +
      `Highest efficiency: ${this.formatDimensionName(strongest[0])} (${strongest[1]}/100). ` +
      `Primary opportunity for improvement: ${this.formatDimensionName(weakest[0])} (${weakest[1]}/100).`;
  }

  private formatDimensionName(key: string): string {
    switch (key) {
      case "energyEfficiency": return "Energy Efficiency";
      case "computeEfficiency": return "Compute Efficiency";
      case "memoryEfficiency": return "Memory Efficiency";
      case "carbonEfficiency": return "Carbon Efficiency";
      default: return key;
    }
  }

  private hasSufficientData(input: GreenScoreInput): boolean {
    if (!input) return false;

    // Check if telemetry or verification metrics or energy exist
    const hasTelemetry = !!(input.telemetry && typeof input.telemetry.executionTimeMs === "number" && typeof input.telemetry.cpuUsagePercent === "number");
    const hasVerification = !!(input.verificationMetrics && typeof input.verificationMetrics.executionTimeMs === "number");
    const hasEnergy = !!(input.energy && typeof input.energy.energyWh === "number");

    return hasTelemetry || hasVerification || hasEnergy;
  }

  private extractMetrics(input: GreenScoreInput) {
    const telemetry = input.telemetry || input.verificationMetrics;
    const executionTimeMs = telemetry?.executionTimeMs ?? 0;
    const runtimeSeconds = executionTimeMs / 1000;
    const cpuUsagePercent = telemetry?.cpuUsagePercent ?? 0;
    const memoryMb = telemetry?.memoryMb ?? 0;

    const energyWh = input.energy?.energyWh ?? input.verificationMetrics?.energyWh ?? (executionTimeMs * 0.00001);
    const carbonGrams = input.carbon?.carbonEmissionsGrams ?? input.verificationMetrics?.carbonGrams ?? (energyWh * 0.4);

    return {
      executionTimeMs,
      runtimeSeconds,
      cpuUsagePercent,
      memoryMb,
      energyWh,
      carbonGrams
    };
  }

  private hasInvalidMetricValues(metrics: ReturnType<typeof this.extractMetrics>): boolean {
    const vals = Object.values(metrics);
    return vals.some(v => typeof v !== "number" || isNaN(v) || !isFinite(v) || v < 0);
  }
}

export const greenScoreEngine = new GreenScoreEngine();
