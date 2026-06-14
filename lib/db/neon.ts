/*
Collectium Neon DB client

Formål:
- Felles Neon/Postgres-kobling for Next.js API-ruter.
- Beholder kompatibilitet med eksisterende Collectium-kode.

Eksporter:
- neonPool  = direkte pg Pool
- neonQuery = returnerer rows
- neonOne   = returnerer første row eller null

Berørte DB:
- Neon/Postgres
- DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL

Viktig:
- Denne filen må ikke forenkles til kun neonPool, fordi eldre ruter bruker neonOne/neonQuery.
*/

import { Pool, type QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL");
}

declare global {
  // eslint-disable-next-line no-var
  var collectiumNeonPool: Pool | undefined;
}

export const neonPool =
  global.collectiumNeonPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global.collectiumNeonPool = neonPool;
}

export async function neonQuery<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await neonPool.query<T>(sql, params);
  return result.rows;
}

export async function neonOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await neonQuery<T>(sql, params);
  return rows[0] ?? null;
}
