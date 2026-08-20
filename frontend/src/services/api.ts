/**
 * GreenOps AI - Frontend API Service (Phase 12 Integration)
 * 
 * Connects frontend views with real Phase 11 backend APIs:
 * - Code Analysis Submission: POST /api/analyses
 * - Async Polling & Live Progress Tracking: GET /api/analyses/:analysisId
 * - Recent Analyses History: GET /api/analyses
 * 
 * Core Principle: AI proposes. Measurement verifies.
 */

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

export type GreenGrade = "A+" | "A" | "B" | "C" | "D" | "F";
export type VerificationStatus = "VERIFIED" | "REJECTED" | "INCONCLUSIVE" | "PENDING";

export interface AnalysisFinding {
  id?: number | string;
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  category: string;
  ruleId?: string;
  message?: string;
  description: string;
  recommendation?: string;
  fixSnippet?: string;
  estimatedEnergyImpact?: string;
  explanation?: string;
  type?: string;
  title?: string;
}

export interface MetricComparison {
  original: number;
  optimized: number;
  reductionPercent: number;
  unit: string;
  delta?: number;
}

export interface AiExplanation {
  problem: string;
  whyItMatters: string;
  optimization: string;
  expectedImpact: {
    cpu: string;
    runtime: string;
    memory: string;
  };
  modelMetadata?: {
    provider: string;
    model: string;
    isFallback: boolean;
  };
}

export interface EnergyResult {
  energyWh: number;
  energyJoules: number;
  estimatedPowerWatts: number;
  executionTimeMs: number;
  measurementType: string;
  confidenceLabel: string;
  breakdown?: {
    baselinePowerWatts: number;
    dynamicPowerWatts: number;
    memoryPowerWatts: number;
  };
}

export interface CarbonResult {
  carbonEmissionsGrams: number;
  carbonEmissionsKg: number;
  energyWh: number;
  carbonIntensity: number;
  region: string;
  unit: string;
}

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  measuredValue?: string | number;
  threshold?: string | number;
}

export interface VerificationResult {
  verificationId: string;
  optimizationId?: string;
  analysisId?: string;
  status: VerificationStatus;
  passed: boolean;
  summary: string;
  energyReductionPercent: number;
  carbonReductionPercent: number;
  runtimeReductionPercent: number;
  cpuReductionPercent: number;
  memoryReductionPercent: number;
  metrics?: {
    executionTimeMs?: MetricComparison;
    cpuUsagePercent?: MetricComparison;
    memoryMb?: MetricComparison;
    energyWh?: MetricComparison;
    carbonGrams?: MetricComparison;
  };
  checks: VerificationCheck[];
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface GreenScoreBreakdown {
  energyEfficiency: number;
  computeEfficiency: number;
  memoryEfficiency: number;
  codeQuality: number;
}

export interface GreenScoreResult {
  score: number;
  originalScore: number;
  optimizedScore: number;
  improvement: number;
  grade: GreenGrade;
  breakdown: GreenScoreBreakdown;
  summary: string;
  calculatedAt?: string;
}

export interface SingleRunResult {
  runIndex: number;
  isWarmup: boolean;
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

export interface BenchmarkResult {
  benchmarkId: string;
  analysisId?: string;
  status: "COMPLETED" | "FAILED";
  language: string;
  fileName: string;
  codeVersion: "BASE" | "OPTIMIZED" | string;
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
  statistics?: {
    executionTimeMs: { median: number; average: number; min: number; max: number };
    cpuUsagePercent: { median: number; average: number; min: number; max: number };
    memoryMb: { median: number; average: number; min: number; max: number };
  };
  warmupRuns: number;
  measuredRuns: number;
  runs?: SingleRunResult[];
  error?: string;
  createdAt?: string;
}

export interface EnergySummary {
  original: EnergyResult;
  optimized: EnergyResult;
  reductionPercent: number;
  savingsWh: number;
  savingsJoules: number;
}

export interface CarbonSummary {
  original: CarbonResult;
  optimized: CarbonResult;
  reductionPercent: number;
  savingsGrams: number;
  region: string;
}

export interface AnalysisSummary {
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

export interface FullAnalysisJob {
  analysisId: string;
  id?: string; // compatibility alias
  projectId?: string | null;
  status: AnalysisJobStatus;
  stage: PipelineStage;
  stageProgress: number; // 0-100%
  language: string;
  fileName: string;
  originalCode: string;
  optimizedCode?: string;

  findings?: AnalysisFinding[];
  aiExplanation?: AiExplanation;
  benchmarks?: {
    original: BenchmarkResult;
    optimized: BenchmarkResult;
  };
  runtimeMetrics?: {
    executionTimeMs: MetricComparison;
    cpuUsagePercent: MetricComparison;
    memoryMb: MetricComparison;
  };
  energy?: EnergySummary;
  carbon?: CarbonSummary;
  verification?: VerificationResult;
  greenScore?: GreenScoreResult;
  summary?: AnalysisSummary;

