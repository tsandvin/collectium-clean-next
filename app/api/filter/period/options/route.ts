/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter options API UI/UX 8.6 - relation anchor model
 *
 * Definering / formal:
 * Leser periodenoder og relasjonsnoder fra Neon og returnerer datagrunnlag for /test/periodefilter.
 * API-et stotter at Rad 1 er anker: periode, konge/regent, person, ar, kilde, utgave, valor eller variant.
 *
 * Bruksomrade:
 * Brukes av components/period-filter-test/CollectiumPeriodFilterTest.tsx.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 * - object.relations.view
 *
 * Berorte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berorte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_options_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0004 / CHANGE-2026-06-18-0002
 *
 * Endringsregel:
 * Denne filen skriver ikke data. Den utvider test-API-et med relasjonsanker.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

type PeriodOptionRow = {
  period_slug: string;
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
};

type RelationSummaryRow = {
  relation_type: string;
  relation_count: number;
};

type RelationNodeRow = {
  relation_type: string;
  relation_label_no: string | null;
  relation_slug: string;
  relation_href: string | null;
  relation_count: number;
};

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return 0;
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      source: "neon",
      message,
      rows: [],
      relationNodes: [],
      relationSummary: [],
      updatedAt: new Date().toISOString(),
    },
    { status },
  );
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  if (!databaseUrl) {
    return errorResponse(
      "Mangler DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL. Periodefilter-testen kan ikke lese Neon.",
      500,
    );
  }

  try {
    const sql = neon(databaseUrl);

    const rows = (await sql`
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
        relation_href
      from public.ct_v_period_filter_options
      where period_slug is not null
      order by
        coalesce(period_level, 99),
        coalesce(start_year, 999999),
        display_name_no nulls last,
        period_slug
    `) as PeriodOptionRow[];

    let relationSummary: RelationSummaryRow[] = [];
    let relationNodes: RelationNodeRow[] = [];

    try {
      const relationRows = (await sql`
        select
          relation_type,
          count(*)::int as relation_count
        from public.ct_v_object_relations_resolved
        where source_key = 'norske_sedler'
          and object_group = 'banknote'
        group by relation_type
        order by relation_type
      `) as RelationSummaryRow[];

      relationSummary = relationRows.map((row) => ({
        relation_type: row.relation_type,
        relation_count: asNumber(row.relation_count),
      }));

      const nodeRows = (await sql`
        select
          relation_type,
          max(relation_label_no) as relation_label_no,
          relation_slug,
          max(relation_href) as relation_href,
          count(*)::int as relation_count
        from public.ct_v_object_relations_resolved
        where source_key = 'norske_sedler'
          and object_group = 'banknote'
          and relation_type in ('ar', 'publiseringsar', 'regent', 'person', 'kilde', 'utgave', 'valor', 'variant')
          and relation_slug is not null
        group by relation_type, relation_slug
        order by
          case relation_type
            when 'regent' then 1
            when 'person' then 2
            when 'ar' then 3
            when 'publiseringsar' then 4
            when 'kilde' then 5
            when 'utgave' then 6
            when 'valor' then 7
            when 'variant' then 8
            else 99
          end,
          relation_count desc,
          relation_slug
        limit 300
      `) as RelationNodeRow[];

      relationNodes = nodeRows.map((row) => ({
        relation_type: row.relation_type,
        relation_label_no: row.relation_label_no,
        relation_slug: row.relation_slug,
        relation_href: row.relation_href,
        relation_count: asNumber(row.relation_count),
      }));
    } catch {
      relationSummary = [];
      relationNodes = [];
    }

    const normalizedRows = rows.map((row) => ({
      ...row,
      period_level: row.period_level === null ? null : asNumber(row.period_level),
      start_year: row.start_year === null ? null : asNumber(row.start_year),
      end_year: row.end_year === null ? null : asNumber(row.end_year),
    }));

    return NextResponse.json({
      ok: true,
      source: "neon",
      model: "ui86_period_filter_anchor_rows",
      rows: normalizedRows,
      relationNodes,
      relationSummary,
      rules: {
        row1: "Anker: periode, konge/regent, person, ar, kilde, utgave, valor eller variant",
        row2: "Kontekst innenfor valgt anker",
        row3: "Bare konkrete undernoder dersom API har reelle valg",
        noDuplicateSelection: true,
        selectedNodeHasBio: true,
        dynamicSegments: ["samler", "historie", "finans"],
        frontendTruth: "API/Neon determines values; frontend only displays and filters returned rows.",
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil ved lesing av periodefilter fra Neon.";
    return errorResponse(message, 500);
  }
}
