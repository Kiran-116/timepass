import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/greenops_db";

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "GreenOps AI API",
    tagline: "AI proposes. Measurement verifies.",
    version: "0.1.0",
    status: "online",
    phase: "Phase 1 - Foundation Setup",
  });
});

app.get(["/health", "/api/health"], async (_req: Request, res: Response) => {
  let dbStatus = "disconnected";
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbStatus = "connected";
  } catch (error) {
    dbStatus = `unavailable (${(error as Error).message})`;
  }

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: "healthy",
      database: dbStatus,
    },
  });
});

const server = app.listen(PORT, () => {
  console.log(`[GreenOps Backend] Server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[GreenOps Backend] SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

export default app;
