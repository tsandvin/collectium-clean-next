/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon Health Route
 *
 * Definering / formål:
 * Kontrollert API-rute for å teste at Next.js/Vercel kan lese fra Neon Postgres.
 *
 * Bruksområde:
 * Brukes som første tekniske Neon-koblingstest før MariaDB -> Neon migrering.
 *
 * Berørte sider / routes:
 * - /api/system/neon-health
 *
 * Berørte DB-brytere / feature_keys:
 * - system.neon.health
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-health
 *
 * Berørte tabeller / views:
 * - Ingen tabell. Leser kun Postgres serverstatus.
 *
 * Dataretning:
 * Neon Postgres -> API/backend -> Next.js route -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: neon.health
 *
 * Versjon:
 * CT-FILE-NEON-HEALTH-0001
 *
 * Endringsregel:
 * Dette er en kontrollrute. Den skal ikke skrive data.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.neon_DATABASE_URL ??
    process.env.neon_POSTGRES_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

export async function GET() {
  try {
    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          source: "neon",
          error:
            "Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
        },
        { status: 500 }
      );
    }

    const sql = neon(databaseUrl);

    const result = await sql`
      SELECT
        now() AS server_time,
        current_database() AS database_name,
        current_user AS database_user,
        version() AS postgres_version
    `;

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "neon",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
