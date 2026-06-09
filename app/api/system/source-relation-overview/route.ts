/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Source relation overview API
 *
 * Definering / formål:
 * Kontrollerer Neon source-, object group-, relation- og perioderegister.
 * Ruten leser kun kontroll-/registerdata og migrerer ikke kildedata.
 *
 * Bruksområde:
 * Brukes av MariaDB -> Neon Control for å vise om source/relation/period-kjeden
 * er klar for videre mapping og innholdskontroll.
 *
 * Berørte DB-brytere / feature_keys:
 * - system.source_relation_overview
 * - system.mariadb_neon_control
 * - period.simple
 * - period.advanced
 * - period.production_period
 *
 * Berørte routes:
 * - /api/system/source-relation-overview
 * - /admin/system/mariadb-neon
 *
 * Datakilde:
 * - Neon/Postgres
 * - ct_source_inventory
 * - ct_object_group_inventory
 * - ct_relation_type_registry
 * - ct_relation_path_registry
 * - ct_relation_missing_links
 * - ct_period_filter_registry
 * - ct_v_period_filter_registry_active
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  row_count: number | string;
};

type TableExistsRow = {
  table_name: string;
  table_type: string;
};

type RegistrySampleRow = Record<string, unknown>;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL || process.env.neon_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL mangler. Legg Neon connection string i Vercel Environment Variables."
    );
  }

  return databaseUrl;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusFromCount(count: number, expectedMinimum = 1): "OK" | "VARSEL" | "FEIL" {
  if (count >= expectedMinimum) return "OK";
  return "FEIL";
}

async function tableExists(
  sql: ReturnType<typeof neon>,
  tableName: string
): Promise<boolean> {
  const rows = (await sql`
    SELECT
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    LIMIT 1`) as TableExistsRow[];

  return rows.length > 0;
}

async function safeCount(
  sql: ReturnType<typeof neon>,
  tableName: string
): Promise<{
  table_name: string;
  exists: boolean;
  row_count: number;
  status: "OK" | "VARSEL" | "FEIL";
  message_no: string;
}> {
  const exists = await tableExists(sql, tableName);

  if (!exists) {
    return {
      table_name: tableName,
      exists: false,
      row_count: 0,
      status: "FEIL",
      message_no: "Tabell/view mangler i Neon.",
    };
  }

  const rows = (await sql(`
    SELECT COUNT(*)::int AS row_count
    FROM ${tableName}`)) as CountRow[];

  const rowCount = toNumber(rows[0]?.row_count);

  return {
    table_name: tableName,
    exists: true,
    row_count: rowCount,
    status: statusFromCount(rowCount),
    message_no: rowCount > 0 ? "Registeret finnes og har rader." : "Registeret finnes, men har 0 rader.",
  };
}

export async function GET() {
  try {
    const sql = neon(getDatabaseUrl());

    const [
      sourceInventory,
      objectGroupInventory,
      relationTypeRegistry,
      relationPathRegistry,
      relationMissingLinks,
      periodFilterRegistry,
      periodFilterActiveView,
    ] = await Promise.all([
      safeCount(sql, "ct_source_inventory"),
      safeCount(sql, "ct_object_group_inventory"),
      safeCount(sql, "ct_relation_type_registry"),
      safeCount(sql, "ct_relation_path_registry"),
      safeCount(sql, "ct_relation_missing_links"),
      safeCount(sql, "ct_period_filter_registry"),
      safeCount(sql, "ct_v_period_filter_registry_active"),
    ]);

    const periodRows = periodFilterActiveView.exists
      ? (await sql`
          SELECT
            period_filter_key,
            period_filter_label_no,
            period_filter_level,
            access_min_membership,
            api_route,
            page_route,
            sort_order
          FROM ct_v_period_filter_registry_active
          ORDER BY sort_order, period_filter_key`) as RegistrySampleRow[]
      : [];

    const sourceRows = sourceInventory.exists
      ? (await sql`
          SELECT *
          FROM ct_source_inventory
          ORDER BY 1 LIMIT 25`) as RegistrySampleRow[]
      : [];

    const objectGroupRows = objectGroupInventory.exists
      ? (await sql`
          SELECT *
          FROM ct_object_group_inventory
          ORDER BY 1 LIMIT 25`) as RegistrySampleRow[]
      : [];

    const relationTypeRows = relationTypeRegistry.exists
      ? (await sql`
          SELECT *
          FROM ct_relation_type_registry
          ORDER BY 1 LIMIT 25`) as RegistrySampleRow[]
      : [];

    const relationPathRows = relationPathRegistry.exists
      ? (await sql`
          SELECT *
          FROM ct_relation_path_registry
          ORDER BY 1 LIMIT 25`) as RegistrySampleRow[]
      : [];

    const openMissingRelationRows = relationMissingLinks.exists
      ? (await sql`
          SELECT *
          FROM ct_relation_missing_links
          ORDER BY 1 LIMIT 25`) as RegistrySampleRow[]
      : [];

    const checks = [
      sourceInventory,
      objectGroupInventory,
      relationTypeRegistry,
      relationPathRegistry,
      relationMissingLinks,
      periodFilterRegistry,
      periodFilterActiveView,
    ];

    const okCount = checks.filter((check) => check.status === "OK").length;
    const warningCount = checks.filter((check) => check.status === "VARSEL").length;
    const errorCount = checks.filter((check) => check.status === "FEIL").length;

    const periodFilterStatus =
      periodFilterActiveView.row_count === 17 ? "OK" : "VARSEL";

    const relationRegistryStatus =
      relationTypeRegistry.status === "OK" && relationPathRegistry.status === "OK"
        ? "OK"
        : "FEIL";

    const sourceRegistryStatus =
      sourceInventory.status === "OK" && objectGroupInventory.status === "OK"
        ? "OK"
        : "FEIL";

    const overallStatus =
      errorCount === 0 && periodFilterActiveView.row_count === 17 ? "OK" : "VARSEL";

    return NextResponse.json({
      ok: overallStatus === "OK",
      source: "source-relation-overview",
      checked_at: new Date().toISOString(),
      status: {
        neon: "OK",
        source_inventory: sourceRegistryStatus,
        relation_registry: relationRegistryStatus,
        period_filter_registry: periodFilterStatus,
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        next_step: "object_group_mapping",
      },
      summary: {
        ok: okCount,
        varsel: warningCount,
        feil: errorCount,
        period_filter_expected_count: 17,
        period_filter_actual_count: periodFilterActiveView.row_count,
      },
      checks,
      samples: {
        period_filters: periodRows,
        sources: sourceRows,
        object_groups: objectGroupRows,
        relation_types: relationTypeRows,
        relation_paths: relationPathRows,
        missing_relation_links: openMissingRelationRows,
      },
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Dette er source/relation-overview. Ruten leser Neon kontrollregistre og migrerer ikke kildedata. Neon er ikke sann hoveddatabase før mapping, radtelling, ID-kontroll, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er OK.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "source-relation-overview",
        checked_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        status: {
          neon: "FEIL",
          source_inventory: "UKJENT",
          relation_registry: "UKJENT",
          period_filter_registry: "UKJENT",
          migration_status: "blocked",
          neon_truth_status: "not_approved",
          next_step: "fix_source_relation_overview",
        },
      },
      { status: 500 }
    );
  }
}

