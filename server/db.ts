import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { configManager } from "./config";

const rawUrl = process.env.DATABASE_URL ?? "";
const isSupabase = rawUrl.includes("supabase");

// Strip sslmode from the connection string so the pg driver doesn't
// override our programmatic SSL config (newer pg treats sslmode=require
// as verify-full, causing SELF_SIGNED_CERT_IN_CHAIN on Supabase pooler).
const connectionString = rawUrl.replace(/[?&]sslmode=[^&]*/g, (m) =>
  m.startsWith("?") ? "?" : ""
).replace(/\?&/, "?").replace(/\?$/, "");

// Get database configuration from config manager
const dbConfig = configManager.database;

export const pool = new pg.Pool({
  connectionString,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  // Production pool hardening with configurable values
  max: dbConfig.maxConnections,
  idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
  allowExitOnIdle: dbConfig.allowExitOnIdle,
  // Additional pool configuration for better scalability
  maxUses: 7500, // Close connections after 7500 uses to prevent memory leaks
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // 10 seconds initial delay
});

// Emit pool errors to prevent unhandled rejection crashes
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

// Pool monitoring
pool.on("connect", (client) => {
  console.debug("New database client connected");
});

pool.on("remove", (client) => {
  console.debug("Database client removed");
});

pool.on("acquire", (client) => {
  console.debug("Database client acquired from pool");
});

pool.on("release", (client) => {
  console.debug("Database client released to pool");
});

export const db = drizzle(pool, { schema });
