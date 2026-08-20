/**
 * GreenOps AI - Phase 11: End-to-End Analysis Pipeline Orchestrator
 *
 * Core Principle: AI proposes. Measurement verifies.
 * Coordinates all modules in the end-to-end analysis workflow:
 * Developer Code → Static Analyzer → AI Explainer → AI Optimizer
 * → Original Benchmark → Optimized Benchmark → Runtime Metrics
 * → Energy Engine → Carbon Engine → Verification Engine → Green Score → Persist Result.
 */

import { analyzeCode } from "../analyzer/staticAnalyzer";
import { aiAgentEngine } from "../ai/aiAgent";
import { runBenchmark } from "../benchmark/runner";
import { carbonEngine } from "../carbon/carbonEngine";
import { energyEngine } from "../energy/energyEngine";
import { greenScoreEngine } from "../score/greenScoreEngine";
import { verificationEngine } from "../verification/verificationEngine";
import { pipelineStore } from "./pipelineStore";
import type { AnalysisJob, AnalysisRequestDTO, PipelineStage } from "./types";

export class AnalysisPipeline {
  /**
   * Starts a new analysis job (synchronous or asynchronous execution)
   */
  public async executePipeline(
    request: AnalysisRequestDTO,
    options: { sync?: boolean } = {}
  ): Promise<AnalysisJob> {
    const {
      code,
      language = "python",
      fileName = "service.py",
      projectId,
      region = "global",
      customPowerModel,
      warmupRuns = 2,
      measuredRuns = 5,
      timeoutMs = 10000,
    } = request;

    if (!code || typeof code !== "string" || code.trim() === "") {
      throw new Error("Code is required for analysis and must be a non-empty string.");
    }

    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create and store initial job in QUEUED status
    const job = pipelineStore.createJob({
      analysisId,
      projectId: projectId || null,
      type: request.type || "CODE",
      prNumber: request.prNumber,
      repoFullName: request.repoFullName,
      commitSha: request.commitSha || null,
      prTitle: request.prTitle,
      prUrl: request.prUrl,
      status: "QUEUED",
      stage: "INITIALIZING",
      stageProgress: 0,
      language,
      fileName,
      originalCode: code,
    });

    // 2. If sync is requested, wait for execution to complete
    if (options.sync) {
      await this.runWorkflow(analysisId, request);
      return pipelineStore.getJob(analysisId)!;
    }

    // 3. Otherwise, run asynchronously in background and return job immediately
    setImmediate(() => {
      this.runWorkflow(analysisId, request).catch((err) => {
        console.error(`[AnalysisPipeline] Uncaught error in job ${analysisId}:`, err);
      });
    });

    return job;
  }

