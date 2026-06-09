/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB -> Neon Table Mapping Control API
 *
 * Definering / formål:
 * Leser MariaDB information_schema og Neon information_schema for å klassifisere
 * hvilke tabeller som skal migreres, kontrolleres, arkiveres, hoppes over eller vurderes manuelt.
 *
 * Bruksområde:
 * Brukes av /admin/system/mariadb-neon som neste steg etter schema inventory.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 * - admin.system.mariadb_neon.table_mapping.view
 *
 * Berørte API-ruter:
 * - GET /api/system/table-mapping
 *
 * Berørte tabeller / views:
 * - MariaDB information_schema.tables
 * - Neon information_schema.tables
 * - ct_migration_table_map
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system.database
 * log_action: table_mapping.check
 *
 * Versjon:
 * CT-FILE-NEON-MAPPING-0001 / CHANGE-2026-06-09-0002
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MariaDbTableRow = {
  table_name: string;
  table_type: string;
  table_rows: number | null;
};

type NeonTableRow = {
  table_name: string;
  table_type: string;
};

type TableMappingRow = {
  source_table: string;
  source_type: string;
  target_table: string | null;
  mapping_status:
    | "MIGRATE"
    | "CONTROL_ONLY"
    | "ARCHIVE_ONLY"
    | "SKIP_BACKUP"
    | "MANUAL_REVIEW"
    | "ALREADY_CONTROL_TABLE";
  priority: "high" | "medium" | "low" | "skip";
  reason_no: string;
  source_rows: number | null;
  neon_exists: boolean;
};

