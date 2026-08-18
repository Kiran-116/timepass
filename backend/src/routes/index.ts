import { Request, Response, Router } from "express";
import analysesRoutes from "./analyses.routes";
import authRoutes from "./auth.routes";
import benchmarksRoutes from "./benchmarks.routes";
import githubRoutes from "./github.routes";
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
router.use("/github", githubRoutes);

// Base /api status
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    phase: "Phase 2 - Database + Backend Foundation",
    endpoints: [
      "/api/auth",
      "/api/projects",
      "/api/analyses",
      "/api/benchmarks",
      "/api/optimizations",
      "/api/verifications",
      "/api/github",
    ],
  });
});

export default router;