  /**
   * Internal workflow executor running all pipeline stages sequentially
   */
  public async runWorkflow(analysisId: string, request: AnalysisRequestDTO): Promise<AnalysisJob> {
    let currentStage: PipelineStage = "INITIALIZING";

    try {
      const {
        code,
        language = "python",
        fileName = "service.py",
        region = "global",
        customPowerModel,
        warmupRuns = 2,
        measuredRuns = 5,
        timeoutMs = 10000,
      } = request;

      // STAGE 1: Static Code Analysis
      currentStage = "STATIC_ANALYSIS";
      pipelineStore.updateStage(analysisId, currentStage, 10);
      const findings = analyzeCode(code, { fileName, language });

      // STAGE 2: Original Code Benchmark Execution
      currentStage = "ORIGINAL_BENCHMARK";
      pipelineStore.updateStage(analysisId, currentStage, 25);
      const originalBenchmark = await runBenchmark({
        code,
        language,
        fileName,
        analysisId,
        codeVersion: "BASE",
        warmupRuns,
        measuredRuns,
        timeoutMs,
      });

      // STAGE 3: Original Energy Estimation
      currentStage = "ORIGINAL_ENERGY";
      pipelineStore.updateStage(analysisId, currentStage, 35);
      const originalEnergy = energyEngine.calculateEnergy(
        {
          executionTimeMs: originalBenchmark.executionTimeMs,
          cpuUsagePercent: originalBenchmark.cpuUsagePercent,
          memoryMb: originalBenchmark.memoryMb,
        },
        customPowerModel
      );

      // STAGE 4: Original Carbon Calculation
      currentStage = "ORIGINAL_CARBON";
      pipelineStore.updateStage(analysisId, currentStage, 45);
      const originalCarbon = await carbonEngine.calculateCarbon(originalEnergy, region);

      // STAGE 5: AI Explanation & Refactoring Optimization
      currentStage = "AI_OPTIMIZATION";
      pipelineStore.updateStage(analysisId, currentStage, 55);
      const aiResult = await aiAgentEngine.generateOptimization({
        code,
        language,
        fileName,
        findings,
        telemetry: {
          executionTimeMs: originalBenchmark.executionTimeMs,
          cpuUsagePercent: originalBenchmark.cpuUsagePercent,
          memoryMb: originalBenchmark.memoryMb,
        },
        energy: originalEnergy,
        carbon: originalCarbon,
      });

      const optimizedCode = aiResult.optimizedCode;

      // STAGE 6: Optimized Code Benchmark Execution
      currentStage = "OPTIMIZED_BENCHMARK";
      pipelineStore.updateStage(analysisId, currentStage, 70);
      const optimizedBenchmark = await runBenchmark({
        code: optimizedCode,
        language,
        fileName,
        analysisId,
        codeVersion: "OPTIMIZED",
        warmupRuns,
        measuredRuns,
        timeoutMs,
      });

      // STAGE 7: Optimized Energy Estimation
      currentStage = "OPTIMIZED_ENERGY";
      pipelineStore.updateStage(analysisId, currentStage, 80);
      const optimizedEnergy = energyEngine.calculateEnergy(
        {
          executionTimeMs: optimizedBenchmark.executionTimeMs,
          cpuUsagePercent: optimizedBenchmark.cpuUsagePercent,
          memoryMb: optimizedBenchmark.memoryMb,
        },
        customPowerModel
      );

      // STAGE 8: Optimized Carbon Calculation
      currentStage = "OPTIMIZED_CARBON";
      pipelineStore.updateStage(analysisId, currentStage, 85);
      const optimizedCarbon = await carbonEngine.calculateCarbon(optimizedEnergy, region);

      // STAGE 9: Verification Engine
      currentStage = "VERIFICATION";
      pipelineStore.updateStage(analysisId, currentStage, 90);
      const verification = verificationEngine.verify({
        originalCode: code,
        optimizedCode,
        originalBenchmark,
        optimizedBenchmark,
        originalEnergy,
        optimizedEnergy,
        originalCarbon,
        optimizedCarbon,
      });

      // STAGE 10: Green Score Calculation
      currentStage = "GREEN_SCORE";
      pipelineStore.updateStage(analysisId, currentStage, 95);
      const greenScore = greenScoreEngine.calculateScore({
        findings,
        originalBenchmark,
        optimizedBenchmark,
        originalEnergy,
        optimizedEnergy,
        originalCarbon,
        optimizedCarbon,
        verificationResult: verification,
      });

      // STAGE 11: Finalize Unified Results
      currentStage = "FINALIZING";
      pipelineStore.updateStage(analysisId, currentStage, 98);

      const timeReduction = verification.runtimeReductionPercent;
      const cpuReduction = verification.cpuReductionPercent;
      const memReduction = verification.memoryReductionPercent;
      const energyReduction = verification.energyReductionPercent;
      const carbonReduction = verification.carbonReductionPercent;

      const energySavingsWh = Number(
        (originalEnergy.energyWh - optimizedEnergy.energyWh).toFixed(8)
      );
      const energySavingsJoules = Number(
        (originalEnergy.energyJoules - optimizedEnergy.energyJoules).toFixed(6)
      );
      const carbonSavingsGrams = Number(
        (originalCarbon.carbonEmissionsGrams - optimizedCarbon.carbonEmissionsGrams).toFixed(8)
      );

      const highFindings = findings.filter((f) => f.severity === "HIGH").length;
      const mediumFindings = findings.filter((f) => f.severity === "MEDIUM").length;
      const lowFindings = findings.filter((f) => f.severity === "LOW").length;

      const completedJob = pipelineStore.updateJob(analysisId, {
        status: "COMPLETED",
        stage: "COMPLETED",
        stageProgress: 100,
        optimizedCode,
        findings,
        aiExplanation: {
          problem: aiResult.problem,
          whyItMatters: aiResult.whyItMatters,
          optimization: aiResult.optimization,
          expectedImpact: aiResult.expectedImpact,
          modelMetadata: aiResult.modelMetadata,
        },
        benchmarks: {
          original: originalBenchmark,
          optimized: optimizedBenchmark,
        },
        runtimeMetrics: {
          executionTimeMs: {
            original: originalBenchmark.executionTimeMs,
            optimized: optimizedBenchmark.executionTimeMs,
            reductionPercent: timeReduction,
            unit: "ms",
          },
          cpuUsagePercent: {
            original: originalBenchmark.cpuUsagePercent,
            optimized: optimizedBenchmark.cpuUsagePercent,
            reductionPercent: cpuReduction,
            unit: "%",
          },
          memoryMb: {
            original: originalBenchmark.memoryMb,
            optimized: optimizedBenchmark.memoryMb,
            reductionPercent: memReduction,
            unit: "MB",
          },
        },
        energy: {
          original: originalEnergy,
          optimized: optimizedEnergy,
          reductionPercent: energyReduction,
          savingsWh: energySavingsWh,
          savingsJoules: energySavingsJoules,
        },
        carbon: {
          original: originalCarbon,
          optimized: optimizedCarbon,
          reductionPercent: carbonReduction,
          savingsGrams: carbonSavingsGrams,
          region,
        },
        verification,
        greenScore,
        summary: {
          totalFindings: findings.length,
          highFindings,
          mediumFindings,
          lowFindings,
          energyReductionPercent: energyReduction,
          carbonReductionPercent: carbonReduction,
          runtimeReductionPercent: timeReduction,
          verificationStatus: verification.status,
          greenScore: greenScore.score,
          grade: greenScore.grade,
        },
        completedAt: new Date().toISOString(),
      });

      return completedJob!;
    } catch (error) {
      console.error(`[AnalysisPipeline] Stage ${currentStage} failed for ${analysisId}:`, error);

      const failedJob = pipelineStore.updateJob(analysisId, {
        status: "FAILED",
        stage: "FAILED",
        failedStage: currentStage,
        error: (error as Error).message || "Unknown error during analysis pipeline execution",
        completedAt: new Date().toISOString(),
      });

      return failedJob!;
    }
  }
}

export const analysisPipeline = new AnalysisPipeline();
