import mysql from "mysql2/promise";
import { Pool } from "pg";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TransferStatus = "OK" | "VARSEL" | "MANGLER" | "INFO";

type TransferRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  mariadb_table: string | null;
  neon_table: string | null;
  mariadb_exists: boolean;
  neon_exists: boolean;
  mariadb_rows: number | null;
  neon_rows: number | null;
  status: TransferStatus;
  status_color: "green" | "yellow" | "red" | "blue";
  deviation_no: string;
  next_action_no: string;
};

type MigrationTableMapRow = {
  source_key: string | null;
  object_group: string | null;
  source_table: string | null;
  mariadb_table_name?: string | null;
  source_role?: string | null;
  source_status?: string | null;
  row_count?: number | string | null;
  notes_no?: string | null;
};

function getNeonConnectionString(): string {
  const value =
    process.env.NEON_DATABASE_URL ||
    process.env.neon_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;

  if (!value) {
    throw new Error("Neon env mangler. Bruk DATABASE_URL eller neon_DATABASE_URL.");
  }

  return value;
}

function getMariaDbConnectionOptions(): mysql.ConnectionOptions {
  return {
    host: process.env.CT_DB_HOST || process.env.MARIADB_HOST || process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.CT_DB_PORT || process.env.MARIADB_PORT || process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    database: process.env.CT_DB_NAME || process.env.CT_DB_DATABASE || process.env.MARIADB_DATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME,
    user: process.env.CT_DB_USER || process.env.MARIADB_USER || process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.CT_DB_PASSWORD || process.env.MARIADB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    charset: "utf8mb4",
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true
  };
}

function escapeIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Ugyldig SQL-identifikator: ${identifier}`);
  }

  return `\`${identifier}\``;
}

async function getMariaDbTables(conn: mysql.Connection): Promise<Set<string>> {
  const [rows] = await conn.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = database()
    `
  );

  return new Set(
    (rows as Array<{ table_name: string }>).map((row) => row.table_name)
  );
}

async function countMariaDbRows(
  conn: mysql.Connection,
  tableName: string | null
): Promise<number | null> {
  if (!tableName || tableName === "NO_MARIADB_SOURCE") {
    return null;
  }

  try {
    const [rows] = await conn.query(
      `select count(*) as row_count from ${escapeIdentifier(tableName)}`
    );

    const first = (rows as Array<{ row_count: number | string }>)[0];
    return Number(first?.row_count ?? 0);
  } catch {
    return null;
  }
}

async function getNeonTables(pool: Pool): Promise<Set<string>> {
  const result = await pool.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
    `
  );

  return new Set(result.rows.map((row) => String(row.table_name)));
}

async function getMigrationTableMap(pool: Pool): Promise<MigrationTableMapRow[]> {
  const exists = await pool.query(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'ct_migration_table_map'
      ) as exists
    `
  );

  if (!exists.rows[0]?.exists) {
    return [];
  }

  const result = await pool.query(
    `
      select
        source_key,
        object_group,
        source_table,
        mariadb_table_name,
        source_role,
        source_status,
        row_count,
        notes_no
      from ct_migration_table_map
      order by source_key, object_group, source_table
    `
  );

  return result.rows as MigrationTableMapRow[];
}

async function countNeonStagingRows(
  pool: Pool,
  sourceKey: string,
  objectGroup: string,
  sourceTable: string | null
): Promise<number | null> {
  const exists = await pool.query(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'ct_migration_catalog_object_staging'
      ) as exists
    `
  );

  if (!exists.rows[0]?.exists) {
    return null;
  }

  const result = await pool.query(
    `
      select count(*)::int as row_count
      from ct_migration_catalog_object_staging
      where source_key = $1
        and object_group = $2
        and source_table is not distinct from $3
    `,
    [sourceKey, objectGroup, sourceTable]
  );

  return Number(result.rows[0]?.row_count ?? 0);
}

