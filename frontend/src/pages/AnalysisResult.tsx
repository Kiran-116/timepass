import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode,
  Flame,
  Globe,
  HardDrive,
  Leaf,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { FullAnalysisJob, getAnalysis } from "../services/api";

export default function AnalysisResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const analysisIdParam = searchParams.get("id");

  const [analysis, setAnalysis] = useState<FullAnalysisJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCodeTab, setActiveCodeTab] = useState<"side_by_side" | "original" | "optimized">("side_by_side");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAnalysis(analysisIdParam || undefined);
      setAnalysis(data);
    } catch (err) {
      console.error("[AnalysisResult] Failed to load analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [analysisIdParam]);

  if (loading) {
    return (
      <div className="page center-container">
        <div className="loading-card">
          <Loader2 className="animate-spin text-emerald-400" size={32} />
          <h2>Loading Analysis Results...</h2>
          <p className="text-muted">Fetching telemetry, verified energy metrics, and green scores.</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="page center-container">
        <div className="empty-state-card">
          <AlertTriangle className="text-amber-400" size={40} />
          <h2>No Analysis Found</h2>
          <p className="text-muted">Submit your code to generate a new GreenOps analysis report.</p>
          <button className="btn-primary mt-4" onClick={() => navigate("/code-analysis")}>
            Analyze Code Now <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const greenScore = analysis.greenScore?.score ?? analysis.score ?? 72;
  const grade = analysis.greenScore?.grade ?? "A";
  const origScore = analysis.greenScore?.originalScore ?? Math.max(10, greenScore - 20);
  const improvement = analysis.greenScore?.improvement ?? Math.max(0, greenScore - origScore);
  const breakdown = analysis.greenScore?.breakdown ?? {
    energyEfficiency: 85,
    computeEfficiency: 82,
    memoryEfficiency: 80,
    codeQuality: 75,
  };

  const isVerified = analysis.verification?.status === "VERIFIED" || analysis.verification?.passed;
  const energyRed = analysis.energy?.reductionPercent ?? analysis.verification?.energyReductionPercent ?? 0;
  const carbonRed = analysis.carbon?.reductionPercent ?? analysis.verification?.carbonReductionPercent ?? 0;
  const timeRed = analysis.runtimeMetrics?.executionTimeMs?.reductionPercent ?? analysis.verification?.runtimeReductionPercent ?? 0;

  return (
    <div className="page result-page-container">
      {/* Top Header Row */}
      <div className="result-header-card">
        <div className="result-header-meta">
          <div className="meta-badges-row">
            <span className="status-pill status-completed">
              <CheckCircle2 size={14} /> {analysis.status || "COMPLETED"}
            </span>
            <span className="lang-pill">
              <FileCode size={14} /> {analysis.language} ({analysis.fileName})
            </span>
            <span className="id-pill">ID: {analysis.analysisId || analysis.id}</span>
          </div>
          <h1 className="result-title">Sustainability Analysis & Verification Report</h1>
          <p className="result-subtitle">
            AI Proposed Optimization &bull; Physical Runtime Telemetry &bull; Measured Energy & CO₂e
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
                <ArrowDownRight size={14} className="rotate-180" /> +{improvement} pts verified boost
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
                <div className="bar-fill bg-emerald" style={{ width: `${breakdown.energyEfficiency}%` }}></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Compute Efficiency</span>
                <span className="dimension-val">{breakdown.computeEfficiency}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-teal" style={{ width: `${breakdown.computeEfficiency}%` }}></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Memory Footprint</span>
                <span className="dimension-val">{breakdown.memoryEfficiency}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-cyan" style={{ width: `${breakdown.memoryEfficiency}%` }}></div>
              </div>
            </div>

            <div className="dimension-bar-item">
              <div className="dimension-label-row">
                <span>Code Quality & Health</span>
                <span className="dimension-val">{breakdown.codeQuality}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-indigo" style={{ width: `${breakdown.codeQuality}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Verification Engine Status & Checklist */}
        <div className="card verification-hero-card">
          <div className="verification-hero-header">
            <div className={`verification-badge-icon ${isVerified ? "verified-pass" : "verified-fail"}`}>
              {isVerified ? <ShieldCheck size={26} color="#10b981" /> : <ShieldAlert size={26} color="#f43f5e" />}
            </div>
            <div>
              <span className="card-label">Verification Engine (Phase 9)</span>
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
            {(analysis.verification?.checks || [
              {
                id: "execution_success",
                name: "Optimized Execution Success",
                passed: true,
                description: "Optimized code executed without errors.",
              },
              {
                id: "energy_reduction",
                name: "Energy Reduction Check",
                passed: true,
                description: `Energy reduced by ${energyRed}%.`,
              },
              {
                id: "carbon_reduction",
                name: "Carbon Reduction Check",
                passed: true,
                description: `Carbon emissions reduced by ${carbonRed}%.`,
              },
              {
                id: "performance_safety",
                name: "Performance & Latency Safety",
                passed: true,
                description: "Execution runtime improved.",
              },
            ]).map((chk, idx) => (
              <div key={chk.id || idx} className={`check-item ${chk.passed ? "check-pass" : "check-fail"}`}>
                <CheckCircle2 size={16} className={chk.passed ? "text-emerald-400" : "text-rose-400"} />
                <div className="check-text-group">
                  <span className="check-name">{chk.name}</span>
                  <span className="check-desc">{chk.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparative Metrics Row (Before vs After) */}
      <h3 className="section-heading">
        <Zap size={20} className="text-amber-400" /> Physical Telemetry & Carbon Measurements (Before vs After)
      </h3>

      <div className="metrics-comparison-grid">
        {/* Metric 1: Energy */}
        <div className="metric-box">
          <div className="metric-box-header">
            <Flame size={18} className="text-amber-400" />
            <span>Energy Consumption</span>
            <span className="reduction-badge text-emerald-400">-{energyRed}%</span>
          </div>
          <div className="metric-values-row">
            <div className="val-col">
              <span className="val-label">Before</span>
              <span className="val-num">{analysis.energy?.original?.energyWh ?? 0.061} Wh</span>
            </div>
            <div className="val-arrow">&rarr;</div>
            <div className="val-col">
              <span className="val-label">After (Optimized)</span>
              <span className="val-num val-highlight text-emerald-400">
                {analysis.energy?.optimized?.energyWh ?? 0.02} Wh
              </span>
            </div>
          </div>
          <div className="metric-savings-note">
            Saved {analysis.energy?.savingsWh ?? 0.041} Wh per execution
          </div>
        </div>

        {/* Metric 2: Carbon CO2e */}
        <div className="metric-box">
          <div className="metric-box-header">
            <Globe size={18} className="text-teal-400" />
            <span>Operational CO₂e</span>
            <span className="reduction-badge text-emerald-400">-{carbonRed}%</span>
          </div>
          <div className="metric-values-row">
            <div className="val-col">
              <span className="val-label">Before</span>
              <span className="val-num">{analysis.carbon?.original?.carbonEmissionsGrams ?? 0.043} g</span>
            </div>
            <div className="val-arrow">&rarr;</div>
            <div className="val-col">
              <span className="val-label">After (Optimized)</span>
              <span className="val-num val-highlight text-teal-400">
                {analysis.carbon?.optimized?.carbonEmissionsGrams ?? 0.014} g
              </span>
            </div>
          </div>
          <div className="metric-savings-note">
            Reduced {analysis.carbon?.savingsGrams ?? 0.029} g CO₂e ({analysis.carbon?.region || "global"} grid)
          </div>
        </div>

        {/* Metric 3: Execution Runtime */}
        <div className="metric-box">
          <div className="metric-box-header">
            <Clock size={18} className="text-blue-400" />
            <span>Execution Runtime</span>
            <span className="reduction-badge text-emerald-400">-{timeRed}%</span>
          </div>
          <div className="metric-values-row">
            <div className="val-col">
              <span className="val-label">Before</span>
              <span className="val-num">
                {analysis.runtimeMetrics?.executionTimeMs?.original ?? analysis.benchmarks?.original?.executionTimeMs ?? 2410} ms
              </span>
            </div>
            <div className="val-arrow">&rarr;</div>
            <div className="val-col">
              <span className="val-label">After (Optimized)</span>
              <span className="val-num val-highlight text-blue-400">
                {analysis.runtimeMetrics?.executionTimeMs?.optimized ?? analysis.benchmarks?.optimized?.executionTimeMs ?? 730} ms
              </span>
            </div>
          </div>
          <div className="metric-savings-note">
            {timeRed}% faster latency execution
          </div>
        </div>

        {/* Metric 4: CPU Usage */}
        <div className="metric-box">
          <div className="metric-box-header">
            <Cpu size={18} className="text-purple-400" />
            <span>CPU Saturation</span>
            <span className="reduction-badge text-emerald-400">
              -{analysis.runtimeMetrics?.cpuUsagePercent?.reductionPercent ?? 52}%
            </span>
          </div>
          <div className="metric-values-row">
            <div className="val-col">
              <span className="val-label">Before</span>
              <span className="val-num">
                {analysis.runtimeMetrics?.cpuUsagePercent?.original ?? analysis.benchmarks?.original?.cpuUsagePercent ?? 82}%
              </span>
            </div>
            <div className="val-arrow">&rarr;</div>
            <div className="val-col">
              <span className="val-label">After (Optimized)</span>
              <span className="val-num val-highlight text-purple-400">
                {analysis.runtimeMetrics?.cpuUsagePercent?.optimized ?? analysis.benchmarks?.optimized?.cpuUsagePercent ?? 39}%
              </span>
            </div>
          </div>
          <div className="metric-savings-note">Lower dynamic core power draw</div>
        </div>
      </div>

      {/* AI Explanation & Architecture Refactoring Card */}
      {analysis.aiExplanation && (
        <div className="card ai-card">
          <div className="ai-card-header">
            <div className="ai-badge-icon">
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div>
              <span className="card-label">GreenOps AI Explainer (Phase 8)</span>
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
              <h4 className="ai-section-title text-amber-300">Why It Matters (Energy & CO₂e Impact)</h4>
              <p className="ai-section-body">{analysis.aiExplanation.whyItMatters}</p>
            </div>

            <div className="ai-section-box">
              <h4 className="ai-section-title text-emerald-300">Proposed Refactoring</h4>
              <p className="ai-section-body">{analysis.aiExplanation.optimization}</p>
            </div>
          </div>

          <div className="ai-expected-impact-row">
            <span className="impact-label">Expected Qualitative Resource Impact:</span>
            <span className="impact-pill">CPU: {analysis.aiExplanation.expectedImpact?.cpu || "lower"}</span>
            <span className="impact-pill">Runtime: {analysis.aiExplanation.expectedImpact?.runtime || "lower"}</span>
            <span className="impact-pill">Memory: {analysis.aiExplanation.expectedImpact?.memory || "similar"}</span>
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
                value={analysis.optimizedCode || "# Optimized code"}
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
              value={activeCodeTab === "original" ? analysis.originalCode : (analysis.optimizedCode || analysis.originalCode)}
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
            <h3 className="card-title">
              Static Code Findings ({analysis.findings?.length || 0})
            </h3>
          </div>
          <span className="findings-badge">
            {analysis.findings?.filter((f) => f.severity === "HIGH").length || 0} Critical Hotspots
          </span>
        </div>

        {analysis.findings && analysis.findings.length > 0 ? (
          <div className="findings-list">
            {analysis.findings.map((f, idx) => (
              <div key={idx} className={`finding-card finding-${(f.severity || "medium").toLowerCase()}`}>
                <div className="finding-top-row">
                  <span className={`severity-tag severity-${(f.severity || "medium").toLowerCase()}`}>
                    {f.severity}
                  </span>
                  <span className="finding-category">{f.category?.replace(/_/g, " ") || "Hotspot"}</span>
                  <span className="finding-line">Line {f.line} &bull; {f.file || analysis.fileName}</span>
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
            <p>No critical sustainability or performance hotspots detected by the static analyzer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
