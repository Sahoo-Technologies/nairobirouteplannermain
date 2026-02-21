// Enable Row Level Security (RLS) on all public tables in Supabase.
// Our app connects via the connection pooler as the `postgres` role (bypasses RLS),
// so we add a default-deny policy for the PostgREST anon/authenticated roles.
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const PUBLIC_TABLES = [
  "analytics_reports",
  "backups",
  "conversations",
  "demand_forecasts",
  "dispatches",
  "driver_insights",
  "drivers",
  "inventory",
  "messages",
  "order_items",
  "orders",
  "parcels",
  "password_reset_tokens",
  "payments",
  "procurements",
  "products",
  "route_optimizations",
  "routes",
  "salespersons",
  "sessions",
  "shops",
  "stock_movements",
  "suppliers",
  "targets",
  "users",
];

try {
  for (const table of PUBLIC_TABLES) {
    // 1. Enable RLS
    await pool.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY`);

    // 2. Force RLS even for table owners (except superuser/postgres role)
    await pool.query(`ALTER TABLE public."${table}" FORCE ROW LEVEL SECURITY`);

    // 3. Drop any existing permissive policies that might exist
    //    (Supabase sometimes creates default ones)
    const existing = await pool.query(
      `SELECT policyname FROM pg_policies WHERE tablename = $1 AND schemaname = 'public'`,
      [table]
    );
    for (const row of existing.rows) {
      await pool.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public."${table}"`);
    }

    // 4. Create a deny-all policy for anon and authenticated roles
    //    (our Express app uses the postgres role which bypasses RLS)
    await pool.query(`
      CREATE POLICY "deny_all_anon" ON public."${table}"
        AS RESTRICTIVE
        FOR ALL
        TO anon
        USING (false)
    `);

    await pool.query(`
      CREATE POLICY "deny_all_authenticated" ON public."${table}"
        AS RESTRICTIVE
        FOR ALL
        TO authenticated
        USING (false)
    `);

    console.log(`  ✓ RLS enabled on public.${table}`);
  }

  console.log(`\n✓ RLS enabled and locked down on all ${PUBLIC_TABLES.length} public tables`);
} catch (err) {
  console.error("RLS setup error:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
