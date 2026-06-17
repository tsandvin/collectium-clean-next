/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon database connection
 *
 * Definering / formål:
 * Felles Neon Postgres-kobling for Collectium Next.js/Vercel.
 * Filen eksporterer sql, neonQuery, neonOne og neonPool.
 *
 * Bruksområde:
 * Brukes av API-ruter og server-side datahenting som skal lese Collectium-data fra Neon.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[relationKey]
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.search
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - admin.system.mariadb_neon.view
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/system/neon-health
 * - Auth/session routes
 *
 * Berørte tabeller / views:
 * - ct_no_banknote_catalog
 * - ct_no_coin_catalog
 * - ct_v_object_presentation_resolved
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: database
 * log_action: neon_query
 *
 * Versjon:
 * CT-FILE-NEON-0004 / CHANGE-2026-06-17-0004
 *
 * Endringsnotat:
 * CT-FILE-NEON-0004 bruker sql.query(...) for vanlige parameter-spørringer.
 * Neon serverless-driveren tillater ikke lenger sql("SELECT $1", [value]).
 */

import { neon } from "@neondatabase/serverless";

type EnvCandidate = {
  name: string;
  value: string | undefined;
};

function isValidDatabaseUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
  } catch {
    return false;
  }
}

const candidates: EnvCandidate[] = [
  { name: "NEON_DATABASE_URL", value: process.env.NEON_DATABASE_URL },
  { name: "DATABASE_URL", value: process.env.DATABASE_URL },
  { name: "neon_DATABASE_URL", value: process.env.neon_DATABASE_URL },
  { name: "neon_POSTGRES_URL", value: process.env.neon_POSTGRES_URL },
  { name: "neon_POSTGRES_PRISMA_URL", value: process.env.neon_POSTGRES_PRISMA_URL },
];

const selected = candidates.find((candidate) =>
  isValidDatabaseUrl(candidate.value)
);

if (!selected?.value) {
  const availableNames = candidates
    .filter((candidate) => Boolean(candidate.value))
    .map((candidate) => candidate.name)
    .join(", ");

  throw new Error(
    `Missing valid Neon/Postgres database URL. Checked NEON_DATABASE_URL, DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL and neon_POSTGRES_PRISMA_URL. Available env names: ${availableNames || "none"}.`
  );
}

export const databaseUrlSource = selected.name;
export const sql = neon(selected.value);

export type NeonQueryValue = unknown;
type NeonQueryParams = readonly unknown[];

type NeonSqlQuery = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    queryText: string,
    params?: NeonQueryParams
  ) => Promise<T[]>;
};

function getQueryRunner(): NeonSqlQuery {
  return sql as unknown as NeonSqlQuery;
}

export async function neonQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  queryText: string,
  params: NeonQueryParams = []
): Promise<T[]> {
  const runner = getQueryRunner();
  return runner.query<T>(queryText, params);
}

export async function neonOne<T extends Record<string, unknown> = Record<string, unknown>>(
  queryText: string,
  params: NeonQueryParams = []
): Promise<T | null> {
  const rows = await neonQuery<T>(queryText, params);
  return rows[0] ?? null;
}

export const neonPool = {
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    queryText: string,
    params: NeonQueryParams = []
  ): Promise<{ rows: T[] }> {
    const rows = await neonQuery<T>(queryText, params);
    return { rows };
  },

  async end(): Promise<void> {
    return;
  },
};