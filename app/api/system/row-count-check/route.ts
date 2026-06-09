import { NextRequest, NextResponse } from "next/server";
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

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

function toTextOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}

function isSafeIdentifier(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name);
}

async function getMariaDbQueryFunction(): Promise<(sql: string, params?: unknown[]) => Promise<unknown[]>> {
  const candidates = ["@/lib/db/mariadb", "@/src/db/mariadb", "@/lib/db/mysql"];

  for (const modulePath of candidates) {
    try {
      const mod = await import(modulePath);
      const queryFn = mod.mariadbQuery || mod.ctQuery || mod.query || mod.default;

      if (typeof queryFn === "function") {
        return queryFn;
      }
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "Could not load MariaDB query helper. Expected mariadbQuery, ctQuery, query or default export.",
  );
}

function classifyPriority(tableName: string): "high" | "medium" | "low" | "skip" {
  const lower = tableName.toLowerCase();

  if (
    lower.startsWith("backup_") ||
    lower.startsWith("backup_ct_") ||
    lower.startsWith("bak_") ||
    lower.includes("_backup") ||
    lower.includes("before_patch")
  ) {
    return "skip";
  }

  if (
    lower === "ct_app_pages" ||
    lower === "ct_app_page_features" ||
    lower === "ct_app_features" ||
    lower === "ct_feature_access_rules" ||
    lower === "ct_feature_action_routes" ||
    lower === "ct_v_feature_access_resolved" ||
    lower.includes("user") ||
    lower.includes("session") ||
    lower.includes("auth") ||
    lower.includes("membership") ||
    lower.includes("catalog") ||
    lower.includes("banknote") ||
    lower.includes("coin") ||
    lower.includes("object") ||
    lower.includes("source") ||
    lower.includes("relation") ||
    lower.includes("ruler") ||
    lower.includes("historical") ||
    lower.includes("collection") ||
    lower.includes("wishlist")
  ) {
    return "high";
  }

  if (
    lower.includes("auction") ||
    lower.includes("dealer") ||
    lower.includes("shop") ||
    lower.includes("market")
  ) {
    return "medium";
  }

  return "low";
}

function classifyStatus(
  tableName: string,
  tableType: string,
  sourceRowsEstimate: string | null,
  neonExists: boolean,
): string {
  const priority = classifyPriority(tableName);
  const estimatedRows = Number(sourceRowsEstimate || "0");

  if (priority === "skip") return "SKIPPED_BACKUP";
  if (tableType.toUpperCase() === "VIEW") return "VIEW_RECREATE_LATER";
  if (!neonExists && estimatedRows > 0) return "SOURCE_HAS_DATA_NEON_MISSING";
  if (!neonExists) return "MISSING_IN_NEON";
  return "NEON_EXISTS_ESTIMATE_ONLY";
}

async function countNeonRows(tableName: string): Promise<string | null> {
  if (!isSafeIdentifier(tableName)) return null;

  const rows = await neonQuery<CountRow>(
    `select count(*)::text as count_value from "${tableName}"`,
  );

  return toTextOrNull(rows[0]?.count_value);
}

export async function GET(request: NextRequest) {
  try {
    const exact = request.nextUrl.searchParams.get("exact") === "1";
    const limitRaw = Number(request.nextUrl.searchParams.get("limit") || "120");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 120;

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
        const sourceTable = String(row.table_name);
        const sourceType = String(row.table_type);
        const sourceRowsEstimate = toTextOrNull(row.table_rows);
        const priority = classifyPriority(sourceTable);
        const neonExists = neonTableNames.has(sourceTable);

        return {
          source_table: sourceTable,
          source_type: sourceType,
          priority,
          source_rows_estimate: sourceRowsEstimate,
          neon_exists: neonExists,
          neon_rows_exact: null as string | null,
          row_count_status: classifyStatus(sourceTable, sourceType, sourceRowsEstimate, neonExists),
        };
      })
      .filter((row) => row.priority === "high" || row.row_count_status === "SOURCE_HAS_DATA_NEON_MISSING")
      .slice(0, limit);

    if (exact) {
      for (const row of candidates) {
        if (row.neon_exists && row.source_type.toUpperCase() === "BASE TABLE") {
          try {
            row.neon_rows_exact = await countNeonRows(row.source_table);
          } catch {
            row.neon_rows_exact = null;
          }
        }
      }
    }

    const summary = candidates.reduce<Record<string, number>>((acc, row) => {
      acc[row.row_count_status] = (acc[row.row_count_status] || 0) + 1;
      return acc;
    }, {});

    const blocking = candidates.filter((row) =>
      row.row_count_status === "SOURCE_HAS_DATA_NEON_MISSING" ||
      row.row_count_status === "MISSING_IN_NEON"
    );

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "row-count-check",
      checked_at: new Date().toISOString(),
      status: {
        row_count_check: exact ? "inventory_started_exact_neon_only" : "inventory_started_estimate_only",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "id_mapping_check",
      },
      mode: exact ? "exact_neon_only" : "estimate_only",
      limit: String(limit),
      maria_table_count: String(mariaTables.length),
      neon_table_count: String(neonTables.length),
      summary,
      checked_table_count: String(candidates.length),
      blocking_count: String(blocking.length),
      blocking: blocking.slice(0, 80),
      row_counts: candidates,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Dette er lett radtallskontroll. Den bruker MariaDB-estimater for aa unngaa Vercel timeout. Ingen kildedata migreres.",
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
