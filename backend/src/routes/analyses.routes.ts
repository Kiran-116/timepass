import { Request, Response, Router } from "express";
import { analysisPipeline } from "../pipeline/analysisPipeline";
import { pipelineStore } from "../pipeline/pipelineStore";

const router = Router();

// POST /api/analyses - Create and trigger a new complete analysis pipeline job
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      code,
      language = "python",
      fileName = "service.py",
      projectId,
      region = "global",
      customPowerModel,
      warmupRuns = 2,
      measuredRuns = 5,
      timeoutMs = 10000,
    } = req.body;

    if (!code || typeof code !== "string" || code.trim() === "") {
      res.status(400).json({
        error: "Code is required and must be a non-empty string",
      });
      return;
    }

    const isSync = req.query.sync === "true";

    const job = await analysisPipeline.executePipeline(
      {
        code,
        language,
        fileName,
        projectId,
        region,
        customPowerModel,
        warmupRuns,
        measuredRuns,
        timeoutMs,
      },
      { sync: isSync }
    );

    if (isSync) {
      res.status(200).json(job);
    } else {
      res.status(202).json({
        analysisId: job.analysisId,
        id: job.analysisId, // compatibility alias
        status: job.status,
        stage: job.stage,
        stageProgress: job.stageProgress,
        language: job.language,
        fileName: job.fileName,
        createdAt: job.createdAt,
        message: "Analysis job successfully queued and started",
      });
    }
  } catch (error) {
    console.error("[Analyses API Error]:", error);
    res.status(500).json({
      error: "Failed to initiate analysis pipeline",
      message: (error as Error).message,
    });
  }
});

// GET /api/analyses - List recent analyses
router.get("/", (_req: Request, res: Response) => {
  try {
    const recent = pipelineStore.getRecentJobs(30);
    res.status(200).json({
      total: recent.length,
      analyses: recent,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve analyses list",
      message: (error as Error).message,
    });
  }
});

// GET /api/analyses/:analysisId - Get complete analysis status or final results
router.get("/:analysisId", (req: Request, res: Response) => {
  const analysisId = Array.isArray(req.params.analysisId)
    ? req.params.analysisId[0]
    : req.params.analysisId;

  if (!analysisId) {
    res.status(400).json({ error: "analysisId parameter is required" });
    return;
  }

  const job = pipelineStore.getJob(analysisId);

  if (!job) {
    res.status(404).json({
      error: "Analysis not found",
      analysisId,
    });
    return;
  }

  // Ensure compatibility aliases (e.g. id, score, co2e) without overwriting job.energy object
  const responsePayload = {
    ...job,
    id: job.analysisId,
    score: job.greenScore?.score ?? 0,
    energyWh: job.energy?.original?.energyWh ?? 0,
    co2e: job.carbon?.original?.carbonEmissionsGrams ?? 0,
  };

  res.status(200).json(responsePayload);
});

export default router;
