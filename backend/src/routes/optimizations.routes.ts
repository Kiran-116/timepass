import { Request, Response, Router } from "express";
import { aiAgentEngine } from "../ai/aiAgent";
import { pipelineStore } from "../pipeline/pipelineStore";

const router = Router();

// POST /api/optimizations - Request standalone AI optimization for code & findings
router.post("/", async (req: Request, res: Response) => {
  try {
    const { code, language = "python", fileName = "service.py", findings, telemetry, energy, carbon, analysisId } = req.body;

    if (!code || typeof code !== "string" || code.trim() === "") {
      res.status(400).json({ error: "Code is required for AI optimization" });
      return;
    }

    const result = await aiAgentEngine.generateOptimization({
      code,
      language,
      fileName,
      findings,
      telemetry,
      energy,
      carbon,
    });

    res.status(200).json({
      optimizationId: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      analysisId: analysisId || null,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      error: "AI optimization generation failed",
      message: (error as Error).message,
    });
  }
});

// GET /api/optimizations/:optimizationId - Get optimization details
router.get("/:optimizationId", (req: Request, res: Response) => {
  const { optimizationId } = req.params;

  const jobs = pipelineStore.getRecentJobs(50);
  const match = jobs.find((j) => j.analysisId === optimizationId);

  if (match && match.aiExplanation && match.optimizedCode) {
    res.status(200).json({
      optimizationId,
      analysisId: match.analysisId,
      originalCode: match.originalCode,
      optimizedCode: match.optimizedCode,
      aiExplanation: match.aiExplanation,
      status: match.status,
    });
    return;
  }

  res.status(404).json({
    error: "Optimization record not found",
    optimizationId,
  });
});

export default router;
