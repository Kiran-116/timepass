import fs from "fs";
import path from "path";
import { pool } from "./index";

export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log("[Migration] Checking database migration status...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows: executedMigrations } = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations"
    );
    const executedSet = new Set(executedMigrations.map((r) => r.name));

    // Resolve migrations folder
    const candidateDirs = [
      path.join(__dirname, "migrations"),
      path.join(__dirname, "../../src/db/migrations"),
      path.join(process.cwd(), "src/db/migrations"),
      path.join(process.cwd(), "backend/src/db/migrations"),
    ];

    const migrationsDir = candidateDirs.find((dir) => fs.existsSync(dir));
    if (!migrationsDir) {
      console.warn(`[Migration] Migrations directory not found in candidates: ${candidateDirs.join(", ")}`);
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      if (!executedSet.has(file)) {
        console.log(`[Migration] Applying migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sqlContent = fs.readFileSync(filePath, "utf-8");

        await client.query("BEGIN");
        try {
          await client.query(sqlContent);
          await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
          await client.query("COMMIT");
          console.log(`[Migration] Successfully applied: ${file}`);
        } catch (err) {
          await client.query("ROLLBACK");
          console.error(`[Migration Error] Failed to apply ${file}:`, (err as Error).message);
          throw err;
        }
      } else {
        console.log(`[Migration] Already applied: ${file}`);
      }
    }

    console.log("[Migration] Database is up to date.");
  } finally {
    client.release();
  }
};

// If run directly from CLI
if (require.main === module || process.argv[1]?.includes("migrate")) {
  runMigrations()
    .then(() => {
      console.log("[Migration] Migration process finished successfully.");
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Migration] Migration process failed:", err);
      pool.end();
      process.exit(1);
    });
}
