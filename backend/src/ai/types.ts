/**
 * GreenOps AI - Phase 8: AI Agent Types & Output Specifications
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Defines structured context input and structured optimization output schemas.
 */

import type { AnalysisFinding } from "../analyzer/staticAnalyzer";
import type { CarbonCalculationResult } from "../carbon/carbonEngine";
import type { EnergyCalculationResult } from "../energy/energyEngine";

export interface TelemetryContext {
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
}

export interface AiAgentInputContext {
  code: string;
  language?: string;
  fileName?: string;
  findings?: AnalysisFinding[];
  telemetry?: TelemetryContext;
  energy?: EnergyCalculationResult;
  carbon?: CarbonCalculationResult;
}

export type ResourceImpactQualitative = "lower" | "similar" | "higher";

export interface ExpectedImpactQualitative {
  cpu: ResourceImpactQualitative;
  runtime: ResourceImpactQualitative;
  memory: ResourceImpactQualitative;
}

export interface AiModelMetadata {
  provider: string;
  model: string;
  isFallback: boolean;
}

export interface AiAgentOutput {
  problem: string;
  whyItMatters: string;
  optimization: string;
  optimizedCode: string;
  expectedImpact: ExpectedImpactQualitative;
  modelMetadata: AiModelMetadata;
  createdAt: string;
}
