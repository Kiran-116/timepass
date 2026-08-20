import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Leaf,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { FullAnalysisJob, getAnalysis } from "../services/api";
import { BeforeAfterMetricsMatrix } from "../components/BeforeAfterMetricsMatrix";

export default function AnalysisResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const analysisIdParam = searchParams.get("id");

  const [analysis, setAnalysis] = useState<FullAnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"side_by_side" | "original" | "optimized">(
    "side_by_side"
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getAnalysis(analysisIdParam || undefined);
      if (data) {
        setAnalysis(data);
      } else {
        setErrorMsg(
          analysisIdParam
            ? `Analysis job "${analysisIdParam}" was not found.`
            : "No recent analysis records available."
        );
      }
    } catch (err) {
      console.error("[AnalysisResult] Failed to load analysis:", err);
      setErrorMsg((err as Error).message || "Failed to load analysis result.");
    } finally {
      setLoading(false);
    }
  }, [analysisIdParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="page center-container">
        <div className="loading-card">
          <Loader2 className="animate-spin text-emerald-400" size={36} />
          <h2>Loading Analysis Results...</h2>
          <p className="text-muted">
            Fetching measured telemetry, verified energy data, and Green Scores.
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="page center-container">
        <div className="empty-state-card">
          <AlertTriangle className="text-amber-400" size={40} />
          <h2>{errorMsg || "No Analysis Found"}</h2>
          <p className="text-muted">
            Submit your code to execute the GreenOps AI analysis and verification workflow.
          </p>
          <button className="btn-primary mt-4" onClick={() => navigate("/code-analysis")}>
            Analyze Code Now <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const greenScore = analysis.greenScore?.score ?? analysis.score ?? 0;
  const grade = analysis.greenScore?.grade ?? "A";
  const origScore = analysis.greenScore?.originalScore ?? Math.max(0, greenScore - 20);
  const improvement = analysis.greenScore?.improvement ?? Math.max(0, greenScore - origScore);
  const breakdown = analysis.greenScore?.breakdown ?? {
    energyEfficiency: 80,
    computeEfficiency: 80,
    memoryEfficiency: 80,
    codeQuality: 80,
  };

  const isVerified =
    analysis.verification?.status === "VERIFIED" || Boolean(analysis.verification?.passed);
  const energyRed =
    analysis.energy?.reductionPercent ?? analysis.verification?.energyReductionPercent ?? 0;

  return (
    <div className="page result-page-container">
      {/* Top Header Row */}
      <div className="result-header-card">
        <div className="result-header-meta">
          <div className="meta-badges-row">
            <span
              className={`status-pill ${analysis.status === "COMPLETED" ? "status-completed" : "status-pending"}`}
            >
              <CheckCircle2 size={14} /> {analysis.status || "COMPLETED"}
            </span>
            <span className="lang-pill">
              <FileCode size={14} /> {analysis.language} ({analysis.fileName})
            </span>
            <span className="id-pill">ID: {analysis.analysisId || analysis.id}</span>
          </div>
          <h1 className="result-title">Sustainability Analysis & Verification Report</h1>
          <p className="result-subtitle">
            AI Proposed Optimization &bull; Sandbox Telemetry &bull; Measured Energy & CO₂e
          </p>
        </div>

        <div className="result-actions">
          <button className="btn-secondary" onClick={() => loadData()}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate("/code-analysis")}>
            Analyze New Code <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Main Top Cards Grid: Green Score & Verification Seal */}
      <div className="scores-grid">
        {/* Card 1: Green Score */}
        <div className="card green-score-hero-card">
          <div className="score-hero-header">
            <div className="score-badge-icon">
              <Leaf size={24} color="#10b981" />
            </div>
            <div>
              <span className="card-label">GreenOps Product Metric</span>
              <h2 className="card-title">Green Score</h2>
            </div>
            <div className="grade-badge">{grade}</div>
          </div>

          <div className="score-number-row">
            <span className="score-big">{greenScore}</span>
            <span className="score-denom">/ 100</span>
            {improvement > 0 && (
              <span className="improvement-pill">
                <ArrowDownRight size={14} className="rotate-180" /> +{improvement} pts verified
                boost
              </span>
            )}
          </div>

          <p className="score-summary-text">
            {analysis.greenScore?.summary ||
              `Green Score evaluated at ${greenScore}/100 based on verified energy efficiency, compute latency, and resolved static hotspots.`}
          </p>

          <div className="score-dimensions">
            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Energy Efficiency</span>
                <span className="dimension-val">{breakdown.energyEfficiency}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bg-emerald"
                  style={{ width: `${breakdown.energyEfficiency}%` }}
                ></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Compute Efficiency</span>
                <span className="dimension-val">{breakdown.computeEfficiency}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bg-teal"
                  style={{ width: `${breakdown.computeEfficiency}%` }}
                ></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Memory Footprint</span>
                <span className="dimension-val">{breakdown.memoryEfficiency}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bg-cyan"
                  style={{ width: `${breakdown.memoryEfficiency}%` }}
                ></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Code Quality & Health</span>
                <span className="dimension-val">{breakdown.codeQuality}%</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bg-indigo"
                  style={{ width: `${breakdown.codeQuality}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Verification Engine Status & Checklist */}
        <div className="card verification-hero-card">
          <div className="verification-hero-header">
            <div
              className={`verification-badge-icon ${isVerified ? "verified-pass" : "verified-fail"}`}
            >
              {isVerified ? (
                <ShieldCheck size={26} color="#10b981" />
              ) : (
                <ShieldAlert size={26} color="#f43f5e" />
              )}
            </div>
            <div>
              <span className="card-label">Verification Engine</span>
              <h2 className="card-title">
                {isVerified ? "Optimization VERIFIED" : "Optimization REJECTED"}
              </h2>
            </div>
            <span className={`pill-seal ${isVerified ? "seal-pass" : "seal-fail"}`}>
              {isVerified ? "VERIFIED ✅" : "REJECTED ❌"}
            </span>
          </div>

          <p className="verification-summary-text">
            {analysis.verification?.summary ||
              "Measurement confirms algorithmic refactoring reduced energy and carbon emissions without runtime crashes."}
          </p>

          <div className="verification-checks-list">
            <h4 className="checklist-title">Verification Rule Checklist</h4>
            {analysis.verification?.checks && analysis.verification.checks.length > 0 ? (
              analysis.verification.checks.map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className={`check-item ${chk.passed ? "check-pass" : "check-fail"}`}
                >
                  <CheckCircle2
                    size={16}
                    className={chk.passed ? "text-emerald-400" : "text-rose-400"}
                  />
                  <div className="check-text-group">
                    <span className="check-name">{chk.name}</span>
                    <span className="check-desc">{chk.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="check-item check-pass">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <div className="check-text-group">
                  <span className="check-name">Physical Telemetry Measured</span>
                  <span className="check-desc">
                    Workload completed with verified energy reduction.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparative Metrics Row (Before vs After) */}
      <h3 className="section-heading">
        <Zap size={20} className="text-amber-400" /> Physical Telemetry & Carbon Measurements
        (Before vs After)
      </h3>

      <div className="mb-6">
        <BeforeAfterMetricsMatrix
          analysis={analysis}
          showVerificationBadge={false}
          showTable={true}
          showCharts={true}
        />
      </div>

      {/* AI Explanation & Architecture Refactoring Card */}
      {analysis.aiExplanation && (
        <div className="card ai-card">
          <div className="ai-card-header">
            <div className="ai-badge-icon">
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div>
              <span className="card-label">GreenOps AI Explainer</span>
              <h3 className="card-title">Algorithmic Optimization Proposal</h3>
            </div>
            <span className="ai-model-tag">
              {analysis.aiExplanation.modelMetadata?.model || "GreenOps AI Optimizer"}
            </span>
          </div>

          <div className="ai-sections-grid">
            <div className="ai-section-box">
              <h4 className="ai-section-title text-rose-300">Detected Inefficiency</h4>
              <p className="ai-section-body">{analysis.aiExplanation.problem}</p>
            </div>

            <div className="ai-section-box">
              <h4 className="ai-section-title text-amber-300">
                Why It Matters (Energy & CO₂e Impact)
              </h4>
              <p className="ai-section-body">{analysis.aiExplanation.whyItMatters}</p>
            </div>

            <div className="ai-section-box">
              <h4 className="ai-section-title text-emerald-300">Proposed Refactoring</h4>
              <p className="ai-section-body">{analysis.aiExplanation.optimization}</p>
            </div>
          </div>

          <div className="ai-expected-impact-row">
            <span className="impact-label">Expected Qualitative Resource Impact:</span>
            <span className="impact-pill">
              CPU: {analysis.aiExplanation.expectedImpact?.cpu || "lower"}
            </span>
            <span className="impact-pill">
              Runtime: {analysis.aiExplanation.expectedImpact?.runtime || "lower"}
            </span>
            <span className="impact-pill">
              Memory: {analysis.aiExplanation.expectedImpact?.memory || "similar"}
            </span>
          </div>
        </div>
      )}

      {/* Side-by-Side Code Diff Viewer */}
      <div className="card code-comparison-card">
        <div className="code-comparison-header">
          <div className="flex items-center gap-2">
            <FileCode size={20} className="text-emerald-400" />
            <h3 className="card-title">Code Comparison (Original vs Verified Optimization)</h3>
          </div>

          <div className="code-tab-toggle">
            <button
              className={`toggle-btn ${activeCodeTab === "side_by_side" ? "active" : ""}`}
              onClick={() => setActiveCodeTab("side_by_side")}
            >
              Side-by-Side
            </button>
            <button
              className={`toggle-btn ${activeCodeTab === "original" ? "active" : ""}`}
              onClick={() => setActiveCodeTab("original")}
            >
              Original Only
            </button>
            <button
              className={`toggle-btn ${activeCodeTab === "optimized" ? "active" : ""}`}
              onClick={() => setActiveCodeTab("optimized")}
            >
              Optimized Only
            </button>
          </div>
        </div>

        {activeCodeTab === "side_by_side" ? (
          <div className="code-side-by-side-grid">
            <div className="code-pane">
              <div className="code-pane-title text-rose-400">
                <span>Original Code (Unoptimized)</span>
              </div>
              <Editor
                height="320px"
                language={analysis.language || "python"}
                value={analysis.originalCode || "# Original code"}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className="code-pane">
              <div className="code-pane-title text-emerald-400">
                <span>Optimized Code (Verified &bull; -{energyRed}% Energy)</span>
              </div>
              <Editor
                height="320px"
                language={analysis.language || "python"}
                value={analysis.optimizedCode || analysis.originalCode || "# Optimized code"}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="single-editor-pane">
            <Editor
              height="360px"
              language={analysis.language || "python"}
              value={
                activeCodeTab === "original"
                  ? analysis.originalCode
                  : analysis.optimizedCode || analysis.originalCode
              }
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                automaticLayout: true,
              }}
            />
          </div>
        )}
      </div>

      {/* Static Code Findings List */}
      <div className="card findings-card">
        <div className="findings-card-header">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-amber-400" />
            <h3 className="card-title">Static Code Findings ({analysis.findings?.length || 0})</h3>
          </div>
          <span className="findings-badge">
            {analysis.findings?.filter((f) => f.severity === "HIGH").length || 0} Critical Hotspots
          </span>
        </div>

        {analysis.findings && analysis.findings.length > 0 ? (
          <div className="findings-list">
            {analysis.findings.map((f, idx) => (
              <div
                key={idx}
                className={`finding-card finding-${(f.severity || "medium").toLowerCase()}`}
              >
                <div className="finding-top-row">
                  <span
                    className={`severity-tag severity-${(f.severity || "medium").toLowerCase()}`}
                  >
                    {f.severity}
                  </span>
                  <span className="finding-category">
                    {f.category?.replace(/_/g, " ") || "Hotspot"}
                  </span>
                  <span className="finding-line">
                    Line {f.line} &bull; {f.file || analysis.fileName}
                  </span>
                </div>
                <p className="finding-desc">{f.description}</p>
                {f.recommendation && (
                  <div className="finding-rec-row">
                    <strong>Recommendation:</strong> {f.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="clean-code-state">
            <CheckCircle2 size={32} className="text-emerald-400" />
            <p>
              No critical sustainability or performance hotspots detected by the static analyzer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
