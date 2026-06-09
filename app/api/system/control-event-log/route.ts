/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Control Event Log Route
 *
 * Definering / formål:
 * API-rute for å logge kontrollhendelser fra admin/system-sider.
 *
 * Bruksområde:
 * Brukes når en bruker/admin trykker på faner, brytere, knapper eller routes,
 * og systemet må logge OK, INFO, VARSEL, FEIL, BLOKKERT eller KRITISK.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.control_event_log.view
 * - system.control_event_log.write
 * - system.mariadb_neon.control
 *
 * Berørte API-ruter:
 * - GET  /api/system/control-event-log
 * - POST /api/system/control-event-log
 *
 * Berørte tabeller / views:
 * - Neon: ct_control_event_logs
 *
 * Dataretning:
 * React/admin UI -> API/backend -> Neon Postgres kontrolltabell -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: control_event_log.write
 *
 * Versjon:
 * CT-FILE-CONTROL-EVENT-LOG-ROUTE-0001
 *
 * Endringsregel:
 * Denne ruten logger kun kontrollhendelser. Den migrerer ikke kildedata.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type EventStatus = "OK" | "INFO" | "VARSEL" | "FEIL" | "BLOKKERT" | "KRITISK";

type ControlEventInput = {
  event_source?: string;
  event_type?: string;
  route_path?: string;
  button_key?: string;
  tab_key?: string;
  feature_key?: string;
  action_route?: string;
  http_method?: string;
  status?: EventStatus;
  severity?: string;
  message_no?: string;
  suggested_fix_no?: string;
  payload_json?: unknown;
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

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeStatus(value: unknown): EventStatus {
  if (
    value === "OK" ||
    value === "INFO" ||
    value === "VARSEL" ||
    value === "FEIL" ||
    value === "BLOKKERT" ||
    value === "KRITISK"
  ) {
    return value;
  }

  return "INFO";
}

async function ensureTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS ct_control_event_logs (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      event_source text NOT NULL DEFAULT 'frontend',
      event_type text NOT NULL DEFAULT 'control_event',
      route_path text,
      button_key text,
      tab_key text,
      feature_key text,
      action_route text,
      http_method text,
      status text NOT NULL DEFAULT 'INFO',
      severity text NOT NULL DEFAULT 'info',
      message_no text NOT NULL,
      suggested_fix_no text,
      payload_json jsonb NOT NULL DEFAULT '{}'::jsonb
    )
  `;
}

export async function GET() {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        source: "control-event-log",
        error:
          "Neon Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
      },
      { status: 500 }
    );
  }

  try {
    const sql = neon(databaseUrl);
    await ensureTable(sql);

    const rows = await sql`
      SELECT
        id,
        created_at,
        event_source,
        event_type,
        route_path,
        button_key,
        tab_key,
        feature_key,
        action_route,
        http_method,
        status,
        severity,
        message_no,
        suggested_fix_no,
        payload_json
      FROM ct_control_event_logs
      ORDER BY id DESC
      LIMIT 100
    `;

    const summaryRows = await sql`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM ct_control_event_logs
      GROUP BY status
      ORDER BY status
    `;

    return NextResponse.json({
      ok: true,
      source: "control-event-log",
      checked_at: new Date().toISOString(),
      summary: summaryRows,
      events: rows,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Dette er kontrollhendelseslogg. Den logger frontend/admin/system-hendelser og migrerer ikke kildedata.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "control-event-log",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const databaseUrl = getNeonDatabaseUrl();

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        source: "control-event-log",
        error:
          "Neon Database URL mangler. Fant ikke DATABASE_URL, neon_DATABASE_URL, neon_POSTGRES_URL eller POSTGRES_URL.",
      },
      { status: 500 }
    );
  }

  try {
    const input = (await request.json()) as ControlEventInput;
    const sql = neon(databaseUrl);
    await ensureTable(sql);

    const eventSource = normalizeText(input.event_source, "frontend");
    const eventType = normalizeText(input.event_type, "control_event");
    const routePath = normalizeText(input.route_path, "/admin/system/mariadb-neon");
    const buttonKey = normalizeText(input.button_key, "");
    const tabKey = normalizeText(input.tab_key, "");
    const featureKey = normalizeText(input.feature_key, "");
    const actionRoute = normalizeText(input.action_route, "");
    const httpMethod = normalizeText(input.http_method, "");
    const status = normalizeStatus(input.status);
    const severity = normalizeText(input.severity, status.toLowerCase());
    const messageNo = normalizeText(input.message_no, "Kontrollhendelse registrert.");
    const suggestedFixNo = normalizeText(input.suggested_fix_no, "Ingen tiltak.");
    const payloadJson = input.payload_json ?? {};

    const rows = await sql`
      INSERT INTO ct_control_event_logs (
        event_source,
        event_type,
        route_path,
        button_key,
        tab_key,
        feature_key,
        action_route,
        http_method,
        status,
        severity,
        message_no,
        suggested_fix_no,
        payload_json
      )
      VALUES (
        ${eventSource},
        ${eventType},
        ${routePath},
        ${buttonKey || null},
        ${tabKey || null},
        ${featureKey || null},
        ${actionRoute || null},
        ${httpMethod || null},
        ${status},
        ${severity},
        ${messageNo},
        ${suggestedFixNo},
        ${JSON.stringify(payloadJson)}
      )
      RETURNING id, created_at, status, message_no
    `;

    return NextResponse.json({
      ok: true,
      source: "control-event-log",
      event: rows[0],
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_control_event_logs_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "control-event-log",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
