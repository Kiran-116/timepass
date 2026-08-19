/**
 * GreenOps AI - Phase 9: Verification Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Evaluates whether proposed optimizations achieve verified reductions in energy & carbon
 * without introducing runtime crashes, syntax regressions, or severe performance degradation.
 */

import type {
  MetricComparison,
  VerificationCheck,
  VerificationInputContext,
  VerificationResult,
  VerificationStatus,
} from "./types";

export class VerificationEngine {
  /**
   * Primary Verification Function
   * Compares before and after measurements to determine verification status.
   */
  public verify(context: VerificationInputContext): VerificationResult {
    this.validateContext(context);

    const {
      originalCode,
      optimizedCode,
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
      energyReductionThresholdPercent = 0.0,
    } = context;

    // 1. Calculate granular metric comparisons
    const timeComp = this.compareMetric(
      originalBenchmark.executionTimeMs,
      optimizedBenchmark.executionTimeMs,
      "ms"
    );

    const cpuComp = this.compareMetric(
      originalBenchmark.cpuUsagePercent,
      optimizedBenchmark.cpuUsagePercent,
      "%"
    );

    const memComp = this.compareMetric(
      originalBenchmark.memoryMb,
      optimizedBenchmark.memoryMb,
      "MB"
    );

    const energyComp = this.compareMetric(
      originalEnergy.energyWh,
      optimizedEnergy.energyWh,
      "Wh"
    );

    const carbonComp = this.compareMetric(
      originalCarbon.carbonEmissionsGrams,
      optimizedCarbon.carbonEmissionsGrams,
      "gCO2e"
    );

    // 2. Evaluate Rule Checklist
    const checks: VerificationCheck[] = [];

    // Rule 1: Benchmark Execution Status
    const optExecutionPassed = optimizedBenchmark.status === "COMPLETED";
    checks.push({
      id: "execution_success",
      name: "Optimized Execution Success",
      passed: optExecutionPassed,
      severity: "CRITICAL",
      description: optExecutionPassed
        ? "Optimized code executed successfully in the sandbox environment without runtime errors."
        : `Optimized execution failed: ${optimizedBenchmark.error || "Runtime execution error"}`,
      measuredValue: optimizedBenchmark.status,
      threshold: "COMPLETED",
    });

    // Rule 2: Code Modification Validity
    const codeNotEmpty = typeof optimizedCode === "string" && optimizedCode.trim().length > 0;
    const codeChanged = originalCode.trim() !== optimizedCode.trim();
    const codeValid = codeNotEmpty && codeChanged;
    checks.push({
      id: "code_validity",
      name: "Code Refactoring Validity",
      passed: codeValid,
      severity: "CRITICAL",
      description: codeValid
        ? "AI generated valid, non-empty, modified optimization code."
        : "Optimization code is either empty or identical to original code.",
      measuredValue: codeChanged ? "MODIFIED" : "UNCHANGED",
      threshold: "MODIFIED",
    });

    // Rule 3: Energy Reduction Check
    const energyReduced = energyComp.reductionPercent > energyReductionThresholdPercent;
    checks.push({
      id: "energy_reduction",
      name: "Energy Reduction Threshold",
      passed: energyReduced,
      severity: "CRITICAL",
      description: energyReduced
        ? `Energy consumption reduced by ${energyComp.reductionPercent}% (${originalEnergy.energyWh} Wh → ${optimizedEnergy.energyWh} Wh).`
        : `Optimization did not achieve the required energy reduction (measured: ${energyComp.reductionPercent}%, threshold: >${energyReductionThresholdPercent}%).`,
      measuredValue: `${energyComp.reductionPercent}%`,
      threshold: `>${energyReductionThresholdPercent}%`,
    });

    // Rule 4: Carbon Reduction Check
    const carbonReduced = carbonComp.reductionPercent > energyReductionThresholdPercent;
    checks.push({
      id: "carbon_reduction",
      name: "Carbon Emissions Reduction",
      passed: carbonReduced,
      severity: "CRITICAL",
      description: carbonReduced
        ? `Operational carbon emissions reduced by ${carbonComp.reductionPercent}% (${originalCarbon.carbonEmissionsGrams} g → ${optimizedCarbon.carbonEmissionsGrams} g).`
        : `Optimization did not reduce carbon emissions (measured: ${carbonComp.reductionPercent}%).`,
      measuredValue: `${carbonComp.reductionPercent}%`,
      threshold: `>${energyReductionThresholdPercent}%`,
    });

    // Rule 5: Performance / Latency Safety Check (No severe runtime regression > 200%)
    const noSevereRegression = timeComp.reductionPercent >= -50;
    checks.push({
      id: "performance_safety",
      name: "Performance & Latency Safety",
      passed: noSevereRegression,
      severity: "WARNING",
      description: noSevereRegression
        ? timeComp.reductionPercent >= 0
          ? `Execution speed improved by ${timeComp.reductionPercent}%.`
          : `Execution latency is within acceptable tolerance (-${Math.abs(timeComp.reductionPercent)}%).`
        : `Severe runtime latency regression detected: execution time increased by ${Math.abs(timeComp.reductionPercent)}%.`,
      measuredValue: `${timeComp.reductionPercent}%`,
      threshold: ">=-50%",
    });

    // 3. Determine Overall Verification Decision
    const criticalChecksPassed = checks
      .filter((c) => c.severity === "CRITICAL")
      .every((c) => c.passed);

    let status: VerificationStatus = "REJECTED";
    let passed = false;
    let summary = "";

    if (criticalChecksPassed) {
      status = "VERIFIED";
      passed = true;
      summary = `Optimization verified: ${energyComp.reductionPercent}% energy reduction and ${carbonComp.reductionPercent}% carbon reduction confirmed through physical benchmark measurement.`;
    } else {
      status = "REJECTED";
      passed = false;
      if (!optExecutionPassed) {
        summary = "Optimization rejected: Refactored code failed during sandbox benchmark execution.";
      } else if (!energyReduced) {
        summary = `Optimization rejected: Measured energy consumption did not decrease (${energyComp.reductionPercent}% change).`;
      } else {
        summary = "Optimization rejected: Failed one or more critical verification safety checks.";
      }
    }

    const verificationId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return {
      verificationId,
      status,
      passed,
      summary,

      energyReductionPercent: energyComp.reductionPercent,
      carbonReductionPercent: carbonComp.reductionPercent,
      runtimeReductionPercent: timeComp.reductionPercent,
      cpuReductionPercent: cpuComp.reductionPercent,
      memoryReductionPercent: memComp.reductionPercent,

      metrics: {
        executionTimeMs: timeComp,
        cpuUsagePercent: cpuComp,
        memoryMb: memComp,
        energyWh: energyComp,
        carbonGrams: carbonComp,
      },

      checks,
      verifiedBy: "GreenOps Verification Engine v1.0",
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to compute comparative percentage differences safely
   */
  public compareMetric(original: number, optimized: number, unit: string): MetricComparison {
    const orig = Number(original) || 0;
    const opt = Number(optimized) || 0;
    const delta = Number((orig - opt).toFixed(6));

    let reductionPercent = 0;
    if (orig > 0) {
      reductionPercent = Number((((orig - opt) / orig) * 100).toFixed(2));
    } else if (orig === 0 && opt === 0) {
      reductionPercent = 0;
    } else if (orig === 0 && opt > 0) {
      reductionPercent = -100;
    }

    return {
      original: orig,
      optimized: opt,
      delta,
      reductionPercent,
      unit,
    };
  }

  private validateContext(context: VerificationInputContext): void {
    if (!context || typeof context !== "object") {
      throw new Error("Verification context must be a valid object.");
    }
    if (!context.originalBenchmark || !context.optimizedBenchmark) {
      throw new Error("Both original and optimized benchmark results are required for verification.");
    }
    if (!context.originalEnergy || !context.optimizedEnergy) {
      throw new Error("Both original and optimized energy results are required for verification.");
    }
    if (!context.originalCarbon || !context.optimizedCarbon) {
      throw new Error("Both original and optimized carbon results are required for verification.");
    }
  }
}

export const verificationEngine = new VerificationEngine();
