/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Neon Sync Schema Route
 *
 * Definering / formål:
 * Kontrollert overføring av schema-/inventory-informasjon fra MariaDB til Neon.
 * Ruten flytter kun metadata: tabellnavn, tabelltype, kolonneantall og migreringsstatus.
 *
 * Bruksområde:
 * Første trygge overføringssteg fra MariaDB til Neon etter bootstrap.
 * Brukes for å bygge table mapping, field mapping og migreringskontroll.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb_neon.sync_schema
 * - system.mariadb_neon.table_inventory
 * - system.migration.table_mapping.prepare
 *
 * Berørte API-ruter:
 * - GET  /api/system/mariadb-neon-sync-schema
 * - POST /api/system/mariadb-neon-sync-schema
 *
 * Berørte tabeller / views:
 * - MariaDB: information_schema.tables
 * - MariaDB: information_schema.columns
 * - Neon: ct_schema_inventory_runs
 * - Neon: ct_schema_inventory_tables
 *
 * Dataretning:
 * MariaDB information_schema -> API/backend -> Neon control tables
 *
 * Logging:
 * log_category: system
 * log_action: mariadb_neon.sync_schema
 *
 * Versjon:
 * CT-FILE-MARIADB-NEON-SYNC-SCHEMA-0001
 *
 * Endringsregel:
 * Denne ruten skriver bare kontrollmetadata til Neon.
 * Den migrerer ikke kildedata, brukere, katalogobjekter, priser eller samlingsdata.
 */

import mysql, { type RowDataPacket } from "mysql2/promise";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MariaTableRow = RowDataPacket & {
  table_name: string;
  table_type: string;
  column_count: number | string;
};

type ClassifiedTable = {
  table_name: string;
  table_type: string;
  column_count: number;
  migration_role: string;
  migration_status: string;
  suggested_action_no: string;
};

function getNeonDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.neon_DATABASE_URL ??
    process.env.neon_POSTGRES_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

function getMariaDbConfig() {
  const host = process.env.CT_DB_HOST;
  const database = process.env.CT_DB_NAME;
  const user = process.env.CT_DB_USER;
  const password = process.env.CT_DB_PASSWORD;
  const port = Number(process.env.CT_DB_PORT ?? 3306);

  if (!host || !database || !user || !password) {
    return null;
  }

  return {
    host,
    database,
    user,
    password,
    port,
  };
}

function isBackupOrTempTable(tableName: string) {
  const name = tableName.toLowerCase();

  return (
    name.startsWith("backup_") ||
    name.startsWith("bak_") ||
    name.includes("_backup") ||
    name.includes("before_") ||
    name.includes("_temp") ||
    name.includes("tmp_")
  );
}

