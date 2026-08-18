export interface MetricStatistics {
  median: number;
  average: number;
  min: number;
  max: number;
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

export interface BenchmarkOptions {
  code: string;
  language?: string;
  fileName?: string;
  analysisId?: string;
  codeVersion?: "BASE" | "OPTIMIZED" | string;
  warmupRuns?: number; // default: 2
  measuredRuns?: number; // default: 5
  timeoutMs?: number; // default: 10000
  cpuLimit?: number; // default: 1.0
  memoryLimitMb?: number; // default: 256
}

export interface BenchmarkResult {
  benchmarkId: string;
  analysisId?: string;
  status: "COMPLETED" | "FAILED";
  language: string;
  fileName: string;
  codeVersion: string;
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
  statistics: {
    executionTimeMs: MetricStatistics;
    cpuUsagePercent: MetricStatistics;
    memoryMb: MetricStatistics;
  };
  warmupRuns: number;
  measuredRuns: number;
  runs?: SingleRunResult[];
  error?: string;
  createdAt: string;
}

export interface SandboxExecutionResult {
  success: boolean;
  executionTimeMs: number;
  cpuUsagePercent: number;
  memoryMb: number;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  isTimeout?: boolean;
}
