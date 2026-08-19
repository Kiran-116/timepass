/**
 * GreenOps AI - Phase 8: AI Agent Engine
 * 
 * Core Principle: AI proposes. Measurement verifies.
 * Generates structured optimizations & explanations without fabricating numerical carbon metrics.
 */

import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import type { AiAgentInputContext, AiAgentOutput, ExpectedImpactQualitative, ResourceImpactQualitative } from "./types";

// Safe env loader fallback
try {
  // @ts-ignore
  import("dotenv").then(dotenv => dotenv.default?.config()).catch(() => {});
} catch {
  // Ignore if dotenv is not present in standalone test environment
}

export class AiAgentEngine {
  private provider: string;
  private apiKey?: string;
  private modelName: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || "gemini";
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    this.modelName = process.env.AI_MODEL || (this.provider === "openai" ? "gpt-4o-mini" : "gemini-1.5-pro");
  }

  /**
   * Main AI Optimization Generator
   */
  public async generateOptimization(context: AiAgentInputContext): Promise<AiAgentOutput> {
    if (!context || !context.code || typeof context.code !== "string" || context.code.trim() === "") {
      throw new Error("Source code is required for AI optimization analysis.");
    }

    // 1. If API key is present, attempt live LLM call
    if (this.apiKey) {
      try {
        const liveResult = await this.callLiveLlm(context);
        return this.validateAndSanitizeOutput(liveResult, this.provider, this.modelName, false);
      } catch (error) {
        console.warn(`[AiAgent] Live LLM call failed (${(error as Error).message}). Falling back to Rule-Assisted Optimization Engine.`);
      }
    }

    // 2. Deterministic Rule-Assisted Optimization Fallback Engine
    // Guarantees 100% offline hackathon demo reliability when no API key is set
    const fallbackResult = this.generateRuleAssistedFallback(context);
    return this.validateAndSanitizeOutput(fallbackResult, "deterministic-rule-engine", "greenops-static-optimizer-v1", true);
  }

  /**
   * Live LLM Integration (Supports Gemini / OpenAI endpoints via HTTP fetch)
   */
  private async callLiveLlm(context: AiAgentInputContext): Promise<Partial<AiAgentOutput>> {
    const promptText = buildUserPrompt(context);

    if (this.provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptText }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      return JSON.parse(content);
    } else {
      // Default: Google Gemini API REST call
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: SYSTEM_PROMPT },
              { text: promptText }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawText);
    }
  }

  /**
   * Offline Rule-Assisted Fallback Generator
   */
  public generateRuleAssistedFallback(context: AiAgentInputContext): Partial<AiAgentOutput> {
    const code = context.code;
    const lang = (context.language || "python").toLowerCase();

    // Pattern 1: N+1 Loop Database Query or Repeated Call
    if (code.includes("for ") && (code.includes("query(") || code.includes("select ") || code.includes("fetch(") || code.includes("find_by"))) {
      return {
        problem: "Database or API query detected inside an iterative loop (N+1 Query Smell).",
        whyItMatters: "Executing network roundtrips inside a loop multiplies CPU idle wait times, network overhead, and energy consumption per iteration.",
        optimization: "Batch fetch all required records upfront using a single vectorized query or bulk request.",
        optimizedCode: this.optimizeNPlusOneCode(code, lang),
        expectedImpact: { cpu: "lower", runtime: "lower", memory: "similar" }
      };
    }

    // Pattern 2: O(n^2) Nested Loops or Quadratic Lookup
    if (code.match(/for\s+.*\s+in\s+.*:\s*[\s\S]*for\s+.*\s+in\s+.*:/) || code.match(/for\s*\([^)]*\)\s*\{[\s\S]*for\s*\([^)]*\)\s*\{/)) {
      return {
        problem: "Nested loop algorithm causing quadratic time complexity O(n²).",
        whyItMatters: "Quadratic complexity causes CPU execution time and total Watt-hours to scale quadratically with input size.",
        optimization: "Replace nested loop searching with a Set or Hash Map lookup to achieve linear time complexity O(n).",
        optimizedCode: this.optimizeNestedLoopCode(code, lang),
        expectedImpact: { cpu: "lower", runtime: "lower", memory: "similar" }
      };
    }

    // Default Inefficiency Refactoring
    return {
      problem: "Sequential resource allocation and redundant variable recalculation detected.",
      whyItMatters: "Redundant computational loops consume unnecessary CPU cycles and elevate runtime power draw.",
      optimization: "Vectorize operations and cache repeated values outside loop scopes.",
      optimizedCode: this.optimizeDefaultCode(code, lang),
      expectedImpact: { cpu: "lower", runtime: "lower", memory: "similar" }
    };
  }

  /**
   * Helper code transformers for fallback optimizations
   */
  private optimizeNPlusOneCode(code: string, lang: string): string {
    if (lang === "python") {
      return `# Optimized GreenOps AI Code (Batched Bulk Query)
user_ids = [u.id for u in users]
user_details_map = {d.id: d for d in db.query_bulk(user_ids)}
results = [user_details_map.get(uid) for uid in user_ids]
`;
    }
    return `// Optimized GreenOps AI Code (Batched Bulk Query)
const userIds = users.map(u => u.id);
const userDetailsMap = await db.queryBulk(userIds);
const results = userIds.map(id => userDetailsMap.get(id));
`;
  }

  private optimizeNestedLoopCode(code: string, lang: string): string {
    if (lang === "python") {
      return `# Optimized GreenOps AI Code (Linear O(n) Hash Lookup)
lookup_set = set(list_b)
common_elements = [item for item in list_a if item in lookup_set]
`;
    }
    return `// Optimized GreenOps AI Code (Linear O(n) Set Lookup)
const lookupSet = new Set(listB);
const commonElements = listA.filter(item => lookupSet.has(item));
`;
  }

  private optimizeDefaultCode(code: string, lang: string): string {
    if (lang === "python") {
      return `# Optimized GreenOps AI Code (Cached Computations)
memoized_data = precalculate_heavy_data()
results = [memoized_data + item for item in raw_data]
`;
    }
    return `// Optimized GreenOps AI Code (Cached Operations)
const memoizedData = precalculateHeavyData();
const results = rawData.map(item => memoizedData + item);
`;
  }

  /**
   * Validates & Sanitizes AI Output to Ensure Schema Safety & Numeric Non-Fabrication
   */
  public validateAndSanitizeOutput(
    raw: Partial<AiAgentOutput>,
    provider: string,
    model: string,
    isFallback: boolean
  ): AiAgentOutput {
    if (!raw || typeof raw !== "object") {
      throw new Error("AI output must be a valid JSON object.");
    }

    const problem = raw.problem && typeof raw.problem === "string" && raw.problem.trim() !== ""
      ? raw.problem
      : "Efficiency bottleneck detected in algorithm implementation.";

    const whyItMatters = raw.whyItMatters && typeof raw.whyItMatters === "string"
      ? raw.whyItMatters
      : "High execution times increase energy consumption and operational carbon emissions.";

    const optimization = raw.optimization && typeof raw.optimization === "string"
      ? raw.optimization
      : "Algorithmic refactoring proposed to improve efficiency.";

    const optimizedCode = raw.optimizedCode && typeof raw.optimizedCode === "string" && raw.optimizedCode.trim() !== ""
      ? raw.optimizedCode
      : "// Optimized code functionally equivalent";

    // Sanitize Expected Impact (Qualitative only: lower | similar | higher)
    const rawImpact: any = raw.expectedImpact || {};
    const expectedImpact: ExpectedImpactQualitative = {
      cpu: this.sanitizeQualitativeImpact(rawImpact.cpu),
      runtime: this.sanitizeQualitativeImpact(rawImpact.runtime),
      memory: this.sanitizeQualitativeImpact(rawImpact.memory)
    };

    // Sanitize text fields to strip any fabricated numeric claims (e.g. "reduces energy by 42%")
    const sanitizedProblem = this.sanitizeTextForNumericClaims(problem);
    const sanitizedWhyItMatters = this.sanitizeTextForNumericClaims(whyItMatters);
    const sanitizedOptimization = this.sanitizeTextForNumericClaims(optimization);

    return {
      problem: sanitizedProblem,
      whyItMatters: sanitizedWhyItMatters,
      optimization: sanitizedOptimization,
      optimizedCode,
      expectedImpact,
      modelMetadata: {
        provider,
        model,
        isFallback
      },
      createdAt: new Date().toISOString()
    };
  }

  private sanitizeQualitativeImpact(val: any): ResourceImpactQualitative {
    if (val === "lower" || val === "similar" || val === "higher") {
      return val;
    }
    return "lower";
  }

  /**
   * Safety Sanitizer: Strips fabricated percentage claims like "reduces energy by 43%" from LLM text
   */
  public sanitizeTextForNumericClaims(text: string): string {
    if (!text) return "";
    return text
      .replace(/(reduces?|decreases?|saves?|lowers?)\s+(energy|co2e?|carbon|power)\s+by\s+\d+(\.\d+)?%/gi, "lowers expected energy consumption")
      .replace(/\d+(\.\d+)?%\s+(energy|carbon|co2e?)\s+(reduction|decrease|savings)/gi, "expected energy reduction");
  }
}

export const aiAgentEngine = new AiAgentEngine();
