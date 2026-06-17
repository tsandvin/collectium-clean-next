/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period Filter Options API
 *
 * Definering / formål:
 * Leser faktiske periodefiltervalg fra Neon view ct_v_period_filter_options.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter for tidslinjeverdier.
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.options.view
 * - filter.period.timeline.view
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/options
 *
 * Leser fra:
 * - public.ct_v_period_filter_options
 *
 * Skriver til:
 * - Ingen. Read-only.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

function asText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function firstText(row: DbRow, keys: string[]): string {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value.length > 0) {
      return value;
    }
  }

  return "";
}

function firstNumber(row: DbRow, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const text = asText(value);
    const match = text.match(/-?\d{1,4}/);

    if (match) {
      const numberValue = Number(match[0]);
      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return null;
}

function normalizeOption(row: DbRow, index: number): DbRow {
  const optionKey =
    firstText(row, [
      "period_option_key",
      "period_filter_option_key",
      "option_key",
      "period_key",
      "relation_key",
      "period_relation_key",
      "period_slug",
      "relation_slug",
      "slug",
      "id",
    ]) || `period-option-${index + 1}`;

  const label =
    firstText(row, [
      "period_option_label_no",
      "period_filter_option_label_no",
      "option_label_no",
      "period_label_no",
      "relation_label_no",
      "display_name_no",
      "label_no",
      "title_no",
      "name_no",
      "period_name_no",
    ]) || optionKey;

  const filterKey =
    firstText(row, [
      "period_filter_key",
      "filter_key",
      "period_type_key",
      "period_type",
      "relation_type",
      "option_type",
    ]) || "period.option";

  const startYear = firstNumber(row, [
    "start_year",
    "year_from",
    "period_start_year",
    "from_year",
    "object_year_from",
    "publication_year_from",
    "year",
    "object_year",
    "publication_year",
  ]);

  const endYear = firstNumber(row, [
    "end_year",
    "year_to",
    "period_end_year",
    "to_year",
    "object_year_to",
    "publication_year_to",
    "year",
    "object_year",
    "publication_year",
  ]);

  return {
    ...row,
    option_key: optionKey,
    option_label_no: label,
    period_filter_key: filterKey,
    timeline_start_year: startYear,
    timeline_end_year: endYear ?? startYear,
    timeline_sort_year: startYear ?? 999999,
  };
}

export async function GET() {
  try {
    const rows = await neonQuery<DbRow>(`
      select *
      from public.ct_v_period_filter_options
      order by 1
      limit 500
    `);

    const options = rows.map((row, index) => normalizeOption(row, index));

    return NextResponse.json({
      ok: true,
      source: "ct_v_period_filter_options",
      count: options.length,
      options,
      rows: options,
      rule: "Dette er faktiske periodefiltervalg/tidslinjeverdier. Filtertype-registeret ligger separat i ct_v_period_filter_registry_active.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "ct_v_period_filter_options",
        error: error instanceof Error ? error.message : "Unknown period options error",
      },
      { status: 500 }
    );
  }
}