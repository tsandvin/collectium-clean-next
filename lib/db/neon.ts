/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database connection
 *
 * Definering / formål:
 * Kobler Collectium Next.js til Neon Postgres under MariaDB -> Neon migreringskontroll.
 * Koblingen er lazy slik at build ikke feiler hvis lokal Neon-env mangler.
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
 * - GET /api/system/table-mapping
 * - GET /api/system/field-mapping
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
 * log_action: neon.query
 *
 * Versjon:
 * CT-FILE-NEON-0001 / CHANGE-2026-06-09-0004
 */

import { Pool } from "pg";

let neonPool: Pool | null = null;

function getConnectionString(): string {
  const connectionString =
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.neon_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing Neon/Postgres connection string. Set NEON_DATABASE_URL, POSTGRES_URL, DATABASE_URL or neon_DATABASE_URL in Vercel Environment Variables.",
    );
  }

  return connectionString;
}

function getNeonPool(): Pool {
  if (neonPool) {
    return neonPool;
  }

  neonPool = new Pool({
    connectionString: getConnectionString(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  return neonPool;
}

export async function neonQuery<T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getNeonPool().query(sql, params);
  return result.rows as T[];
}
