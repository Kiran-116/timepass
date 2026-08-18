import { Request, Response } from "express";
import { query } from "../db";
import { CreateProjectDTO, Project, UpdateProjectDTO } from "../types";

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      repositoryUrl,
      repository_url,
      language = "python",
      userId,
      user_id,
    }: CreateProjectDTO = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "Project name is required and must be a non-empty string" });
      return;
    }

    const repoUrl = repositoryUrl || repository_url || null;
    const uid = userId || user_id || null;

    const result = await query<Project>(
      `INSERT INTO projects (name, repository_url, language, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), repoUrl, language.trim().toLowerCase(), uid]
    );

    const createdProject = result.rows[0];
    res.status(201).json(createdProject);
  } catch (error) {
    console.error("[Create Project Error]:", error);
    res.status(500).json({ error: "Failed to create project", details: (error as Error).message });
  }
};

export const getProjects = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<Project>("SELECT * FROM projects ORDER BY created_at DESC");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("[Get Projects Error]:", error);
    res.status(500).json({ error: "Failed to fetch projects", details: (error as Error).message });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await query<Project>("SELECT * FROM projects WHERE id = $1", [projectId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: `Project with ID ${projectId} not found` });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("[Get Project By ID Error]:", error);
    res.status(500).json({ error: "Failed to fetch project", details: (error as Error).message });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { name, repositoryUrl, repository_url, language }: UpdateProjectDTO = req.body;

    const existing = await query<Project>("SELECT * FROM projects WHERE id = $1", [projectId]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: `Project with ID ${projectId} not found` });
      return;
    }

    const current = existing.rows[0];
    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedRepoUrl =
      repositoryUrl !== undefined
        ? repositoryUrl
        : repository_url !== undefined
          ? repository_url
          : current.repository_url;
    const updatedLanguage =
      language !== undefined ? language.trim().toLowerCase() : current.language;

    const result = await query<Project>(
      `UPDATE projects
       SET name = $1, repository_url = $2, language = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [updatedName, updatedRepoUrl, updatedLanguage, projectId]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("[Update Project Error]:", error);
    res.status(500).json({ error: "Failed to update project", details: (error as Error).message });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    const result = await query<Project>("DELETE FROM projects WHERE id = $1 RETURNING id, name", [
      projectId,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: `Project with ID ${projectId} not found` });
      return;
    }

    res.status(200).json({
      message: "Project deleted successfully",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("[Delete Project Error]:", error);
    res.status(500).json({ error: "Failed to delete project", details: (error as Error).message });
  }
};
