/**
 * GreenOps AI - Phase 9: Verification Engine Types
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Defines input context, comparison metrics, and verification results.
 */

import type { BenchmarkResult } from "../benchmark/types";
import type { CarbonCalculationResult } from "../carbon/carbonEngine";
import type { EnergyCalculationResult } from "../energy/energyEngine";

export type VerificationStatus = "VERIFIED" | "REJECTED" | "INCONCLUSIVE" | "PENDING";

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  measuredValue?: string | number;
  threshold?: string | number;
}

export interface MetricComparison {
  original: number;
  optimized: number;
  delta: number;
  reductionPercent: number;
  unit: string;
}

export interface VerificationInputContext {
  originalCode: string;
  optimizedCode: string;
  originalBenchmark: BenchmarkResult;
  optimizedBenchmark: BenchmarkResult;
  originalEnergy: EnergyCalculationResult;
  optimizedEnergy: EnergyCalculationResult;
  originalCarbon: CarbonCalculationResult;
  optimizedCarbon: CarbonCalculationResult;
  energyReductionThresholdPercent?: number;
}

export interface VerificationResult {
  verificationId: string;
  optimizationId?: string;
  analysisId?: string;
  status: VerificationStatus;
  passed: boolean;
  summary: string;
  
  // Key Comparative Reductions
  energyReductionPercent: number;
  carbonReductionPercent: number;
  runtimeReductionPercent: number;
  cpuReductionPercent: number;
  memoryReductionPercent: number;

  // Granular Metric Comparisons
  metrics: {
    executionTimeMs: MetricComparison;
    cpuUsagePercent: MetricComparison;
    memoryMb: MetricComparison;
    energyWh: MetricComparison;
    carbonGrams: MetricComparison;
  };

  // Rule Verification Checklist
  checks: VerificationCheck[];

  // Trust & Metadata
  verifiedBy: string;
  verifiedAt: string;
}

export type VerificationMetrics = VerificationResult["metrics"];
