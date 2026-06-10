/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database helper
 *
 * Definering / formÃ¥l:
 * Felles Postgres/Neon databasekobling for Next.js API-ruter.
 *
 * BruksomrÃ¥de:
 * Brukes av auth API og senere Neon-baserte Collectium-ruter.
 *
 * BerÃ¸rte sider / routes:
 * - /api/auth/login
 * - /api/auth/register
 * - /api/auth/logout
 * - /api/auth/session
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.login
 * - auth.register
 * - auth.logout
 * - auth.session.view
 *
 * BerÃ¸rte API-ruter:
 * - /api/auth/*
 *
 * BerÃ¸rte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 * - ct_login_attempts
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: db.query
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0001 / CHANGE-2026-06-10-0002
 */

import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var collectiumNeonPool: Pool | undefined;
}

function getConnectionString(): string {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!value) {
    throw new Error("Missing Neon/Postgres connection string. Set DATABASE_URL or POSTGRES_URL in Vercel Environment Variables.");
  }

  return value;
}

export function getNeonPool(): Pool {
  if (!global.collectiumNeonPool) {
    global.collectiumNeonPool = new Pool({
      connectionString: getConnectionString(),
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
  }

  return global.collectiumNeonPool;
}

export async function neonQuery<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getNeonPool().query<T>(sql, params);
  return result.rows;
}

export async function neonOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await neonQuery<T>(sql, params);
  return rows[0] ?? null;
}
