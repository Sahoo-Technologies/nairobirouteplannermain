import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const rawUrl = process.env.DATABASE_URL ?? "";
const isSupabase = rawUrl.includes("supabase");

// Strip sslmode from the connection string so the pg driver doesn't
// override our programmatic SSL config (newer pg treats sslmode=require
// as verify-full, causing SELF_SIGNED_CERT_IN_CHAIN on Supabase pooler).
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, (m) =>
  m.startsWith("?") ? "?" : ""
).replace(/\?&/, "?").replace(/\?$/, "");

export const pool = new pg.Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  // Production pool hardening
  max: 10,                       // max connections (Supabase pooler default limit)
  idleTimeoutMillis: 30_000,     // close idle clients after 30s
  connectionTimeoutMillis: 10_000, // fail fast if DB unreachable
  allowExitOnIdle: true,         // let Node.js exit if pool is idle (important for serverless)
});

// Emit pool errors to prevent unhandled rejection crashes
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

export const db = drizzle(pool, { schema });
