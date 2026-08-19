/**
 * GreenOps AI - Phase 11 API Route Integration Tests
 * 
 * Tests REST Endpoints:
 * - POST /api/analyses (Async & Sync)
 * - POST /api/analyses (Validation)
 * - GET /api/analyses/:analysisId (200 & 404)
 * - GET /api/analyses (List)
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import app from "../../index";

// Helper to make mock requests against the Express app
async function mockFetch(
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: any }> {
  // Use http server / direct endpoint test
  const port = 5000;
  const url = `http://localhost:${port}${path}`;

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const body = await res.json();
    return { status: res.status, body };
  } catch (err) {
    throw new Error(`Fetch failed: ${(err as Error).message}`);
  }
}

describe("Phase 11: Analyses API Route Tests", () => {
  it("POST /api/analyses should accept valid code and return 202 with analysisId", async () => {
    const res = await mockFetch("/api/analyses", {
      method: "POST",
      body: {
        code: "def process(n): return [i*2 for i in range(n)]",
        language: "python",
        fileName: "process.py",
      },
    });

    assert.strictEqual(res.status, 202);
    assert.ok(res.body.analysisId);
    assert.ok(["QUEUED", "PROCESSING", "COMPLETED"].includes(res.body.status));
  });

  it("POST /api/analyses should return 400 when code is missing", async () => {
    const res = await mockFetch("/api/analyses", {
      method: "POST",
      body: {
        language: "python",
      },
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it("POST /api/analyses?sync=true should execute synchronously and return full result", async () => {
    const res = await mockFetch("/api/analyses?sync=true", {
      method: "POST",
      body: {
        code: "def total(items):\n  s = 0\n  for i in range(len(items)):\n    for j in range(len(items)):\n      s += items[j]\n  return s",
        language: "python",
        fileName: "nested.py",
        warmupRuns: 1,
        measuredRuns: 2,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "COMPLETED");
    assert.ok(res.body.analysisId);
    assert.ok(res.body.findings.length > 0);
    assert.ok(res.body.aiExplanation);
    assert.ok(res.body.energy);
    assert.ok(res.body.carbon);
    assert.ok(res.body.verification);
    assert.ok(res.body.greenScore);
  });

  it("GET /api/analyses/:analysisId should return 404 for non-existent ID", async () => {
    const res = await mockFetch("/api/analyses/non-existent-analysis-id");
    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
  });

  it("GET /api/analyses should return list of recent analyses", async () => {
    const res = await mockFetch("/api/analyses");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.analyses));
    assert.ok(res.body.total >= 0);
  });
});
