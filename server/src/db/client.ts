import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("");
  console.error("===============================================================");
  console.error("  DATABASE_URL is not set on this environment.");
  console.error("");
  console.error("  Local: copy .env.example to .env at the repo root and fill in");
  console.error("    DATABASE_URL=postgres://postgres:postgres@localhost:5432/adhd_strength");
  console.error("");
  console.error("  Railway: open the service → Variables tab → New Variable.");
  console.error("    Name:  DATABASE_URL");
  console.error("    Value: ${{Postgres.DATABASE_URL}}   (reference variable)");
  console.error("    If no Postgres plugin exists, add one first:");
  console.error("    + New → Database → Add PostgreSQL.");
  console.error("");
  console.error("  Also required: JWT_SECRET (any 32+ char string).");
  console.error("===============================================================");
  console.error("");
  throw new Error("DATABASE_URL is not set");
}

const needsSsl = /sslmode=require/i.test(connectionString) || process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
export { schema };
