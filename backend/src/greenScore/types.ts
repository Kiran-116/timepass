/**
 * GreenOps AI - Phase 10: Green Score Engine Types & Interfaces
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Defines data structures for developer-facing Green Score (0-100),
 * dimension breakdowns, scoring weights, and comparison metrics.
 */

import type { CodeFinding } from "../analyzer/staticAnalyzer.ts";
import type { CarbonCalculationResult } from "../carbon/carbonEngine.ts";
import type { EnergyCalculationResult } from "../energy/energyEngine.ts";
import type { VerificationMetrics, VerificationResult } from "../verification/types.ts";

export type GreenScoreStatus = "CALCULATED" | "INSUFFICIENT_DATA" | "INVALID_INPUT";
export type GreenScoreRating = "A+" | "A" | "B" | "C" | "D" | "F" | "N/A";
export type ComparisonStatus = "IMPROVED" | "REGRESSED" | "UNCHANGED" | "INSUFFICIENT_DATA";

export interface TelemetryMetricsInput {
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb?: number;
}

export interface GreenScoreInput {
  telemetry?: TelemetryMetricsInput;
  energy?: EnergyCalculationResult;
  carbon?: CarbonCalculationResult;
  verificationMetrics?: VerificationMetrics;
  findings?: CodeFinding[];
}

export interface GreenScoreDimensions {
  energyEfficiency: number;  // 0 to 100
  computeEfficiency: number; // 0 to 100
  memoryEfficiency: number;  // 0 to 100
  carbonEfficiency: number;  // 0 to 100
}

export interface GreenScoreWeights {
  energy: number;   // Default: 0.35
  compute: number;  // Default: 0.25
  memory: number;   // Default: 0.20
  carbon: number;   // Default: 0.20
}

export interface GreenScoreResult {
  status: GreenScoreStatus;
  score: number | null;        // Integer 0 to 100 (null if INSUFFICIENT_DATA)
  rating: GreenScoreRating;
  methodologyVersion: string;  // e.g. "v1.0"
  breakdown: GreenScoreDimensions | null;
  explanation: string;
  isProductMetricNotice: string;
  createdAt: string;
}

export interface GreenScoreComparisonResult {
  status: ComparisonStatus;
  beforeScore: GreenScoreResult;
  afterScore: GreenScoreResult;
  scoreDelta: number | null;   // e.g. +14 pts
  ratingChange: string;        // e.g. "C -> A"
  summary: string;
  createdAt: string;
}

export interface GreenScoreOptions {
  weights?: Partial<GreenScoreWeights>;
  methodologyVersion?: string;
}
