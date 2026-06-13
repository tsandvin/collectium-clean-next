/**
 * COLLECTIUM FILE HEADER
 * Overskrift:
 * MariaDB - Neon Postgres transfer matrix API
 *
 * Definering / formål:
 * - Viser overføringsstatus fra MariaDB-kilder til Neon Postgres staging.
 * - Viser også regel-/metodelaget fra ct_migration_source_rules / ct_v_migration_transfer_matrix_full.
 * - Skiller mellom kilde- og radstatus, regler, metoder, blokkering og truth-godkjenning.
 *
 * Bruksområde:
 * - Brukes av MariaDB - Neon Postgres Control.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte API-ruter:
 * - GET /api/system/mariadb-neon-transfer-matrix
 *
 * Berørte tabeller / views:
 * - Neon: ct_migration_table_map
 * - Neon: ct_migration_source_rules
 * - Neon: ct_v_migration_transfer_matrix_full
 * - Neon: ct_migration_catalog_object_staging
 * - MariaDB: fysiske kilde-/legacy-tabeller definert i ct_migration_table_map
 *
 * Dataretning:
 * MariaDB read-only + Neon -> API/backend -> Next.js -> React -> UI
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

type TransferStatus = "OK" | "VARSEL" | "MANGLER" | "INFO";
type TransferStatusColor = "green" | "yellow" | "red" | "blue";

type TableMapRow = {
  source_key: string | null;
  object_group: string | null;
  source_table: string | null;
  mariadb_table_name: string | null;
  canonical_catalog_table: string | null;
  physical_mariadb_source: string | null;
  legacy_table_name: string | null;
  source_role: string | null;
  source_status: string | null;
  row_count: number | string | null;
  notes_no: string | null;
};

type SourceRuleRow = {
  source_key: string;
  object_group: string;
  source_role: string;
  source_role_label: string;
  primary_source_table: string | null;
  legacy_control_source: string | null;
  neon_target_table: string | null;
  import_method: string;
  mapping_rule: string;
  validation_rule: string;
  utf8_rule: string;
  id_rule: string;
  relation_rule: string;
  filter_rule: string;
  migration_allowed: boolean;
  truth_approval_allowed: boolean;
  status: string;
  blocking_level: string;
  next_action: string | null;
  notes: string | null;
};

type TransferRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  canonical_catalog_table: string | null;
  physical_mariadb_source: string | null;
  legacy_table_name: string | null;
  source_role: string | null;
  source_role_label: string;
  source_status: string | null;
  mariadb_table: string | null;
  neon_table: string;
  mariadb_exists: boolean;
  neon_exists: boolean;
  mariadb_rows: number | null;
  neon_rows: number | null;
  status: TransferStatus;
  status_color: TransferStatusColor;
  deviation_no: string;
  next_action_no: string;
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
    host:
      process.env.CT_DB_HOST ||
      process.env.MARIADB_HOST ||
      process.env.MYSQL_HOST ||
      process.env.DB_HOST,
    port: Number(
      process.env.CT_DB_PORT ||
        process.env.MARIADB_PORT ||
        process.env.MYSQL_PORT ||
        process.env.DB_PORT ||
        3306
    ),
    database:
      process.env.CT_DB_NAME ||
      process.env.CT_DB_DATABASE ||
      process.env.MARIADB_DATABASE ||
      process.env.MYSQL_DATABASE ||
      process.env.DB_NAME,
    user:
      process.env.CT_DB_USER ||
      process.env.MARIADB_USER ||
      process.env.MYSQL_USER ||
      process.env.DB_USER,
    password:
      process.env.CT_DB_PASSWORD ||
      process.env.MARIADB_PASSWORD ||
      process.env.MYSQL_PASSWORD ||
      process.env.DB_PASSWORD,
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

function sourceRoleLabel(sourceRole: string | null): string {
  if (sourceRole === "primary_import" || sourceRole === "primary_source") return "Primær importkilde";
  if (sourceRole === "legacy_control" || sourceRole === "legacy_resolved_table") return "Kontrollkilde";
  if (sourceRole === "neon_first") return "Neon-first kilde";
  if (sourceRole === "staging_source") return "Stagingkilde";
  if (sourceRole === "control_source") return "Kontrollkilde";
  return sourceRole || "Ukjent rolle";
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

async function neonViewExists(pool: Pool, viewName: string): Promise<boolean> {
  const result = await pool.query(
    `
      select exists (
        select 1
        from information_schema.views
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [viewName]
  );

  return Boolean(result.rows[0]?.exists);
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

async function countNeonStagingRows(
  pool: Pool,
  sourceKey: string,
  objectGroup: string,
  sourceTable: string | null
): Promise<number | null> {
  const exists = await neonTableExists(pool, "ct_migration_catalog_object_staging");
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

async function countMariaDbObjects(conn: mysql.Connection): Promise<number> {
  const [rows] = await conn.query(
    `
      select count(*) as object_count
      from information_schema.tables
      where table_schema = database()
        and table_type in ('BASE TABLE', 'VIEW')
    `
  );

  const first = (rows as Array<{ object_count: number | string }>)[0];
  return Number(first?.object_count ?? 0);
}

async function countNeonObjects(pool: Pool): Promise<number> {
  const result = await pool.query(
    `
      select count(*)::int as object_count
      from (
        select table_name
        from information_schema.tables
        where table_schema = 'public'

        union all

        select table_name
        from information_schema.views
        where table_schema = 'public'
      ) x
    `
  );

  return Number(result.rows[0]?.object_count ?? 0);
}

function resolveStatus(input: {
  sourceKey: string;
  objectGroup: string;
  sourceRole: string | null;
  sourceStatus: string | null;
  mariaTable: string | null;
  mariaRows: number | null;
  neonRows: number | null;
}): Pick<TransferRow, "status" | "status_color" | "deviation_no" | "next_action_no"> {
  const { sourceKey, objectGroup, sourceRole, sourceStatus, mariaTable, mariaRows, neonRows } = input;

  if (sourceRole === "neon_first" || mariaTable === "NO_MARIADB_SOURCE") {
    return {
      status: "INFO",
      status_color: "blue",
      deviation_no: "Kilden finnes ikke i MariaDB og er definert som Neon-first.",
      next_action_no: "Opprett Neon kilde-/filter-/objektstruktur når denne objektgruppen skal bygges."
    };
  }

  if (
    sourceRole === "legacy_control" ||
    sourceRole === "legacy_resolved_table" ||
    sourceStatus === "control_only"
  ) {
    return {
      status: "INFO",
      status_color: "blue",
      deviation_no: "Legacy/resolved kontrollkilde. Skal ikke brukes som primær importkilde.",
      next_action_no: "Bruk kun som kontroll mot primær fysisk kilde og kanonisk katalogmapping."
    };
  }

  if (!mariaTable) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "MariaDB-kilde mangler i mapping.",
      next_action_no: "Kontroller ct_migration_table_map."
    };
  }

  if (mariaRows === null) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "MariaDB-tabell finnes ikke eller kan ikke telles.",
      next_action_no: "Kontroller fysisk MariaDB-kilde og mapping."
    };
  }

  if (neonRows === null) {
    return {
      status: "MANGLER",
      status_color: "red",
      deviation_no: "Neon staging-tabell finnes ikke eller kan ikke telles.",
      next_action_no: "Kontroller ct_migration_catalog_object_staging."
    };
  }

  if (mariaRows === neonRows && mariaRows > 0) {
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
      deviation_no: `Delvis overført eller radtall avviker. MariaDB=${mariaRows}, Neon=${neonRows}.`,
      next_action_no: "Kjør kontrollert import/row-count-sjekk før truth-godkjenning."
    };
  }

  return {
    status: "MANGLER",
    status_color: "red",
    deviation_no: `Ikke overført. MariaDB=${mariaRows}, Neon=0.`,
    next_action_no:
      sourceKey === "norske_sedler" && objectGroup === "banknote"
        ? "Kjør staging-import fra primary_source ct_import_banknote_catalog_objects_csv når import/UTF-8 er stabil."
        : "Kjør staging-import etter at import-ruten er stabil."
  };
}

async function loadSourceRules(pool: Pool): Promise<SourceRuleRow[]> {
  const fullViewExists = await neonViewExists(pool, "ct_v_migration_transfer_matrix_full");

  if (fullViewExists) {
    const result = await pool.query(
      `
        select
          source_key,
          object_group,
          source_role,
          coalesce(source_role_label, source_role) as source_role_label,
          primary_source_table,
          legacy_control_source,
          neon_target_table,
          import_method,
          mapping_rule,
          validation_rule,
          utf8_rule,
          id_rule,
          relation_rule,
          filter_rule,
          migration_allowed,
          truth_approval_allowed,
          status,
          blocking_level,
          next_action,
          notes
        from ct_v_migration_transfer_matrix_full
        order by
          case status
            when 'MANGLER' then 1
            when 'VARSEL' then 2
            when 'MÅ_DEFINERES' then 3
            when 'INFO' then 4
            when 'OK' then 5
            else 9
          end,
          source_key,
          object_group,
          source_role
      `
    );

    return result.rows.map((row, index) => ({
      line_no: index + 1,
      source_key: String(row.source_key || ""),
      object_group: String(row.object_group || ""),
      source_role: String(row.source_role || ""),
      source_role_label: String(row.source_role_label || row.source_role || ""),
      primary_source_table: row.primary_source_table,
      legacy_control_source: row.legacy_control_source,
      neon_target_table: row.neon_target_table,
      import_method: String(row.import_method || "not_defined"),
      mapping_rule: String(row.mapping_rule || "not_defined"),
      validation_rule: String(row.validation_rule || "not_defined"),
      utf8_rule: String(row.utf8_rule || "not_defined"),
      id_rule: String(row.id_rule || "not_defined"),
      relation_rule: String(row.relation_rule || "not_defined"),
      filter_rule: String(row.filter_rule || "not_defined"),
      migration_allowed: Boolean(row.migration_allowed),
      truth_approval_allowed: Boolean(row.truth_approval_allowed),
      status: String(row.status || "INFO"),
      blocking_level: String(row.blocking_level || "BLOKKERT"),
      next_action: row.next_action,
      notes: row.notes
    }));
  }

  const tableExists = await neonTableExists(pool, "ct_migration_source_rules");
  if (!tableExists) return [];

  const result = await pool.query(
    `
      select
        source_key,
        object_group,
        source_role,
        primary_source_table,
        legacy_control_source,
        neon_target_table,
        import_method,
        mapping_rule,
        validation_rule,
        utf8_rule,
        id_rule,
        relation_rule,
        filter_rule,
        migration_allowed,
        truth_approval_allowed,
        status,
        blocking_level,
        next_action,
        notes
      from ct_migration_source_rules
      order by source_key, object_group, source_role
    `
  );

  return result.rows.map((row, index) => ({
    line_no: index + 1,
    source_key: String(row.source_key || ""),
    object_group: String(row.object_group || ""),
    source_role: String(row.source_role || ""),
    source_role_label: sourceRoleLabel(row.source_role),
    primary_source_table: row.primary_source_table,
    legacy_control_source: row.legacy_control_source,
    neon_target_table: row.neon_target_table,
    import_method: String(row.import_method || "not_defined"),
    mapping_rule: String(row.mapping_rule || "not_defined"),
    validation_rule: String(row.validation_rule || "not_defined"),
    utf8_rule: String(row.utf8_rule || "not_defined"),
    id_rule: String(row.id_rule || "not_defined"),
    relation_rule: String(row.relation_rule || "not_defined"),
    filter_rule: String(row.filter_rule || "not_defined"),
    migration_allowed: Boolean(row.migration_allowed),
    truth_approval_allowed: Boolean(row.truth_approval_allowed),
    status: String(row.status || "INFO"),
    blocking_level: String(row.blocking_level || "BLOKKERT"),
    next_action: row.next_action,
    notes: row.notes
  }));
}

export async function GET() {
  const neonPool = new Pool({
    connectionString: getNeonConnectionString(),
    ssl: { rejectUnauthorized: false }
  });

  const mariaConn = await mysql.createConnection(getMariaDbConnectionOptions());

  try {
    await mariaConn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

    const mapExists = await neonTableExists(neonPool, "ct_migration_table_map");
    const sourceRules = await loadSourceRules(neonPool);

    if (!mapExists) {
      return NextResponse.json({
        ok: false,
        source: "mariadb-neon-transfer-matrix",
        checked_at: new Date().toISOString(),
        summary: {
          total: 0,
          ok: 0,
          varsel: 0,
          mangler: 1,
          info: 0,
          rules_defined: sourceRules.length,
          methods_defined: sourceRules.filter((row) => row.import_method !== "not_defined").length,
          migration_allowed: sourceRules.filter((row) => row.migration_allowed).length,
          truth_approval_allowed: sourceRules.filter((row) => row.truth_approval_allowed).length,
          blocked: sourceRules.filter((row) => row.blocking_level !== "OK").length
        },
        database_summary: {
          mariadb_table_or_view_count: await countMariaDbObjects(mariaConn),
          neon_table_or_view_count: await countNeonObjects(neonPool)
        },
        rows: [],
        source_rules: sourceRules,
        error_no: "ct_migration_table_map mangler i Neon."
      });
    }

    const mapResult = await neonPool.query(
      `
        select
          source_key,
          object_group,
          source_table,
          mariadb_table_name,
          canonical_catalog_table,
          physical_mariadb_source,
          legacy_table_name,
          source_role,
          source_status,
          row_count,
          notes_no
        from ct_migration_table_map
        order by source_key, object_group,
          case source_role
            when 'staging_source' then 1
            when 'primary_source' then 2
            when 'primary_import' then 2
            when 'legacy_control' then 3
            when 'legacy_resolved_table' then 3
            when 'control_source' then 4
            when 'neon_first' then 5
            else 9
          end,
          source_table
      `
    );

    const mapRows = mapResult.rows as TableMapRow[];
    const neonStagingExists = await neonTableExists(neonPool, "ct_migration_catalog_object_staging");
    const rows: TransferRow[] = [];

    for (const mapRow of mapRows) {
      const sourceKey = String(mapRow.source_key || "");
      const objectGroup = String(mapRow.object_group || "");
      const mariaTable = mapRow.mariadb_table_name || mapRow.source_table || null;

      const mariaExists = await mariaDbTableExists(mariaConn, mariaTable);
      const mariaRows = await countMariaDbRows(mariaConn, mariaTable);
      const neonRows = await countNeonStagingRows(
        neonPool,
        sourceKey,
        objectGroup,
        mapRow.source_table
      );

      const status = resolveStatus({
        sourceKey,
        objectGroup,
        sourceRole: mapRow.source_role,
        sourceStatus: mapRow.source_status,
        mariaTable,
        mariaRows,
        neonRows
      });

      rows.push({
        line_no: rows.length + 1,
        source_key: sourceKey,
        object_group: objectGroup,
        canonical_catalog_table: mapRow.canonical_catalog_table,
        physical_mariadb_source: mapRow.physical_mariadb_source,
        legacy_table_name: mapRow.legacy_table_name,
        source_role: mapRow.source_role,
        source_role_label: sourceRoleLabel(mapRow.source_role),
        source_status: mapRow.source_status,
        mariadb_table: mariaTable,
        neon_table: "ct_migration_catalog_object_staging",
        mariadb_exists: mariaExists,
        neon_exists: neonStagingExists,
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
      {
        total: 0,
        ok: 0,
        varsel: 0,
        mangler: 0,
        info: 0,
        rules_defined: sourceRules.length,
        methods_defined: sourceRules.filter((row) => row.import_method !== "not_defined").length,
        migration_allowed: sourceRules.filter((row) => row.migration_allowed).length,
        truth_approval_allowed: sourceRules.filter((row) => row.truth_approval_allowed).length,
        blocked: sourceRules.filter((row) => row.blocking_level !== "OK").length
      }
    );

    return NextResponse.json({
      ok:
        summary.mangler === 0 &&
        summary.varsel === 0 &&
        summary.migration_allowed === 0 &&
        summary.truth_approval_allowed === 0,
      source: "mariadb-neon-transfer-matrix",
      checked_at: new Date().toISOString(),
      summary,
      rows,
      source_rules: sourceRules,
      database_summary: {
        mariadb_table_or_view_count: await countMariaDbObjects(mariaConn),
        neon_table_or_view_count: await countNeonObjects(neonPool)
      },
      collectium_rule: {
        migration_allowed: false,
        neon_truth_approval_allowed: false,
        reason:
          "Overføringsmatrisen viser kilde-/radstatus og regel-/metodelaget. Den migrerer ikke data og kan ikke truth-godkjenne Neon."
      }
    });
  } finally {
    await mariaConn.end();
    await neonPool.end();
  }
}
