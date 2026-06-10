/**
 * COLLECTIUM FILE HEADER
 * Fil: app/api/catalog/control-data/route.ts
 * Definering/formål:
 * - Enkel katalog-kontroll for MariaDB mot Neon staging.
 * - Leser MariaDB som kontrollarkiv og Neon som ny database/staging.
 *
 * Bruksområde:
 * - Brukes av /katalog/kontroll.
 * - Skal vise om katalogkilder finnes, hvor mange rader som finnes i MariaDB,
 *   hvor mange rader som er importert til Neon staging, og hva neste tiltak er.
 *
 * Berørte DB-brytere/feature_keys:
 * - catalog.control_data
 * - system.mariadb_neon.transfer_matrix
 * - migration.catalog_object_staging
 *
 * Berørte sider/routes:
 * - /katalog/kontroll
 * - /api/catalog/control-data
 *
 * Viktig:
 * - Denne ruten migrerer ikke data.
 * - Denne ruten skriver ikke til MariaDB.
 * - Denne ruten godkjenner ikke Neon som truth.
 */

import mysql from "mysql2/promise";
import { Pool } from "pg";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CatalogControlStatus = "OK" | "VARSEL" | "MANGLER" | "INFO";

type CatalogControlRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  label_no: string;
  mariadb_table: string | null;
  neon_table: string;
  mariadb_expected_rows: number | null;
  mariadb_actual_rows: number | null;
  neon_staging_rows: number | null;
  status: CatalogControlStatus;
  status_color: "green" | "yellow" | "red" | "blue";
  deviation_no: string;
  next_action_no: string;
};

