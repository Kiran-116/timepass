import { Request, Response, Router } from "express";

const router = Router();

// POST /api/verifications - Run verification comparing before/after optimization
router.post("/", (req: Request, res: Response) => {
  const { optimizationId } = req.body;
  res.status(202).json({
    message: "Verification comparison endpoint",
    status: "QUEUED",
    received: {
      optimizationId: optimizationId || null,
    },
  });
});

// GET /api/verifications/:verificationId - Get verification result
router.get("/:verificationId", (req: Request, res: Response) => {
  const { verificationId } = req.params;
  res.status(200).json({
    id: verificationId,
    status: "QUEUED",
    message: "Verification lookup endpoint",
  });
});

export default router;
