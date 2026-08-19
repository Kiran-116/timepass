import { GreenOpsComparisonFlow } from "../components/GreenOpsComparisonFlow";

export default function BeforeAfter() {
  return (
    <div className="page">
      <div style={{ marginBottom: "2rem" }}>
        <h1>Before / After Sustainability Story</h1>
        <p>Experimental measurement comparing baseline code versus AI-optimized implementation.</p>
      </div>

      <GreenOpsComparisonFlow
        score={86}
        energyWh={0.020}
        energyReductionPercent={67.2}
        carbonGrams={0.014}
        carbonReductionPercent={67.4}
        isVerified={true}
      />
    </div>
  );
}
