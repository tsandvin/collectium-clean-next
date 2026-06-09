/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Schema Inventory Route
 *
 * Definering / formål:
 * Leser metadata fra MariaDB og Neon for å telle tabeller, views og kolonner før migrering.
 *
 * Bruksområde:
 * Brukes som første schema-inventory i MariaDB vs Neon-kontrollen.
 *
 * Berørte sider / routes:
 * - /api/system/schema-inventory
 *
 * Berørte DB-brytere / feature_keys:
 * - system.schema.inventory
 * - system.db.overview
 *
 * Berørte API-ruter:
 * - GET /api/system/schema-inventory
 *
 * Berørte tabeller / views:
 * - MariaDB information_schema.tables
 * - MariaDB information_schema.columns
 * - Neon information_schema.tables
 * - Neon information_schema.columns
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> Next.js route -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: schema.inventory
 *
 * Versjon:
 * CT-FILE-SCHEMA-INVENTORY-0001
 *
 * Endringsregel:
 * Dette er en kontrollrute. Den skal ikke skrive data.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

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
  const port = Number(process.env.CT_DB_PORT ?? "3306");
  const database = process.env.CT_DB_NAME;
  const user = process.env.CT_DB_USER;
  const password = process.env.CT_DB_PASSWORD;

  const missing = [
    ["CT_DB_HOST", host],
    ["CT_DB_NAME", database],
    ["CT_DB_USER", user],
    ["CT_DB_PASSWORD", password],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    missing,
    config: {
      host,
      port,
      database,
      user,
      password,
    },
  };
}

async function getMariaDbInventory() {
  const { missing, config } = getMariaDbConfig();

  if (missing.length > 0) {
    return {
      ok: false,
      source: "mariadb",
      error: "MariaDB environment variables mangler.",
      missing,
    };
  }

  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      connectTimeout: 10000,
    });

    const [summaryRows] = await connection.execute(
      `
      SELECT
        SUM(CASE WHEN table_type = 'BASE TABLE' THEN 1 ELSE 0 END) AS table_count,
        SUM(CASE WHEN table_type = 'VIEW' THEN 1 ELSE 0 END) AS view_count
      FROM information_schema.tables
      WHERE table_schema = ?
      `,
      [config.database]
    );

    const [columnRows] = await connection.execute(
      `
      SELECT COUNT(*) AS column_count
      FROM information_schema.columns
      WHERE table_schema = ?
      `,
      [config.database]
    );

    const [sampleTables] = await connection.execute(
      `
      SELECT
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = ?
      ORDER BY table_name
      LIMIT 50
      `,
      [config.database]
    );

    return {
      ok: true,
      source: "mariadb",
      database_name: config.database,
      summary: {
        ...(Array.isArray(summaryRows) ? summaryRows[0] : {}),
        ...(Array.isArray(columnRows) ? columnRows[0] : {}),
      },
      sample_tables: sampleTables,
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function getNeonInventory() {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return {
      ok: false,
      source: "neon",
      error:
        "Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
    };
  }

  const sql = neon(databaseUrl);

  const summaryRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE table_type = 'BASE TABLE') AS table_count,
      COUNT(*) FILTER (WHERE table_type = 'VIEW') AS view_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;

  const columnRows = await sql`
    SELECT COUNT(*) AS column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `;

  const sampleTables = await sql`
    SELECT
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
    LIMIT 50
  `;

  return {
    ok: true,
    source: "neon",
    database_name: "public",
    summary: {
      ...summaryRows[0],
      ...columnRows[0],
    },
    sample_tables: sampleTables,
  };
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  const [mariaDbResult, neonResult] = await Promise.allSettled([
    getMariaDbInventory(),
    getNeonInventory(),
  ]);

  const mariadb =
    mariaDbResult.status === "fulfilled"
      ? mariaDbResult.value
      : {
          ok: false,
          source: "mariadb",
          error:
            mariaDbResult.reason instanceof Error
              ? mariaDbResult.reason.message
              : "Unknown MariaDB schema inventory error",
        };

  const neon =
    neonResult.status === "fulfilled"
      ? neonResult.value
      : {
          ok: false,
          source: "neon",
          error:
            neonResult.reason instanceof Error
              ? neonResult.reason.message
              : "Unknown Neon schema inventory error",
        };

  const bothOk = Boolean(mariadb.ok && neon.ok);

  return NextResponse.json({
    ok: bothOk,
    source: "schema-inventory",
    checked_at: checkedAt,
    status: {
      mariadb: mariadb.ok ? "OK" : "ERROR",
      neon: neon.ok ? "OK" : "ERROR",
      inventory_status: bothOk ? "inventory_started" : "inventory_failed",
      migration_status: "not_started",
      neon_truth_status: "not_approved",
      next_step: bothOk ? "table_mapping" : "fix_schema_inventory",
    },
    inventory: {
      mariadb,
      neon,
    },
    collectium_rule: {
      write_allowed: false,
      migration_allowed: false,
      reason:
        "Dette er bare schema-inventory. Ingen data skal migreres før table mapping, row count, ID mapping, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
    },
  });
}
