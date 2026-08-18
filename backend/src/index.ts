import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { checkDbHealth, pool } from "./db";
import { runMigrations } from "./db/migrate";
import apiRoutes from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET /health - Core health endpoint required for Phase 2
app.get(["/health", "/api/health"], async (_req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();
  if (dbHealth.connected) {
    res.status(200).json({
      status: "ok",
    });
  } else {
    res.status(200).json({
      status: "ok",
      warning: "database not ready",
      dbError: dbHealth.message,
    });
  }
});

// Root metadata route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "GreenOps AI API",
    tagline: "AI proposes. Measurement verifies.",
    version: "0.2.0",
    status: "online",
    phase: "Phase 2 - Database + Backend Foundation",
  });
});

// Mount modular API groups under /api
app.use("/api", apiRoutes);

// Centralized error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled Error]:", err.stack || err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// 404 Fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Server Initialization
const server = app.listen(PORT, async () => {
  console.log(`[GreenOps Backend] Server running on http://localhost:${PORT}`);

  // Attempt auto-migration on server start if database is reachable
  try {
    const health = await checkDbHealth();
    if (health.connected) {
      await runMigrations();
    } else {
      console.log(
        '[GreenOps Backend] Database not connected yet. Run "npm run db:migrate" when database is up.'
      );
    }
  } catch (error) {
    console.error("[GreenOps Backend] Initial migration check failed:", (error as Error).message);
  }
});

process.on("SIGTERM", () => {
  console.log("[GreenOps Backend] SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

export default app;
