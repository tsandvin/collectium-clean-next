/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database connection
 *
 * Definering / formål:
 * Kobler Collectium Next.js til Neon Postgres under MariaDB -> Neon migreringskontroll.
 *
 * Bruksområde:
 * Brukes av admin/system/mariadb-neon og API-ruter for Neon health, schema inventory,
 * table mapping og migreringskontroll.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 * - admin.system.mariadb_neon.run_check
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-health
 * - GET /api/system/db-overview
 *
 * Berørte tabeller / views:
 * - Neon public schema
 * - ct_migration_control_runs
 * - ct_database_truth_status
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system.database
 * log_action: neon.health
 *
 * Versjon:
 * CT-FILE-NEON-0001 / CHANGE-2026-06-09-0001
 */

import { Pool } from "pg";

const connectionString =
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Missing Neon/Postgres connection string. Set NEON_DATABASE_URL, POSTGRES_URL or DATABASE_URL in Vercel Environment Variables.",
  );
}

export const neonPool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function neonQuery<T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await neonPool.query(sql, params);
  return result.rows as T[];
}
