/**
 * COLLECTIUM FILE HEADER
 * Fil: app/api/catalog/sample-objects/route.ts
 * Definering/formål:
 * - Viser eksempelobjekter fra MariaDB og Neon staging.
 * - Brukes til kontroll før full katalogoverføring.
 *
 * Bruksområde:
 * - /katalog/kontroll/eksempel
 * - /api/catalog/sample-objects?limit=10
 *
 * Berørte DB-brytere/feature_keys:
 * - catalog.sample_objects
 * - catalog.control_data
 * - migration.catalog_object_staging
 *
 * Berørte sider/routes:
 * - /katalog/kontroll/eksempel
 * - /api/catalog/sample-objects
 *
 * Viktig:
 * - Ruten migrerer ikke data.
 * - Ruten skriver ikke til MariaDB.
 * - Ruten godkjenner ikke Neon som truth.
 */

import mysql from "mysql2/promise";
import { Pool } from "pg";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MigrationTableMapRow = {
  source_key: string | null;
  object_group: string | null;
  source_table: string | null;
  mariadb_table_name: string | null;
  source_role: string | null;
  source_status: string | null;
  row_count: number | string | null;
};

type SampleGroup = {
  source_key: string;
  object_group: string;
  label_no: string;
  mariadb_table: string | null;
  neon_table: string;
  status: "OK" | "VARSEL" | "MANGLER" | "INFO";
  message_no: string;
  mariadb_samples: Array<Record<string, unknown>>;
  neon_samples: Array<Record<string, unknown>>;
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

async function getMariaDbColumns(conn: mysql.Connection, tableName: string): Promise<string[]> {
  const [rows] = await conn.query(
    `
      select column_name
      from information_schema.columns
      where table_schema = database()
        and table_name = ?
      order by ordinal_position
    `,
    [tableName]
  );

  return (rows as Array<{ column_name: string }>).map((row) => row.column_name);
}

function preferredColumnsForSource(sourceKey: string, objectGroup: string, columns: string[]): string[] {
  const wanted =
    sourceKey === "norske_mynter" && objectGroup === "coin"
      ? [
          "id",
          "source_key",
          "object_group",
          "source_catalog_number",
          "object_reference_key",
          "object_title_no",
          "collectium_title",
          "denomination_raw_no",
          "object_year_label",
          "object_year",
          "material_raw_no",
          "coin_image_path",
          "issue_period_label",
          "issue_start_year",
          "issue_end_year",
          "ruler_name_raw_no"
        ]
      : [
          "object_id",
          "source_key",
          "object_group",
          "source_catalog_number",
          "object_title_no",
          "denomination_raw_no",
          "object_year_label",
          "publication_year_label",
          "litra_raw_no",
          "denomination_issue_raw_no",
          "variant_type_raw_no",
          "signature_raw_no",
          "ruler_name_raw_no",
          "historical_ruler_raw_no",
          "country_raw_no",
          "obverse_image_path",
          "reverse_image_path"
        ];

  const available = wanted.filter((column) => columns.includes(column));

  if (available.length > 0) {
    return available;
  }

  return columns.slice(0, 14);
}

async function getMariaDbSamples(
  conn: mysql.Connection,
  sourceKey: string,
  objectGroup: string,
  tableName: string | null,
  limit: number
): Promise<Array<Record<string, unknown>>> {
  if (!tableName || tableName === "NO_MARIADB_SOURCE") return [];

  const exists = await mariaDbTableExists(conn, tableName);
  if (!exists) return [];

  const columns = await getMariaDbColumns(conn, tableName);
  const selectedColumns = preferredColumnsForSource(sourceKey, objectGroup, columns);

  if (selectedColumns.length === 0) return [];

  const selectList = selectedColumns
    .map((column) => escapeMariaDbIdentifier(column))
    .join(", ");

  const [rows] = await conn.query(
    `select ${selectList} from ${escapeMariaDbIdentifier(tableName)} limit ?`,
    [limit]
  );

  return rows as Array<Record<string, unknown>>;
}

async function neonStagingExists(pool: Pool): Promise<boolean> {
  const result = await pool.query(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'ct_migration_catalog_object_staging'
      ) as exists
    `
  );

  return Boolean(result.rows[0]?.exists);
}

async function getNeonSamples(
  pool: Pool,
  sourceKey: string,
  objectGroup: string,
  sourceTable: string | null,
  limit: number
): Promise<Array<Record<string, unknown>>> {
  const exists = await neonStagingExists(pool);
  if (!exists) return [];

  const result = await pool.query(
    `
      select
        source_system,
        source_key,
        object_group,
        source_table,
        source_object_id,
        source_row_id,
        source_catalog_number,
        object_reference_key,
        object_title_no,
        collectium_title,
        denomination_raw_no,
        object_year_label,
        object_year,
        material_raw_no,
        ruler_name_raw_no,
        source_row_hash
      from ct_migration_catalog_object_staging
      where source_key = $1
        and object_group = $2
        and source_table is not distinct from $3
      order by id
      limit $4
    `,
    [sourceKey, objectGroup, sourceTable, limit]
  );

  return result.rows as Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") || "10");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, limitParam)) : 10;

  const neonPool = new Pool({
    connectionString: getNeonConnectionString(),
    ssl: { rejectUnauthorized: false }
  });

  const mariaConn = await mysql.createConnection(getMariaDbConnectionOptions());

  try {
    await mariaConn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

    const tableMap = await getMigrationTableMap(neonPool);
    const groups: SampleGroup[] = [];

    for (const mapRow of tableMap) {
      const sourceKey = String(mapRow.source_key || "");
      const objectGroup = String(mapRow.object_group || "");
      const mariaTable = mapRow.mariadb_table_name || mapRow.source_table || null;

      if (sourceKey === "verdibrev" && objectGroup === "security") {
        groups.push({
          source_key: sourceKey,
          object_group: objectGroup,
          label_no: labelForSource(sourceKey, objectGroup),
          mariadb_table: mariaTable,
          neon_table: "ct_migration_catalog_object_staging",
          status: "INFO",
          message_no: "Verdibrev finnes ikke i MariaDB. Dette er Neon-first.",
          mariadb_samples: [],
          neon_samples: await getNeonSamples(neonPool, sourceKey, objectGroup, mapRow.source_table, limit)
        });
        continue;
      }

      const mariaSamples = await getMariaDbSamples(
        mariaConn,
        sourceKey,
        objectGroup,
        mariaTable,
        limit
      );

      const neonSamples = await getNeonSamples(
        neonPool,
        sourceKey,
        objectGroup,
        mapRow.source_table,
        limit
      );

      let status: SampleGroup["status"] = "OK";
      let message = "Eksempeldata finnes.";

      if (mariaSamples.length === 0) {
        status = "MANGLER";
        message = "Ingen MariaDB-eksempler funnet.";
      } else if (neonSamples.length === 0) {
        status = "VARSEL";
        message = "MariaDB-eksempler finnes, men Neon staging har ingen eksempelrader.";
      } else if (neonSamples.length < mariaSamples.length) {
        status = "VARSEL";
        message = "MariaDB og Neon staging har eksempler, men Neon har færre rader.";
      }

      groups.push({
        source_key: sourceKey,
        object_group: objectGroup,
        label_no: labelForSource(sourceKey, objectGroup),
        mariadb_table: mariaTable,
        neon_table: "ct_migration_catalog_object_staging",
        status,
        message_no: message,
        mariadb_samples: mariaSamples,
        neon_samples: neonSamples
      });
    }

    return NextResponse.json({
      ok: groups.every((group) => group.status === "OK" || group.status === "INFO"),
      source: "catalog-sample-objects",
      checked_at: new Date().toISOString(),
      limit,
      groups,
      collectium_rule: {
        migration_allowed: false,
        neon_truth_approval_allowed: false,
        reason:
          "Eksempelvisningen leser ti objekt-eksempler fra MariaDB og Neon staging. Den migrerer ikke data."
      }
    });
  } finally {
    await mariaConn.end();
    await neonPool.end();
  }
}
