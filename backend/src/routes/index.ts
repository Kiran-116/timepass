import { Request, Response, Router } from "express";
import analysesRoutes from "./analyses.routes";
import authRoutes from "./auth.routes";
import benchmarksRoutes from "./benchmarks.routes";
import githubRoutes from "./github.routes";
import greenScoreRoutes from "./greenScore.routes";
import optimizationsRoutes from "./optimizations.routes";
import projectsRoutes from "./projects.routes";
import verificationsRoutes from "./verifications.routes";

const router = Router();

// API Group Mounts
router.use("/auth", authRoutes);
router.use("/projects", projectsRoutes);
router.use("/analyses", analysesRoutes);
router.use("/benchmarks", benchmarksRoutes);
router.use("/optimizations", optimizationsRoutes);
router.use("/verifications", verificationsRoutes);
router.use("/green-score", greenScoreRoutes);
router.use("/github", githubRoutes);

// Base /api status
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    phase: "Phase 10 - Green Score Engine",
    endpoints: [
      "/api/auth",
      "/api/projects",
      "/api/analyses",
      "/api/benchmarks",
      "/api/optimizations",
      "/api/verifications",
      "/api/green-score",
      "/api/github",
    ],
  });
});

export default router;
