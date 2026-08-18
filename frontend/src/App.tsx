import { Activity, BarChart3, Code2, GitCompare, Leaf } from "lucide-react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";

import AnalysisResult from "./pages/AnalysisResult";
import BeforeAfter from "./pages/BeforeAfter";
import CodeAnalysis from "./pages/CodeAnalysis";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="header">
          <div className="brand">
            <div className="logo-badge">
              <Leaf size={22} color="#ffffff" />
            </div>
            <div>
              <h1 className="brand-name">GreenOps AI</h1>
              <p className="tagline">AI Proposes. Measurement Verifies.</p>
            </div>
          </div>

          <nav className="nav-menu">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              end
            >
              <Activity size={16} /> Dashboard
            </NavLink>
            <NavLink
              to="/code-analysis"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <Code2 size={16} /> Code Analysis
            </NavLink>
            <NavLink
              to="/analysis-result"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <BarChart3 size={16} /> Analysis Result
            </NavLink>
            <NavLink
              to="/before-after"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <GitCompare size={16} /> Before / After
            </NavLink>
          </nav>

          <div className="badge-phase">
            <span className="status-dot"></span>
            Production Ready
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/code-analysis" element={<CodeAnalysis />} />
            <Route path="/analysis-result" element={<AnalysisResult />} />
            <Route path="/before-after" element={<BeforeAfter />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>GreenOps AI &copy; 2026 &mdash; Automated Sustainability & Telemetry Intelligence</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
