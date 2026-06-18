/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter options API UI/UX 8.6
 *
 * Definering / formål:
 * Leser periodefilter-noder fra Neon og returnerer datagrunnlag for testside /test/periodefilter.
 * API-et støtter Rad 1 Nasjonal hovedperiode, Rad 2 Hovedperiode og Rad 3 Underperiode / relasjon.
 *
 * Bruksområde:
 * Brukes av components/period-filter-test/CollectiumPeriodFilterTest.tsx.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_options_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0001 / CHANGE-2026-06-18-0001
 *
 * Endringsregel:
 * Denne filen erstatter kun periodefilter-testens options route. Den skriver ikke data.
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
  object_count?: number;
};

type RelationSummaryRow = {
  relation_type: string;
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
      levels: { row1: [], row2: [], row3: [] },
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
    } catch {
      relationSummary = [];
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
      model: "ui86_period_filter_three_rows",
      rows: normalizedRows,
      levels: {
        row1: normalizedRows.filter((row) => row.period_level === 1),
        row2: normalizedRows.filter((row) => row.period_level === 2),
        row3: normalizedRows.filter((row) => row.period_level === 3),
      },
      relationSummary,
      rules: {
        row1: "Nasjonal hovedperiode",
        row2: "Hovedperiode",
        row3: "Underperiode / relasjon",
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
