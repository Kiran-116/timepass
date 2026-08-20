import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Code2,
  FileCode,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { FullAnalysisJob, getAnalysis, getRecentAnalyses } from "../services/api";
import { BeforeAfterMetricsMatrix } from "../components/BeforeAfterMetricsMatrix";
import { GreenOpsComparisonFlow, ComparisonMetricRow } from "../components/GreenOpsComparisonFlow";

export default function BeforeAfter() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const [analysis, setAnalysis] = useState<FullAnalysisJob | null>(null);
  const [recentList, setRecentList] = useState<FullAnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async (targetId?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [current, recents] = await Promise.all([getAnalysis(targetId), getRecentAnalyses(10)]);
      setAnalysis(current);
      setRecentList(recents);
      if (!current) {
        setErrorMsg(
          "No analysis records found. Run an analysis from the Code Analysis workspace to generate live Before vs After measurements."
        );
      }
    } catch (err) {
      console.error("[BeforeAfter] Error loading data:", err);
      setErrorMsg((err as Error).message || "Failed to retrieve telemetry comparisons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(idFromUrl || undefined);
  }, [idFromUrl]);

  const handleSelectJob = (job: FullAnalysisJob) => {
    setAnalysis(job);
    setSearchParams({ id: job.analysisId });
  };

  if (loading) {
    return (
      <div className="page center-container">
        <div className="loading-card">
          <Loader2 className="animate-spin text-emerald-400" size={36} />
          <h2>Loading Before / After Telemetry...</h2>
          <p className="text-muted">
            Fetching measured sandbox benchmarks, power profiles, and verification checks.
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="page center-container">
        <div className="empty-state-card">
          <AlertTriangle className="text-amber-400" size={44} />
          <h2>{errorMsg || "No Telemetry Measurements Available"}</h2>
          <p className="text-muted">
            GreenOps AI requires a completed benchmark analysis run to generate physical Before vs
            After telemetry comparisons.
          </p>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary" onClick={() => navigate("/code-analysis")}>
              <Code2 size={16} /> Analyze Code Now <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => fetchData()}>
              <RefreshCw size={15} /> Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derive real values from analysis for GreenOpsComparisonFlow
  const energyBefore = analysis.energy?.original?.energyWh ?? null;
  const energyAfter = analysis.energy?.optimized?.energyWh ?? null;
  const energyRed =
    analysis.energy?.reductionPercent ?? analysis.verification?.energyReductionPercent ?? null;

  const carbonBefore = analysis.carbon?.original?.carbonEmissionsGrams ?? null;
  const carbonAfter = analysis.carbon?.optimized?.carbonEmissionsGrams ?? null;
  const carbonRed =
    analysis.carbon?.reductionPercent ?? analysis.verification?.carbonReductionPercent ?? null;

  const timeBefore =
    analysis.runtimeMetrics?.executionTimeMs?.original ??
    analysis.benchmarks?.original?.executionTimeMs ??
    null;
  const timeAfter =
    analysis.runtimeMetrics?.executionTimeMs?.optimized ??
    analysis.benchmarks?.optimized?.executionTimeMs ??
    null;
  const timeRed =
    analysis.runtimeMetrics?.executionTimeMs?.reductionPercent ??
    analysis.verification?.runtimeReductionPercent ??
    null;

  const cpuBefore =
    analysis.runtimeMetrics?.cpuUsagePercent?.original ??
    analysis.benchmarks?.original?.cpuUsagePercent ??
    null;
  const cpuAfter =
    analysis.runtimeMetrics?.cpuUsagePercent?.optimized ??
    analysis.benchmarks?.optimized?.cpuUsagePercent ??
    null;
  const cpuRed =
    analysis.runtimeMetrics?.cpuUsagePercent?.reductionPercent ??
    analysis.verification?.cpuReductionPercent ??
    null;

  const memBefore =
    analysis.runtimeMetrics?.memoryMb?.original ?? analysis.benchmarks?.original?.memoryMb ?? null;
  const memAfter =
    analysis.runtimeMetrics?.memoryMb?.optimized ??
    analysis.benchmarks?.optimized?.memoryMb ??
    null;
  const memRed =
    analysis.runtimeMetrics?.memoryMb?.reductionPercent ??
    analysis.verification?.memoryReductionPercent ??
    null;

  const greenScore = analysis.greenScore?.score ?? analysis.score ?? null;
  const grade = analysis.greenScore?.grade ?? "A";
  const isVerified =
    analysis.verification?.status === "VERIFIED" || Boolean(analysis.verification?.passed);

  const comparisonFlowMetrics: ComparisonMetricRow[] = [
    {
      name: "Runtime",
      before: timeBefore !== null ? `${timeBefore} ms` : "N/A",
      after: timeAfter !== null ? `${timeAfter} ms` : "N/A",
      reductionPercent: timeRed,
    },
    {
      name: "CPU Usage",
      before: cpuBefore !== null ? `${cpuBefore}%` : "N/A",
      after: cpuAfter !== null ? `${cpuAfter}%` : "N/A",
      reductionPercent: cpuRed,
    },
    {
      name: "Memory",
      before: memBefore !== null ? `${memBefore} MB` : "N/A",
      after: memAfter !== null ? `${memAfter} MB` : "N/A",
      reductionPercent: memRed,
    },
    {
      name: "Energy",
      before: energyBefore !== null ? `${energyBefore} Wh` : "N/A",
      after: energyAfter !== null ? `${energyAfter} Wh` : "N/A",
      reductionPercent: energyRed,
    },
    {
      name: "CO₂e Carbon",
      before: carbonBefore !== null ? `${carbonBefore} g` : "N/A",
      after: carbonAfter !== null ? `${carbonAfter} g` : "N/A",
      reductionPercent: carbonRed,
    },
  ];

  return (
    <div className="page before-after-container">
      {/* Top Header Banner */}
      <div className="page-header-row">
        <div>
          <div className="badge-tag mb-2">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Phase 13 &bull; Before vs After Telemetry Visualization</span>
          </div>
          <h1 className="page-title">Before vs After Performance & Sustainability Matrix</h1>
          <p className="page-subtitle">
            Empirical runtime telemetry and power measurements comparing unoptimized baseline code
            against verified AI refactorings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-secondary" onClick={() => fetchData(analysis.analysisId)}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/analysis-result?id=${analysis.analysisId}`)}
          >
            View Full Analysis Report <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Target Analysis Context Strip */}
      <div className="analysis-context-strip">
        <div className="context-item">
          <FileCode size={15} className="text-emerald-400" />
          <span>
            Target File: <strong>{analysis.fileName}</strong> ({analysis.language})
          </span>
        </div>
        <div className="context-item">
          <span>
            Job ID: <code>{analysis.analysisId}</code>
          </span>
        </div>
        <div className="context-item">
          <span>Created: {new Date(analysis.createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="context-item">
          <span className={`status-pill-small ${isVerified ? "pill-pass" : "pill-fail"}`}>
            Verification: {analysis.verification?.status || (isVerified ? "VERIFIED" : "PENDING")}
          </span>
        </div>
      </div>

      {/* Recent Analyses Selector */}
      {recentList.length > 1 && (
        <div className="selector-card mb-6">
          <label className="text-xs uppercase tracking-wider text-muted font-bold block mb-2">
            Select Analysis Record to Compare:
          </label>
          <div className="flex flex-wrap gap-2">
            {recentList.map((job) => (
              <button
                key={job.analysisId}
                className={`tab-pill ${analysis.analysisId === job.analysisId ? "active" : ""}`}
                onClick={() => handleSelectJob(job)}
              >
                {job.fileName} ({job.language}) &bull; Score:{" "}
                {job.greenScore?.score ?? job.score ?? "—"} &bull;{" "}
                {job.verification?.status === "VERIFIED" ? "✅" : "⚠️"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Story Flow Hero Card */}
      <GreenOpsComparisonFlow
        score={greenScore}
        grade={grade}
        energyWh={energyAfter}
        energyReductionPercent={energyRed}
        carbonGrams={carbonAfter}
        carbonReductionPercent={carbonRed}
        metrics={comparisonFlowMetrics}
        isVerified={isVerified}
        measuredRuns={analysis.benchmarks?.original?.measuredRuns || 5}
      />

      {/* 5 Core Metric Cards, Visual Comparison Bar Charts & Granular Matrix Table */}
      <div className="mt-8">
        <h2 className="section-title-highlight mb-4">
          <span>📊 Physical Resource Telemetry & Carbon Measurements</span>
        </h2>
        <BeforeAfterMetricsMatrix
          analysis={analysis}
          showVerificationBadge={true}
          showTable={true}
          showCharts={true}
        />
      </div>
    </div>
  );
}
