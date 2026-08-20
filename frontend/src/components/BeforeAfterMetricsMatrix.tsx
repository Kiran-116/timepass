import React from "react";
import {
  Clock,
  Cpu,
  Flame,
  Globe,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { FullAnalysisJob } from "../services/api";

export interface MetricItem {
  id: string;
  name: string;
  category: "compute" | "energy" | "carbon" | "memory";
  icon: React.ElementType;
  beforeVal: number | null;
  afterVal: number | null;
  unit: string;
  reductionPercent: number | null;
  savingsFormatted?: string;
  description: string;
}

interface BeforeAfterMetricsMatrixProps {
  analysis: FullAnalysisJob;
  showVerificationBadge?: boolean;
  showTable?: boolean;
  showCharts?: boolean;
}

export const BeforeAfterMetricsMatrix: React.FC<BeforeAfterMetricsMatrixProps> = ({
  analysis,
  showVerificationBadge = true,
  showTable = true,
  showCharts = true,
}) => {
  // Extract real metrics from analysis object with safe fallbacks to null (never fake numbers)
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
    (timeBefore && timeAfter && timeBefore > 0
      ? Number((((timeBefore - timeAfter) / timeBefore) * 100).toFixed(1))
      : null);

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
    (cpuBefore && cpuAfter && cpuBefore > 0
      ? Number((((cpuBefore - cpuAfter) / cpuBefore) * 100).toFixed(1))
      : null);

  const memBefore =
    analysis.runtimeMetrics?.memoryMb?.original ?? analysis.benchmarks?.original?.memoryMb ?? null;
  const memAfter =
    analysis.runtimeMetrics?.memoryMb?.optimized ??
    analysis.benchmarks?.optimized?.memoryMb ??
    null;
  const memRed =
    analysis.runtimeMetrics?.memoryMb?.reductionPercent ??
    analysis.verification?.memoryReductionPercent ??
    (memBefore && memAfter && memBefore > 0
      ? Number((((memBefore - memAfter) / memBefore) * 100).toFixed(1))
      : null);

  const energyBefore =
    analysis.energy?.original?.energyWh ??
    analysis.verification?.metrics?.energyWh?.original ??
    null;
  const energyAfter =
    analysis.energy?.optimized?.energyWh ??
    analysis.verification?.metrics?.energyWh?.optimized ??
    null;
  const energyRed =
    analysis.energy?.reductionPercent ??
    analysis.verification?.energyReductionPercent ??
    (energyBefore && energyAfter && energyBefore > 0
      ? Number((((energyBefore - energyAfter) / energyBefore) * 100).toFixed(1))
      : null);

  const carbonBefore =
    analysis.carbon?.original?.carbonEmissionsGrams ??
    analysis.verification?.metrics?.carbonGrams?.original ??
    null;
  const carbonAfter =
    analysis.carbon?.optimized?.carbonEmissionsGrams ??
    analysis.verification?.metrics?.carbonGrams?.optimized ??
    null;
  const carbonRed =
    analysis.carbon?.reductionPercent ??
    analysis.verification?.carbonReductionPercent ??
    (carbonBefore && carbonAfter && carbonBefore > 0
      ? Number((((carbonBefore - carbonAfter) / carbonBefore) * 100).toFixed(1))
      : null);

  const energySavings =
    analysis.energy?.savingsWh ??
    (energyBefore !== null && energyAfter !== null
      ? Number(Math.max(0, energyBefore - energyAfter).toFixed(6))
      : null);

  const carbonSavings =
    analysis.carbon?.savingsGrams ??
    (carbonBefore !== null && carbonAfter !== null
      ? Number(Math.max(0, carbonBefore - carbonAfter).toFixed(6))
      : null);

  const isVerified =
    analysis.verification?.status === "VERIFIED" || analysis.verification?.passed === true;
  const verificationStatus = analysis.verification?.status || (isVerified ? "VERIFIED" : "PENDING");

  const metrics: MetricItem[] = [
    {
      id: "runtime",
      name: "Execution Runtime",
      category: "compute",
      icon: Clock,
      beforeVal: timeBefore,
      afterVal: timeAfter,
      unit: "ms",
      reductionPercent: timeRed,
      savingsFormatted:
        timeBefore !== null && timeAfter !== null
          ? `${Number(Math.max(0, timeBefore - timeAfter).toFixed(1))} ms faster`
          : undefined,
      description: "Sandbox measured execution latency across warmup & measured iterations",
    },
    {
      id: "cpu",
      name: "CPU Saturation",
      category: "compute",
      icon: Cpu,
      beforeVal: cpuBefore,
      afterVal: cpuAfter,
      unit: "%",
      reductionPercent: cpuRed,
      savingsFormatted:
        cpuBefore !== null && cpuAfter !== null
          ? `-${Number((cpuBefore - cpuAfter).toFixed(1))}% load`
          : undefined,
      description: "Average core CPU utilization sampled during benchmark execution",
    },
    {
      id: "memory",
      name: "Memory Footprint",
      category: "memory",
      icon: HardDrive,
      beforeVal: memBefore,
      afterVal: memAfter,
      unit: "MB",
      reductionPercent: memRed,
      savingsFormatted:
        memBefore !== null && memAfter !== null
          ? `Saved ${Number(Math.max(0, memBefore - memAfter).toFixed(2))} MB RAM`
          : undefined,
      description: "Peak process resident set size (RSS) memory consumption",
    },
    {
      id: "energy",
      name: "Estimated Energy",
      category: "energy",
      icon: Flame,
      beforeVal: energyBefore,
      afterVal: energyAfter,
      unit: "Wh",
      reductionPercent: energyRed,
      savingsFormatted: energySavings !== null ? `Saved ${energySavings} Wh` : undefined,
      description: "Calibrated dynamic + baseline compute power integration model",
    },
    {
      id: "carbon",
      name: "Operational CO₂e",
      category: "carbon",
      icon: Globe,
      beforeVal: carbonBefore,
      afterVal: carbonAfter,
      unit: "g",
      reductionPercent: carbonRed,
      savingsFormatted: carbonSavings !== null ? `Avoided ${carbonSavings} g CO₂e` : undefined,
      description: `Grid carbon intensity factored for ${analysis.carbon?.region || "global"} grid region`,
    },
  ];

  return (
    <div className="before-after-matrix-root">
      {/* Verification Status & Impact Summary Banner */}
      {showVerificationBadge && (
        <div
          className={`verification-badge-banner ${isVerified ? "verified-pass" : "verified-reject"}`}
        >
          <div className="verification-badge-content">
            <div className="badge-icon-box">
              {isVerified ? (
                <ShieldCheck size={32} className="text-emerald-400" />
              ) : (
                <ShieldAlert size={32} className="text-rose-400" />
              )}
            </div>
            <div>
              <div className="verification-title-row">
                <h3 className="verification-heading">
                  {isVerified ? "✅ Optimization Verified" : "❌ Optimization Rejected"}
                </h3>
                <span className={`status-pill-small ${isVerified ? "pill-pass" : "pill-fail"}`}>
                  Status: {verificationStatus}
                </span>
              </div>
              <p className="verification-subtext">
                {analysis.verification?.summary ||
                  (isVerified
                    ? "Empirical benchmark execution confirms reduced computational energy and operational CO₂e footprint without regression."
                    : "Benchmark measurements detected insufficient energy savings or functional divergence.")}
              </p>
            </div>
          </div>

          <div className="verification-stat-chips">
            {energyRed !== null && (
              <div className="stat-chip chip-energy">
                <span className="chip-label">Energy Impact</span>
                <span className="chip-val">
                  {energyRed > 0 ? `-${energyRed}%` : `${energyRed}%`}
                </span>
              </div>
            )}
            {carbonRed !== null && (
              <div className="stat-chip chip-carbon">
                <span className="chip-label">CO₂e Impact</span>
                <span className="chip-val">
                  {carbonRed > 0 ? `-${carbonRed}%` : `${carbonRed}%`}
                </span>
              </div>
            )}
            {timeRed !== null && (
              <div className="stat-chip chip-latency">
                <span className="chip-label">Latency Impact</span>
                <span className="chip-val">{timeRed > 0 ? `-${timeRed}%` : `${timeRed}%`}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5 Core Metric Cards with Before vs After Comparison */}
      <div className="metrics-cards-grid">
        {metrics.map((item) => {
          const Icon = item.icon;
          const hasBefore = item.beforeVal !== null;
          const hasAfter = item.afterVal !== null;
          const hasReduction = item.reductionPercent !== null;
          const isPositiveImprovement = (item.reductionPercent ?? 0) > 0;

          // Calculate visual bar proportions
          const maxVal = Math.max(item.beforeVal ?? 1, item.afterVal ?? 1, 0.000001);
          const beforePercent = hasBefore
            ? Math.min(100, Math.max(8, ((item.beforeVal ?? 0) / maxVal) * 100))
            : 0;
          const afterPercent = hasAfter
            ? Math.min(100, Math.max(8, ((item.afterVal ?? 0) / maxVal) * 100))
            : 0;

          return (
            <div key={item.id} className={`telemetry-card card-${item.id}`}>
              <div className="telemetry-card-top">
                <div className="telemetry-title-group">
                  <div className={`metric-icon-circle icon-circle-${item.id}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="metric-title">{item.name}</h4>
                    <span className="metric-unit-tag">Unit: {item.unit}</span>
                  </div>
                </div>

                {hasReduction ? (
                  <div
                    className={`metric-delta-pill ${isPositiveImprovement ? "delta-pill-good" : "delta-pill-bad"}`}
                  >
                    {isPositiveImprovement ? (
                      <TrendingDown size={14} />
                    ) : item.reductionPercent === 0 ? (
                      <Minus size={14} />
                    ) : (
                      <TrendingUp size={14} />
                    )}
                    <span>
                      {item.reductionPercent && item.reductionPercent > 0
                        ? `-${item.reductionPercent}%`
                        : `${item.reductionPercent}%`}
                    </span>
                  </div>
                ) : (
                  <span className="metric-delta-pill delta-pill-na">N/A</span>
                )}
              </div>

              {/* Before vs After Comparison Display */}
              <div className="comparison-values-row">
                <div className="val-block before-val-block">
                  <span className="val-stage-label">Before (Original)</span>
                  <span className="val-primary">
                    {hasBefore ? `${item.beforeVal} ${item.unit}` : "N/A"}
                  </span>
                </div>

                <div className="val-arrow-separator">
                  <span className="flow-arrow">&rarr;</span>
                </div>

                <div className="val-block after-val-block">
                  <span className="val-stage-label">After (Optimized)</span>
                  <span className="val-primary highlight-after">
                    {hasAfter ? `${item.afterVal} ${item.unit}` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Visual Comparison Bar Chart */}
              {showCharts && hasBefore && hasAfter && (
                <div className="comparison-bars-container">
                  <div className="bar-row">
                    <span className="bar-stage-label">Before</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-before"
                        style={{ width: `${beforePercent}%` }}
                        title={`Before: ${item.beforeVal} ${item.unit}`}
                      ></div>
                    </div>
                    <span className="bar-value-text">{item.beforeVal}</span>
                  </div>

                  <div className="bar-row">
                    <span className="bar-stage-label">After</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-after"
                        style={{ width: `${afterPercent}%` }}
                        title={`After: ${item.afterVal} ${item.unit}`}
                      ></div>
                    </div>
                    <span className="bar-value-text text-emerald-400">{item.afterVal}</span>
                  </div>
                </div>
              )}

              {/* Savings & Explanation Footer */}
              {item.savingsFormatted && (
                <div className="card-savings-footer">
                  <span className="savings-highlight">{item.savingsFormatted}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Granular Comparison Table */}
      {showTable && (
        <div className="comparison-table-wrapper">
          <div className="table-header-box">
            <h4 className="table-title">Complete Before vs After Telemetry Matrix</h4>
            <span className="table-subtitle">
              Source: Sandbox execution measurements &bull; File:{" "}
              <code>{analysis.fileName || "service.py"}</code>
            </span>
          </div>

          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Telemetry Metric</th>
                  <th>Before (Original)</th>
                  <th>After (Optimized)</th>
                  <th>Improvement / Delta</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const Icon = m.icon;
                  const hasBefore = m.beforeVal !== null;
                  const hasAfter = m.afterVal !== null;
                  const hasRed = m.reductionPercent !== null;
                  const isPositive = (m.reductionPercent ?? 0) > 0;

                  return (
                    <tr key={m.id}>
                      <td className="col-metric-name">
                        <Icon size={16} className="table-metric-icon" />
                        <div>
                          <strong>{m.name}</strong>
                          <div className="text-xs text-muted">{m.description}</div>
                        </div>
                      </td>
                      <td className="col-val-before">
                        {hasBefore ? (
                          `${m.beforeVal} ${m.unit}`
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="col-val-after">
                        {hasAfter ? (
                          <span className="font-semibold text-emerald-400">
                            {m.afterVal} {m.unit}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="col-val-delta">
                        {hasRed ? (
                          <span
                            className={`pill-table-delta ${isPositive ? "delta-good" : "delta-neutral"}`}
                          >
                            {m.reductionPercent && m.reductionPercent > 0
                              ? `-${m.reductionPercent}% (${m.savingsFormatted || "reduced"})`
                              : `${m.reductionPercent}%`}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="col-category">
                        <span className={`category-tag cat-${m.category}`}>{m.category}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
