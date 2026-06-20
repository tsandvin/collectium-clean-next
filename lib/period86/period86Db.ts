/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periode 8.6 Neon Database Helper
 *
 * Definering / formål:
 * Felles, liten Neon/Postgres-query helper for Periode 8.6 API-ruter.
 *
 * Bruksområde:
 * Brukes av /api/period86/* route handlers for read-only spørringer mot Neon.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 * - /katalog
 * - /relasjon/[type]/[slug]
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.master.view
 * - period86.row1.view
 * - period86.row2.view
 * - period86.dynamic_field.view
 * - period86.catalog_search.view
 *
 * Berørte API-ruter:
 * - GET /api/period86/master
 * - GET /api/period86/row1
 * - GET /api/period86/row1/nodes
 * - GET /api/period86/row2
 * - GET /api/period86/row2/nodes
 * - GET /api/period86/dynamic-field
 * - GET /api/period86/catalog-search
 * - GET /api/period86/filter-options
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_period86_dynamic_field_resolved
 * - ct_sn_period_relation_links
 * - ct_v_catalog_period_relations
 * - ct_v_ruler_identity_resolved_v2
 * - ct_v_ruler_identity_alias_resolved
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js route handlers -> React UI
 *
 * Logging:
 * log_category: period86
 * log_action: read
 *
 * Versjon:
 * CT-PERIOD86-API-0001 / CHANGE-2026-06-20-0001
 *
 * Endringsregel:
 * Dette er ny modul. Overskriver ikke eksisterende hovedlayout eller katalogsider.
 */

import { Pool, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or POSTGRES_URL for Periode 8.6 API.");
}

const globalForPeriod86 = globalThis as unknown as {
  period86Pool?: Pool;
};

export const period86Pool =
  globalForPeriod86.period86Pool ??
  new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPeriod86.period86Pool = period86Pool;
}

export async function period86Query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await period86Pool.query<T>(sql, params);
  return result.rows;
}

export function toPositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function jsonOk<T>(payload: T, init?: ResponseInit): Response {
  return Response.json(payload, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

export function jsonError(message: string, status = 500, detail?: unknown): Response {
  return Response.json(
    {
      ok: false,
      error: message,
      detail: process.env.NODE_ENV === "production" ? undefined : detail,
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