function classifyTable(row: MariaTableRow): ClassifiedTable {
  const tableName = String(row.table_name);
  const tableType = String(row.table_type);
  const columnCount = Number(row.column_count ?? 0);
  const lower = tableName.toLowerCase();

  if (isBackupOrTempTable(tableName)) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "archive_or_backup",
      migration_status: "blocked",
      suggested_action_no:
        "Backup/temp/history-tabell skal ikke migreres som aktiv sannhet. Marker som arkiv eller ekskluder fra aktiv mapping.",
    };
  }

  if (tableType.toUpperCase().includes("VIEW")) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "source_view",
      migration_status: "needs_mapping",
      suggested_action_no:
        "Vurder som read_view/resolved view. Må kobles mot tilsvarende Neon-view eller API-kontrakt før migrering.",
    };
  }

  if (
    lower.includes("user") ||
    lower.includes("session") ||
    lower.includes("auth") ||
    lower.includes("member") ||
    lower.includes("profile")
  ) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "identity_or_membership",
      migration_status: "needs_auth_privacy_review",
      suggested_action_no:
        "Må vurderes separat for auth/session/personvern/ID-mapping før noen brukerdata flyttes.",
    };
  }

  if (
    lower.includes("catalog") ||
    lower.includes("banknote") ||
    lower.includes("coin") ||
    lower.includes("object") ||
    lower.includes("source")
  ) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "catalog_source",
      migration_status: "needs_source_mapping",
      suggested_action_no:
        "Må kobles mot source_key + object_group + object_id og table/field mapping før dataflytting.",
    };
  }

  if (
    lower.includes("auction") ||
    lower.includes("bid") ||
    lower.includes("shop") ||
    lower.includes("market") ||
    lower.includes("price")
  ) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "market_or_channel",
      migration_status: "needs_process_mapping",
      suggested_action_no:
        "Må kobles mot marked, auksjon, nettbutikk, prisobservasjoner og prosesslogg før dataflytting.",
    };
  }

  if (lower.startsWith("ct_")) {
    return {
      table_name: tableName,
      table_type: tableType,
      column_count: columnCount,
      migration_role: "collectium_control_or_domain",
      migration_status: "needs_mapping",
      suggested_action_no:
        "Collectium-tabell. Må vurderes mot DB 8.4-kjede, feature/action-route eller domenemodell.",
    };
  }

  return {
    table_name: tableName,
    table_type: tableType,
    column_count: columnCount,
    migration_role: "source_table",
    migration_status: "needs_mapping",
    suggested_action_no:
      "Kandidat for mapping. Må ha målstruktur, field mapping, radtelling og ID-kontroll før migrering.",
  };
}

