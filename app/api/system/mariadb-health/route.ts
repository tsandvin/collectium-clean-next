/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB Health Route
 *
 * Definering / formål:
 * Kontrollert API-rute for å teste at Next.js/Vercel kan lese fra eksisterende MariaDB.
 *
 * Bruksområde:
 * Brukes som teknisk MariaDB-koblingstest før MariaDB -> Neon kontroll og migrering.
 *
 * Berørte sider / routes:
 * - /api/system/mariadb-health
 *
 * Berørte DB-brytere / feature_keys:
 * - system.mariadb.health
 *
 * Berørte API-ruter:
 * - GET /api/system/mariadb-health
 *
 * Berørte tabeller / views:
 * - Ingen tabell. Leser kun SELECT 1 og DATABASE().
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js route -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: mariadb.health
 *
 * Versjon:
 * CT-FILE-MARIADB-HEALTH-0001
 *
 * Endringsregel:
 * Dette er en kontrollrute. Den skal ikke skrive data.
 */

import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

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

export async function GET() {
  const { missing, config } = getMariaDbConfig();

  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb",
        error: "MariaDB environment variables mangler.",
        missing,
      },
      { status: 500 }
    );
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

    return NextResponse.json({
      ok: true,
      source: "mariadb",
      connection: {
        variable_set: "CT_DB_*",
        write_test: false,
      },
      database: Array.isArray(rows) ? rows[0] : rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "mariadb",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
