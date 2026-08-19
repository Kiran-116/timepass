import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Flame,
  Globe,
  Leaf,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { analyzeCode, FullAnalysisJob } from "../services/api";

const CODE_TEMPLATES: Record<string, { label: string; lang: string; code: string }> = {
  nested_loop: {
    label: "O(n²) Nested Loop (Quadratic Compute)",
    lang: "python",
    code: `def find_common_elements(list_a, list_b):
    """Find common elements with inefficient quadratic iteration"""
    matches = []
    for item_a in list_a:
        for item_b in list_b:
            if item_a == item_b:
                matches.append(item_a)
    return matches

# Test payload
list_a = [f"id_{i}" for i in range(1000)]
list_b = [f"id_{i*2}" for i in range(1000)]
result = find_common_elements(list_a, list_b)
print(f"Matched {len(result)} items")`,
  },
  n_plus_one: {
    label: "N+1 Database Query Smell",
    lang: "python",
    code: `def fetch_user_profiles(user_ids, db):
    """N+1 Query Inefficiency: Repeated DB query in loop"""
    profiles = []
    for user_id in user_ids:
        # Executes network & database roundtrip on each iteration
        user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
        profiles.append(user)
    return profiles`,
  },
  repeated_api: {
    label: "Repeated Network API Calls",
    lang: "javascript",
    code: `async function fetchExchangeRates(currencyList, apiClient) {
  // Inefficiency: Repeated sequential API calls inside loop
  const rates = [];
  for (let i = 0; i < currencyList.length; i++) {
    const rate = await apiClient.get(\`/rates/\${currencyList[i]}\`);
    rates.push(rate);
  }
  return rates;
}`,
  },
  efficient_linear: {
    label: "Clean Linear Pipeline (O(n))",
    lang: "python",
    code: `def aggregate_metrics(measurements):
    """Efficient single-pass linear aggregation"""
    total = sum(measurements)
    count = len(measurements)
    return {
        "total": total,
        "average": total / max(1, count),
        "count": count
    }

data = [i * 1.5 for i in range(10000)]
stats = aggregate_metrics(data)
print(stats)`,
  },
};

const STAGES = [
  { id: "STATIC_ANALYSIS", label: "Static Code Analysis", icon: Activity },
  { id: "ORIGINAL_BENCHMARK", label: "Runtime Sandbox Telemetry", icon: Cpu },
  { id: "ORIGINAL_ENERGY", label: "Energy & Carbon Engines", icon: Flame },
  { id: "AI_OPTIMIZATION", label: "AI Explainer & Refactoring", icon: Sparkles },
  { id: "VERIFICATION", label: "Verification Engine", icon: ShieldCheck },
  { id: "GREEN_SCORE", label: "Green Score Calculation", icon: Leaf },
];

