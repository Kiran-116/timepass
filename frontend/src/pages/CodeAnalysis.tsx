import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCode,
  Flame,
  Leaf,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  analyzeCode,
  FullAnalysisJob,
  PipelineStage,
} from "../services/api";

const CODE_TEMPLATES: Record<
  string,
  { label: string; lang: string; fileName: string; code: string }
> = {
  nested_loop: {
    label: "O(n²) Nested Loop (Quadratic Compute)",
    lang: "python",
    fileName: "service.py",
    code: `def find_common_elements(list_a, list_b):
    """Find common elements with inefficient quadratic iteration"""
    matches = []
    for item_a in list_a:
        for item_b in list_b:
            if item_a == item_b:
                matches.append(item_a)
    return matches

# Test workload execution
list_a = [f"id_{i}" for i in range(1000)]
list_b = [f"id_{i*2}" for i in range(1000)]
result = find_common_elements(list_a, list_b)
print(f"Matched {len(result)} items")`,
  },
  n_plus_one: {
    label: "N+1 Database Query Smell",
    lang: "python",
    fileName: "service.py",
    code: `def fetch_user_profiles(user_ids, db):
    """N+1 Query Inefficiency: Repeated DB query in loop"""
    profiles = []
    for user_id in user_ids:
        # Executes network & database roundtrip on each iteration
        user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
        profiles.append(user)
    return profiles

# Simulated database driver
class MockDB:
    def query(self, sql):
        return {"user": sql}

db = MockDB()
fetch_user_profiles(list(range(200)), db)
print("Fetched profiles")`,
  },
  repeated_api: {
    label: "Repeated Network API Calls",
    lang: "javascript",
    fileName: "service.js",
    code: `async function fetchExchangeRates(currencyList, apiClient) {
  // Inefficiency: Repeated sequential API calls inside loop
  const rates = [];
  for (let i = 0; i < currencyList.length; i++) {
    const rate = await apiClient.get(\`/rates/\${currencyList[i]}\`);
    rates.push(rate);
  }
  return rates;
}

const apiClient = { get: async (u) => ({ url: u, rate: 1.25 }) };
fetchExchangeRates(["USD", "EUR", "GBP", "JPY", "CAD"], apiClient).then(r => console.log(r.length));`,
  },
  efficient_linear: {
    label: "Clean Linear Pipeline (O(n))",
    lang: "python",
    fileName: "service.py",
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

const PIPELINE_DISPLAY_STAGES: Array<{
  id: PipelineStage | string;
  label: string;
  icon: typeof Activity;
}> = [
  { id: "STATIC_ANALYSIS", label: "Static Code Analysis", icon: Activity },
  { id: "ORIGINAL_BENCHMARK", label: "Sandbox Telemetry", icon: Cpu },
  { id: "ORIGINAL_ENERGY", label: "Energy & Carbon Engines", icon: Flame },
  { id: "AI_OPTIMIZATION", label: "AI Explainer & Refactoring", icon: Sparkles },
  { id: "VERIFICATION", label: "Verification Engine", icon: ShieldCheck },
  { id: "GREEN_SCORE", label: "Green Score Calculation", icon: Leaf },
];

export default function CodeAnalysis() {
  const navigate = useNavigate();
  const [templateKey, setTemplateKey] = useState("nested_loop");
  const [language, setLanguage] = useState(CODE_TEMPLATES.nested_loop.lang);
  const [fileName, setFileName] = useState(CODE_TEMPLATES.nested_loop.fileName);
  const [code, setCode] = useState(CODE_TEMPLATES.nested_loop.code);

  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedJob, setCompletedJob] = useState<FullAnalysisJob | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any ongoing polling request if the user navigates away
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const tmpl = CODE_TEMPLATES[key];
    if (tmpl) {
      setLanguage(tmpl.lang);
      setFileName(tmpl.fileName);
      setCode(tmpl.code);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (lang === "python" && !fileName.endsWith(".py")) {
      setFileName("service.py");
    } else if ((lang === "javascript" || lang === "typescript") && !fileName.endsWith(".js") && !fileName.endsWith(".ts")) {
      setFileName(lang === "typescript" ? "service.ts" : "service.js");
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setErrorMsg("Please enter or select source code to analyze.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setErrorMsg("");
    setCompletedJob(null);
    setProgressPercent(5);
    setCurrentStage("INITIALIZING");

    try {
      const result = await analyzeCode(
        code,
        language,
        fileName,
        (job) => {
          if (job.stage) {
            setCurrentStage(job.stage);
          }
          if (typeof job.stageProgress === "number") {
            setProgressPercent(Math.max(5, job.stageProgress));
          }
        },
        abortController.signal
      );

      setCompletedJob(result);
      setProgressPercent(100);
      setCurrentStage("COMPLETED");
    } catch (err) {
      if ((err as Error).name === "AbortError" || (err as Error).message.includes("cancelled")) {
        return;
      }
      console.error("[CodeAnalysis] Pipeline submission failed:", err);
      setErrorMsg(
        (err as Error).message ||
          "Analysis workflow failed. Please ensure the backend is running at http://localhost:5000."
      );
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
            Submit your source code to execute the complete real GreenOps AI pipeline:
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
            onChange={(e) => handleLanguageChange(e.target.value)}
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
                <Loader2 className="animate-spin" size={16} /> Running Pipeline...
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
              <span className="font-semibold text-lg">
                Executing Real Analysis Pipeline: {currentStage.replace(/_/g, " ")}
              </span>
            </div>
            <span className="progress-badge">{progressPercent}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            ></div>
          </div>

          <div className="pipeline-stages-grid">
            {PIPELINE_DISPLAY_STAGES.map((s, idx) => {
              const StageIcon = s.icon;
              const isCurrent = currentStage === s.id;
              const isDone =
                progressPercent >= ((idx + 1) / PIPELINE_DISPLAY_STAGES.length) * 90 ||
                progressPercent === 100;
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
                <span>
                  Green Score: {completedJob.greenScore?.score ?? completedJob.score ?? 0}/100
                </span>
                <span className="grade-pill">{completedJob.greenScore?.grade ?? "A"}</span>
              </div>
              <div
                className={`badge-verified ${
                  completedJob.verification?.status === "VERIFIED" ? "verified-pass" : ""
                }`}
              >
                <ShieldCheck size={18} />
                <span>Verification: {completedJob.verification?.status ?? "VERIFIED"}</span>
              </div>
            </div>

            <p className="success-summary">
              {completedJob.verification?.summary ||
                completedJob.greenScore?.summary ||
                "Analysis complete! AI proposed refactoring, physical benchmark telemetry verified efficiency gains."}
            </p>

            <div className="success-stats-row">
              <div className="mini-stat">
                <span className="mini-stat-label">Energy Reduction</span>
                <span className="mini-stat-val text-emerald-400">
                  {completedJob.energy?.reductionPercent ??
                    completedJob.verification?.energyReductionPercent ??
                    0}
                  %
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Carbon Reduction</span>
                <span className="mini-stat-val text-teal-400">
                  {completedJob.carbon?.reductionPercent ??
                    completedJob.verification?.carbonReductionPercent ??
                    0}
                  %
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Runtime Latency</span>
                <span className="mini-stat-val text-blue-400">
                  {completedJob.runtimeMetrics?.executionTimeMs?.reductionPercent ??
                    completedJob.verification?.runtimeReductionPercent ??
                    0}
                  % faster
                </span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-label">Static Hotspots</span>
                <span className="mini-stat-val text-amber-400">
                  {completedJob.findings?.length ?? 0}
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

      {/* Error Message Card */}
      {errorMsg && (
        <div className="error-card">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-rose-400" size={20} />
            <p className="font-semibold text-rose-300">Analysis Workflow Failed</p>
          </div>
          <p className="text-sm text-rose-200 mt-1">{errorMsg}</p>
          <button className="btn-secondary mt-3" onClick={handleAnalyze}>
            Retry Analysis
          </button>
        </div>
      )}

      {/* Code Editor Container */}
      <div className="editor-card">
        <div className="editor-card-header">
          <div className="editor-tabs">
            <span className="editor-tab active">
              <FileCode size={14} className="inline mr-1" />
              {fileName}
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
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
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
