import { useState, useEffect } from "react";
import {
  Leaf,
  Server,
  Database,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Code2,
  Users,
} from "lucide-react";

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime?: number;
  services?: {
    api: string;
    database: string;
  };
}

export default function App() {
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setBackendHealth(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo-badge">
            <Leaf size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-name">GreenOps AI</h1>
            <p className="tagline">AI Proposes. Measurement Verifies.</p>
          </div>
        </div>
        <div className="badge-phase">
          <span className="status-dot"></span>
          Phase 1 Development Foundation
        </div>
      </header>

      <main>
        <section className="hero-section">
          <h2 className="hero-title">
            Sustainability Intelligence <br />
            <span className="hero-gradient">Layer for Software Engineering</span>
          </h2>
          <p className="hero-subtitle">
            Monorepo development environment initialized for frontend, backend orchestrator, and
            PostgreSQL database services.
          </p>
        </section>

        <div className="grid">
          {/* Service Health Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <div className="icon-wrapper">
                  <Activity size={20} color="#10b981" />
                </div>
                <h3 className="card-title">System Status</h3>
              </div>
              <span className={`status-pill ${error ? "pending" : ""}`}>
                {loading ? "CHECKING..." : error ? "CONNECTING" : "OPERATIONAL"}
              </span>
            </div>
            <p className="card-desc">
              Real-time communication status between the React frontend, Express API backend, and
              PostgreSQL database.
            </p>
            <div className="code-box">
              <div>API Host: {apiUrl}</div>
              <div>
                Backend Status:{" "}
                {backendHealth
                  ? backendHealth.services?.api
                  : error
                    ? "Retrying..."
                    : "Checking..."}
              </div>
              <div>
                Database Status:{" "}
                {backendHealth
                  ? backendHealth.services?.database
                  : error
                    ? "Waiting for API..."
                    : "Checking..."}
              </div>
              {backendHealth?.timestamp && (
                <div style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.75rem" }}>
                  Last Checked: {new Date(backendHealth.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Core Modules Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <div className="icon-wrapper">
                  <ShieldCheck size={20} color="#3b82f6" />
                </div>
                <h3 className="card-title">Architecture Pipeline</h3>
              </div>
              <span className="status-pill">PHASE 1</span>
            </div>
            <p className="card-desc">
              Core engines planned across subsequent execution phases as specified in architectural
              documentation:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Code2 size={16} color="#10b981" /> Code Analyzer
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Cpu size={16} color="#3b82f6" /> Runtime Profiler
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Leaf size={16} color="#10b981" /> Energy Engine
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <CheckCircle2 size={16} color="#f59e0b" /> Verification
              </div>
            </div>
          </div>

          {/* Team Roles Card */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header">
              <div className="card-title-group">
                <div className="icon-wrapper">
                  <Users size={20} color="#a855f7" />
                </div>
                <h3 className="card-title">4-Member Engineering Ownership Foundation</h3>
              </div>
              <span className="status-pill">READY</span>
            </div>
            <div className="team-list">
              <div className="team-member">
                <div>
                  <div className="member-role">Member 1: Backend + Orchestration Lead</div>
                  <div className="member-ownership">
                    Backend API, PostgreSQL, Job Orchestration, Analysis Workflow
                  </div>
                </div>
                <Server size={18} color="#9ca3af" />
              </div>
              <div className="team-member">
                <div>
                  <div className="member-role">Member 2: Energy + Runtime Engineering Lead</div>
                  <div className="member-ownership">
                    Docker Sandbox, Benchmark Runner, CPU/Memory Telemetry, Energy Estimation
                  </div>
                </div>
                <Cpu size={18} color="#9ca3af" />
              </div>
              <div className="team-member">
                <div>
                  <div className="member-role">Member 3: AI + Code Analysis Lead</div>
                  <div className="member-ownership">
                    Static Analysis, Code Smell Detection, LLM Optimization Engine
                  </div>
                </div>
                <Code2 size={18} color="#9ca3af" />
              </div>
              <div className="team-member">
                <div>
                  <div className="member-role">Member 4: Frontend + GitHub Integration Lead</div>
                  <div className="member-ownership">
                    React Dashboard, Visualization, Green Score UI, GitHub PR Integration
                  </div>
                </div>
                <Database size={18} color="#9ca3af" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          GreenOps AI &copy; 2026 &mdash; Built with React, Vite, Express, TypeScript, and Docker
        </p>
      </footer>
    </div>
  );
}
