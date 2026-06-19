/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period timeline test API
 *
 * Definering / formål:
 * Read-only Next.js route handler for Tidslinjeperiode. Returnerer perioder,
 * filtre og katalogtreff basert på Neon/Postgres-data.
 *
 * Bruksområde:
 * Brukes av /test/Periodetidslinje og /test/period-timeline.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 * - /test/period-timeline
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_catalog_period_relations når tilgjengelig
 * - ct_v_object_presentation_resolved når tilgjengelig
 *
 * Dataretning:
 * Neon/Postgres -> route handler -> JSON -> React UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: api_read
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-V3
 */

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

type PeriodRow = {
  period_slug: string;
  display_name_no: string;
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

type CatalogRow = {
  object_id: number | string | null;
  source_key: string | null;
  object_group: string | null;
  title_no: string | null;
  source_catalog_number: string | null;
  denomination_raw_no: string | null;
  object_year_label: string | null;
  publication_year_label: string | null;
  denomination_issue_raw_no: string | null;
  variant_type_raw_no: string | null;
};

let pool: Pool | null = null;

function getConnectionString(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    null
  );
}

function getPool(): Pool {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL mangler.");
  }
  if (!pool) {
    pool = new Pool({ connectionString, ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false } });
  }
  return pool;
}

function asNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const yearFrom = asNumber(url.searchParams.get("year_from"), 1814);
  const yearTo = asNumber(url.searchParams.get("year_to"), 2024);
  const periodSlug = url.searchParams.get("period_slug");
  const objectType = url.searchParams.get("object_type") || "Verdibrev";

  try {
    const db = getPool();

    const periodsResult = await db.query<PeriodRow>(
      `
        select
          period_slug,
          display_name_no,
          period_type_key,
          period_type_label_no,
          period_level,
          parent_period_slug,
          start_year,
          end_year,
          summary_short_no,
          collectium_relevance_no,
          relation_href,
          null::integer as object_count,
          null::integer as relation_count,
          period_type_label_no as timeline_group
        from ct_v_period_filter_options
        order by coalesce(start_year, 999999), coalesce(end_year, 999999), display_name_no
      `,
    );

    const rows = periodsResult.rows;
    const relationTypes = Array.from(new Set(rows.map((row) => row.period_type_key).filter(Boolean))) as string[];

    let catalogRows: CatalogRow[] = [];
    const warnings: string[] = [];

    try {
      const selectedSlug = periodSlug || rows.find((row) => row.period_slug === "svensk-union")?.period_slug || null;
      const sourceObjectGroup = objectType === "banknote" ? "banknote" : objectType === "coin" ? "coin" : null;

      const catalogResult = await db.query<CatalogRow>(
        `
          select distinct
            o.object_id,
            o.source_key,
            o.object_group,
            o.title_no,
            o.source_catalog_number,
            o.denomination_raw_no,
            o.object_year_label,
            o.publication_year_label,
            o.denomination_issue_raw_no,
            o.variant_type_raw_no
          from ct_v_object_presentation_resolved o
          where (
            ($1::text is null)
            or exists (
              select 1
              from ct_v_catalog_period_relations cpr
              where cpr.source_key = o.source_key
                and cpr.object_group = o.object_group
                and cpr.object_id = o.object_id
                and cpr.period_slug = $1
            )
          )
          and ($2::text is null or o.object_group = $2)
          and (
            nullif(regexp_replace(coalesce(o.object_year_label, o.publication_year_label, ''), '[^0-9-]', '', 'g'), '')::integer
              between $3::integer and $4::integer
            or o.object_year_label is null
          )
          order by o.source_key, o.object_group, o.object_id
          limit 12
        `,
        [selectedSlug, sourceObjectGroup, yearFrom, yearTo],
      );
      catalogRows = catalogResult.rows;
    } catch (catalogError) {
      warnings.push("catalog_period_relation_lookup_not_available");
      const fallbackResult = await db.query<CatalogRow>(
        `
          select
            object_id,
            source_key,
            object_group,
            title_no,
            source_catalog_number,
            denomination_raw_no,
            object_year_label,
            publication_year_label,
            denomination_issue_raw_no,
            variant_type_raw_no
          from ct_v_object_presentation_resolved
          where (
            nullif(regexp_replace(coalesce(object_year_label, publication_year_label, ''), '[^0-9-]', '', 'g'), '')::integer
              between $1::integer and $2::integer
            or object_year_label is null
          )
          order by source_key, object_group, object_id
          limit 12
        `,
        [yearFrom, yearTo],
      );
      catalogRows = fallbackResult.rows;
    }

    warnings.push("object_count_not_available", "relation_count_not_available");

    return NextResponse.json({
      ok: true,
      source: "neon:pg",
      title: "Tidslinjeperiode",
      rows,
      summary: {
        totalPeriods: rows.length,
        level1Count: rows.filter((row) => row.period_level === 1).length,
        level2Count: rows.filter((row) => row.period_level === 2).length,
        level3Count: rows.filter((row) => row.period_level === 3).length,
        relationTypeCount: relationTypes.length,
        periodsWithRelationHref: rows.filter((row) => row.relation_href).length,
        periodWindow: `${yearFrom}-${yearTo}`,
        selectedPeriod: periodSlug,
        catalogHits: catalogRows.length,
      },
      relationTypes,
      catalogRows,
      warnings: Array.from(new Set(warnings)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "neon:pg",
        title: "Tidslinjeperiode",
        rows: [],
        summary: {},
        relationTypes: [],
        catalogRows: [],
        warnings: [],
        error: error instanceof Error ? error.message : "Ukjent API-feil.",
      },
      { status: 500 },
    );
  }
}
