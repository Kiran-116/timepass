import { useState } from "react";
import Editor from "@monaco-editor/react";
import { analyzeCode } from "../services/api";

export default function CodeAnalysis() {
  const [language, setLanguage] = useState("python");

  const [code, setCode] = useState(
    `def calculate_total(items):
    total = 0

    for i in range(len(items)):
        for j in range(len(items)):
            total += items[j]

    return total`
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await analyzeCode(code, language);

      localStorage.setItem("greenops-analysis", JSON.stringify(result));

      setMessage(`Analysis completed! Green Score: ${result.score}`);
    } catch {
      setMessage("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Code Analysis</h1>

      <p>Analyze your code for performance and environmental efficiency.</p>

      <div className="toolbar">
        <label htmlFor="language">Language:</label>

        <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Code"}
        </button>
      </div>

      <div className="editor-container">
        <Editor
          height="500px"
          language={language}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      {message && <div className="success-message">{message}</div>}
    </div>
  );
}
