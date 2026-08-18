import { useEffect, useState } from "react";
import { getAnalysis, AnalysisResponse } from "../services/api";

export default function AnalysisResult() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalysis = async () => {
      const result = await getAnalysis("analysis-001");
      setAnalysis(result);
      setLoading(false);
    };

    loadAnalysis();
  }, []);

  if (loading) {
    return <div className="page">Loading analysis...</div>;
  }

  if (!analysis) {
    return <div className="page">No analysis found.</div>;
  }

  return (
    <div className="page">
      <h1>Analysis Result</h1>

      <div className="score-card">
        <h2>Green Score</h2>
        <strong>{analysis.score}/100</strong>
      </div>

      <div className="metrics">
        <div className="card">
          <h3>Energy</h3>
          <p>{analysis.energy} Wh</p>
        </div>

        <div className="card">
          <h3>CO₂e</h3>
          <p>{analysis.co2e} g</p>
        </div>
      </div>

      <h2>Findings</h2>

      {analysis.findings.map((finding) => (
        <div className="finding" key={finding.id}>
          <h3>
            {finding.severity} — {finding.title}
          </h3>

          <p>{finding.description}</p>

          <small>Line: {finding.line}</small>

          <p>
            <strong>Recommendation:</strong> {finding.recommendation}
          </p>
        </div>
      ))}

      <h2>Recommendations</h2>

      <ul>
        {analysis.recommendations.map((recommendation) => (
          <li key={recommendation}>{recommendation}</li>
        ))}
      </ul>
    </div>
  );
}
