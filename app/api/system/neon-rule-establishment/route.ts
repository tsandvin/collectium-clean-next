/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon Rule Establishment API
 *
 * Definering / formål:
 * Leser live Neon-regelkontroll for første godkjenningsscope i MariaDB -> Neon-overgangen.
 * Første scope er Norske sedler / banknote.
 *
 * Bruksområde:
 * Brukes av admin/system/mariadb-neon for å vise om Neon-kontrolltabeller,
 * source scope registry og truth gate faktisk finnes i Neon.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - GET /api/system/neon-rule-establishment
 * - POST /api/system/neon-rule-establishment
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.neon_rule_establishment.view
 * - admin.system.neon_rule_establishment.run
 * - admin.system.neon_rule_establishment.approve
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-rule-establishment
 * - POST /api/system/neon-rule-establishment
 *
 * Berørte tabeller / views:
 * - Neon: ct_neon_rule_control_runs
 * - Neon: ct_neon_rule_control_steps
 * - Neon: ct_neon_rule_control_findings
 * - Neon: ct_neon_rule_establishment_registry
 * - Neon: ct_neon_rule_source_scope_registry
 * - Neon: ct_neon_rule_truth_gate
 *
 * Dataretning:
 * Neon regelstatus -> Next.js API -> Admin UI
 *
 * Logging:
 * log_category: system.mariadb_neon
 * log_action: neon_rule_establishment.live_check
 *
 * Versjon:
 * CT-API-0002 / CHANGE-2026-06-10-0002
 *
 * Endringsregel:
 * Denne route-filen erstatter testrespons med live Neon-lesing.
 * POST er fortsatt blokkert til admin-session og MariaDB read-only-verifikasjon er koblet.
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Status = "OK" | "VARSEL" | "FEIL" | "BLOKKERT" | "INFO";

const ROUTE = "/api/system/neon-rule-establishment";
const SOURCE_KEY = "norske_sedler";
const OBJECT_GROUP = "banknote";
const CANONICAL_NEON_TABLE = "ct_no_banknote_catalog";

const REQUIRED_NEON_TABLES = [
  "ct_neon_rule_control_runs",
  "ct_neon_rule_control_steps",
  "ct_neon_rule_control_findings",
  "ct_neon_rule_establishment_registry",
  "ct_neon_rule_source_scope_registry",
  "ct_neon_rule_truth_gate",
] as const;

function getDatabaseUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null
  );
}

function statusFromBoolean(ok: boolean): Status {
  return ok ? "OK" : "FEIL";
}

