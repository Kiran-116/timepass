import { Request, Response, Router } from "express";

const router = Router();

// GET /api/auth/github - Initiate GitHub OAuth flow
router.get("/github", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "GitHub OAuth initiation endpoint",
    status: "ready",
  });
});

// GET /api/auth/github/callback - Handle GitHub OAuth callback
router.get("/github/callback", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "GitHub OAuth callback endpoint",
    status: "ready",
  });
});

// POST /api/auth/logout - Terminate session
router.post("/logout", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "User logged out successfully",
  });
});

export default router;
