import { NextRequest, NextResponse } from "next/server";
import mysql, { type ConnectionOptions } from "mysql2/promise";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TableMapRow = {
  source_key: string;
  object_group: string;
  source_table: string | null;
  source_role: string;
  source_status: string;
  row_count: number | null;
};

type FieldMapRow = {
  source_field: string;
  target_field: string;
  target_field_group: string;
  transform_rule: string;
  compare_rule: string;
  is_required: boolean;
  is_identity_field: boolean;
  is_relation_field: boolean;
  is_period_field: boolean;
  is_market_field: boolean;
};

type ImportMode = "preview" | "import";

const STAGING_COLUMNS = new Set([
  "source_object_id",
  "source_row_id",
  "source_catalog_number",
  "object_reference_key",
  "source_row_hash",
  "object_title_no",
  "collectium_title",
  "denomination_raw_no",
  "denomination_issue_raw_no",
  "variant_type_raw_no",
  "litra_raw_no",
  "signature_raw_no",
  "country_raw_no",
  "ruler_name_raw_no",
  "historical_ruler_raw_no",
  "object_year_label",
  "object_year",
  "publication_year_label",
  "issue_period_label",
  "issue_start_year",
  "issue_end_year",
  "material_raw_no",
  "obverse_image_path",
  "reverse_image_path",
  "coin_image_path",
  "market_value_grade_08_vg",
  "market_value_grade_15_cf",
  "market_value_grade_25_vf",
  "market_value_grade_35_cvf",
  "market_value_grade_45_xf",
  "market_value_grade_53_aunc",
  "market_value_grade_60_unc",
  "market_value_grade_63_cunc",
  "market_value_grade_65_gunc",
  "market_value_grade_67_sgunc"
]);

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getNeonUrl(): string {
  const url =
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error("Missing Neon/Postgres env var. Expected NEON_DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING or DATABASE_URL.");
  }

  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error("Database URL is not a Postgres/Neon URL.");
  }

  return url;
}

function getMariaDbConfig() {
  const url = process.env.MARIADB_URL || process.env.MYSQL_URL;

  if (url) {
    return url;
  }

  const host = process.env.MARIADB_HOST || process.env.MYSQL_HOST;
  const port = Number(process.env.MARIADB_PORT || process.env.MYSQL_PORT || 3306);
  const database = process.env.MARIADB_DATABASE || process.env.MYSQL_DATABASE;
  const user = process.env.MARIADB_USER || process.env.MYSQL_USER;
  const password = process.env.MARIADB_PASSWORD || process.env.MYSQL_PASSWORD;

  if (!host || !database || !user || !password) {
    throw new Error("Missing MariaDB env vars. Expected MARIADB_HOST, MARIADB_DATABASE, MARIADB_USER, MARIADB_PASSWORD or MARIADB_URL.");
  }

  return {
    host,
    port,
    database,
    user,
    password,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true
  };
}

function assertSafeIdentifier(value: string, label: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
}

