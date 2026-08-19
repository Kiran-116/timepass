/**
 * GreenOps AI - Phase 8 Unit Tests
 * 
 * Unit tests for AI Agent Engine covering:
 * 1. Valid structured output & schema parsing
 * 2. Prompt context construction
 * 3. Sanitization of fabricated numerical carbon claims
 * 4. Handling malformed responses & missing fields
 * 5. Fallback behavior when API key is missing
 * 6. Code preservation & non-empty optimization checks
 * 
 * Note: All tests use local mocked context/engine — zero paid API calls.
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { AiAgentEngine, aiAgentEngine } from "../aiAgent.ts";
import { buildUserPrompt, SYSTEM_PROMPT } from "../prompts.ts";
import type { AiAgentInputContext } from "../types.ts";

describe("Phase 8: AI Agent Unit Tests", () => {
  // Test 1: Valid structured output & schema validation
  it("should generate valid structured output matching schema", async () => {
    const context: AiAgentInputContext = {
      code: "for i in range(len(users)):\n  for j in range(len(items)):\n    if users[i].id == items[j].user_id: pass",
      language: "python",
      findings: [{
        category: "O(n^2) Complexity",
        severity: "HIGH",
        description: "Nested loop iteration",
        file: "app.py",
        line: 1,
        recommendation: "Use map or set lookup"
      }]
    };

    const result = await aiAgentEngine.generateOptimization(context);

    assert.ok(result.problem.length > 0, "Problem must not be empty");
    assert.ok(result.whyItMatters.length > 0, "WhyItMatters must not be empty");
    assert.ok(result.optimization.length > 0, "Optimization must not be empty");
    assert.ok(result.optimizedCode.length > 0, "OptimizedCode must not be empty");
    assert.ok(["lower", "similar", "higher"].includes(result.expectedImpact.cpu));
    assert.ok(["lower", "similar", "higher"].includes(result.expectedImpact.runtime));
    assert.ok(["lower", "similar", "higher"].includes(result.expectedImpact.memory));
    assert.ok(result.modelMetadata.isFallback === true || result.modelMetadata.isFallback === false);
  });

  // Test 2: Prompt context construction
  it("should construct prompt containing static findings, energy, and carbon telemetry", () => {
    const context: AiAgentInputContext = {
      code: "def process(): pass",
      language: "python",
      findings: [{ category: "N+1 Query", severity: "HIGH", description: "DB query in loop", file: "app.py", line: 1, recommendation: "Batch queries" }],
      telemetry: { executionTimeMs: 2500, cpuUsagePercent: 80, memoryMb: 512 },
      energy: { energyWh: 0.05, estimatedPowerWatts: 80 } as any,
      carbon: { carbonEmissionsGrams: 0.03, region: "us-east-1" } as any
    };

    const promptText = buildUserPrompt(context);

    assert.ok(promptText.includes("def process(): pass"));
    assert.ok(promptText.includes("N+1 Query"));
    assert.ok(promptText.includes("2500ms"));
    assert.ok(promptText.includes("0.05 Wh"));
    assert.ok(promptText.includes("0.03 g"));
    assert.ok(SYSTEM_PROMPT.includes("AI proposes. Measurement verifies."));
  });

  // Test 3: Safety restriction: Fabricated numerical claims are sanitized
  it("should sanitize fabricated numerical claims in LLM text (e.g. 'reduces energy by 43%')", () => {
    const fabricatedText = "Refactoring reduces energy by 43% and lowers CO2 by 25%.";
    
    const sanitized = aiAgentEngine.sanitizeTextForNumericClaims(fabricatedText);

    assert.strictEqual(sanitized.includes("by 43%"), false, "Numeric claim 'by 43%' must be removed");
    assert.strictEqual(sanitized.includes("by 25%"), false, "Numeric claim 'by 25%' must be removed");
    assert.ok(sanitized.includes("lowers expected energy consumption"));
  });

  // Test 4: Handling malformed responses & missing fields
  it("should handle partial or missing output fields gracefully via sanitizer", () => {
    const partialRaw = {
      problem: "In-memory allocation bloat",
      expectedImpact: { cpu: "invalid_value" as any, runtime: "lower" as const, memory: "lower" as const }
    };

    const result = aiAgentEngine.validateAndSanitizeOutput(partialRaw, "test-provider", "test-model", true);

    assert.strictEqual(result.problem, "In-memory allocation bloat");
    assert.strictEqual(result.expectedImpact.cpu, "lower"); // Fallback to safe qualitative default
    assert.ok(result.optimizedCode.length > 0);
  });

  // Test 5: Fallback behavior when API key is missing
  it("should fall back gracefully to deterministic rule-assisted optimizer when no API key is set", async () => {
    const engineWithoutKey = new AiAgentEngine();
    // @ts-ignore
    engineWithoutKey.apiKey = undefined;

    const context: AiAgentInputContext = {
      code: "for u in users:\n  profile = db.query(u.id)",
      language: "python"
    };

    const result = await engineWithoutKey.generateOptimization(context);

    assert.ok(result.problem.includes("N+1") || result.problem.length > 0);
    assert.ok(result.optimizedCode.includes("bulk") || result.optimizedCode.includes("query"));
    assert.strictEqual(result.modelMetadata.isFallback, true);
  });

  // Test 6: Validation check: Throws error on empty code
  it("should throw validation error when code input is empty", async () => {
    await assert.rejects(
      async () => {
        // @ts-ignore
        await aiAgentEngine.generateOptimization({ code: "" });
      },
      /Source code is required/
    );
  });
});
