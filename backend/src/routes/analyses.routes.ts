import { Request, Response, Router } from "express";
import { analyzeCode } from "../analyzer/staticAnalyzer";

const router = Router();

// POST /api/analyses - Analyze submitted code
router.post("/", (req: Request, res: Response) => {
  const { projectId, language = "python", code, fileName = "service.py" } = req.body;

  if (!code || typeof code !== "string") {
    res.status(400).json({
      error: "Code is required",
    });

    return;
  }

  const findings = analyzeCode(code, {
    fileName,
    language,
  });

  res.status(200).json({
    id: `analysis-${Date.now()}`,
    projectId: projectId || null,
    status: "COMPLETED",
    language,
    fileName,
    findings,
    summary: {
      totalFindings: findings.length,
      high: findings.filter((finding) => finding.severity === "HIGH").length,
      medium: findings.filter((finding) => finding.severity === "MEDIUM").length,
      low: findings.filter((finding) => finding.severity === "LOW").length,
    },
  });
});

// GET /api/analyses/:analysisId - Get analysis details
router.get("/:analysisId", (req: Request, res: Response) => {
  const { analysisId } = req.params;

  res.status(200).json({
    id: analysisId,
    status: "COMPLETED",
    message: "Analysis lookup endpoint",
  });
});

export default router;