async function getMariaDbTables(): Promise<MariaDbTableRow[]> {
  const candidates = [
    "@/lib/db/mariadb",
    "@/src/db/mariadb",
    "@/lib/db/mysql",
  ];

  for (const modulePath of candidates) {
    try {
      const mod = await import(modulePath);

      const queryFn =
        mod.mariadbQuery ||
        mod.ctQuery ||
        mod.query ||
        mod.default;

      if (typeof queryFn !== "function") {
        continue;
      }

      const rows = await queryFn(`
        select
          table_name,
          table_type,
          table_rows
        from information_schema.tables
        where table_schema = database()
        order by table_name
      `);

      return rows as MariaDbTableRow[];
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Could not load MariaDB query helper. Expected mariadbQuery, ctQuery, query or default export in lib/db/mariadb.ts, src/db/mariadb.ts or lib/db/mysql.ts.",
  );
}

function classifyTable(row: MariaDbTableRow, neonTableNames: Set<string>): TableMappingRow {
  const name = row.table_name;
  const lower = name.toLowerCase();

  let mapping_status: TableMappingRow["mapping_status"] = "MANUAL_REVIEW";
  let priority: TableMappingRow["priority"] = "medium";
  let reason_no = "Tabellen krever manuell vurdering før migrering.";
  let target_table: string | null = name;

  if (
    lower.startsWith("backup_") ||
    lower.startsWith("backup_ct_") ||
    lower.startsWith("bak_") ||
    lower.includes("_backup") ||
    lower.includes("before_patch") ||
    lower.includes("before_page_feature_fix")
  ) {
    mapping_status = "SKIP_BACKUP";
    priority = "skip";
    target_table = null;
    reason_no = "Backup-, patch- eller midlertidig tabell. Skal ikke migreres som aktiv Neon-struktur.";
  } else if (
    lower.startsWith("ct_migration_") ||
    lower === "ct_database_truth_status" ||
    lower === "ct_system_control_status" ||
    lower.startsWith("ct_control_")
  ) {
    mapping_status = "ALREADY_CONTROL_TABLE";
    priority = "low";
    reason_no = "Kontrolltabell for migreringssystemet. Finnes normalt allerede i Neon.";
  } else if (
    lower === "ct_app_pages" ||
    lower === "ct_app_page_features" ||
    lower === "ct_app_features" ||
    lower === "ct_feature_access_rules" ||
    lower === "ct_feature_action_routes" ||
    lower === "ct_v_feature_access_resolved" ||
    lower.includes("feature") ||
    lower.includes("access_rule") ||
    lower.includes("action_route")
  ) {
    mapping_status = "CONTROL_ONLY";
    priority = "high";
    reason_no = "DB 8.4-kjede / side-feature-access-action-route. Må kontrolleres før Neon kan bli sann database.";
  } else if (
    lower.includes("user") ||
    lower.includes("session") ||
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("membership") ||
    lower.includes("profile")
  ) {
    mapping_status = "MIGRATE";
    priority = "high";
    reason_no = "Bruker/auth/session/medlemskap er kjernefunksjon og må migreres eller bygges kontrollert i Neon.";
  } else if (
    lower.includes("catalog") ||
    lower.includes("banknote") ||
    lower.includes("coin") ||
    lower.includes("object") ||
    lower.includes("source") ||
    lower.includes("relation") ||
    lower.includes("ruler") ||
    lower.includes("historical")
  ) {
    mapping_status = "MIGRATE";
    priority = "high";
    reason_no = "Katalog/objekt/kilde/relasjon er kjernegrunnlag for Collectium.";
  } else if (
    lower.includes("collection") ||
    lower.includes("wishlist") ||
    lower.includes("favorite") ||
    lower.includes("transaction")
  ) {
    mapping_status = "MIGRATE";
    priority = "high";
    reason_no = "Samling, brukerstatus og transaksjoner må migreres kontrollert.";
  } else if (
    lower.includes("auction") ||
    lower.includes("bid") ||
    lower.includes("dealer") ||
    lower.includes("shop") ||
    lower.includes("market")
  ) {
    mapping_status = "MIGRATE";
    priority = "medium";
    reason_no = "Marked, auksjon, forhandler og nettbutikk må migreres etter katalog/auth-kontroll.";
  } else if (
    lower.includes("log") ||
    lower.includes("event") ||
    lower.includes("audit")
  ) {
    mapping_status = "ARCHIVE_ONLY";
    priority = "low";
    reason_no = "Logg/event/audit kan arkiveres eller migreres senere etter datakvalitetsregel.";
  }

  return {
    source_table: name,
    source_type: row.table_type,
    target_table,
    mapping_status,
    priority,
    reason_no,
    source_rows: row.table_rows,
    neon_exists: target_table ? neonTableNames.has(target_table) : false,
  };
}

export async function GET() {
  try {
    const mariadbTables = await getMariaDbTables();

    const neonTables = await neonQuery<NeonTableRow>(`
      select
        table_name,
        table_type
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    const neonTableNames = new Set(neonTables.map((row) => row.table_name));
    const mapping = mariadbTables.map((row) => classifyTable(row, neonTableNames));

    const summary = mapping.reduce<Record<string, number>>((acc, row) => {
      acc[row.mapping_status] = (acc[row.mapping_status] || 0) + 1;
      return acc;
    }, {});

    const prioritySummary = mapping.reduce<Record<string, number>>((acc, row) => {
      acc[row.priority] = (acc[row.priority] || 0) + 1;
      return acc;
    }, {});

    const highPriorityMissing = mapping.filter(
      (row) =>
        row.priority === "high" &&
        row.target_table &&
        !row.neon_exists &&
        row.mapping_status !== "SKIP_BACKUP",
    );

    return NextResponse.json({
      ok: true,
      source: "table-mapping",
      checked_at: new Date().toISOString(),
      status: {
        table_mapping: "inventory_started",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "field_mapping",
      },
      summary,
      priority_summary: prioritySummary,
      databases: {
        mariadb: {
          table_count: mariadbTables.length,
        },
        neon: {
          table_count: neonTables.length,
        },
      },
      high_priority_missing_count: highPriorityMissing.length,
      high_priority_missing: highPriorityMissing.slice(0, 80),
      mapping,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Dette er table mapping. Ingen kildedata skal migreres før field mapping, row count, ID mapping, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "table-mapping",
        status: "FEIL",
        migration_allowed: false,
        source_data_migration_allowed: false,
        error: error instanceof Error ? error.message : "Unknown table mapping error",
      },
      { status: 500 },
    );
  }
}
