export default function BeforeAfter() {
  const metrics = [
    ["Runtime", "2.8 s", "1.6 s"],
    ["CPU", "78%", "51%"],
    ["Memory", "420 MB", "310 MB"],
    ["Energy", "65 Wh", "38 Wh"],
    ["CO₂e", "28 g", "16 g"],
  ];

  return (
    <div className="page">
      <h1>Before / After</h1>

      <p>Compare environmental performance before and after optimization.</p>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Before</th>
            <th>After</th>
          </tr>
        </thead>

        <tbody>
          {metrics.map(([metric, before, after]) => (
            <tr key={metric}>
              <td>{metric}</td>
              <td>{before}</td>
              <td>{after}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="reduction-card">
        <h2>Reduction</h2>
        <strong>41.5%</strong>
      </div>
    </div>
  );
}