function normalizeStatus(value: unknown, fallback: Status): Status {
  const text = String(value || "").toLowerCase();

  if (text === "ok") return "OK";
  if (text === "varsel" || text === "warning") return "VARSEL";
  if (text === "feil" || text === "error") return "FEIL";
  if (text === "blokkert" || text === "blocked") return "BLOKKERT";
  if (text === "info") return "INFO";

  return fallback;
}

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return jsonResponse(
      {
        ok: false,
        route: ROUTE,
        mode: "live_neon_check",
        error: "missing_database_url",
        neon_sql: {
          status: "BLOKKERT",
          detail:
            "Mangler DATABASE_URL, POSTGRES_URL eller NEON_DATABASE_URL i Vercel/local env.",
        },
        rule_gate: {
          truth_status: "not_approved",
          migration_allowed: false,
        },
        svar_til_chatgpt: [
          "NEON RULE ESTABLISHMENT LIVE CHECK:",
          "Database URL: MANGLER",
          "Neon SQL: BLOKKERT",
          "Migration allowed: false",
          "Next: legg Neon connection string i Vercel environment variables.",
        ].join("\n"),
      },
      500
    );
  }

  try {
    const sql = neon(databaseUrl);

    const tableRows = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any(${REQUIRED_NEON_TABLES})
      order by table_name
    `;

    const foundTables = tableRows.map((row) => String(row.table_name));
    const missingTables = REQUIRED_NEON_TABLES.filter(
      (tableName) => !foundTables.includes(tableName)
    );

    const scopeRows = await sql`
      select
        id,
        source_key,
        object_group,
        canonical_neon_table,
        source_scope,
        scope_status,
        migration_allowed,
        detail,
        created_at,
        updated_at
      from public.ct_neon_rule_source_scope_registry
      where source_key = ${SOURCE_KEY}
        and object_group = ${OBJECT_GROUP}
      limit 1
    `;

    const truthRows = await sql`
      select
        id,
        source_key,
        object_group,
        canonical_neon_table,
        truth_status,
        structure_status,
        rules_status,
        source_data_status,
        mariadb_verification_status,
        migration_allowed,
        detail,
        created_at,
        updated_at
      from public.ct_neon_rule_truth_gate
      where source_key = ${SOURCE_KEY}
        and object_group = ${OBJECT_GROUP}
      limit 1
    `;

    const scope = scopeRows[0] || null;
    const truth = truthRows[0] || null;

    const tablesOk = missingTables.length === 0;
    const scopeOk =
      !!scope &&
      scope.source_key === SOURCE_KEY &&
      scope.object_group === OBJECT_GROUP &&
      scope.canonical_neon_table === CANONICAL_NEON_TABLE;

    const truthGateExists = !!truth;
    const migrationAllowed = Boolean(truth?.migration_allowed);
    const truthStatus = String(truth?.truth_status || "not_approved");

    const structureStatus = normalizeStatus(truth?.structure_status, "VARSEL");
    const rulesStatus = normalizeStatus(truth?.rules_status, "VARSEL");
    const sourceDataStatus = normalizeStatus(
      truth?.source_data_status,
      "BLOKKERT"
    );
    const mariadbStatus = normalizeStatus(
      truth?.mariadb_verification_status,
      "BLOKKERT"
    );

    const ok =
      tablesOk &&
      scopeOk &&
      truthGateExists &&
      truthStatus === "approved" &&
      migrationAllowed === true &&
      mariadbStatus === "OK";

    return jsonResponse({
      ok,
      route: ROUTE,
      mode: "live_neon_check",
      source_key: SOURCE_KEY,
      object_group: OBJECT_GROUP,
      canonical_neon_table: CANONICAL_NEON_TABLE,

      neon_sql: {
        status: statusFromBoolean(tablesOk),
        control_tables_required: REQUIRED_NEON_TABLES.length,
        control_tables_found: foundTables.length,
        found_tables: foundTables,
        missing_tables: missingTables,
        detail: tablesOk
          ? "Alle Neon rule-control tabeller finnes i public schema."
          : "En eller flere Neon rule-control tabeller mangler.",
      },

      scope_registry: {
        status: statusFromBoolean(scopeOk),
        row: scope,
        detail: scopeOk
          ? "Scope registry er koblet til norske_sedler / banknote."
          : "Scope registry mangler eller peker feil.",
      },

      truth_gate: {
        status:
          truthGateExists && !migrationAllowed ? "BLOKKERT" : statusFromBoolean(ok),
        row: truth,
        truth_status: truthStatus,
        migration_allowed: migrationAllowed,
        detail: truthGateExists
          ? "Truth gate finnes. Migration allowed styres av Neon/MariaDB-godkjenning."
          : "Truth gate mangler for norske_sedler / banknote.",
      },

      mariadb_verification: {
        required: true,
        mode: "read-only",
        status: mariadbStatus,
        detail:
          "MariaDB read-only-verifikasjon må kobles før Neon kan godkjennes som sannhet.",
      },

      rule_gate: {
        structure_status: structureStatus,
        rules_status: rulesStatus,
        source_data_status: sourceDataStatus,
        truth_status: truthStatus,
        migration_allowed: migrationAllowed,
      },

      steps: [
        {
          id: "NR-001",
          label: "SQL for Neon-regelkontrolltabeller",
          status: tablesOk ? "OK" : "FEIL",
          detail: tablesOk
            ? "Alle forventede Neon-kontrolltabeller finnes."
            : "Mangler Neon-kontrolltabeller.",
          blocking: !tablesOk,
        },
        {
          id: "NR-002",
          label: "API-route /api/system/neon-rule-establishment",
          status: "OK",
          detail: "Route er live og leser Neon.",
          blocking: false,
        },
        {
          id: "NR-003",
          label: "Scope Norske sedler / banknote",
          status: scopeOk ? "OK" : "FEIL",
          detail: scopeOk
            ? "source_key=norske_sedler, object_group=banknote, canonical table=ct_no_banknote_catalog."
            : "Scope mangler eller peker feil.",
          blocking: !scopeOk,
        },
        {
          id: "NR-004",
          label: "Truth gate",
          status: truthGateExists ? "BLOKKERT" : "FEIL",
          detail: truthGateExists
            ? "Truth gate finnes og holder migrering blokkert til godkjenning."
            : "Truth gate mangler.",
          blocking: true,
        },
        {
          id: "NR-005",
          label: "MariaDB read-only verifikasjon",
          status: mariadbStatus,
          detail:
            "Må kobles til eksisterende MariaDB-sjekk før kildedata eller flere katalogområder mappes.",
          blocking: mariadbStatus !== "OK",
        },
      ],

      test_object: {
        source_key: SOURCE_KEY,
        object_group: OBJECT_GROUP,
        object_id: 1459,
        title: "Testobjekt · Norske sedler · banknote · 1459",
        relation_key_rule: "object_id + object_group + source_key",
        filter_key_rule: "source_key + object_group + filter_field + filter_value",
      },

      svar_til_chatgpt: [
        "NEON RULE ESTABLISHMENT LIVE CHECK:",
        `Route: ${ROUTE}`,
        `Mode: live_neon_check`,
        `Scope: source_key=${SOURCE_KEY}, object_group=${OBJECT_GROUP}`,
        `Canonical Neon table: ${CANONICAL_NEON_TABLE}`,
        `Neon control tables: ${foundTables.length}/${REQUIRED_NEON_TABLES.length}`,
        `Scope registry: ${scopeOk ? "OK" : "FEIL"}`,
        `Truth status: ${truthStatus}`,
        `Migration allowed: ${migrationAllowed}`,
        `MariaDB read-only verification: ${mariadbStatus}`,
        "Next: koble MariaDB read-only kontroll før approval.",
      ].join("\n"),

      next_step:
        "Koble MariaDB read-only-verifikasjon. Ikke åpne migration_allowed før MariaDB, logging, rules og truth gate er OK.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse(
      {
        ok: false,
        route: ROUTE,
        mode: "live_neon_check",
        error: "neon_live_check_failed",
        detail: message,
        rule_gate: {
          truth_status: "not_approved",
          migration_allowed: false,
        },
        svar_til_chatgpt: [
          "NEON RULE ESTABLISHMENT LIVE CHECK:",
          "Neon live query: FEIL",
          `Error: ${message}`,
          "Migration allowed: false",
          "Next: kontroller Neon env og tabeller.",
        ].join("\n"),
      },
      500
    );
  }
}

export async function POST() {
  return jsonResponse(
    {
      ok: false,
      route: ROUTE,
      mode: "live_neon_check",
      post_status: "blocked_safe_mode",
      message:
        "POST er blokkert til admin-session, MariaDB read-only verifikasjon, logging og approval workflow er koblet.",
      rule_gate: {
        truth_status: "not_approved",
        migration_allowed: false,
      },
    },
    409
  );
}
