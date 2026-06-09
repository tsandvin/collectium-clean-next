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

type MariaUserCountRow = {
  table_name: string;
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

async function mariaTableExists(
  queryFn: (sql: string, params?: unknown[]) => Promise<unknown[]>,
  tableName: string,
): Promise<boolean> {
  const rows = (await queryFn(
    `
      select table_name
      from information_schema.tables
      where table_schema = database()
        and table_name = ?
      limit 1
    `,
    [tableName],
  )) as TableExistsRow[];

  return rows.length > 0;
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

async function countMariaTable(
  queryFn: (sql: string, params?: unknown[]) => Promise<unknown[]>,
  tableName: string,
): Promise<string | null> {
  if (!isSafeIdentifier(tableName)) {
    return null;
  }

  const rows = (await queryFn(`select count(*) as count_value from \`${tableName}\``)) as CountRow[];
  return toTextOrNull(rows[0]?.count_value);
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

    const importantUserTables = [
      "ct_users",
      "ct_user_profiles",
      "ct_user_sessions",
      "ct_user_roles",
      "ct_user_memberships",
      "ct_memberships",
      "ct_membership_plans",
      "ct_login_sessions",
      "ct_auth_login_attempts",
      "ct_login_attempts",
      "ds230c_users",
      "ds230c_usermeta",
      "dsf9f5_users",
      "dsf9f5_usermeta",
    ];

    const userTables: MariaUserCountRow[] = [];

    for (const tableName of importantUserTables) {
      if (await mariaTableExists(mariaQuery, tableName)) {
        userTables.push({
          table_name: tableName,
          count_value: await countMariaTable(mariaQuery, tableName),
        });
      }
    }

    const expectedIdentityMapTables = [
      "ct_migration_user_id_map",
      "ct_user_identity_map",
      "ct_legacy_user_identity_map",
      "ct_migration_object_id_map",
      "ct_object_identity_map",
    ];

    const identityMapChecks = [];

    for (const tableName of expectedIdentityMapTables) {
      const exists = await neonTableExists(tableName);
      identityMapChecks.push({
        table_name: tableName,
        neon_exists: exists,
        neon_rows: exists ? await countNeonTable(tableName) : null,
        status: exists ? "FOUND" : "MISSING",
        reason_no: exists
          ? "ID-mappingtabellen finnes i Neon."
          : "ID-mappingtabellen mangler i Neon. Må opprettes før bruker-, objekt- og relasjonsdata kan migreres trygt.",
      });
    }

    const missingIdentityMaps = identityMapChecks.filter((row) => row.status === "MISSING");

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "id-mapping-check",
      checked_at: new Date().toISOString(),
      status: {
        id_mapping_check: "inventory_started",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "relation_path_check",
      },
      maria_user_tables: userTables.map((row) => ({
        table_name: row.table_name,
        rows: toTextOrNull(row.count_value),
      })),
      identity_map_checks: identityMapChecks,
      missing_identity_map_count: String(missingIdentityMaps.length),
      blocking: missingIdentityMaps,
      collectium_rule: {
        write_allowed: false,
        migration_allowed: false,
        reason:
          "Bruker-, objekt- og relasjonsdata skal ikke migreres før ID mapping finnes. MariaDB ID og Neon ID må kunne kobles trygt.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "id-mapping-check",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown ID mapping check error",
    }), { status: 500 });
  }
}
