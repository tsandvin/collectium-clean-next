/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB -> Neon Field Mapping Control API
 *
 * Definering / formål:
 * Leser MariaDB og Neon information_schema.columns for å sammenligne felter per tabell
 * etter første table mapping-kontroll.
 *
 * Bruksområde:
 * Brukes av /admin/system/mariadb-neon for å se hvilke felt som finnes, mangler eller
 * må mappes manuelt før datamigrering.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 * - admin.system.mariadb_neon.field_mapping.view
 *
 * Berørte API-ruter:
 * - GET /api/system/field-mapping
 *
 * Berørte tabeller / views:
 * - MariaDB information_schema.columns
 * - Neon information_schema.columns
 * - ct_migration_field_map
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: system.database
 * log_action: field_mapping.check
 *
 * Versjon:
 * CT-FILE-NEON-MAPPING-0002 / CHANGE-2026-06-09-0003
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ColumnRow = {
  table_name: string;
  column_name: string;
  ordinal_position: number;
  data_type: string;
  is_nullable: string;
  column_key?: string;
};

async function getMariaDbColumns(): Promise<ColumnRow[]> {
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
          column_name,
          ordinal_position,
          data_type,
          is_nullable,
          column_key
        from information_schema.columns
        where table_schema = database()
        order by table_name, ordinal_position
      `);

      return rows as ColumnRow[];
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Could not load MariaDB query helper. Expected mariadbQuery, ctQuery, query or default export in lib/db/mariadb.ts, src/db/mariadb.ts or lib/db/mysql.ts.",
  );
}

function isBackupTable(tableName: string): boolean {
  const lower = tableName.toLowerCase();

  return (
    lower.startsWith("backup_") ||
    lower.startsWith("backup_ct_") ||
    lower.startsWith("bak_") ||
    lower.includes("_backup") ||
    lower.includes("before_patch") ||
    lower.includes("before_page_feature_fix")
  );
}

function normalizeTypeForComparison(typeName: string): string {
  const lower = typeName.toLowerCase();

  if (["int", "integer", "smallint", "mediumint"].includes(lower)) {
    return "integer";
  }

  if (["bigint"].includes(lower)) {
    return "bigint";
  }

  if (["varchar", "char", "text", "mediumtext", "longtext"].includes(lower)) {
    return "text";
  }

  if (["datetime", "timestamp", "date"].includes(lower)) {
    return "datetime";
  }

  if (["tinyint", "boolean", "bool"].includes(lower)) {
    return "boolean_or_tinyint";
  }

  if (["decimal", "numeric", "float", "double"].includes(lower)) {
    return "numeric";
  }

  if (["json", "jsonb"].includes(lower)) {
    return "json";
  }

  return lower;
}

export async function GET() {
  try {
    const mariaColumns = (await getMariaDbColumns()).filter(
      (row) => !isBackupTable(row.table_name),
    );

    const neonColumns = await neonQuery<ColumnRow>(`
      select
        table_name,
        column_name,
        ordinal_position,
        data_type,
        is_nullable
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `);

    const neonColumnSet = new Set(
      neonColumns.map((row) => `${row.table_name}.${row.column_name}`),
    );

    const neonColumnTypeMap = new Map(
      neonColumns.map((row) => [
        `${row.table_name}.${row.column_name}`,
        normalizeTypeForComparison(row.data_type),
      ]),
    );

    const fieldMapping = mariaColumns.map((row) => {
      const key = `${row.table_name}.${row.column_name}`;
      const existsInNeon = neonColumnSet.has(key);

      const sourceType = normalizeTypeForComparison(row.data_type);
      const targetType = neonColumnTypeMap.get(key) || null;

      let status:
        | "MATCH"
        | "MISSING_IN_NEON"
        | "TYPE_REVIEW"
        | "MANUAL_REVIEW" = "MANUAL_REVIEW";

      let reason_no = "Feltet krever manuell vurdering.";

      if (!existsInNeon) {
        status = "MISSING_IN_NEON";
        reason_no = "Feltet finnes i MariaDB, men ikke i Neon med samme tabell- og feltnavn.";
      } else if (targetType === sourceType) {
        status = "MATCH";
        reason_no = "Feltet finnes i begge databaser med kompatibel type.";
      } else {
        status = "TYPE_REVIEW";
        reason_no = "Feltet finnes i begge databaser, men datatype må vurderes.";
      }

      return {
        source_table: row.table_name,
        source_column: row.column_name,
        source_type: row.data_type,
        source_type_normalized: sourceType,
        source_nullable: row.is_nullable,
        source_column_key: row.column_key || null,
        target_table: row.table_name,
        target_column: row.column_name,
        target_type_normalized: targetType,
        neon_exists: existsInNeon,
        status,
        reason_no,
      };
    });

    const summary = fieldMapping.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const missingCritical = fieldMapping.filter((row) => {
      const table = row.source_table.toLowerCase();
      const isCritical =
        table.includes("user") ||
        table.includes("session") ||
        table.includes("auth") ||
        table.includes("membership") ||
        table.includes("catalog") ||
        table.includes("object") ||
        table.includes("feature") ||
        table.includes("access") ||
        table.includes("action_route");

      return isCritical && row.status !== "MATCH";
    });

    return NextResponse.json({
      ok: true,
      source: "field-mapping",
      checked_at: new Date().toISOString(),
      status: {
        field_mapping: "inventory_started",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "row_count_check",
      },
      summary,
      databases: {
        mariadb: {
          column_count_checked_without_backup_tables: mariaColumns.length,
        },
        neon: {
          column_count: neonColumns.length,
        },
      },
      missing_or_review_critical_count: missingCritical.length,
      missing_or_review_critical: missingCritical.slice(0, 120),
      field_mapping: fieldMapping,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Dette er field mapping. Ingen kildedata skal migreres før row count, ID mapping, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "field-mapping",
        status: "FEIL",
        migration_allowed: false,
        source_data_migration_allowed: false,
        error: error instanceof Error ? error.message : "Unknown field mapping error",
      },
      { status: 500 },
    );
  }
}
