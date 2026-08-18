import { Pool, QueryResult, QueryResultRow } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "greenops_db"}`;

export const pool = new Pool({
  connectionString,
});

pool.on("error", (err) => {
  console.error("[Database Pool Error]:", err.message);
});

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development" && duration > 200) {
    console.log(`[Database Query] executed in ${duration}ms: ${text.substring(0, 80)}`);
  }
  return res;
};

export const checkDbHealth = async (): Promise<{ connected: boolean; message?: string }> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      message: (error as Error).message,
    };
  }
};
