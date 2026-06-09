/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon Health API
 *
 * Definering / formål:
 * Tester Neon/Postgres-kobling for MariaDB -> Neon kontrollsiden.
 *
 * Bruksområde:
 * Brukes av /admin/system/mariadb-neon for å vise om Neon er koblet.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-health
 *
 * Berørte tabeller / views:
 * - PostgreSQL server/version
 * - information_schema.tables
 * - information_schema.views
 * - information_schema.columns
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system.database
 * log_action: neon.health
 *
 * Versjon:
 * CT-FILE-NEON-0002 / CHANGE-2026-06-09-0002
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const versionRows = await neonQuery<{ version: string }>(
      "select version() as version",
    );

    const currentRows = await neonQuery<{
      current_database: string;
      current_user: string;
      current_schema: string;
    }>(`
      select
        current_database() as current_database,
        current_user as current_user,
        current_schema() as current_schema
    `);

    const inventoryRows = await neonQuery<{
      table_count: string;
      view_count: string;
      column_count: string;
    }>(`
      select
        (
          select count(*)
          from information_schema.tables
          where table_schema = 'public'
          and table_type = 'BASE TABLE'
        )::text as table_count,
        (
          select count(*)
          from information_schema.views
          where table_schema = 'public'
        )::text as view_count,
        (
          select count(*)
          from information_schema.columns
          where table_schema = 'public'
        )::text as column_count
    `);

    return NextResponse.json({
      ok: true,
      database: "neon",
      status: "OK",
      truth_status: process.env.COLLECTIUM_NEON_TRUTH_STATUS || "not_approved",
      migration_status: process.env.COLLECTIUM_DB_MODE || "migration_control",
      connection: {
        database: currentRows[0]?.current_database || null,
        user: currentRows[0]?.current_user || null,
        schema: currentRows[0]?.current_schema || null,
      },
      version: versionRows[0]?.version || null,
      inventory: {
        tables: Number(inventoryRows[0]?.table_count || 0),
        views: Number(inventoryRows[0]?.view_count || 0),
        columns: Number(inventoryRows[0]?.column_count || 0),
      },
      next_step:
        "If inventory is 0/0/0, run controlled Neon bootstrap before migrating source data.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "neon",
        status: "FEIL",
        truth_status: "not_approved",
        migration_status: process.env.COLLECTIUM_DB_MODE || "migration_control",
        error: error instanceof Error ? error.message : "Unknown Neon error",
      },
      { status: 500 },
    );
  }
}
