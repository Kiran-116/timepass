/**
 * GreenOps AI - Phase 10: Green Score Types
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Defines inputs, score breakdowns, and composite scoring metrics (0–100).
 */

import type { AnalysisFinding } from "../analyzer/staticAnalyzer";
import type { BenchmarkResult } from "../benchmark/types";
import type { CarbonCalculationResult } from "../carbon/carbonEngine";
import type { EnergyCalculationResult } from "../energy/energyEngine";
import type { VerificationResult } from "../verification/types";

export type GreenGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface GreenScoreBreakdown {
  energyEfficiency: number;   // 0–100
  computeEfficiency: number;  // 0–100
  memoryEfficiency: number;   // 0–100
  codeQuality: number;        // 0–100
}

export interface GreenScoreInputContext {
  findings?: AnalysisFinding[];
  originalBenchmark?: BenchmarkResult;
  optimizedBenchmark?: BenchmarkResult;
  originalEnergy?: EnergyCalculationResult;
  optimizedEnergy?: EnergyCalculationResult;
  originalCarbon?: CarbonCalculationResult;
  optimizedCarbon?: CarbonCalculationResult;
  verificationResult?: VerificationResult;
}

export interface GreenScoreResult {
  score: number;             // Composite 0–100 Green Score
  originalScore: number;     // Pre-optimization Green Score
  optimizedScore: number;    // Post-optimization Green Score
  improvement: number;       // Score delta (e.g. +25)
  grade: GreenGrade;         // A+, A, B, C, D, F
  breakdown: GreenScoreBreakdown;
  summary: string;
  calculatedAt: string;
}