async function ensureNeonTables(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS ct_schema_inventory_runs (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      source_database text NOT NULL,
      target_database text NOT NULL,
      run_status text NOT NULL DEFAULT 'completed',
      migration_allowed boolean NOT NULL DEFAULT false,
      source_data_migration_allowed boolean NOT NULL DEFAULT false,
      total_tables integer NOT NULL DEFAULT 0,
      base_tables integer NOT NULL DEFAULT 0,
      views integer NOT NULL DEFAULT 0,
      blocked_tables integer NOT NULL DEFAULT 0,
      needs_mapping integer NOT NULL DEFAULT 0,
      payload_json jsonb NOT NULL DEFAULT '{}'::jsonb
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ct_schema_inventory_tables (
      id bigserial PRIMARY KEY,
      run_id bigint NOT NULL REFERENCES ct_schema_inventory_runs(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      source_database text NOT NULL,
      source_table_name text NOT NULL,
      source_table_type text NOT NULL,
      source_column_count integer NOT NULL DEFAULT 0,
      migration_role text NOT NULL,
      migration_status text NOT NULL,
      suggested_action_no text NOT NULL,
      source_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_ct_schema_inventory_tables_run_id
    ON ct_schema_inventory_tables(run_id)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_ct_schema_inventory_tables_name
    ON ct_schema_inventory_tables(source_table_name)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_ct_schema_inventory_tables_status
    ON ct_schema_inventory_tables(migration_status)
  `;
}

async function readMariaDbTables() {
  const config = getMariaDbConfig();

  if (!config) {
    throw new Error(
      "MariaDB miljøvariabler mangler. Krever CT_DB_HOST, CT_DB_NAME, CT_DB_USER og CT_DB_PASSWORD."
    );
  }

  const connection = await mysql.createConnection(config);

  try {
    const [rows] = await connection.query<MariaTableRow[]>(`
      SELECT
        t.TABLE_NAME AS table_name,
        t.TABLE_TYPE AS table_type,
        COUNT(c.COLUMN_NAME) AS column_count
      FROM information_schema.TABLES t
      LEFT JOIN information_schema.COLUMNS c
        ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
       AND c.TABLE_NAME = t.TABLE_NAME
      WHERE t.TABLE_SCHEMA = DATABASE()
      GROUP BY t.TABLE_NAME, t.TABLE_TYPE
      ORDER BY t.TABLE_NAME
    `);

    return {
      database_name: config.database,
      rows,
    };
  } finally {
    await connection.end();
  }
}

export async function GET() {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-sync-schema",
        error:
          "Neon Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
      },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);
    await ensureNeonTables(sql);

    const runs = await sql`
      SELECT
        id,
        created_at,
        source_database,
        target_database,
        run_status,
        total_tables,
        base_tables,
        views,
        blocked_tables,
        needs_mapping,
        migration_allowed,
        source_data_migration_allowed
      FROM ct_schema_inventory_runs
      ORDER BY id DESC
      LIMIT 10
    `;

    const latestRunId = runs[0]?.id ?? null;

    const tables = latestRunId
      ? await sql`
          SELECT
            id,
            run_id,
            source_table_name,
            source_table_type,
            source_column_count,
            migration_role,
            migration_status,
            suggested_action_no
          FROM ct_schema_inventory_tables
          WHERE run_id = ${latestRunId}
          ORDER BY source_table_name
          LIMIT 100
        `
      : [];

    return NextResponse.json({
      ok: true,
      source: "mariadb-neon-sync-schema",
      method_for_sync: "POST",
      checked_at: new Date().toISOString(),
      latest_run_id: latestRunId,
      runs,
      latest_tables_sample: tables,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Denne ruten viser bare schema-inventory metadata som er overført til Neon. Den flytter ikke kildedata.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-sync-schema",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-sync-schema",
        error:
          "Neon Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
      },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);
    await ensureNeonTables(sql);

    const maria = await readMariaDbTables();
    const classified = maria.rows.map(classifyTable);

    const totalTables = classified.length;
    const baseTables = classified.filter((item) =>
      item.table_type.toUpperCase().includes("BASE TABLE")
    ).length;
    const views = classified.filter((item) =>
      item.table_type.toUpperCase().includes("VIEW")
    ).length;
    const blockedTables = classified.filter(
      (item) => item.migration_status === "blocked"
    ).length;
    const needsMapping = classified.filter((item) =>
      item.migration_status.includes("needs")
    ).length;

    const runRows = await sql`
      INSERT INTO ct_schema_inventory_runs (
        source_database,
        target_database,
        run_status,
        migration_allowed,
        source_data_migration_allowed,
        total_tables,
        base_tables,
        views,
        blocked_tables,
        needs_mapping,
        payload_json
      )
      VALUES (
        ${maria.database_name},
        ${"neon.public"},
        ${"completed"},
        ${false},
        ${false},
        ${totalTables},
        ${baseTables},
        ${views},
        ${blockedTables},
        ${needsMapping},
        ${JSON.stringify({
          note: "Schema metadata only. No source rows migrated.",
          source: "information_schema",
        })}
      )
      RETURNING id, created_at
    `;

    const runId = runRows[0].id;

    for (const item of classified) {
      await sql`
        INSERT INTO ct_schema_inventory_tables (
          run_id,
          source_database,
          source_table_name,
          source_table_type,
          source_column_count,
          migration_role,
          migration_status,
          suggested_action_no,
          source_payload_json
        )
        VALUES (
          ${runId},
          ${maria.database_name},
          ${item.table_name},
          ${item.table_type},
          ${item.column_count},
          ${item.migration_role},
          ${item.migration_status},
          ${item.suggested_action_no},
          ${JSON.stringify({
            table_name: item.table_name,
            table_type: item.table_type,
            column_count: item.column_count,
          })}
        )
      `;
    }

    return NextResponse.json({
      ok: true,
      source: "mariadb-neon-sync-schema",
      status: {
        sync_status: "completed",
        run_id: runId,
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "table_mapping",
      },
      summary: {
        total_tables: totalTables,
        base_tables: baseTables,
        views,
        blocked_tables: blockedTables,
        needs_mapping: needsMapping,
      },
      sample: classified.slice(0, 30),
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_schema_inventory_metadata_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Kun schema-/inventory-metadata er skrevet til Neon. Ingen kildedata, brukere, katalogobjekter, priser eller samlingsdata er migrert.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb-neon-sync-schema",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
