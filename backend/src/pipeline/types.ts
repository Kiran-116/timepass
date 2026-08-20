/**
 * GreenOps AI - Phase 11: Pipeline Types & DTOs
 *
 * Defines request, response, job lifecycle status, and unified analysis structures.
 */

import type { AnalysisFinding } from "../analyzer/staticAnalyzer";
import type { BenchmarkResult } from "../benchmark/types";
import type { CarbonCalculationResult } from "../carbon/carbonEngine";
import type { EnergyCalculationResult } from "../energy/energyEngine";
import type { PowerModel } from "../energy/powerModel";
import type { GreenGrade, GreenScoreResult } from "../score/types";
import type { VerificationResult, VerificationStatus } from "../verification/types";

export type AnalysisJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type PipelineStage =
  | "INITIALIZING"
  | "STATIC_ANALYSIS"
  | "ORIGINAL_BENCHMARK"
  | "ORIGINAL_ENERGY"
  | "ORIGINAL_CARBON"
  | "AI_OPTIMIZATION"
  | "OPTIMIZED_BENCHMARK"
  | "OPTIMIZED_ENERGY"
  | "OPTIMIZED_CARBON"
  | "VERIFICATION"
  | "GREEN_SCORE"
  | "FINALIZING"
  | "COMPLETED"
  | "FAILED";

export interface AnalysisRequestDTO {
  code: string;
  language?: string;
  fileName?: string;
  projectId?: string;
  region?: string;
  customPowerModel?: PowerModel;
  warmupRuns?: number;
  measuredRuns?: number;
  timeoutMs?: number;
  type?: "CODE" | "PR" | "BENCHMARK";
  prNumber?: number;
  repoFullName?: string;
  commitSha?: string | null;
  prTitle?: string;
  prUrl?: string;
}

export interface MetricComparisonDTO {
  original: number;
  optimized: number;
  reductionPercent: number;
  unit: string;
}

export interface AiExplanationDTO {
  problem: string;
  whyItMatters: string;
  optimization: string;
  expectedImpact: {
    cpu: string;
    runtime: string;
    memory: string;
  };
  modelMetadata: {
    provider: string;
    model: string;
    isFallback: boolean;
  };
}

export interface EnergySummaryDTO {
  original: EnergyCalculationResult;
  optimized: EnergyCalculationResult;
  reductionPercent: number;
  savingsWh: number;
  savingsJoules: number;
}

export interface CarbonSummaryDTO {
  original: CarbonCalculationResult;
  optimized: CarbonCalculationResult;
  reductionPercent: number;
  savingsGrams: number;
  region: string;
}

export interface AnalysisSummaryDTO {
  totalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  energyReductionPercent: number;
  carbonReductionPercent: number;
  runtimeReductionPercent: number;
  verificationStatus: VerificationStatus;
  greenScore: number;
  grade: GreenGrade;
}

export interface AnalysisJob {
  analysisId: string;
  projectId?: string | null;
  type?: "CODE" | "PR" | "BENCHMARK";
  status: AnalysisJobStatus;
  stage: PipelineStage;
  stageProgress: number; // 0–100%
  language: string;
  fileName: string;
  originalCode: string;
  optimizedCode?: string;

  // PR specific metadata
  prNumber?: number;
  repoFullName?: string;
  commitSha?: string | null;
  prTitle?: string;
  prUrl?: string;
  reportMarkdown?: string;

  findings?: AnalysisFinding[];
  aiExplanation?: AiExplanationDTO;
  benchmarks?: {
    original: BenchmarkResult;
    optimized: BenchmarkResult;
  };
  runtimeMetrics?: {
    executionTimeMs: MetricComparisonDTO;
    cpuUsagePercent: MetricComparisonDTO;
    memoryMb: MetricComparisonDTO;
  };
  energy?: EnergySummaryDTO;
  carbon?: CarbonSummaryDTO;
  verification?: VerificationResult;
  greenScore?: GreenScoreResult;
  summary?: AnalysisSummaryDTO;

  error?: string;
  failedStage?: PipelineStage;
  createdAt: string;
  completedAt?: string;
}
