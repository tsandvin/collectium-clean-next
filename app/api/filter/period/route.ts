/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period filter registry API
 *
 * Definering / formål:
 * Leser aktive periodefilter fra Neon/Postgres og returnerer dem til frontend/admin.
 *
 * Bruksområde:
 * Brukes av periodefilter, Filter Master, katalogfilter, relasjonssider og admin-kontroll.
 *
 * Berørte DB-brytere / feature_keys:
 * - period.simple
 * - period.advanced
 * - period.publication_year
 * - period.object_year
 * - period.edition_period
 * - period.production_period
 * - period.usage_period
 * - period.ruler_period
 * - period.dynasty_period
 * - period.historical_period
 * - period.historical_event_period
 * - period.find_period
 * - period.provenance_period
 * - period.auction_period
 * - period.market_period
 * - period.collection_transaction_period
 * - period.index_period
 *
 * Berørte routes:
 * - /api/filter/period
 * - /filter/periode
 * - /filter/periode/avansert
 *
 * Datakilde:
 * - Neon/Postgres
 * - ct_v_period_filter_registry_active
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PeriodFilterRow = {
  period_filter_key: string;
  period_filter_label_no: string;
  period_filter_level: string;
  access_min_membership: string;
  api_route: string;
  page_route: string;
  sort_order: number;
};

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL mangler. Legg Neon connection string i Vercel Environment Variables eller .env.local."
    );
  }

  return databaseUrl;
}

export async function GET() {
  try {
    const sql = neon(getDatabaseUrl());

    const result = await sql`
      SELECT
        period_filter_key,
        period_filter_label_no,
        period_filter_level,
        access_min_membership,
        api_route,
        page_route,
        sort_order
      FROM ct_v_period_filter_registry_active
      ORDER BY sort_order, period_filter_key
    `;

    const rows = result as PeriodFilterRow[];

    return NextResponse.json({
      ok: true,
      source: "neon",
      registry: "ct_v_period_filter_registry_active",
      count: rows.length,
      rows,
      control: {
        expected_count: 17,
        count_status: rows.length === 17 ? "ok" : "warning",
        neon_registry_status: rows.length === 17 ? "ok" : "partial_or_missing",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "neon",
        registry: "ct_v_period_filter_registry_active",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
