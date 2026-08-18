import { executeInDockerSandbox } from "./sandbox";
import { computeMetricStatistics } from "./telemetry";
import { BenchmarkOptions, BenchmarkResult, SingleRunResult } from "./types";

export async function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkResult> {
  const {
    code,
    language = "python",
    fileName = "benchmark.py",
    analysisId,
    codeVersion = "BASE",
    warmupRuns = 2,
    measuredRuns = 5,
    timeoutMs = 10000,
    cpuLimit = 1.0,
    memoryLimitMb = 256,
  } = options;

  if (!code || typeof code !== "string" || code.trim() === "") {
    throw new Error("Code is required for benchmark execution and cannot be empty.");
  }

  const benchmarkId = `bm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const runs: SingleRunResult[] = [];

  // 1. Execute Warm-up Runs (default 2)
  for (let i = 1; i <= warmupRuns; i++) {
    const result = await executeInDockerSandbox(code, {
      language,
      fileName,
      timeoutMs,
      cpuLimit,
      memoryLimitMb,
    });

    if (!result.success) {
      return {
        benchmarkId,
        analysisId,
        status: "FAILED",
        language,
        fileName,
        codeVersion,
        executionTimeMs: 0,
        cpuUsagePercent: 0,
        memoryMb: 0,
        statistics: {
          executionTimeMs: { median: 0, average: 0, min: 0, max: 0 },
          cpuUsagePercent: { median: 0, average: 0, min: 0, max: 0 },
          memoryMb: { median: 0, average: 0, min: 0, max: 0 },
        },
        warmupRuns,
        measuredRuns,
        runs,
        error: result.error || "Warm-up execution failed",
        createdAt: new Date().toISOString(),
      };
    }

    runs.push({
      runIndex: i,
      isWarmup: true,
      executionTimeMs: result.executionTimeMs,
      cpuUsagePercent: result.cpuUsagePercent,
      memoryMb: result.memoryMb,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  // 2. Execute Measured Runs (default 5)
  const measuredTimes: number[] = [];
  const measuredCpus: number[] = [];
  const measuredMems: number[] = [];

  for (let i = 1; i <= measuredRuns; i++) {
    const result = await executeInDockerSandbox(code, {
      language,
      fileName,
      timeoutMs,
      cpuLimit,
      memoryLimitMb,
    });

    if (!result.success) {
      return {
        benchmarkId,
        analysisId,
        status: "FAILED",
        language,
        fileName,
        codeVersion,
        executionTimeMs: 0,
        cpuUsagePercent: 0,
        memoryMb: 0,
        statistics: {
          executionTimeMs: { median: 0, average: 0, min: 0, max: 0 },
          cpuUsagePercent: { median: 0, average: 0, min: 0, max: 0 },
          memoryMb: { median: 0, average: 0, min: 0, max: 0 },
        },
        warmupRuns,
        measuredRuns,
        runs,
        error: result.error || `Measured run ${i} failed`,
        createdAt: new Date().toISOString(),
      };
    }

    measuredTimes.push(result.executionTimeMs);
    measuredCpus.push(result.cpuUsagePercent);
    measuredMems.push(result.memoryMb);

    runs.push({
      runIndex: warmupRuns + i,
      isWarmup: false,
      executionTimeMs: result.executionTimeMs,
      cpuUsagePercent: result.cpuUsagePercent,
      memoryMb: result.memoryMb,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  // 3. Compute statistical telemetry aggregates
  const timeStats = computeMetricStatistics(measuredTimes);
  const cpuStats = computeMetricStatistics(measuredCpus);
  const memStats = computeMetricStatistics(measuredMems);

  return {
    benchmarkId,
    analysisId,
    status: "COMPLETED",
    language,
    fileName,
    codeVersion,
    executionTimeMs: timeStats.median,
    cpuUsagePercent: cpuStats.median,
    memoryMb: memStats.median,
    statistics: {
      executionTimeMs: timeStats,
      cpuUsagePercent: cpuStats,
      memoryMb: memStats,
    },
    warmupRuns,
    measuredRuns,
    runs,
    createdAt: new Date().toISOString(),
  };
}
