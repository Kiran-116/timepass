import { useEffect, useState } from "react";
import { getAnalysis, AnalysisResponse } from "../services/api";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    getAnalysis("analysis-001").then(setAnalysis);
  }, []);

  return (
    <div className="page">
      <h1>GreenOps Dashboard</h1>

      <p>Monitor the environmental efficiency of your software.</p>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Green Score</h3>
          <strong>{analysis?.score ?? "..."} / 100</strong>
        </div>

        <div className="card">
          <h3>Energy</h3>
          <strong>{analysis?.energy ?? "..."} Wh</strong>
        </div>

        <div className="card">
          <h3>CO₂e</h3>
          <strong>{analysis?.co2e ?? "..."} g</strong>
        </div>

        <div className="card">
          <h3>Recent Analyses</h3>
          <strong>3</strong>
        </div>
      </div>

      <h2>Recent Analyses</h2>

      <div className="card">
        <p>sample-code.py — Green Score: 72</p>
        <p>api-service.py — Green Score: 81</p>
        <p>database.py — Green Score: 76</p>
      </div>

      <h2>Recent PRs</h2>

      <div className="card">
        <p>PR #24 — Performance Optimization</p>
        <p>PR #21 — API Optimization</p>
        <p>PR #18 — Database Refactoring</p>
      </div>
    </div>
  );
}
