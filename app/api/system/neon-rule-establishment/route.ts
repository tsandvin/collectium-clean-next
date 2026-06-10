/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Neon Rule Establishment API
 *
 * Definering / formål:
 * Kontrollerer og etablerer første Neon-regelstatus for MariaDB -> Neon-overgangen.
 * Første testscope er Norske sedler / banknote.
 *
 * Bruksområde:
 * Brukes av admin/system/mariadb-neon for å vise om regelkontrolltabeller, kilde-scope,
 * truth gate og testrespons finnes før flere katalogområder mappes.
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
 * - MariaDB read-only kontroll: ct_app_pages, ct_app_features, ct_feature_action_routes, katalogkilde/views
 *
 * Dataretning:
 * MariaDB read-only kontroll -> Neon regelstatus -> Next.js API -> Admin UI
 *
 * Logging:
 * log_category: system.mariadb_neon
 * log_action: neon_rule_establishment
 *
 * Versjon:
 * CT-API-0001 / CHANGE-2026-06-10-0001
 *
 * Endringsregel:
 * Denne route-filen er ny og overskriver ingen kjernefil.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Status = "OK" | "VARSEL" | "FEIL" | "BLOKKERT" | "INFO";

type RuleStep = {
  id: string;
  label: string;
  status: Status;
  detail: string;
  blocking: boolean;
};

type NeonRuleEstablishmentResponse = {
  ok: boolean;
  route: string;
  mode: "test" | "live";
  source_key: "norske_sedler";
  object_group: "banknote";
  canonical_neon_table: "ct_no_banknote_catalog";
  mariadb_verification: {
    required: true;
    mode: "read-only";
    status: Status;
    detail: string;
  };
  neon_rule_tables: {
    required: string[];
    status: Status;
    detail: string;
  };
  rule_gate: {
    structure_status: Status;
    rules_status: Status;
    source_data_status: Status;
    truth_status: "not_approved" | "approved";
    migration_allowed: boolean;
  };
  steps: RuleStep[];
  test_object: {
    source_key: "norske_sedler";
    object_group: "banknote";
    object_id: number;
    title: string;
    relation_key_rule: string;
    filter_key_rule: string;
  };
  svar_til_chatgpt: string;
  next_step: string;
};

const REQUIRED_NEON_TABLES = [
  "ct_neon_rule_control_runs",
  "ct_neon_rule_control_steps",
  "ct_neon_rule_control_findings",
  "ct_neon_rule_establishment_registry",
  "ct_neon_rule_source_scope_registry",
  "ct_neon_rule_truth_gate",
];

function buildTestResponse(): NeonRuleEstablishmentResponse {
  const steps: RuleStep[] = [
    {
      id: "NR-001",
      label: "SQL for Neon-regelkontrolltabeller",
      status: "VARSEL",
      detail: "SQL er definert i pakken. Må kjøres i Neon før live-status kan bli OK.",
      blocking: true,
    },
    {
      id: "NR-002",
      label: "API-route /api/system/neon-rule-establishment",
      status: "OK",
      detail: "Route er definert og returnerer testrespons for første scope.",
      blocking: false,
    },
    {
      id: "NR-003",
      label: "Testscope Norske sedler / banknote",
      status: "OK",
      detail: "source_key=norske_sedler, object_group=banknote, canonical table=ct_no_banknote_catalog.",
      blocking: false,
    },
    {
      id: "NR-004",
      label: "MariaDB read-only verifikasjon",
      status: "BLOKKERT",
      detail: "Må kobles til eksisterende MariaDB-sjekk før kildedata eller flere katalogområder mappes.",
      blocking: true,
    },
    {
      id: "NR-005",
      label: "Adminvisning på /admin/system/mariadb-neon",
      status: "VARSEL",
      detail: "Komponent er laget. Må kobles inn i eksisterende adminside.",
      blocking: false,
    },
  ];

  return {
    ok: false,
    route: "/api/system/neon-rule-establishment",
    mode: "test",
    source_key: "norske_sedler",
    object_group: "banknote",
    canonical_neon_table: "ct_no_banknote_catalog",
    mariadb_verification: {
      required: true,
      mode: "read-only",
      status: "BLOKKERT",
      detail: "MariaDB må bekrefte at source_key/object_group/API-bane er korrekt før Neon-regel kan godkjennes.",
    },
    neon_rule_tables: {
      required: REQUIRED_NEON_TABLES,
      status: "VARSEL",
      detail: "Forventede tabeller er definert i SQL, men denne testresponsen bekrefter ikke live Neon ennå.",
    },
    rule_gate: {
      structure_status: "VARSEL",
      rules_status: "VARSEL",
      source_data_status: "BLOKKERT",
      truth_status: "not_approved",
      migration_allowed: false,
    },
    steps,
    test_object: {
      source_key: "norske_sedler",
      object_group: "banknote",
      object_id: 1459,
      title: "Testobjekt · Norske sedler · banknote · 1459",
      relation_key_rule: "object_id + object_group + source_key",
      filter_key_rule: "source_key + object_group + filter_field + filter_value",
    },
    svar_til_chatgpt: [
      "NEON RULE ESTABLISHMENT:",
      "Route: /api/system/neon-rule-establishment",
      "Scope: source_key=norske_sedler, object_group=banknote",
      "Canonical Neon table: ct_no_banknote_catalog",
      "SQL control tables: defined, must be run in Neon",
      "MariaDB read-only verification: required before approval",
      "Truth status: not_approved",
      "Migration allowed: false",
      "Next: run SQL, connect live Neon check, then map more catalog areas only after OK.",
    ].join("\n"),
    next_step: "Kjør SQL i Neon, koble route mot Neon live query og MariaDB read-only kontroll, vis panelet på admin/system/mariadb-neon.",
  };
}

export async function GET() {
  return NextResponse.json(buildTestResponse(), {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST() {
  // Første versjon er bevisst trygg: ingen DB-skriving fra API før SQL og live DB-klient er bekreftet.
  return NextResponse.json(
    {
      ...buildTestResponse(),
      ok: false,
      post_status: "blocked_safe_mode",
      message: "POST er blokkert i v1 til Neon-klient, admin-session og MariaDB read-only verifikasjon er koblet.",
    },
    { status: 409 }
  );
}
