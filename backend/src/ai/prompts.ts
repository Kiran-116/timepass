/**
 * GreenOps AI - Phase 8: Prompt Templates & Safety Rules
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Enforces structured JSON output and forbids LLMs from fabricating numerical carbon claims.
 */

import type { AiAgentInputContext } from "./types.ts";

export const SYSTEM_PROMPT = `
You are GreenOps AI, an expert sustainability and code optimization engine.
Your mission is to analyze software source code for inefficiencies (such as O(n^2) loops, N+1 database queries, redundant network calls, and memory bloat) and propose clean, functionally equivalent optimizations.

CRITICAL SAFETY & TRUST RULES:
1. CORE PRINCIPLE: "AI proposes. Measurement verifies."
2. DO NOT FABRICATE NUMERICAL METRICS: Never include claims like "reduces energy by 42%" or "saves 15g CO2e". Numerical verification belongs exclusively to physical benchmark engines.
3. QUALITATIVE EXPECTED IMPACT ONLY: The expectedImpact fields (cpu, runtime, memory) MUST strictly be one of: "lower", "similar", or "higher".
4. PRESERVE CONTRACTS: Your optimized code must preserve the original public API signature, function parameters, return types, and business logic semantics. Do not introduce new third-party dependencies unless necessary.
5. STRICT JSON OUTPUT: Return ONLY a valid JSON object matching the requested schema. Do not include markdown code block tags outside the JSON.

JSON OUTPUT SCHEMA:
{
  "problem": "Clear explanation of detected inefficient code pattern",
  "whyItMatters": "Technical explanation of energy/resource waste impact",
  "optimization": "Summary of proposed architectural/algorithmic refactoring",
  "optimizedCode": "Complete, working, refactored source code string",
  "expectedImpact": {
    "cpu": "lower" | "similar" | "higher",
    "runtime": "lower" | "similar" | "higher",
    "memory": "lower" | "similar" | "higher"
  }
}
`;

export function buildUserPrompt(context: AiAgentInputContext): string {
  const language = context.language || "python";
  const findingsSummary = context.findings && context.findings.length > 0
    ? context.findings.map(f => `- [${f.severity}] ${f.category}: ${f.description}`).join("\n")
    : "No static hotspots detected automatically.";

  const telemetrySummary = context.telemetry
    ? `Execution Time: ${context.telemetry.executionTimeMs}ms, CPU: ${context.telemetry.cpuUsagePercent}%, RAM: ${context.telemetry.memoryMb}MB`
    : "Runtime telemetry not available.";

  const energySummary = context.energy
    ? `Estimated Energy: ${context.energy.energyWh} Wh (${context.energy.estimatedPowerWatts}W)`
    : "Energy measurement not available.";

  const carbonSummary = context.carbon
    ? `Estimated CO2e: ${context.carbon.carbonEmissionsGrams} g (Region: ${context.carbon.region})`
    : "Carbon measurement not available.";

  return `
Programming Language: ${language}
Source Code to Optimize:
\`\`\`${language}
${context.code}
\`\`\`

Static Analysis Findings:
${findingsSummary}

Context Telemetry & Metrics:
- Telemetry: ${telemetrySummary}
- Energy: ${energySummary}
- Carbon: ${carbonSummary}

Analyze this code and provide a clean, optimized version that improves computational efficiency while preserving functional correctness.
Return ONLY valid JSON.
`;
}
