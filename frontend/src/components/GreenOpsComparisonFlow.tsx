import React from "react";

export interface ComparisonMetricRow {
  name: string;
  before: string;
  after: string;
  reductionPercent: number;
}

export interface GreenOpsComparisonFlowProps {
  score?: number;
  energyWh?: number;
  energyReductionPercent?: number;
  carbonGrams?: number;
  carbonReductionPercent?: number;
  metrics?: ComparisonMetricRow[];
  isVerified?: boolean;
}

export const GreenOpsComparisonFlow: React.FC<GreenOpsComparisonFlowProps> = ({
  score = 86,
  energyWh = 0.020,
  energyReductionPercent = 67.2,
  carbonGrams = 0.014,
  carbonReductionPercent = 67.2,
  metrics = [
    { name: "Runtime", before: "2.41s", after: "0.73s", reductionPercent: 69.7 },
    { name: "CPU Usage", before: "82%", after: "39%", reductionPercent: 52.4 },
    { name: "Memory", before: "184MB", after: "96MB", reductionPercent: 47.8 },
    { name: "Energy", before: "0.061 Wh", after: "0.020 Wh", reductionPercent: 67.2 },
    { name: "CO₂e Carbon", before: "0.043 g", after: "0.014 g", reductionPercent: 67.4 }
  ],
  isVerified = true
}) => {
  return (
    <div className="greenops-container">
      {/* Top Stat Summary Grid */}
      <div className="greenops-metrics-grid">
        {/* Green Score Hero Card */}
        <div className="greenops-card-3d greenops-hero-score-badge">
          <div className="greenops-score-circle">
            {score}
          </div>
          <div>
            <div style={{ color: "var(--go-mint-300)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🌱 Green Score
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--go-mint-100)" }}>
              {score} / 100
            </div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Rating: A (Excellent Efficiency)
            </div>
          </div>
        </div>

        {/* Energy Card */}
        <div className="greenops-card-3d greenops-stat-card">
          <div style={{ color: "var(--go-mint-300)", fontSize: "0.85rem", fontWeight: 600 }}>
            Estimated Energy
          </div>
          <div className="greenops-stat-value">
            {energyWh} Wh
          </div>
          <span className="greenops-stat-drop">
            ↓ {energyReductionPercent}%
          </span>
        </div>

        {/* CO2e Card */}
        <div className="greenops-card-3d greenops-stat-card">
          <div style={{ color: "var(--go-mint-300)", fontSize: "0.85rem", fontWeight: 600 }}>
            Operational CO₂e
          </div>
          <div className="greenops-stat-value">
            {carbonGrams} g
          </div>
          <span className="greenops-stat-drop">
            ↓ {carbonReductionPercent}%
          </span>
        </div>
      </div>

      {/* Main Before -> After Story Visual */}
      <div className="greenops-card-3d greenops-comparison-card">
        <div className="greenops-comparison-header">
          <h2>
            <span>⚡ BEFORE → AFTER PERFORMANCE STORY</span>
          </h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--go-mint-300)" }}>
            5 Measured Runs (Median Telemetry)
          </span>
        </div>

        <div className="greenops-metric-flow">
          {metrics.map((m) => (
            <div key={m.name} className="greenops-metric-row">
              <span className="greenops-metric-name">{m.name}</span>
              <span className="greenops-before-val">{m.before}</span>
              <span className="greenops-after-val">
                <span className="greenops-flow-arrow">━━━━━→</span>
                {m.after}
              </span>
              <span className="greenops-stat-drop" style={{ justifySelf: "flex-end" }}>
                ↓ {m.reductionPercent}%
              </span>
            </div>
          ))}
        </div>

        {/* Verified Improvement Banner */}
        {isVerified && (
          <div className="greenops-verified-banner">
            <div className="greenops-verified-text">
              <div className="greenops-verified-icon">🌱</div>
              <div>
                <div className="greenops-verified-title">VERIFIED IMPROVEMENT</div>
                <div className="greenops-verified-sub">
                  AI proposed optimization experimentally verified by benchmark engine.
                </div>
              </div>
            </div>
            <div className="greenops-reduction-badge">
              {energyReductionPercent}% REDUCTION
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
