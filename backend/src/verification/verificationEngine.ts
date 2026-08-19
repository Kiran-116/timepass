/**
 * GreenOps AI - Phase 9: Verification Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Dual-execution benchmark engine that experimentally measures, compares, and verifies
 * whether proposed AI optimizations actually reduce energy & carbon consumption.
 */

import { runBenchmark } from "../benchmark/runner.ts";
import type { BenchmarkResult } from "../benchmark/types.ts";
import { carbonEngine } from "../carbon/carbonEngine.ts";
import { energyEngine } from "../energy/energyEngine.ts";
import { DEMO_POWER_PROFILE } from "../energy/powerModel.ts";
import type { VerificationMetrics, VerificationOptions, VerificationResult, VerificationStatus } from "./types.ts";

export class VerificationEngine {
  /**
   * Main Verification Function
   * Benchmarks both Original and Optimized implementations using identical workloads & environments,
   * measures telemetry, energy (Wh), and carbon (gCO2e), and enforces the verification rules.
   */
  public async verifyOptimization(options: VerificationOptions): Promise<VerificationResult> {
    const {
      originalCode,
      optimizedCode,
      language = "python",
      fileName = "benchmark.py",
      region = "global",
      powerModel = DEMO_POWER_PROFILE,
      energyReductionThresholdPercent = 5.0,
      expectedStdout,
      warmupRuns = 2,
      measuredRuns = 5,
      timeoutMs = 10000
    } = options;

    if (!originalCode || originalCode.trim() === "") {
      throw new Error("Original code is required for verification benchmark.");
    }
    if (!optimizedCode || optimizedCode.trim() === "") {
      throw new Error("Optimized code is required for verification benchmark.");
    }

    // 1. Execute Benchmark for ORIGINAL Implementation (BASE)
    const originalBenchmark = await runBenchmark({
      code: originalCode,
      language,
      fileName,
      codeVersion: "BASE",
      warmupRuns,
      measuredRuns,
      timeoutMs
    });

    if (originalBenchmark.status === "FAILED") {
      return this.buildRejectionResult(
        "Original code benchmark execution failed.",
        0,
        false,
        this.createEmptyMetrics(),
        this.createEmptyMetrics(),
        originalBenchmark,
        originalBenchmark,
        warmupRuns,
        measuredRuns
      );
    }

    // 2. Execute Benchmark for OPTIMIZED Implementation (AFTER)
    const optimizedBenchmark = await runBenchmark({
      code: optimizedCode,
      language,
      fileName,
      codeVersion: "OPTIMIZED",
      warmupRuns,
      measuredRuns,
      timeoutMs
    });

    if (optimizedBenchmark.status === "FAILED") {
      return this.buildRejectionResult(
        `Optimized code benchmark failed: ${optimizedBenchmark.error || "Runtime error"}`,
        energyReductionThresholdPercent,
        false,
        this.computeMetrics(originalBenchmark, powerModel, region),
        this.createEmptyMetrics(),
        originalBenchmark,
        optimizedBenchmark,
        warmupRuns,
        measuredRuns
      );
    }

    // 3. Measure Telemetry, Energy, and Carbon for BEFORE & AFTER
    const beforeMetrics = this.computeMetrics(originalBenchmark, powerModel, region);
    const afterMetrics = this.computeMetrics(optimizedBenchmark, powerModel, region);

    // 4. Functional Correctness Validation
    const functionalityPassed = this.validateFunctionality(
      originalBenchmark,
      optimizedBenchmark,
      expectedStdout
    );

    if (!functionalityPassed) {
      return this.buildRejectionResult(
        "Functional validation failed: Optimized code output does not match expected program behavior.",
        energyReductionThresholdPercent,
        false,
        beforeMetrics,
        afterMetrics,
        originalBenchmark,
        optimizedBenchmark,
        warmupRuns,
        measuredRuns
      );
    }

    // 5. Compute Reduction Percentages
    const reductions = {
      runtimeReductionPercent: this.calculateReductionPercent(beforeMetrics.runtimeSeconds, afterMetrics.runtimeSeconds),
      cpuReductionPercent: this.calculateReductionPercent(beforeMetrics.cpuUsagePercent, afterMetrics.cpuUsagePercent),
      memoryReductionPercent: this.calculateReductionPercent(beforeMetrics.memoryMb, afterMetrics.memoryMb),
      energyReductionPercent: this.calculateReductionPercent(beforeMetrics.energyWh, afterMetrics.energyWh),
      carbonReductionPercent: this.calculateReductionPercent(beforeMetrics.carbonGrams, afterMetrics.carbonGrams)
    };

    // 6. Evaluate Verification Rule
    // VERIFIED iff energy reduction >= threshold AND functionality passed
    const energyImproved = reductions.energyReductionPercent >= energyReductionThresholdPercent;

    if (!energyImproved) {
      const reason = reductions.energyReductionPercent < 0
        ? `REJECTED: Optimized implementation increased energy consumption by ${Math.abs(reductions.energyReductionPercent).toFixed(2)}%.`
        : `REJECTED: Energy reduction (${reductions.energyReductionPercent.toFixed(2)}%) did not meet the required threshold (${energyReductionThresholdPercent.toFixed(2)}%).`;

      return {
        status: "REJECTED",
        reason,
        thresholdPercentUsed: energyReductionThresholdPercent,
        functionalityPassed: true,
        before: beforeMetrics,
        after: afterMetrics,
        reductions,
        benchmarkDetails: {
          originalBenchmarkId: originalBenchmark.benchmarkId,
          optimizedBenchmarkId: optimizedBenchmark.benchmarkId,
          warmupRuns,
          measuredRuns
        },
        createdAt: new Date().toISOString()
      };
    }

    // VERIFIED SUCCESS
    return {
      status: "VERIFIED",
      reason: `VERIFIED: Optimization achieved ${reductions.energyReductionPercent.toFixed(2)}% energy reduction and passed all functional validation checks.`,
      thresholdPercentUsed: energyReductionThresholdPercent,
      functionalityPassed: true,
      before: beforeMetrics,
      after: afterMetrics,
      reductions,
      benchmarkDetails: {
        originalBenchmarkId: originalBenchmark.benchmarkId,
        optimizedBenchmarkId: optimizedBenchmark.benchmarkId,
        warmupRuns,
        measuredRuns
      },
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Calculates telemetry, Wh energy, and gCO2e carbon metrics from a benchmark result
   */
  public computeMetrics(
    bm: BenchmarkResult,
    powerModel = DEMO_POWER_PROFILE,
    region = "global"
  ): VerificationMetrics {
    const telemetry = {
      executionTimeMs: bm.executionTimeMs,
      cpuUsagePercent: bm.cpuUsagePercent,
      memoryMb: bm.memoryMb
    };

    const energyRes = energyEngine.calculateEnergy(telemetry, powerModel);
    const carbonRes = carbonEngine.calculateCarbonSync(energyRes, region);

    return {
      executionTimeMs: bm.executionTimeMs,
      runtimeSeconds: Number((bm.executionTimeMs / 1000).toFixed(4)),
      cpuUsagePercent: bm.cpuUsagePercent,
      memoryMb: bm.memoryMb,
      energyWh: energyRes.energyWh,
      carbonGrams: carbonRes.carbonEmissionsGrams
    };
  }

  /**
   * Functional Correctness Validator
   */
  private validateFunctionality(
    baseBm: BenchmarkResult,
    optBm: BenchmarkResult,
    expectedStdout?: string
  ): boolean {
    // If explicit expected output provided, validate optimized stdout against it
    if (expectedStdout !== undefined) {
      const optOutput = (optBm.runs?.[0]?.stdout || "").trim();
      return optOutput === expectedStdout.trim();
    }

    // Default functional check: compare stdout between original and optimized runs
    const baseOutput = (baseBm.runs?.[0]?.stdout || "").trim();
    const optOutput = (optBm.runs?.[0]?.stdout || "").trim();

    // If both executed cleanly and produced stdout, ensure outputs match
    if (baseOutput !== "" && optOutput !== "") {
      return baseOutput === optOutput;
    }

    // If both exited cleanly with exitCode 0, accept functional equivalence
    const baseExitCode = baseBm.runs?.[0]?.exitCode ?? 0;
    const optExitCode = optBm.runs?.[0]?.exitCode ?? 0;
    return baseExitCode === 0 && optExitCode === 0;
  }

  /**
   * Safe percentage reduction formula: ((before - after) / before) * 100
   */
  public calculateReductionPercent(before: number, after: number): number {
    if (!before || isNaN(before) || before <= 0) {
      return 0.0;
    }
    const diff = before - after;
    const percent = (diff / before) * 100;
    return Number(percent.toFixed(2));
  }

  private createEmptyMetrics(): VerificationMetrics {
    return {
      executionTimeMs: 0,
      runtimeSeconds: 0,
      cpuUsagePercent: 0,
      memoryMb: 0,
      energyWh: 0,
      carbonGrams: 0
    };
  }

  private buildRejectionResult(
    reason: string,
    threshold: number,
    funcPassed: boolean,
    before: VerificationMetrics,
    after: VerificationMetrics,
    origBm: BenchmarkResult,
    optBm: BenchmarkResult,
    warmupRuns: number,
    measuredRuns: number
  ): VerificationResult {
    return {
      status: "REJECTED",
      reason,
      thresholdPercentUsed: threshold,
      functionalityPassed: funcPassed,
      before,
      after,
      reductions: {
        runtimeReductionPercent: this.calculateReductionPercent(before.runtimeSeconds, after.runtimeSeconds),
        cpuReductionPercent: this.calculateReductionPercent(before.cpuUsagePercent, after.cpuUsagePercent),
        memoryReductionPercent: this.calculateReductionPercent(before.memoryMb, after.memoryMb),
        energyReductionPercent: this.calculateReductionPercent(before.energyWh, after.energyWh),
        carbonReductionPercent: this.calculateReductionPercent(before.carbonGrams, after.carbonGrams)
      },
      benchmarkDetails: {
        originalBenchmarkId: origBm.benchmarkId || "bm-orig-failed",
        optimizedBenchmarkId: optBm.benchmarkId || "bm-opt-failed",
        warmupRuns,
        measuredRuns
      },
      createdAt: new Date().toISOString()
    };
  }
}

export const verificationEngine = new VerificationEngine();
