/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Provenance registry system check
 *
 * Definering / formål:
 * Leser Proveniens-kontrollregistrene fra Neon/Postgres og returnerer status til admin/systemkontroll.
 *
 * Bruksområde:
 * Brukes for å kontrollere at Proveniens er registrert som strukturert historikk-, verdi-, transaksjons-,
 * relasjons- og samtykkemodul.
 *
 * Berørte DB-brytere / feature_keys:
 * - provenance.definition
 * - provenance.scope
 * - provenance.event_type
 * - provenance.visibility
 * - period.provenance_period
 *
 * Berørte sider/routes:
 * - /api/system/provenance-check
 * - fremtidig /filter/periode/proveniens
 * - fremtidig /relasjon/[type]/[slug]
 * - fremtidig objektpresentasjon
 *
 * Viktig:
 * Denne ruten leser kun kontrollregister. Den migrerer ikke katalogdata, brukerdata,
 * transaksjonsdata eller privat proveniens.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProvenanceCheckRow = {
  check_name: string;
  definition_rows_active: number | string;
  scope_rows_active: number | string;
  event_type_rows_active: number | string;
  visibility_rows_active: number | string;
  provenance_period_active: number | string;
};

function getDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.neon_DATABASE_URL;

  if (!url) {
    throw new Error("Missing Neon database URL.");
  }

  return url;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  try {
    const sql = neon(getDatabaseUrl());

    const result = await sql`
      SELECT
        'provenance_registry_update' AS check_name,
        (
          SELECT count(*)
          FROM ct_provenance_definition_registry
          WHERE is_active = true
        ) AS definition_rows_active,
        (
          SELECT count(*)
          FROM ct_provenance_scope_registry
          WHERE is_active = true
        ) AS scope_rows_active,
        (
          SELECT count(*)
          FROM ct_provenance_event_type_registry
          WHERE is_active = true
        ) AS event_type_rows_active,
        (
          SELECT count(*)
          FROM ct_provenance_visibility_registry
          WHERE is_active = true
        ) AS visibility_rows_active,
        (
          SELECT count(*)
          FROM ct_period_filter_registry
          WHERE period_filter_key = 'period.provenance_period'
            AND is_active = true
        ) AS provenance_period_active
    `;

    const rows = result as ProvenanceCheckRow[];
    const row = rows[0];

    const actual = {
      definition_rows_active: toNumber(row?.definition_rows_active),
      scope_rows_active: toNumber(row?.scope_rows_active),
      event_type_rows_active: toNumber(row?.event_type_rows_active),
      visibility_rows_active: toNumber(row?.visibility_rows_active),
      provenance_period_active: toNumber(row?.provenance_period_active),
    };

    const ready =
      actual.definition_rows_active === 1 &&
      actual.scope_rows_active === 9 &&
      actual.event_type_rows_active === 15 &&
      actual.visibility_rows_active === 5 &&
      actual.provenance_period_active === 1;

    return NextResponse.json({
      ok: ready,
      source: "provenance-check",
      status: ready ? "ready" : "warning",
      database: "neon",
      control_registry_only: true,
      source_data_migration_allowed: false,
      privacy_required: true,
      consent_required_for_private_data: true,
      expected: {
        definition_rows_active: 1,
        scope_rows_active: 9,
        event_type_rows_active: 15,
        visibility_rows_active: 5,
        provenance_period_active: 1,
      },
      actual,
      collectium_rule: {
        provenance_definition:
          "Proveniens is structured history, value, transaction, relation, visibility and consent control.",
        private_provenance:
          "Private/user-added provenance must not expose identity, ownership, transaction, value or related objects without consent.",
        public_provenance:
          "Public/common-known historical or find-based provenance may be shown as Proveniensperiode.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "provenance-check",
        status: "error",
        database: "neon",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
