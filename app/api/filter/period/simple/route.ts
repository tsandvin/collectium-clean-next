/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Simple Period Filter API
 *
 * Definering / formål:
 * Leser enkelt periodefilter fra Neon.
 *
 * Bruksområde:
 * Brukes av Free/Bronze og grunnleggende katalog-/relasjonsfilter.
 *
 * Berørte sider / routes:
 * - /filter/periode
 * - /katalog
 * - /relasjon/[type]/[slug]
 * - /index
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.simple.use
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/simple
 *
 * Berørte tabeller / views:
 * - ct_period_filter_registry
 *
 * Dataretning:
 * Neon period filter registry -> API -> frontend.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

export async function GET() {
  try {
    const rows = await neonQuery(`
      select *
      from ct_period_filter_registry
      where period_filter_key = 'simple_period'
        and coalesce(is_active, true) = true
      order by coalesce(sort_order, 100), period_filter_key
    `);

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-period-simple",
      checked_at: new Date().toISOString(),
      count: rows.length,
      period_filters: rows,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Dette leser kun enkelt periodefilter fra Neon registry.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-period-simple",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown simple period filter error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
