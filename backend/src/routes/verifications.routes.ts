import { Request, Response, Router } from "express";
import { pipelineStore } from "../pipeline/pipelineStore";
import { verificationEngine } from "../verification/verificationEngine";

const router = Router();

// POST /api/verifications - Run standalone verification comparing before/after metrics
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      originalCode = "",
      optimizedCode = "",
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
      energyReductionThresholdPercent = 0.0,
      analysisId,
    } = req.body;

    if (!originalBenchmark || !optimizedBenchmark || !originalEnergy || !optimizedEnergy || !originalCarbon || !optimizedCarbon) {
      res.status(400).json({
        error: "Missing required benchmark, energy, or carbon metrics for verification comparison.",
      });
      return;
    }

    const result = verificationEngine.verify({
      originalCode,
      optimizedCode,
      originalBenchmark,
      optimizedBenchmark,
      originalEnergy,
      optimizedEnergy,
      originalCarbon,
      optimizedCarbon,
      energyReductionThresholdPercent,
    });

    res.status(200).json({
      ...result,
      analysisId: analysisId || null,
    });
  } catch (error) {
    res.status(500).json({
      error: "Verification calculation failed",
      message: (error as Error).message,
    });
  }
});

// GET /api/verifications/:verificationId - Get verification result from analysis lookup
router.get("/:verificationId", (req: Request, res: Response) => {
  const { verificationId } = req.params;

  // Search in recent jobs for matching verificationId
  const jobs = pipelineStore.getRecentJobs(50);
  const match = jobs.find((j) => j.verification?.verificationId === verificationId || j.analysisId === verificationId);

  if (match && match.verification) {
    res.status(200).json(match.verification);
    return;
  }

  res.status(404).json({
    error: "Verification record not found",
    verificationId,
  });
});

export default router;
