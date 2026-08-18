import { Request, Response, Router } from "express";

const router = Router();

// POST /api/analyses - Create a code analysis job
router.post("/", (req: Request, res: Response) => {
  const { projectId, language, code } = req.body;
  res.status(202).json({
    message: "Analysis job endpoint",
    status: "QUEUED",
    received: {
      projectId: projectId || null,
      language: language || "python",
      hasCode: Boolean(code),
    },
  });
});

// GET /api/analyses/:analysisId - Get analysis details and findings
router.get("/:analysisId", (req: Request, res: Response) => {
  const { analysisId } = req.params;
  res.status(200).json({
    id: analysisId,
    status: "QUEUED",
    message: "Analysis lookup endpoint",
  });
});

export default router;
