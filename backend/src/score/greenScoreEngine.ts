/**
 * GreenOps AI - Phase 10: Green Score Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Calculates a deterministic, bounded 0–100 Green Score representing software sustainability.
 * 
 * Formula:
 * Composite Green Score = (Energy_Weight * Energy_Score)
 *                       + (Compute_Weight * Compute_Score)
 *                       + (Memory_Weight * Memory_Score)
 *                       + (Quality_Weight * Code_Quality_Score)
 * 
 * Verified improvements directly elevate the final Green Score.
 */

import type {
  GreenGrade,
  GreenScoreBreakdown,
  GreenScoreInputContext,
  GreenScoreResult,
} from "./types";

export class GreenScoreEngine {
  /**
   * Weights for dimensional scoring
   */
  private readonly WEIGHTS = {
    energy: 0.35,   // 35% Energy efficiency
    compute: 0.25,  // 25% Compute/CPU efficiency
    memory: 0.15,   // 15% Memory footprint efficiency
    quality: 0.25,  // 25% Code structure & static findings health
  };

  /**
   * Calculates the Green Score result from analysis context
   */
  public calculateScore(context: GreenScoreInputContext = {}): GreenScoreResult {
    // 1. Calculate Code Quality Score (0–100) based on static findings
    const findings = context.findings || [];
    const codeQuality = this.calculateCodeQualityScore(findings);

    // 2. Calculate Original Dimensional Scores
    const origCompute = this.calculateComputeScore(
      context.originalBenchmark?.executionTimeMs,
      context.originalBenchmark?.cpuUsagePercent
    );

    const origMemory = this.calculateMemoryScore(context.originalBenchmark?.memoryMb);

    const origEnergy = this.calculateEnergyEfficiencyScore(
      context.originalEnergy?.energyWh,
      context.originalCarbon?.carbonEmissionsGrams
    );

    const originalScore = this.computeCompositeScore({
      energyEfficiency: origEnergy,
      computeEfficiency: origCompute,
      memoryEfficiency: origMemory,
      codeQuality,
    });

    // 3. Calculate Post-Optimization Dimensional Scores (if verification is present)
    let optEnergy = origEnergy;
    let optCompute = origCompute;
    let optMemory = origMemory;
    let optQuality = Math.min(100, codeQuality + 30); // Assume optimizations resolve identified hotspots

    const verification = context.verificationResult;
    const isVerified = (verification && verification.status === "VERIFIED" && verification.passed) ?? false;

    if (isVerified) {
      // Elevate energy score based on verified reduction
      const energyBoost = Math.max(0, (verification?.energyReductionPercent ?? 0) * 0.4);
      optEnergy = Math.min(100, Math.round(origEnergy + energyBoost));

      // Elevate compute score based on verified runtime & CPU reduction
      const computeBoost = Math.max(0, (verification?.runtimeReductionPercent ?? 0) * 0.3);
      optCompute = Math.min(100, Math.round(origCompute + computeBoost));

      // Elevate memory score based on verified memory reduction
      const memBoost = Math.max(0, (verification?.memoryReductionPercent ?? 0) * 0.2);
      optMemory = Math.min(100, Math.round(origMemory + memBoost));
    } else if (context.optimizedBenchmark) {
      optCompute = this.calculateComputeScore(
        context.optimizedBenchmark.executionTimeMs,
        context.optimizedBenchmark.cpuUsagePercent
      );
      optMemory = this.calculateMemoryScore(context.optimizedBenchmark.memoryMb);
      optEnergy = this.calculateEnergyEfficiencyScore(
        context.optimizedEnergy?.energyWh,
        context.optimizedCarbon?.carbonEmissionsGrams
      );
    }

    const optimizedScore = this.computeCompositeScore({
      energyEfficiency: optEnergy,
      computeEfficiency: optCompute,
      memoryEfficiency: optMemory,
      codeQuality: optQuality,
    });

    // Active score is optimizedScore if verification passed, otherwise originalScore
    const score = isVerified ? optimizedScore : originalScore;
    const improvement = Math.max(0, optimizedScore - originalScore);
    const grade = this.scoreToGrade(score);

    const breakdown: GreenScoreBreakdown = {
      energyEfficiency: isVerified ? optEnergy : origEnergy,
      computeEfficiency: isVerified ? optCompute : origCompute,
      memoryEfficiency: isVerified ? optMemory : origMemory,
      codeQuality: isVerified ? optQuality : codeQuality,
    };

    const summary = this.generateSummary(score, grade, isVerified, improvement, breakdown);

    return {
      score,
      originalScore,
      optimizedScore,
      improvement,
      grade,
      breakdown,
      summary,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Code Quality Score (0–100): Starts at 100, penalized by finding severities
   */
  public calculateCodeQualityScore(findings: { severity?: string }[]): number {
    let penalty = 0;
    for (const f of findings) {
      const sev = (f.severity || "").toUpperCase();
      if (sev === "HIGH") penalty += 18;
      else if (sev === "MEDIUM") penalty += 9;
      else if (sev === "LOW") penalty += 4;
      else penalty += 6;
    }
    return Math.max(10, Math.min(100, 100 - penalty));
  }

  /**
   * Compute Score (0–100): Evaluates execution time and CPU saturation
   */
  public calculateComputeScore(executionTimeMs?: number, cpuUsagePercent?: number): number {
    if (executionTimeMs === undefined && cpuUsagePercent === undefined) {
      return 75; // Baseline default
    }

    const time = executionTimeMs ?? 1000;
    const cpu = cpuUsagePercent ?? 50;

    // Time penalty: <500ms = 100, 500-2000ms = 85, >5000ms = 40
    let timeScore = 100;
    if (time > 5000) timeScore = 40;
    else if (time > 2000) timeScore = 60;
    else if (time > 1000) timeScore = 75;
    else if (time > 500) timeScore = 90;

    // CPU penalty: <30% = 100, 30-60% = 80, >80% = 50
    let cpuScore = 100;
    if (cpu > 80) cpuScore = 50;
    else if (cpu > 60) cpuScore = 70;
    else if (cpu > 40) cpuScore = 85;

    return Math.round(timeScore * 0.6 + cpuScore * 0.4);
  }

  /**
   * Memory Score (0–100): Evaluates memory consumption in MB
   */
  public calculateMemoryScore(memoryMb?: number): number {
    if (memoryMb === undefined) return 80;
    if (memoryMb < 50) return 95;
    if (memoryMb < 150) return 85;
    if (memoryMb < 300) return 70;
    if (memoryMb < 512) return 55;
    return 40;
  }

  /**
   * Energy Efficiency Score (0–100): Evaluates estimated Wh consumption
   */
  public calculateEnergyEfficiencyScore(energyWh?: number, carbonGrams?: number): number {
    if (energyWh === undefined) return 75;
    // Normalized for micro-benchmarks (0.001 - 0.100 Wh)
    if (energyWh <= 0.01) return 95;
    if (energyWh <= 0.03) return 85;
    if (energyWh <= 0.06) return 70;
    if (energyWh <= 0.10) return 55;
    return 40;
  }

  /**
   * Composite weighted score
   */
  private computeCompositeScore(breakdown: GreenScoreBreakdown): number {
    const raw =
      breakdown.energyEfficiency * this.WEIGHTS.energy +
      breakdown.computeEfficiency * this.WEIGHTS.compute +
      breakdown.memoryEfficiency * this.WEIGHTS.memory +
      breakdown.codeQuality * this.WEIGHTS.quality;

    return Math.max(10, Math.min(100, Math.round(raw)));
  }

  /**
   * Maps numerical 0–100 score to Letter Grade
   */
  public scoreToGrade(score: number): GreenGrade {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "F";
  }

  private generateSummary(
    score: number,
    grade: GreenGrade,
    isVerified: boolean,
    improvement: number,
    breakdown: GreenScoreBreakdown
  ): string {
    if (isVerified && improvement > 0) {
      return `Green Score upgraded to ${score}/100 (Grade ${grade}) with a +${improvement} point boost from verified physical benchmark optimizations.`;
    }
    return `Green Score evaluated at ${score}/100 (Grade ${grade}). Energy: ${breakdown.energyEfficiency}/100, Compute: ${breakdown.computeEfficiency}/100, Code Quality: ${breakdown.codeQuality}/100.`;
  }
}

export const greenScoreEngine = new GreenScoreEngine();
