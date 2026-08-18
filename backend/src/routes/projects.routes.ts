import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller";

const router = Router();

// Project CRUD Endpoints
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:projectId", getProjectById);
router.put("/:projectId", updateProject);
router.patch("/:projectId", updateProject);
router.delete("/:projectId", deleteProject);

export default router;