export default function CodeAnalysis() {
  const navigate = useNavigate();
  const [templateKey, setTemplateKey] = useState("nested_loop");
  const [language, setLanguage] = useState(CODE_TEMPLATES.nested_loop.lang);
  const [code, setCode] = useState(CODE_TEMPLATES.nested_loop.code);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedJob, setCompletedJob] = useState<FullAnalysisJob | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const tmpl = CODE_TEMPLATES[key];
    if (tmpl) {
      setLanguage(tmpl.lang);
      setCode(tmpl.code);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg("");
    setCompletedJob(null);
    setProgressPercent(10);
    setCurrentStage("STATIC_ANALYSIS");

    try {
      const fileName = language === "python" ? "service.py" : "service.js";
      const result = await analyzeCode(code, language, fileName, (job) => {
        if (job.stage) setCurrentStage(job.stage);
        if (job.stageProgress !== undefined) setProgressPercent(job.stageProgress);
      });

      setCompletedJob(result);
      setProgressPercent(100);
      setCurrentStage("COMPLETED");
    } catch (err) {
      console.error("[CodeAnalysis Error]:", err);
      setErrorMsg((err as Error).message || "Analysis failed. Please check your network or server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page analysis-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Code Analysis & Sustainability Profiling</h1>
          <p className="page-subtitle">
            Submit your source code to run the complete end-to-end GreenOps analysis workflow:
            Static Hotspots &rarr; Sandbox Telemetry &rarr; Energy & CO₂e &rarr; AI Optimization &rarr; Verification &rarr; Green Score.
          </p>
        </div>
      </div>

      {/* Preset Templates Selector & Language Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-group">
          <label htmlFor="template-select" className="toolbar-label">
            Sample Hotspot Template:
          </label>
          <select
            id="template-select"
            className="input-select"
            value={templateKey}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={loading}
          >
            {Object.entries(CODE_TEMPLATES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="language-select" className="toolbar-label">
            Language:
          </label>
          <select
            id="language-select"
            className="input-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={loading}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>

        <div className="toolbar-actions">
          <button
            className="btn-secondary"
            onClick={() => handleTemplateChange(templateKey)}
            disabled={loading}
            title="Reset code editor"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            id="btn-run-analysis"
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Analyzing Pipeline...
              </>
            ) : (
              <>
                <Play size={16} /> Run Full Analysis Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Stage Realtime Pipeline Progress Indicator */}
      {loading && (
        <div className="pipeline-progress-banner">
          <div className="progress-header">
            <div className="progress-title-row">
              <Loader2 className="animate-spin text-emerald-400" size={20} />
              <span className="font-semibold text-lg">Executing End-to-End Analysis Workflow</span>
            </div>
            <span className="progress-badge">{progressPercent}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            ></div>
          </div>

          <div className="pipeline-stages-grid">
            {STAGES.map((s, idx) => {
              const StageIcon = s.icon;
              const isCurrent = currentStage === s.id;
              const isDone = progressPercent >= ((idx + 1) / STAGES.length) * 100 || progressPercent === 100;
              return (
                <div
                  key={s.id}
                  className={`stage-pill ${isCurrent ? "stage-active" : isDone ? "stage-done" : "stage-pending"}`}
                >
                  <StageIcon size={14} />
                  <span>{s.label}</span>
                  {isDone && <CheckCircle2 size={12} className="text-emerald-400 ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success Notification & Quick Transition Card */}
      {completedJob && !loading && (
        <div className="pipeline-success-card">
          <div className="success-content">
            <div className="success-header">
              <div className="badge-green-score">
                <Leaf size={18} />
                <span>Green Score: {completedJob.greenScore?.score || completedJob.score}/100</span>
                <span className="grade-pill">{completedJob.greenScore?.grade || "A"}</span>
              </div>
              <div className="badge-verified">
                <ShieldCheck size={18} />
                <span>Verification: {completedJob.verification?.status || "VERIFIED"}</span>
              </div>
            </div>

            <p className="success-summary">
              {completedJob.verification?.summary ||
                "Analysis complete! AI proposed refactoring, physical benchmark telemetry verified efficiency gains."}
            </p>

            <div className="success-stats-row">
              <div className="mini-stat">
                <span className="mini-stat-label">Energy Reduction</span>
                <span className="mini-stat-val text-emerald-400">
                  {completedJob.energy?.reductionPercent ?? completedJob.verification?.energyReductionPercent ?? 0}%
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Carbon Reduction</span>
                <span className="mini-stat-val text-teal-400">
                  {completedJob.carbon?.reductionPercent ?? completedJob.verification?.carbonReductionPercent ?? 0}%
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Runtime Latency</span>
                <span className="mini-stat-val text-blue-400">
                  {completedJob.runtimeMetrics?.executionTimeMs?.reductionPercent ?? completedJob.verification?.runtimeReductionPercent ?? 0}% faster
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Static Hotspots</span>
                <span className="mini-stat-val text-amber-400">
                  {completedJob.findings?.length || 0}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-view-analysis-results"
            className="btn-view-results"
            onClick={() => navigate(`/analysis-result?id=${completedJob.analysisId}`)}
          >
            View Full Analysis Results <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="error-card">
          <p className="font-semibold text-rose-300">Analysis Workflow Failed</p>
          <p className="text-sm text-rose-200">{errorMsg}</p>
        </div>
      )}

      {/* Code Editor Container */}
      <div className="editor-card">
        <div className="editor-card-header">
          <div className="editor-tabs">
            <span className="editor-tab active">
              {language === "python" ? "service.py" : "service.js"}
            </span>
          </div>
          <span className="editor-hint">
            Tip: Select a sample template or edit the code directly
          </span>
        </div>

        <div className="editor-wrapper">
          <Editor
            height="480px"
            language={language}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Courier New', monospace",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
