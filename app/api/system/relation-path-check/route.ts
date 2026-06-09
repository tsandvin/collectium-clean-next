import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TableExistsRow = {
  table_name: string;
};

type CountRow = {
  count_value: unknown;
};

type MariaRelationTableRow = {
  table_name: string;
  table_type: string;
  table_rows: unknown;
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

function isSafeIdentifier(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name);
}

async function neonTableExists(tableName: string): Promise<boolean> {
  const rows = await neonQuery<TableExistsRow>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
      limit 1
    `,
    [tableName],
  );

  return rows.length > 0;
}

async function countNeonTable(tableName: string): Promise<string | null> {
  if (!isSafeIdentifier(tableName)) {
    return null;
  }

  const rows = await neonQuery<CountRow>(`select count(*)::text as count_value from "${tableName}"`);
  return toTextOrNull(rows[0]?.count_value);
}

export async function GET() {
  try {
    const mariaQuery = await getMariaDbQueryFunction();

    const mariaRelationTables = (await mariaQuery(`
      select
        table_name,
        table_type,
        cast(coalesce(table_rows, 0) as char) as table_rows
      from information_schema.tables
      where table_schema = database()
        and (
          table_name like '%relation%'
          or table_name like '%relations%'
          or table_name like '%link%'
          or table_name like '%links%'
          or table_name like '%bridge%'
          or table_name like '%ruler%'
          or table_name like '%historical%'
          or table_name like '%person%'
          or table_name like '%producer%'
          or table_name like '%source%'
        )
      order by table_name
    `)) as MariaRelationTableRow[];

    const expectedNeonRelationControlTables = [
      "ct_relation_type_registry",
      "ct_relation_path_registry",
      "ct_relation_missing_links",
      "ct_source_inventory",
      "ct_object_group_inventory",
      "ct_object_inventory_summary",
    ];

    const neonControlChecks = [];

    for (const tableName of expectedNeonRelationControlTables) {
      const exists = await neonTableExists(tableName);
      neonControlChecks.push({
        table_name: tableName,
        neon_exists: exists,
        neon_rows: exists ? await countNeonTable(tableName) : null,
        status: exists ? "FOUND" : "MISSING",
        reason_no: exists
          ? "Relasjons-/inventory-kontrolltabellen finnes i Neon."
          : "Relasjons-/inventory-kontrolltabellen mangler i Neon.",
      });
    }

    const relationCandidates = mariaRelationTables.map((row) => {
      const name = String(row.table_name);
      const lower = name.toLowerCase();

      let relation_type:
        | "object_relation"
        | "person_relation"
        | "ruler_relation"
        | "historical_relation"
        | "producer_relation"
        | "source_relation"
        | "bridge_or_link"
        | "manual_review" = "manual_review";

      if (lower.includes("object")) {
        relation_type = "object_relation";
      } else if (lower.includes("person")) {
        relation_type = "person_relation";
      } else if (lower.includes("ruler")) {
        relation_type = "ruler_relation";
      } else if (lower.includes("historical")) {
        relation_type = "historical_relation";
      } else if (lower.includes("producer")) {
        relation_type = "producer_relation";
      } else if (lower.includes("source")) {
        relation_type = "source_relation";
      } else if (lower.includes("link") || lower.includes("bridge")) {
        relation_type = "bridge_or_link";
      }

      return {
        source_table: name,
        source_type: String(row.table_type),
        source_rows_estimate: toTextOrNull(row.table_rows),
        relation_type,
        neon_exists: false,
        status: "SOURCE_RELATION_FOUND",
        reason_no:
          "MariaDB har relasjons-/link-/bridge-kandidat. Må kobles til Neon relation registry før datamigrering.",
      };
    });

    const missingControl = neonControlChecks.filter((row) => row.status === "MISSING");

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-path-check",
      checked_at: new Date().toISOString(),
      status: {
        relation_path_check: "inventory_started",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "db84_chain_check",
      },
      neon_relation_control: neonControlChecks,
      missing_neon_relation_control_count: String(missingControl.length),
      maria_relation_candidate_count: String(relationCandidates.length),
      maria_relation_candidates: relationCandidates.slice(0, 160),
      blocking: missingControl,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Relasjoner må være definert som kontrollerte path/registry-koblinger før katalog-, person-, konge-, kilde-, produsent- og samlingsdata kan migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-path-check",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown relation path check error",
    }), { status: 500 });
  }
}