function resolveStatus(input: {
  mariadbTable: string | null;
  neonTable: string | null;
  mariadbExists: boolean;
  neonExists: boolean;
  mariaRows: number | null;
  neonRows: number | null;
}): Pick<TransferRow, "status" | "status_color" | "deviation_no" | "next_action_no"> {
  const { mariadbTable, neonTable, mariadbExists, neonExists, mariaRows, neonRows } = input;

  if (!mariadbTable || mariadbTable === "NO_MARIADB_SOURCE") {
    return {
      status: "INFO",
      status_color: "blue",
      deviation_no: "Kilden finnes ikke i MariaDB og er definert som Neon-first.",
      next_action_no: "Opprett Neon kilde-/filter-/objektstruktur når denne objektgruppen skal bygges."
    };
  }

  if (!mariadbExists) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "MariaDB-tabell finnes ikke.",
      next_action_no: "Kontroller ct_migration_table_map eller MariaDB schema."
    };
  }

  if (!neonTable || !neonExists) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "Neon-måltabell finnes ikke.",
      next_action_no: "Opprett Neon staging-/måltabell før import."
    };
  }

  if (mariaRows !== null && neonRows !== null && mariaRows === neonRows) {
    return {
      status: "OK",
      status_color: "green",
      deviation_no: "MariaDB og Neon samsvarer på radtall.",
      next_action_no: "Kan gå videre til ID-, relasjons- og filterkontroll."
    };
  }

  if (neonRows !== null && neonRows > 0) {
    return {
      status: "VARSEL",
      status_color: "yellow",
      deviation_no: `Delvis overført eller radtall avviker. MariaDB=${mariaRows ?? "ukjent"}, Neon=${neonRows}.`,
      next_action_no: "Kjør kontrollert import/row-count-sjekk før truth-godkjenning."
    };
  }

  return {
    status: "MANGLER",
    status_color: "red",
    deviation_no: `Ikke overført. MariaDB=${mariaRows ?? "ukjent"}, Neon=${neonRows ?? 0}.`,
    next_action_no: "Kjør staging-import etter at UTF-8/import-ruten er stabil."
  };
}

export async function GET() {
  const neonPool = new Pool({
    connectionString: getNeonConnectionString(),
    ssl: { rejectUnauthorized: false }
  });

  const mariaConn = await mysql.createConnection(getMariaDbConnectionOptions());

  try {
    await mariaConn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

    const [mariaTables, neonTables, tableMap] = await Promise.all([
      getMariaDbTables(mariaConn),
      getNeonTables(neonPool),
      getMigrationTableMap(neonPool)
    ]);

    const rows: TransferRow[] = [];

    for (const mapRow of tableMap) {
      const sourceKey = String(mapRow.source_key || "");
      const objectGroup = String(mapRow.object_group || "");
      const mariaTable =
        mapRow.mariadb_table_name ||
        mapRow.source_table ||
        null;

      const neonTable = "ct_migration_catalog_object_staging";

      const mariadbExists =
        !!mariaTable &&
        mariaTable !== "NO_MARIADB_SOURCE" &&
        mariaTables.has(mariaTable);

      const neonExists = neonTables.has(neonTable);

      const mariaRows =
        typeof mapRow.row_count === "number"
          ? mapRow.row_count
          : mapRow.row_count
            ? Number(mapRow.row_count)
            : await countMariaDbRows(mariaConn, mariaTable);

      const neonRows =
        sourceKey && objectGroup
          ? await countNeonStagingRows(neonPool, sourceKey, objectGroup, mapRow.source_table || null)
          : null;

      const status = resolveStatus({
        mariadbTable: mariaTable,
        neonTable,
        mariadbExists,
        neonExists,
        mariaRows,
        neonRows
      });

      rows.push({
        line_no: rows.length + 1,
        source_key: sourceKey,
        object_group: objectGroup,
        mariadb_table: mariaTable,
        neon_table: neonTable,
        mariadb_exists: mariadbExists,
        neon_exists: neonExists,
        mariadb_rows: mariaRows,
        neon_rows: neonRows,
        ...status
      });
    }

    const summary = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.status === "OK") acc.ok += 1;
        if (row.status === "VARSEL") acc.varsel += 1;
        if (row.status === "MANGLER") acc.mangler += 1;
        if (row.status === "INFO") acc.info += 1;
        return acc;
      },
      { total: 0, ok: 0, varsel: 0, mangler: 0, info: 0 }
    );

    return NextResponse.json({
      ok: summary.mangler === 0 && summary.varsel === 0,
      source: "mariadb-neon-transfer-matrix",
      checked_at: new Date().toISOString(),
      summary,
      rows,
      database_summary: {
        mariadb_table_or_view_count: mariaTables.size,
        neon_table_or_view_count: neonTables.size
      },
      collectium_rule: {
        migration_allowed: false,
        neon_truth_approval_allowed: false,
        reason:
          "Overføringsmatrisen viser om MariaDB-kilder har tilsvarende Neon-staging/mål og om radtall samsvarer. Den migrerer ikke data."
      }
    });
  } finally {
    await mariaConn.end();
    await neonPool.end();
  }
}

