/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Database Overview Route
 *
 * Definering / formål:
 * Samlet kontrollrute for MariaDB og Neon status i overgangsfasen.
 *
 * Bruksområde:
 * Brukes som første MariaDB vs Neon kontrollstatus før schema inventory, mapping og migrering.
 *
 * Berørte sider / routes:
 * - /api/system/db-overview
 *
 * Berørte DB-brytere / feature_keys:
 * - system.db.overview
 * - system.neon.health
 * - system.mariadb.health
 *
 * Berørte API-ruter:
 * - GET /api/system/db-overview
 *
 * Berørte tabeller / views:
 * - MariaDB: SELECT 1, DATABASE(), VERSION()
 * - Neon: SELECT now(), current_database(), current_user, version()
 *
 * Dataretning:
 * MariaDB + Neon -> API/backend -> Next.js route -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: db.overview
 *
 * Versjon:
 * CT-FILE-DB-OVERVIEW-0001
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

async function checkNeon() {
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

  const result = await sql`
    SELECT
      now() AS server_time,
      current_database() AS database_name,
      current_user AS database_user,
      version() AS postgres_version
  `;

  return {
    ok: true,
    source: "neon",
    connection: {
      variable: process.env.DATABASE_URL
        ? "DATABASE_URL"
        : process.env.neon_DATABASE_URL
          ? "neon_DATABASE_URL"
          : process.env.neon_POSTGRES_URL
            ? "neon_POSTGRES_URL"
            : "POSTGRES_URL",
      pooled: true,
    },
    database: result[0],
  };
}

async function checkMariaDb() {
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

    const [rows] = await connection.execute(
      "SELECT 1 AS ok, DATABASE() AS database_name, VERSION() AS mariadb_version"
    );

    return {
      ok: true,
      source: "mariadb",
      connection: {
        variable_set: "CT_DB_*",
        write_test: false,
      },
      database: Array.isArray(rows) ? rows[0] : rows,
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  const [neonResult, mariaDbResult] = await Promise.allSettled([
    checkNeon(),
    checkMariaDb(),
  ]);

  const neonStatus =
    neonResult.status === "fulfilled"
      ? neonResult.value
      : {
          ok: false,
          source: "neon",
          error:
            neonResult.reason instanceof Error
              ? neonResult.reason.message
              : "Unknown Neon error",
        };

  const mariaDbStatus =
    mariaDbResult.status === "fulfilled"
      ? mariaDbResult.value
      : {
          ok: false,
          source: "mariadb",
          error:
            mariaDbResult.reason instanceof Error
              ? mariaDbResult.reason.message
              : "Unknown MariaDB error",
        };

  const bothOk = Boolean(neonStatus.ok && mariaDbStatus.ok);

  return NextResponse.json({
    ok: bothOk,
    source: "db-overview",
    checked_at: checkedAt,
    status: {
      neon: neonStatus.ok ? "OK" : "ERROR",
      mariadb: mariaDbStatus.ok ? "OK" : "ERROR",
      migration_status: "not_started",
      neon_truth_status: "not_approved",
      next_step: bothOk ? "schema_inventory" : "fix_database_connection",
    },
    databases: {
      neon: neonStatus,
      mariadb: mariaDbStatus,
    },
    collectium_rule: {
      mariadb_current_role: "legacy_truth_and_control_archive",
      neon_current_role: "new_database_connected_not_yet_truth",
      migration_allowed: false,
      reason:
        "Neon er koblet, men ikke godkjent som sann hoveddatabase før schema inventory, mapping, radtelling, ID-kontroll, relasjoner, DB 8.4, auth/session, bruker/samling, admin/action-routes, sidekrav og innholdskrav er kontrollert.",
    },
  });
}