  score?: number; // compatibility alias
  error?: string;
  failedStage?: PipelineStage;
  createdAt: string;
  completedAt?: string;
}

export interface CreateAnalysisOptions {
  code: string;
  language?: string;
  fileName?: string;
  projectId?: string;
  region?: string;
  customPowerModel?: Record<string, unknown>;
  warmupRuns?: number;
  measuredRuns?: number;
  timeoutMs?: number;
}

export interface CreateAnalysisResponse {
  analysisId: string;
  id: string;
  status: AnalysisJobStatus;
  stage: PipelineStage;
  stageProgress: number;
  language: string;
  fileName: string;
  createdAt: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Creates and starts a new analysis pipeline job (POST /api/analyses)
 */
export const createAnalysisJob = async (
  options: CreateAnalysisOptions | string,
  language: string = "python",
  fileName: string = "service.py"
): Promise<CreateAnalysisResponse> => {
  const payload: CreateAnalysisOptions =
    typeof options === "string"
      ? { code: options, language, fileName }
      : options;

  if (!payload.code || typeof payload.code !== "string" || payload.code.trim() === "") {
    throw new Error("Source code is required and cannot be empty.");
  }

  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/analyses` : `/api/analyses`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new Error(
      `Unable to connect to the GreenOps analysis backend service. (${(networkErr as Error).message})`
    );
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
      errorData.message ||
      `Analysis submission failed with HTTP status ${res.status}: ${res.statusText}`
    );
  }

  return await res.json();
};

/**
 * Polls the analysis endpoint (GET /api/analyses/:analysisId) until the job finishes or fails
 */
export const pollAnalysisJob = async (
  analysisId: string,
  onProgress?: (job: FullAnalysisJob) => void,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<FullAnalysisJob> => {
  const { maxAttempts = 75, intervalMs = 800, signal } = options;
  const endpoint = API_BASE_URL
    ? `${API_BASE_URL}/api/analyses/${analysisId}`
    : `/api/analyses/${analysisId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("Analysis polling was cancelled.");
    }

    try {
      const res = await fetch(endpoint, { signal });

      if (res.status === 404) {
        throw new Error(`Analysis job with ID "${analysisId}" was not found.`);
      }

      if (res.ok) {
        const job: FullAnalysisJob = await res.json();
        if (onProgress) {
          onProgress(job);
        }

        if (job.status === "COMPLETED") {
          try {
            localStorage.setItem("greenops-latest-analysis-id", job.analysisId);
            localStorage.setItem("greenops-analysis", JSON.stringify(job));
          } catch {
            // Ignore localStorage errors
          }
          return job;
        }

        if (job.status === "FAILED") {
          const stageInfo = job.failedStage ? ` (at stage: ${job.failedStage})` : "";
          throw new Error(job.error || `Analysis pipeline failed${stageInfo}.`);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[Polling attempt ${attempt + 1}] Unexpected status ${res.status}:`, errData);
      }
    } catch (err) {
      if (signal?.aborted) {
        throw new Error("Analysis polling was cancelled.");
      }
      if ((err as Error).message.includes("Analysis pipeline failed") ||
          (err as Error).message.includes("was not found")) {
        throw err;
      }
      console.warn(`[Polling attempt ${attempt + 1}] Transient error, retrying:`, (err as Error).message);
    }

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, intervalMs);
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeout);
            reject(new Error("Analysis polling was cancelled."));
          },
          { once: true }
        );
      }
    });
  }

  throw new Error("Analysis job timed out. The backend server is still processing or has stopped.");
};

/**
 * Convenience analyzeCode function that initiates the job and polls to completion
 */
export const analyzeCode = async (
  code: string,
  language: string = "python",
  fileName: string = "service.py",
  onProgress?: (job: FullAnalysisJob) => void,
  signal?: AbortSignal
): Promise<FullAnalysisJob> => {
  const created = await createAnalysisJob({ code, language, fileName });
  return await pollAnalysisJob(created.analysisId, onProgress, { signal });
};

/**
 * Retrieves a single analysis by ID (GET /api/analyses/:analysisId with localStorage fallback)
 */
export const getAnalysis = async (analysisId?: string): Promise<FullAnalysisJob | null> => {
  const targetId =
    analysisId && analysisId !== "latest"
      ? analysisId
      : (typeof window !== "undefined" ? localStorage.getItem("greenops-latest-analysis-id") : null);

  // 1. Fetch specific ID if available
  if (targetId) {
    try {
      const endpoint = API_BASE_URL
        ? `${API_BASE_URL}/api/analyses/${targetId}`
        : `/api/analyses/${targetId}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data: FullAnalysisJob = await res.json();
        try {
          localStorage.setItem("greenops-analysis", JSON.stringify(data));
          localStorage.setItem("greenops-latest-analysis-id", data.analysisId);
        } catch {
          // Ignore
        }
        return data;
      }
    } catch (err) {
      console.warn("[GreenOps API] Failed to fetch analysis by ID:", err);
    }
  }

  // 2. Fetch latest recent analysis from API
  try {
    const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/analyses` : `/api/analyses`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.analyses && data.analyses.length > 0) {
        const latest = data.analyses[0] as FullAnalysisJob;
        try {
          localStorage.setItem("greenops-analysis", JSON.stringify(latest));
          localStorage.setItem("greenops-latest-analysis-id", latest.analysisId);
        } catch {
          // Ignore
        }
        return latest;
      }
    }
  } catch (err) {
    console.warn("[GreenOps API] Failed to fetch recent analyses:", err);
  }

  // 3. Fallback to localStorage
  try {
    const saved = localStorage.getItem("greenops-analysis");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore localStorage parse error
  }

  return null;
};

/**
 * Retrieves recent analyses (GET /api/analyses)
 */
export const getRecentAnalyses = async (limit: number = 10): Promise<FullAnalysisJob[]> => {
  try {
    const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/analyses` : `/api/analyses`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      return (data.analyses || []).slice(0, limit);
    }
  } catch (err) {
    console.warn("[GreenOps API] Failed to fetch recent analyses list:", err);
  }
  return [];
};
