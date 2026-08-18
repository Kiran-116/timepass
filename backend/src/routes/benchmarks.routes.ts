import { Request, Response, Router } from "express";

const router = Router();

// POST /api/benchmarks - Start a runtime benchmark job
router.post("/", (req: Request, res: Response) => {
  const { analysisId, codeVersion } = req.body;
  res.status(202).json({
    message: "Benchmark execution endpoint",
    status: "QUEUED",
    received: {
      analysisId: analysisId || null,
      codeVersion: codeVersion || "BASE",
    },
  });
});

// GET /api/benchmarks/:benchmarkId - Get benchmark results & telemetry
router.get("/:benchmarkId", (req: Request, res: Response) => {
  const { benchmarkId } = req.params;
  res.status(200).json({
    id: benchmarkId,
    status: "QUEUED",
    message: "Benchmark telemetry lookup endpoint",
  });
});

export default router;
