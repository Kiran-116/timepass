import React from "react";

export interface ComparisonMetricRow {
  name: string;
  before: string;
  after: string;
  reductionPercent: number | null;
}

export interface GreenOpsComparisonFlowProps {
  score?: number | null;
  grade?: string;
  energyWh?: number | null;
  energyReductionPercent?: number | null;
  carbonGrams?: number | null;
  carbonReductionPercent?: number | null;
  metrics?: ComparisonMetricRow[];
  isVerified?: boolean;
  measuredRuns?: number;
}

export const GreenOpsComparisonFlow: React.FC<GreenOpsComparisonFlowProps> = ({
  score = null,
  grade = "A",
  energyWh = null,
  energyReductionPercent = null,
  carbonGrams = null,
  carbonReductionPercent = null,
  metrics = [],
  isVerified = true,
  measuredRuns = 5,
}) => {
  return (
    <div className="greenops-container">
      {/* Top Stat Summary Grid */}
      <div className="greenops-metrics-grid">
        {/* Green Score Hero Card */}
        <div className="greenops-card-3d greenops-hero-score-badge">
          <div className="greenops-score-circle">{score !== null ? score : "—"}</div>
          <div>
            <div
              style={{
                color: "var(--go-mint-300)",
                fontSize: "0.85rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              🌱 Green Score
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--go-mint-100)" }}>
              {score !== null ? `${score} / 100` : "Pending"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Rating: {grade} (
              {score !== null && score >= 80 ? "Excellent Efficiency" : "Verified Telemetry"})
            </div>
          </div>
        </div>

        {/* Energy Card */}
        <div className="greenops-card-3d greenops-stat-card">
          <div style={{ color: "var(--go-mint-300)", fontSize: "0.85rem", fontWeight: 600 }}>
            Estimated Energy
          </div>
          <div className="greenops-stat-value">{energyWh !== null ? `${energyWh} Wh` : "N/A"}</div>
          {energyReductionPercent !== null && (
            <span className="greenops-stat-drop">↓ {energyReductionPercent}%</span>
          )}
        </div>

        {/* CO2e Card */}
        <div className="greenops-card-3d greenops-stat-card">
          <div style={{ color: "var(--go-mint-300)", fontSize: "0.85rem", fontWeight: 600 }}>
            Operational CO₂e
          </div>
          <div className="greenops-stat-value">
            {carbonGrams !== null ? `${carbonGrams} g` : "N/A"}
          </div>
          {carbonReductionPercent !== null && (
            <span className="greenops-stat-drop">↓ {carbonReductionPercent}%</span>
          )}
        </div>
      </div>

      {/* Main Before -> After Story Visual */}
      <div className="greenops-card-3d greenops-comparison-card">
        <div className="greenops-comparison-header">
          <h2>
            <span>⚡ BEFORE → AFTER PERFORMANCE STORY</span>
          </h2>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--go-mint-300)",
            }}
          >
            {measuredRuns} Measured Runs (Median Telemetry)
          </span>
        </div>

        {metrics.length > 0 ? (
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
                  {m.reductionPercent !== null ? `↓ ${m.reductionPercent}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted">No telemetry metric flow available yet.</div>
        )}

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
            {energyReductionPercent !== null && (
              <div className="greenops-reduction-badge">{energyReductionPercent}% REDUCTION</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
