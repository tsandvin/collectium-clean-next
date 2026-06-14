/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database helper
 *
 * Definering / formål:
 * Felles Neon Postgres helper for Next.js route handlers.
 *
 * Bruksområde:
 * Brukes av API-ruter som trenger read/write mot Neon.
 *
 * Berørte sider / routes:
 * - /api/system/neon-health
 * - /api/system/*
 * - /api/relation/*
 * - /api/filter/*
 *
 * Berørte DB-brytere / feature_keys:
 * - system.neon.health
 * - system.db.control
 * - relation.registry.view
 * - filter.master.view
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-health
 * - GET /api/system/table-mapping
 * - GET /api/system/field-mapping
 * - GET /api/relation/types
 * - GET /api/relation/paths
 *
 * Berørte tabeller / views:
 * - Neon public schema
 * - Collectium ct_* tabeller/views etter rute
 *
 * Dataretning:
 * Neon Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system
 * log_action: neon_query
 *
 * Endringsregel:
 * Dette er en felles DB-helper. Endres kontrollert.
 */

import { neon } from "@neondatabase/serverless";

type QueryValue = string | number | boolean | null | Date | Buffer | undefined;

let sqlClient: ReturnType<typeof neon> | null = null;

function getDatabaseUrl(): string {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing Neon database URL. Set DATABASE_URL, NEON_DATABASE_URL or POSTGRES_URL in Vercel Environment Variables."
    );
  }

  return databaseUrl;
}

export function neonSql() {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }

  return sqlClient;
}

export async function neonQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const sql = neonSql();

  if (params.length > 0) {
    return (await sql.query(text, params)) as T[];
  }

  return (await sql.query(text)) as T[];
}

export async function neonOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await neonQuery<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function neonHealth() {
  const row = await neonOne<{
    ok: number;
    database_name: string;
    current_user: string;
    server_version: string;
  }>(
    "select 1 as ok, current_database() as database_name, current_user as current_user, version() as server_version"
  );

  return {
    ok: Boolean(row?.ok),
    database_name: row?.database_name ?? null,
    current_user: row?.current_user ?? null,
    server_version: row?.server_version ?? null,
  };
}

