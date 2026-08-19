/**
 * GreenOps AI - Phase 9: Verification Engine Types & Interfaces
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Defines the dual-pipeline comparison types and verification status schemas.
 */

import type { PowerModel } from "../energy/powerModel.ts";

export type VerificationStatus = "VERIFIED" | "REJECTED";

export interface VerificationOptions {
  originalCode: string;
  optimizedCode: string;
  language?: string;
  fileName?: string;
  region?: string;                  // Cloud carbon intensity region (default: 'global')
  powerModel?: PowerModel;         // Hardware profile model
  energyReductionThresholdPercent?: number; // Minimum improvement threshold % (default: 5.0%)
  expectedStdout?: string;         // Expected output for functional correctness validation
  warmupRuns?: number;             // Default 2
  measuredRuns?: number;           // Default 5
  timeoutMs?: number;              // Default 10000ms
}

export interface VerificationMetrics {
  executionTimeMs: number;
  runtimeSeconds: number;
  cpuUsagePercent: number;
  memoryMb: number;
  energyWh: number;
  carbonGrams: number;
}

export interface MetricReductions {
  runtimeReductionPercent: number;
  cpuReductionPercent: number;
  memoryReductionPercent: number;
  energyReductionPercent: number;
  carbonReductionPercent: number;
}

export interface VerificationResult {
  status: VerificationStatus;
  reason: string;
  thresholdPercentUsed: number;
  functionalityPassed: boolean;
  
  before: VerificationMetrics;
  after: VerificationMetrics;
  
  reductions: MetricReductions;
  
  benchmarkDetails: {
    originalBenchmarkId: string;
    optimizedBenchmarkId: string;
    warmupRuns: number;
    measuredRuns: number;
  };
  createdAt: string;
}
