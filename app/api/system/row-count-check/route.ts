import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MariaDbTableRow = {
  table_name: string;
  table_type: string;
  table_rows: unknown;
};

type NeonTableRow = {
  table_name: string;
  table_type: string;
};

type CountRow = {
  count_value: unknown;
};

type MappingStatus =
  | "MIGRATE"
  | "CONTROL_ONLY"
  | "ARCHIVE_ONLY"
  | "SKIP_BACKUP"
  | "MANUAL_REVIEW"
  | "ALREADY_CONTROL_TABLE";

type Priority = "high" | "medium" | "low" | "skip";

type RowCountCheckRow = {
  source_table: string;
  source_type: string;
  mapping_status: MappingStatus;
  priority: Priority;
  source_rows_estimate: string | null;
  source_rows_exact: string | null;
  neon_exists: boolean;
  neon_rows_exact: string | null;
  row_count_status:
    | "OK"
    | "MISSING_IN_NEON"
    | "SOURCE_HAS_DATA_NEON_MISSING"
    | "NEON_EMPTY"
    | "COUNT_MATCH"
    | "COUNT_MISMATCH"
    | "SKIPPED_BACKUP"
    | "VIEW_RECREATE_LATER"
    | "COUNT_ERROR";
  reason_no: string;
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

function toTextOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function toNumber(value: string | null): number {
  if (value === null) {
    return 0;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function getMariaDbQueryFunction(): Promise<(sql: string, params?: unknown[]) => Promise<unknown[]>> {
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

      if (typeof queryFn === "function") {
        return queryFn;
      }
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Could not load MariaDB query helper. Expected mariadbQuery, ctQuery, query or default export in lib/db/mariadb.ts, src/db/mariadb.ts or lib/db/mysql.ts.",
  );
}

function classifyTableName(name: string): { mapping_status: MappingStatus; priority: Priority; reason_no: string } {
  const lower = name.toLowerCase();

  if (
    lower.startsWith("backup_") ||
    lower.startsWith("backup_ct_") ||
    lower.startsWith("bak_") ||
    lower.includes("_backup") ||
    lower.includes("before_patch") ||
    lower.includes("before_page_feature_fix")
  ) {
    return {
      mapping_status: "SKIP_BACKUP",
      priority: "skip",
      reason_no: "Backup-, patch- eller midlertidig tabell. Skal ikke migreres som aktiv Neon-struktur.",
    };
  }

  if (
    lower.startsWith("ct_migration_") ||
    lower === "ct_database_truth_status" ||
    lower === "ct_system_control_status" ||
    lower.startsWith("ct_control_")
  ) {
    return {
      mapping_status: "ALREADY_CONTROL_TABLE",
      priority: "low",
      reason_no: "Kontrolltabell for migreringssystemet. Finnes normalt allerede i Neon.",
    };
  }

  if (
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
    return {
      mapping_status: "CONTROL_ONLY",
      priority: "high",
      reason_no: "DB 8.4-kjede / side-feature-access-action-route. Må kontrolleres før Neon kan bli sann database.",
    };
  }

  if (
    lower.includes("user") ||
    lower.includes("session") ||
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("membership") ||
    lower.includes("profile")
  ) {
    return {
      mapping_status: "MIGRATE",
      priority: "high",
      reason_no: "Bruker/auth/session/medlemskap er kjernefunksjon og må migreres eller bygges kontrollert i Neon.",
    };
  }

  if (
    lower.includes("catalog") ||
    lower.includes("banknote") ||
    lower.includes("coin") ||
    lower.includes("object") ||
    lower.includes("source") ||
    lower.includes("relation") ||
    lower.includes("ruler") ||
    lower.includes("historical")
  ) {
    return {
      mapping_status: "MIGRATE",
      priority: "high",
      reason_no: "Katalog/objekt/kilde/relasjon er kjernegrunnlag for Collectium.",
    };
  }

  if (
    lower.includes("collection") ||
    lower.includes("wishlist") ||
    lower.includes("favorite") ||
    lower.includes("transaction")
  ) {
    return {
      mapping_status: "MIGRATE",
      priority: "high",
      reason_no: "Samling, brukerstatus og transaksjoner må migreres kontrollert.",
    };
  }

  if (
    lower.includes("auction") ||
    lower.includes("bid") ||
    lower.includes("dealer") ||
    lower.includes("shop") ||
    lower.includes("market")
  ) {
    return {
      mapping_status: "MIGRATE",
      priority: "medium",
      reason_no: "Marked, auksjon, forhandler og nettbutikk må migreres etter katalog/auth-kontroll.",
    };
  }

  if (
    lower.includes("log") ||
    lower.includes("event") ||
    lower.includes("audit")
  ) {
    return {
      mapping_status: "ARCHIVE_ONLY",
      priority: "low",
      reason_no: "Logg/event/audit kan arkiveres eller migreres senere etter datakvalitetsregel.",
    };
  }

  return {
    mapping_status: "MANUAL_REVIEW",
    priority: "medium",
    reason_no: "Tabellen krever manuell vurdering før migrering.",
  };
}

function isSafeIdentifier(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name);
}

async function countMariaDbRows(
  queryFn: (sql: string, params?: unknown[]) => Promise<unknown[]>,
  tableName: string,
  tableType: string,
): Promise<string | null> {
  if (tableType.toUpperCase() !== "BASE TABLE") {
    return null;
  }

  if (!isSafeIdentifier(tableName)) {
    return null;
  }

  const rows = (await queryFn(`select count(*) as count_value from \`${tableName}\``)) as CountRow[];
  return toTextOrNull(rows[0]?.count_value);
}

async function countNeonRows(tableName: string): Promise<string | null> {
  if (!isSafeIdentifier(tableName)) {
    return null;
  }

  const rows = await neonQuery<CountRow>(`select count(*)::text as count_value from "${tableName}"`);
  return toTextOrNull(rows[0]?.count_value);
}

export async function GET() {
  try {
    const mariaQuery = await getMariaDbQueryFunction();

    const mariaTables = (await mariaQuery(`
      select
        table_name,
        table_type,
        cast(coalesce(table_rows, 0) as char) as table_rows
      from information_schema.tables
      where table_schema = database()
      order by table_name
    `)) as MariaDbTableRow[];

    const neonTables = await neonQuery<NeonTableRow>(`
      select
        table_name,
        table_type
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    const neonTableNames = new Set(neonTables.map((row) => String(row.table_name)));

    const candidates = mariaTables
      .map((row) => {
        const tableName = String(row.table_name);
        const tableType = String(row.table_type);
        const classification = classifyTableName(tableName);

        return {
          table_name: tableName,
          table_type: tableType,
          source_rows_estimate: toTextOrNull(row.table_rows),
          ...classification,
        };
      })
      .filter((row) => row.priority === "high" || row.mapping_status === "CONTROL_ONLY")
      .slice(0, 120);

    const checks: RowCountCheckRow[] = [];

    for (const row of candidates) {
      const neonExists = neonTableNames.has(row.table_name);

      let sourceRowsExact: string | null = null;
      let neonRowsExact: string | null = null;
      let rowCountStatus: RowCountCheckRow["row_count_status"] = "OK";
      let reason = row.reason_no;

      try {
        if (row.mapping_status === "SKIP_BACKUP") {
          rowCountStatus = "SKIPPED_BACKUP";
        } else if (row.table_type.toUpperCase() === "VIEW") {
          rowCountStatus = "VIEW_RECREATE_LATER";
          reason = "MariaDB-view skal ikke kopieres som vanlig tabell. Den må gjenskapes som Postgres-view eller erstattes av API/resolved query.";
        } else {
          sourceRowsExact = await countMariaDbRows(mariaQuery, row.table_name, row.table_type);

          if (!neonExists) {
            rowCountStatus =
              toNumber(sourceRowsExact) > 0
                ? "SOURCE_HAS_DATA_NEON_MISSING"
                : "MISSING_IN_NEON";
          } else {
            neonRowsExact = await countNeonRows(row.table_name);

            if (toNumber(sourceRowsExact) === toNumber(neonRowsExact)) {
              rowCountStatus = "COUNT_MATCH";
            } else if (toNumber(neonRowsExact) === 0) {
              rowCountStatus = "NEON_EMPTY";
            } else {
              rowCountStatus = "COUNT_MISMATCH";
            }
          }
        }
      } catch (error) {
        rowCountStatus = "COUNT_ERROR";
        reason = error instanceof Error ? error.message : "Ukjent radtellefeil.";
      }

      checks.push({
        source_table: row.table_name,
        source_type: row.table_type,
        mapping_status: row.mapping_status,
        priority: row.priority,
        source_rows_estimate: row.source_rows_estimate,
        source_rows_exact: sourceRowsExact,
        neon_exists: neonExists,
        neon_rows_exact: neonRowsExact,
        row_count_status: rowCountStatus,
        reason_no: reason,
      });
    }

    const summary = checks.reduce<Record<string, number>>((acc, row) => {
      acc[row.row_count_status] = (acc[row.row_count_status] || 0) + 1;
      return acc;
    }, {});

    const blocking = checks.filter((row) =>
      row.row_count_status === "SOURCE_HAS_DATA_NEON_MISSING" ||
      row.row_count_status === "COUNT_MISMATCH" ||
      row.row_count_status === "NEON_EMPTY" ||
      row.row_count_status === "COUNT_ERROR"
    );

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "row-count-check",
      checked_at: new Date().toISOString(),
      status: {
        row_count_check: "inventory_started",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "id_mapping_check",
      },
      summary,
      checked_table_count: String(checks.length),
      blocking_count: String(blocking.length),
      blocking: blocking.slice(0, 80),
      row_counts: checks,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Dette er radtallskontroll. Ingen kildedata skal migreres før ID mapping, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "row-count-check",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown row count check error",
    }), { status: 500 });
  }
}
