/**
 * GreenOps AI - Frontend API Service
 * 
 * Connects frontend views with backend Phase 11 APIs:
 * - Code Analysis Submission (POST /api/analyses)
 * - Async Polling & Live Progress Tracking (GET /api/analyses/:analysisId)
 * - Recent Analyses History (GET /api/analyses)
 * - Verification & Benchmark telemetry
 */

export interface AnalysisFinding {
  id?: number | string;
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | string;
  file: string;
  line: number;
  description: string;
  recommendation: string;
  type?: string;
  title?: string;
}

export interface MetricComparison {
  original: number;
  optimized: number;
  reductionPercent: number;
  unit: string;
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
  status: "VERIFIED" | "REJECTED" | "INCONCLUSIVE" | "PENDING";
  passed: boolean;
  summary: string;
  energyReductionPercent: number;
  carbonReductionPercent: number;
  runtimeReductionPercent: number;
  cpuReductionPercent: number;
  memoryReductionPercent: number;
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
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  breakdown: GreenScoreBreakdown;
  summary: string;
}

export interface SingleRunResult {
  runIndex: number;
  isWarmup: boolean;
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
  exitCode: number;
}

export interface BenchmarkResult {
  benchmarkId: string;
  status: "COMPLETED" | "FAILED";
  language: string;
  fileName: string;
  codeVersion: string;
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
}

export interface AnalysisSummary {
  totalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  energyReductionPercent: number;
  carbonReductionPercent: number;
  runtimeReductionPercent: number;
  verificationStatus: string;
  greenScore: number;
  grade: string;
}

export interface FullAnalysisJob {
  analysisId: string;
  id: string; // compatibility alias
  projectId?: string | null;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  stage: string;
  stageProgress: number; // 0-100%
  language: string;
  fileName: string;
  originalCode: string;
  optimizedCode?: string;

  findings: AnalysisFinding[];
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
  energy?: {
    original: EnergyResult;
    optimized: EnergyResult;
    reductionPercent: number;
    savingsWh: number;
    savingsJoules: number;
  };
  carbon?: {
    original: CarbonResult;
    optimized: CarbonResult;
    reductionPercent: number;
    savingsGrams: number;
    region: string;
  };
  verification?: VerificationResult;
  greenScore?: GreenScoreResult;
  summary?: AnalysisSummary;

  score: number; // top-level score alias
  error?: string;
  failedStage?: string;
  createdAt: string;
  completedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Creates and starts a new analysis pipeline job
 */
export const createAnalysisJob = async (
  code: string,
  language: string = "python",
  fileName: string = "service.py"
): Promise<{ analysisId: string; status: string; stage: string; stageProgress: number }> => {
  const res = await fetch(`${API_BASE_URL}/api/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, fileName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Analysis request failed: ${res.statusText}`);
  }

  return await res.json();
};

/**
 * Polls the analysis endpoint until the job finishes or fails
 */
export const pollAnalysisJob = async (
  analysisId: string,
  onProgress?: (job: FullAnalysisJob) => void,
  maxAttempts: number = 60,
  intervalMs: number = 800
): Promise<FullAnalysisJob> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyses/${analysisId}`);
      if (res.ok) {
        const job: FullAnalysisJob = await res.json();
        if (onProgress) onProgress(job);

        if (job.status === "COMPLETED") {
          localStorage.setItem("greenops-analysis", JSON.stringify(job));
          return job;
        }

        if (job.status === "FAILED") {
          throw new Error(job.error || "Analysis pipeline failed during execution.");
        }
      }
    } catch (err) {
      if ((err as Error).message.includes("Analysis pipeline failed")) {
        throw err;
      }
      console.warn(`[Polling attempt ${attempt + 1}] Check failed, retrying...`, err);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Analysis job timed out. The server is still processing or unavailable.");
};

/**
 * Convenience analyzeCode function that initiates the job and polls to completion
 */
export const analyzeCode = async (
  code: string,
  language: string = "python",
  fileName: string = "service.py",
  onProgress?: (job: FullAnalysisJob) => void
): Promise<FullAnalysisJob> => {
  const job = await createAnalysisJob(code, language, fileName);
  return await pollAnalysisJob(job.analysisId, onProgress);
};

/**
 * Retrieves a single analysis by ID (checking API first, then localStorage fallback)
 */
export const getAnalysis = async (analysisId?: string): Promise<FullAnalysisJob | null> => {
  // If specific analysisId provided, fetch from backend
  if (analysisId && analysisId !== "latest") {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyses/${analysisId}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("greenops-analysis", JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("[GreenOps API] Failed to fetch analysis by ID:", err);
    }
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem("greenops-analysis");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore localStorage parse error
  }

  // Fallback: Fetch latest recent analysis from API
  try {
    const res = await fetch(`${API_BASE_URL}/api/analyses`);
    if (res.ok) {
      const data = await res.json();
      if (data.analyses && data.analyses.length > 0) {
        const latest = data.analyses[0];
        localStorage.setItem("greenops-analysis", JSON.stringify(latest));
        return latest;
      }
    }
  } catch {
    // Ignore
  }

  return null;
};

/**
 * Retrieves recent analyses
 */
export const getRecentAnalyses = async (limit: number = 10): Promise<FullAnalysisJob[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analyses`);
    if (res.ok) {
      const data = await res.json();
      return (data.analyses || []).slice(0, limit);
    }
  } catch (err) {
    console.warn("[GreenOps API] Failed to fetch recent analyses:", err);
  }
  return [];
};
