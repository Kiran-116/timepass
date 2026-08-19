/**
 * GreenOps AI - Phase 11: Pipeline Job Store
 * 
 * Manages analysis job persistence, lifecycle status, and caching.
 * Synchronizes with PostgreSQL when connected, and maintains an in-memory
 * repository for instant lookups and 100% offline reliability.
 */

import { pool } from "../db/index";
import type { AnalysisJob, PipelineStage } from "./types";

export class PipelineStore {
  private jobs = new Map<string, AnalysisJob>();
  private maxJobs = 100;

  /**
   * Creates and registers a new analysis job
   */
  public createJob(initial: Partial<AnalysisJob> & { analysisId: string; originalCode: string }): AnalysisJob {
    const job: AnalysisJob = {
      projectId: initial.projectId || null,
      status: initial.status || "QUEUED",
      stage: initial.stage || "INITIALIZING",
      stageProgress: 0,
      language: initial.language || "python",
      fileName: initial.fileName || "service.py",
      createdAt: new Date().toISOString(),
      ...initial,
      analysisId: initial.analysisId,
      originalCode: initial.originalCode,
    };

    this.jobs.set(job.analysisId, job);

    // Evict oldest jobs if cache grows too large
    if (this.jobs.size > this.maxJobs) {
      const oldestKey = this.jobs.keys().next().value;
      if (oldestKey) this.jobs.delete(oldestKey);
    }

    // Persist to PostgreSQL if connected
    this.persistInitialJobToDb(job).catch(() => {});

    return job;
  }

  /**
   * Retrieves an analysis job by ID
   */
  public getJob(analysisId: string): AnalysisJob | undefined {
    return this.jobs.get(analysisId);
  }

  /**
   * Returns all recent analysis jobs
   */
  public getRecentJobs(limit = 20): AnalysisJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Updates an existing job state and stage
   */
  public updateJob(analysisId: string, updates: Partial<AnalysisJob>): AnalysisJob | undefined {
    const existing = this.jobs.get(analysisId);
    if (!existing) return undefined;

    const updated: AnalysisJob = {
      ...existing,
      ...updates,
    };

    this.jobs.set(analysisId, updated);

    if (updates.status === "COMPLETED" || updates.status === "FAILED") {
      this.persistFinalJobToDb(updated).catch(() => {});
    }

    return updated;
  }

  /**
   * Updates stage progression
   */
  public updateStage(analysisId: string, stage: PipelineStage, progress: number): void {
    const job = this.jobs.get(analysisId);
    if (job) {
      job.stage = stage;
      job.stageProgress = Math.min(100, Math.max(0, progress));
      job.status = "PROCESSING";
    }
  }

  /**
   * Helper: Async background database insertion
   */
  private async persistInitialJobToDb(job: AnalysisJob): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO analyses (id, project_id, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          job.analysisId,
          job.projectId || "00000000-0000-0000-0000-000000000000",
          "CODE",
          job.status,
          job.createdAt,
        ]
      );
    } catch {
      // Ignored if DB is offline
    }
  }

  /**
   * Helper: Async background final update in PostgreSQL
   */
  private async persistFinalJobToDb(job: AnalysisJob): Promise<void> {
    try {
      await pool.query(
        `UPDATE analyses
         SET status = $1, completed_at = $2
         WHERE id = $3`,
        [job.status, job.completedAt || new Date().toISOString(), job.analysisId]
      );
    } catch {
      // Ignored if DB is offline
    }
  }
}

export const pipelineStore = new PipelineStore();