type MigrationTableMapRow = {
  source_key: string | null;
  object_group: string | null;
  source_table: string | null;
  mariadb_table_name: string | null;
  source_role: string | null;
  source_status: string | null;
  row_count: number | string | null;
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

function escapeMariaDbIdentifier(identifier: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Ugyldig MariaDB-identifikator: ${identifier}`);
  }

  return `\`${identifier}\``;
}

function labelForSource(sourceKey: string, objectGroup: string): string {
  if (sourceKey === "norske_sedler" && objectGroup === "banknote") return "Norske sedler";
  if (sourceKey === "norske_mynter" && objectGroup === "coin") return "Norske mynter";
  if (sourceKey === "verdibrev" && objectGroup === "security") return "Verdibrev";
  return `${sourceKey} / ${objectGroup}`;
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
        row_count
      from ct_migration_table_map
      order by source_key, object_group, source_table
    `
  );

  return result.rows as MigrationTableMapRow[];
}

async function mariaDbTableExists(conn: mysql.Connection, tableName: string | null): Promise<boolean> {
  if (!tableName || tableName === "NO_MARIADB_SOURCE") return false;

  const [rows] = await conn.query(
    `
      select count(*) as found_count
      from information_schema.tables
      where table_schema = database()
        and table_name = ?
    `,
    [tableName]
  );

  const first = (rows as Array<{ found_count: number | string }>)[0];
  return Number(first?.found_count ?? 0) > 0;
}

async function countMariaDbRows(conn: mysql.Connection, tableName: string | null): Promise<number | null> {
  if (!tableName || tableName === "NO_MARIADB_SOURCE") return null;

  const exists = await mariaDbTableExists(conn, tableName);
  if (!exists) return null;

  const [rows] = await conn.query(
    `select count(*) as row_count from ${escapeMariaDbIdentifier(tableName)}`
  );

  const first = (rows as Array<{ row_count: number | string }>)[0];
  return Number(first?.row_count ?? 0);
}

async function neonTableExists(pool: Pool, tableName: string): Promise<boolean> {
  const result = await pool.query(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [tableName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function countNeonStagingRows(
  pool: Pool,
  sourceKey: string,
  objectGroup: string,
  sourceTable: string | null
): Promise<number | null> {
  const tableName = "ct_migration_catalog_object_staging";
  const exists = await neonTableExists(pool, tableName);

  if (!exists) return null;

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

function resolveControlStatus(input: {
  sourceKey: string;
  objectGroup: string;
  mariaTable: string | null;
  expectedRows: number | null;
  actualMariaRows: number | null;
  neonRows: number | null;
}): Pick<CatalogControlRow, "status" | "status_color" | "deviation_no" | "next_action_no"> {
  const { sourceKey, objectGroup, mariaTable, expectedRows, actualMariaRows, neonRows } = input;

  if (sourceKey === "verdibrev" && objectGroup === "security") {
    return {
      status: "INFO",
      status_color: "blue",
      deviation_no: "Verdibrev finnes ikke i MariaDB og er definert som Neon-first.",
      next_action_no: "Bygg Neon kilde-, filter- og objektstruktur når verdibrev skal inn."
    };
  }

  if (!mariaTable || mariaTable === "NO_MARIADB_SOURCE") {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "MariaDB-kilde mangler.",
      next_action_no: "Kontroller ct_migration_table_map."
    };
  }

  if (actualMariaRows === null) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "MariaDB-tabell finnes ikke eller kan ikke telles.",
      next_action_no: "Kontroller MariaDB-tabellnavn og mapping."
    };
  }

  if (neonRows === null) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "Neon staging-tabell finnes ikke eller kan ikke telles.",
      next_action_no: "Opprett/kontroller ct_migration_catalog_object_staging."
    };
  }

  if (actualMariaRows === neonRows && actualMariaRows > 0) {
    return {
      status: "OK",
      status_color: "green",
      deviation_no: "MariaDB og Neon staging samsvarer på radtall.",
      next_action_no: "Gå videre til ID-, relasjons- og filterkontroll."
    };
  }

  if (neonRows > 0) {
    return {
      status: "VARSEL",
      status_color: "yellow",
      deviation_no: `Delvis overført eller radtall avviker. MariaDB=${actualMariaRows}, Neon=${neonRows}.`,
      next_action_no: "Ikke godkjenn Neon truth. Kjør ren staging-import når import/UTF-8 er stabil."
    };
  }

  return {
    status: "MANGLER",
    status_color: "red",
    deviation_no: `Ikke overført. Forventet=${expectedRows ?? actualMariaRows}, Neon=0.`,
    next_action_no: "Kjør kontrollert testimport før full import."
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

    const tableMap = await getMigrationTableMap(neonPool);

    const rows: CatalogControlRow[] = [];

    for (const mapRow of tableMap) {
      const sourceKey = String(mapRow.source_key || "");
      const objectGroup = String(mapRow.object_group || "");
      const mariaTable = mapRow.mariadb_table_name || mapRow.source_table || null;
      const expectedRows = mapRow.row_count === null || mapRow.row_count === undefined ? null : Number(mapRow.row_count);
      const actualMariaRows = await countMariaDbRows(mariaConn, mariaTable);
      const neonRows = await countNeonStagingRows(neonPool, sourceKey, objectGroup, mapRow.source_table);

      const status = resolveControlStatus({
        sourceKey,
        objectGroup,
        mariaTable,
        expectedRows,
        actualMariaRows,
        neonRows
      });

      rows.push({
        line_no: rows.length + 1,
        source_key: sourceKey,
        object_group: objectGroup,
        label_no: labelForSource(sourceKey, objectGroup),
        mariadb_table: mariaTable,
        neon_table: "ct_migration_catalog_object_staging",
        mariadb_expected_rows: expectedRows,
        mariadb_actual_rows: actualMariaRows,
        neon_staging_rows: neonRows,
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
      source: "catalog-control-data",
      checked_at: new Date().toISOString(),
      summary,
      rows,
      collectium_rule: {
        migration_allowed: false,
        neon_truth_approval_allowed: false,
        reason:
          "Katalog-kontrollen sammenligner MariaDB-kilder med Neon staging. Den migrerer ikke data og godkjenner ikke Neon som truth."
      }
    });
  } finally {
    await mariaConn.end();
    await neonPool.end();
  }
}