function transformValue(value: unknown, rule: string): unknown {
  if (value === null || value === undefined) return null;

  if (rule === "cast_text") {
    return String(value);
  }

  if (rule === "integer") {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  if (rule === "decimal") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  return value;
}

async function getTableMap(pool: Pool, sourceKey: string, objectGroup: string): Promise<TableMapRow> {
  const result = await pool.query<TableMapRow>(
    `
      select
        source_key,
        object_group,
        source_table,
        source_role,
        source_status,
        row_count
      from public.ct_migration_table_map
      where source_system = 'mariadb'
        and target_system = 'neon'
        and source_key = $1
        and object_group = $2
        and is_active = true
        and source_role in ('primary_source', 'staging_source')
      order by
        case source_role
          when 'primary_source' then 1
          when 'staging_source' then 2
          else 9
        end
      limit 1
    `,
    [sourceKey, objectGroup]
  );

  if (!result.rows[0]) {
    throw new Error(`No active migration table map found for ${sourceKey}/${objectGroup}.`);
  }

  return result.rows[0];
}

async function getFieldMap(pool: Pool, sourceKey: string, objectGroup: string, sourceTable: string): Promise<FieldMapRow[]> {
  const result = await pool.query<FieldMapRow>(
    `
      select
        source_field,
        target_field,
        target_field_group,
        transform_rule,
        compare_rule,
        is_required,
        is_identity_field,
        is_relation_field,
        is_period_field,
        is_market_field
      from public.ct_migration_field_map
      where source_system = 'mariadb'
        and target_system = 'neon'
        and source_key = $1
        and object_group = $2
        and source_table = $3
        and is_active = true
        and migration_status = 'active'
      order by id
    `,
    [sourceKey, objectGroup, sourceTable]
  );

  if (result.rows.length === 0) {
    throw new Error(`No active field map found for ${sourceKey}/${objectGroup}/${sourceTable}.`);
  }

  return result.rows;
}

async function fetchMariaDbRows(sourceTable: string, fieldMap: FieldMapRow[], limit: number, offset: number) {
  assertSafeIdentifier(sourceTable, "source_table");

  for (const field of fieldMap) {
    assertSafeIdentifier(field.source_field, "source_field");
  }

  const fields = Array.from(new Set(fieldMap.map((field) => field.source_field)));
  const selectFields = fields.map((field) => `\`${field}\``).join(", ");

    const mariaConfig = getMariaDbConfig();
  const conn =
    typeof mariaConfig === "string"
      ? await mysql.createConnection(mariaConfig)
      : await mysql.createConnection(mariaConfig as ConnectionOptions);

  try {
    const [rows] = await conn.query(
      `select ${selectFields} from \`${sourceTable}\` limit ? offset ?`,
      [limit, offset]
    );

    return rows as Record<string, unknown>[];
  } finally {
    await conn.end();
  }
}

function buildStagingRow(
  sourceKey: string,
  objectGroup: string,
  sourceTable: string,
  fieldMap: FieldMapRow[],
  row: Record<string, unknown>
) {
  const staging: Record<string, unknown> = {
    source_system: "mariadb",
    source_key: sourceKey,
    object_group: objectGroup,
    source_table: sourceTable,
    payload_json: {
      original_row: row
    }
  };

  for (const map of fieldMap) {
    const transformed = transformValue(row[map.source_field], map.transform_rule);

    if (STAGING_COLUMNS.has(map.target_field)) {
      staging[map.target_field] = transformed;
    }
  }

  return staging;
}

async function upsertStagingRows(pool: Pool, rows: Record<string, unknown>[]) {
  let insertedOrUpdated = 0;

  for (const row of rows) {
    await pool.query(
      `
        insert into public.ct_migration_catalog_object_staging (
          source_system,
          source_key,
          object_group,
          source_table,

          source_object_id,
          source_row_id,
          source_catalog_number,
          object_reference_key,
          source_row_hash,

          object_title_no,
          collectium_title,

          denomination_raw_no,
          denomination_issue_raw_no,
          variant_type_raw_no,
          litra_raw_no,
          signature_raw_no,

          country_raw_no,
          ruler_name_raw_no,
          historical_ruler_raw_no,

          object_year_label,
          object_year,
          publication_year_label,
          issue_period_label,
          issue_start_year,
          issue_end_year,

          material_raw_no,

          obverse_image_path,
          reverse_image_path,
          coin_image_path,

          market_value_grade_08_vg,
          market_value_grade_15_cf,
          market_value_grade_25_vf,
          market_value_grade_35_cvf,
          market_value_grade_45_xf,
          market_value_grade_53_aunc,
          market_value_grade_60_unc,
          market_value_grade_63_cunc,
          market_value_grade_65_gunc,
          market_value_grade_67_sgunc,

          migration_status,
          review_status,
          compare_status,
          payload_json,
          notes_no,
          updated_at
        )
        values (
          $1,$2,$3,$4,
          $5,$6,$7,$8,$9,
          $10,$11,
          $12,$13,$14,$15,$16,
          $17,$18,$19,
          $20,$21,$22,$23,$24,$25,
          $26,
          $27,$28,$29,
          $30,$31,$32,$33,$34,$35,$36,$37,$38,$39,
          'staged',
          'pending',
          'not_checked',
          $40::jsonb,
          $41,
          now()
        )
        on conflict (
          source_system,
          source_key,
          object_group,
          source_table,
          coalesce(source_object_id, ''),
          coalesce(source_row_id, ''),
          coalesce(object_reference_key, '')
        )
        do update set
          source_catalog_number = excluded.source_catalog_number,
          source_row_hash = excluded.source_row_hash,
          object_title_no = excluded.object_title_no,
          collectium_title = excluded.collectium_title,
          denomination_raw_no = excluded.denomination_raw_no,
          denomination_issue_raw_no = excluded.denomination_issue_raw_no,
          variant_type_raw_no = excluded.variant_type_raw_no,
          litra_raw_no = excluded.litra_raw_no,
          signature_raw_no = excluded.signature_raw_no,
          country_raw_no = excluded.country_raw_no,
          ruler_name_raw_no = excluded.ruler_name_raw_no,
          historical_ruler_raw_no = excluded.historical_ruler_raw_no,
          object_year_label = excluded.object_year_label,
          object_year = excluded.object_year,
          publication_year_label = excluded.publication_year_label,
          issue_period_label = excluded.issue_period_label,
          issue_start_year = excluded.issue_start_year,
          issue_end_year = excluded.issue_end_year,
          material_raw_no = excluded.material_raw_no,
          obverse_image_path = excluded.obverse_image_path,
          reverse_image_path = excluded.reverse_image_path,
          coin_image_path = excluded.coin_image_path,
          market_value_grade_08_vg = excluded.market_value_grade_08_vg,
          market_value_grade_15_cf = excluded.market_value_grade_15_cf,
          market_value_grade_25_vf = excluded.market_value_grade_25_vf,
          market_value_grade_35_cvf = excluded.market_value_grade_35_cvf,
          market_value_grade_45_xf = excluded.market_value_grade_45_xf,
          market_value_grade_53_aunc = excluded.market_value_grade_53_aunc,
          market_value_grade_60_unc = excluded.market_value_grade_60_unc,
          market_value_grade_63_cunc = excluded.market_value_grade_63_cunc,
          market_value_grade_65_gunc = excluded.market_value_grade_65_gunc,
          market_value_grade_67_sgunc = excluded.market_value_grade_67_sgunc,
          payload_json = excluded.payload_json,
          notes_no = excluded.notes_no,
          updated_at = now()
      `,
      [
        row.source_system,
        row.source_key,
        row.object_group,
        row.source_table,

        row.source_object_id ?? null,
        row.source_row_id ?? null,
        row.source_catalog_number ?? null,
        row.object_reference_key ?? null,
        row.source_row_hash ?? null,

        row.object_title_no ?? null,
        row.collectium_title ?? null,

        row.denomination_raw_no ?? null,
        row.denomination_issue_raw_no ?? null,
        row.variant_type_raw_no ?? null,
        row.litra_raw_no ?? null,
        row.signature_raw_no ?? null,

        row.country_raw_no ?? null,
        row.ruler_name_raw_no ?? null,
        row.historical_ruler_raw_no ?? null,

        row.object_year_label ?? null,
        row.object_year ?? null,
        row.publication_year_label ?? null,
        row.issue_period_label ?? null,
        row.issue_start_year ?? null,
        row.issue_end_year ?? null,

        row.material_raw_no ?? null,

        row.obverse_image_path ?? null,
        row.reverse_image_path ?? null,
        row.coin_image_path ?? null,

        row.market_value_grade_08_vg ?? null,
        row.market_value_grade_15_cf ?? null,
        row.market_value_grade_25_vf ?? null,
        row.market_value_grade_35_cvf ?? null,
        row.market_value_grade_45_xf ?? null,
        row.market_value_grade_53_aunc ?? null,
        row.market_value_grade_60_unc ?? null,
        row.market_value_grade_63_cunc ?? null,
        row.market_value_grade_65_gunc ?? null,
        row.market_value_grade_67_sgunc ?? null,

        JSON.stringify(row.payload_json ?? {}),
        row.notes_no ?? null
      ]
    );

    insertedOrUpdated++;
  }

  return insertedOrUpdated;
}

async function countStaging(pool: Pool, sourceKey: string, objectGroup: string, sourceTable: string) {
  const result = await pool.query<{ count: string }>(
    `
      select count(*)::text as count
      from public.ct_migration_catalog_object_staging
      where source_system = 'mariadb'
        and source_key = $1
        and object_group = $2
        and source_table = $3
    `,
    [sourceKey, objectGroup, sourceTable]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function handleRequest(req: NextRequest) {
  const url = new URL(req.url);

  const mode = (url.searchParams.get("mode") || "preview") as ImportMode;
  const sourceKey = url.searchParams.get("source_key") || "norske_sedler";
  const objectGroup = url.searchParams.get("object_group") || "banknote";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 10), 1), 500);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  if (mode !== "preview" && mode !== "import") {
    return jsonResponse(
      {
        status: "ERROR",
        message: "Invalid mode. Use mode=preview or mode=import."
      },
      400
    );
  }

  const pool = new Pool({
    connectionString: getNeonUrl(),
    ssl: { rejectUnauthorized: false }
  });

  try {
    const tableMap = await getTableMap(pool, sourceKey, objectGroup);

    if (!tableMap.source_table) {
      throw new Error(`Source table is null for ${sourceKey}/${objectGroup}.`);
    }

    const fieldMap = await getFieldMap(pool, sourceKey, objectGroup, tableMap.source_table);
    const mariaRows = await fetchMariaDbRows(tableMap.source_table, fieldMap, limit, offset);

    const stagingRows = mariaRows.map((row) =>
      buildStagingRow(sourceKey, objectGroup, tableMap.source_table as string, fieldMap, row)
    );

    let importedRows = 0;

    if (mode === "import") {
      importedRows = await upsertStagingRows(pool, stagingRows);
    }

    const stagingCount = await countStaging(pool, sourceKey, objectGroup, tableMap.source_table);

    return jsonResponse({
      status: "OK",
      route: "/api/system/migration/import-catalog-staging",
      mode,
      source_key: sourceKey,
      object_group: objectGroup,
      source_table: tableMap.source_table,
      source_role: tableMap.source_role,
      source_status: tableMap.source_status,
      source_row_count_expected: tableMap.row_count,
      mapped_fields: fieldMap.length,
      fetched_from_mariadb: mariaRows.length,
      imported_to_neon_staging: importedRows,
      current_neon_staging_count: stagingCount,
      limit,
      offset,
      preview_rows: mode === "preview" ? stagingRows.slice(0, 5) : []
    });
  } finally {
    await pool.end();
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleRequest(req);
  } catch (error) {
    return jsonResponse(
      {
        status: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleRequest(req);
  } catch (error) {
    return jsonResponse(
      {
        status: "ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      500
    );
  }
}


