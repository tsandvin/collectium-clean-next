/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Tidslinjeperiode API
 *
 * Definering / formål:
 * Read-only Next.js route handler som henter periode-/tidslinjedata fra Neon/Postgres.
 *
 * Bruksområde:
 * Brukes av /test/Periodetidslinje for å vise sanne perioder, nivåer og relasjonskoblinger.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_period_filter_registry_active
 * - ct_catalog_period_relations
 * - ct_v_catalog_period_relations
 * - ct_sn_period_relation
 * - ct_sn_period_relation_links
 * - ct_sn_period_type_registry
 * - ct_v_period_filter_find_relations
 *
 * Dataretning:
 * Neon/Postgres -> Next.js route handler -> JSON -> React UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: read
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-API-0001 / CHANGE-2026-06-19-0001
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbRow = {
  period_slug: string | null;
  display_name_no: string | null;
  period_type_key: string | null;
  period_type_label_no: string | null;
  period_level: number | null;
  parent_period_slug: string | null;
  start_year: number | null;
  end_year: number | null;
  summary_short_no: string | null;
  collectium_relevance_no: string | null;
  relation_href: string | null;
  object_count: number | null;
  relation_count: number | null;
  timeline_group: string | null;
};

type QueryResult = { rows: DbRow[]; driver: string };

type PostgresJsSql = {
  unsafe: (query: string) => Promise<DbRow[]>;
  end: () => Promise<void>;
};

const TIMELINE_QUERY = `
  with period_rows as (
    select
      p.period_slug::text as period_slug,
      p.display_name_no::text as display_name_no,
      p.period_type_key::text as period_type_key,
      p.period_type_label_no::text as period_type_label_no,
      p.period_level::int as period_level,
      p.parent_period_slug::text as parent_period_slug,
      p.start_year::int as start_year,
      p.end_year::int as end_year,
      p.summary_short_no::text as summary_short_no,
      p.collectium_relevance_no::text as collectium_relevance_no,
      p.relation_href::text as relation_href,
      null::int as object_count,
      null::int as relation_count,
      coalesce(p.period_type_label_no::text, p.period_type_key::text, 'Ukjent') as timeline_group
    from public.ct_v_period_filter_options p
  )
  select *
  from period_rows
  order by
    case when start_year is null then 1 else 0 end,
    start_year asc,
    end_year asc,
    display_name_no asc
  limit 500
`;

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  );
}

async function dynamicImport(moduleName: string): Promise<unknown> {
  const importer = new Function("moduleName", "return import(moduleName)") as (value: string) => Promise<unknown>;
  return importer(moduleName);
}

async function queryWithPostgresJs(url: string): Promise<QueryResult> {
  const mod = (await dynamicImport("postgres")) as { default?: (url: string, options?: Record<string, unknown>) => PostgresJsSql };
  const postgres = mod.default;

  if (!postgres) {
    throw new Error("postgres_default_export_missing");
  }

  const sql = postgres(url, { ssl: "require" });

  try {
    const rows = await sql.unsafe(TIMELINE_QUERY);
    return { rows, driver: "postgres" };
  } finally {
    await sql.end();
  }
}

async function queryWithPg(url: string): Promise<QueryResult> {
  const mod = (await dynamicImport("pg")) as {
    Pool?: new (config: Record<string, unknown>) => { query: (query: string) => Promise<{ rows: DbRow[] }>; end: () => Promise<void> };
  };

  if (!mod.Pool) {
    throw new Error("pg_pool_export_missing");
  }

  const pool = new mod.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    const result = await pool.query(TIMELINE_QUERY);
    return { rows: result.rows, driver: "pg" };
  } finally {
    await pool.end();
  }
}

async function readTimelineRows(): Promise<QueryResult> {
  const url = connectionString();

  if (!url) {
    throw new Error("missing_database_url");
  }

  const errors: string[] = [];

  try {
    return await queryWithPostgresJs(url);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "postgres_failed");
  }

  try {
    return await queryWithPg(url);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "pg_failed");
  }

  throw new Error(`no_supported_db_driver:${errors.join("|")}`);
}

function buildSummary(rows: DbRow[]) {
  const relationTypes = Array.from(
    new Set(rows.map((row) => row.period_type_key).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b, "nb"));

  return {
    summary: {
      totalPeriods: rows.length,
      level1Count: rows.filter((row) => row.period_level === 1).length,
      level2Count: rows.filter((row) => row.period_level === 2).length,
      level3Count: rows.filter((row) => row.period_level === 3).length,
      relationTypeCount: relationTypes.length,
      periodsWithRelationHref: rows.filter((row) => Boolean(row.relation_href)).length,
      periodsWithObjectRelation: null,
    },
    relationTypes,
  };
}

export async function GET() {
  try {
    const result = await readTimelineRows();
    const { summary, relationTypes } = buildSummary(result.rows);

    return NextResponse.json({
      ok: true,
      source: `neon:${result.driver}`,
      title: "Tidslinjeperiode",
      rows: result.rows,
      summary,
      relationTypes,
      warnings: ["object_count_not_available", "relation_count_not_available"],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "neon",
        title: "Tidslinjeperiode",
        rows: [],
        summary: {
          totalPeriods: 0,
          level1Count: 0,
          level2Count: 0,
          level3Count: 0,
          relationTypeCount: 0,
          periodsWithRelationHref: 0,
          periodsWithObjectRelation: null,
        },
        relationTypes: [],
        warnings: [],
        error: error instanceof Error ? error.message : "unknown_period_timeline_error",
      },
      { status: 500 },
    );
  }
}
