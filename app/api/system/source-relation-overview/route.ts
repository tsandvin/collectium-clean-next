/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Source Relation Overview API
 *
 * Definering / formål:
 * Leser Neon public schema og lager en samlet kontrollrapport for kilder,
 * katalogtabeller, objektgrupper, relasjonstabeller, namespaces, mangler,
 * naming-avvik og Neon truth-status.
 *
 * Bruksområde:
 * Brukes av /admin/system/mariadb-neon og PowerShell-kontroller for å se
 * om Collectium har riktige katalog- og relasjonsstrukturer i Neon.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.source_relation_overview.view
 * - admin.system.mariadb_neon.view
 *
 * Berørte API-ruter:
 * - GET /api/system/source-relation-overview
 *
 * Berørte tabeller / views:
 * - information_schema.tables
 * - information_schema.views
 * - pg_catalog.pg_class
 * - pg_catalog.pg_namespace
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> Admin/System UI
 *
 * Viktig:
 * Denne ruten skriver ingenting. Den er read-only.
 *
 * Logging:
 * log_category: system
 * log_action: source_relation_overview
 *
 * Versjon:
 * CT-API-SYSTEM-0007 / CHANGE-2026-06-14-0001
 */

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbObjectType =
  | "table"
  | "partitioned_table"
  | "view"
  | "materialized_view"
  | "unknown";

type DbObject = {
  table_schema: string;
  object_name: string;
  object_type: DbObjectType;
  estimated_rows: number | null;
};

type ClassifiedObject = DbObject & {
  namespace_prefix: string;
  namespace_label: string;
  naming_status: "OK" | "SYSTEM_OK" | "MA_SJEKKES" | "SYSTEM_OR_OTHER" | "NOT_COLLECTIUM";
  object_area:
    | "catalog"
    | "relation"
    | "source"
    | "filter"
    | "period"
    | "provenance"
    | "migration"
    | "membership"
    | "market"
    | "collection"
    | "auction"
    | "admin_system"
    | "other";
  expected_role: string | null;
  recommended_action: string | null;
};

const EXPECTED_CATALOGS = [
  {
    object_name: "ct_no_banknote_catalog",
    object_group: "banknote",
    source_key: "norske_sedler",
    label_no: "Norsk seddelkatalog",
    required_now: true,
  },
  {
    object_name: "ct_no_coin_catalog",
    object_group: "coin",
    source_key: "norske_mynter",
    label_no: "Norsk myntekatalog",
    required_now: true,
  },
  {
    object_name: "ct_sv_banknote_catalog",
    object_group: "banknote",
    source_key: "svenske_sedler",
    label_no: "Svensk seddelkatalog",
    required_now: false,
  },
  {
    object_name: "ct_sv_coin_catalog",
    object_group: "coin",
    source_key: "svenske_mynter",
    label_no: "Svensk myntekatalog",
    required_now: false,
  },
  {
    object_name: "ct_dm_banknote_catalog",
    object_group: "banknote",
    source_key: "danske_sedler",
    label_no: "Dansk seddelkatalog",
    required_now: false,
  },
  {
    object_name: "ct_dm_coin_catalog",
    object_group: "coin",
    source_key: "danske_mynter",
    label_no: "Dansk myntekatalog",
    required_now: false,
  },
];

const EXPECTED_RELATIONS = [
  {
    object_name: "ct_sn_konger_relasjon",
    relation_type: "ruler",
    namespace_prefix: "ct_sn",
    label_no: "Skandinavisk konge/regent-relasjon",
    required_now: true,
  },
  {
    object_name: "ct_sn_motiv_relasjon",
    relation_type: "motif",
    namespace_prefix: "ct_sn",
    label_no: "Skandinavisk motivrelasjon",
    required_now: true,
  },
  {
    object_name: "ct_sn_person_relasjon",
    relation_type: "person",
    namespace_prefix: "ct_sn",
    label_no: "Skandinavisk personrelasjon",
    required_now: true,
  },
  {
    object_name: "ct_relation_type_registry",
    relation_type: "registry",
    namespace_prefix: "ct_system",
    label_no: "Relasjonstype-register",
    required_now: true,
  },
  {
    object_name: "ct_relation_path_registry",
    relation_type: "registry",
    namespace_prefix: "ct_system",
    label_no: "Relasjonsbane-register",
    required_now: true,
  },
  {
    object_name: "ct_relation_missing_links",
    relation_type: "diagnostic",
    namespace_prefix: "ct_system",
    label_no: "Manglende relasjonskoblinger",
    required_now: false,
  },
];

const SYSTEM_OK_OBJECTS = new Set([
  "ct_namespace_registry",
  "ct_migration_control_runs",
  "ct_migration_control_steps",
  "ct_migration_control_logs",
  "ct_migration_table_inventory",
  "ct_migration_table_map",
  "ct_migration_field_map",
  "ct_migration_report_files",
  "ct_database_truth_status",
  "ct_system_control_status",
  "ct_source_inventory",
  "ct_object_group_inventory",
  "ct_object_inventory_summary",
  "ct_relation_type_registry",
  "ct_relation_path_registry",
  "ct_relation_path_check_results",
  "ct_relation_missing_links",
  "ct_relation_privacy_rules",
  "ct_market_channel_summary",
  "ct_collection_summary",
  "ct_filter_master_registry",
  "ct_filter_object_type_registry",
  "ct_filter_usage_registry",
  "ct_period_filter_registry",
  "ct_provenance_definition_registry",
  "ct_provenance_event_type_registry",
  "ct_provenance_scope_registry",
  "ct_provenance_visibility_registry",
]);

function getDatabaseUrl(): string {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL;

  if (!value) {
    throw new Error(
      "Mangler DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL eller NEON_DATABASE_URL."
    );
  }

  return value;
}

function namespacePrefix(objectName: string): string {
  if (objectName.startsWith("ct_no_")) return "ct_no";
  if (objectName.startsWith("ct_sn_")) return "ct_sn";
  if (objectName.startsWith("ct_sv_")) return "ct_sv";
  if (objectName.startsWith("ct_dm_")) return "ct_dm";
  if (objectName.startsWith("ct_tl_")) return "ct_tl";
  if (objectName.startsWith("ct_fl_")) return "ct_fl";
  if (objectName.startsWith("ct_eu_")) return "ct_eu";
  if (objectName.startsWith("ct_gl_")) return "ct_gl";
  if (objectName.startsWith("ct_")) return "ct_unscoped_or_system";
  return "not_collectium";
}

function namespaceLabel(prefix: string): string {
  switch (prefix) {
    case "ct_no":
      return "Norge";
    case "ct_sn":
      return "Skandinavia";
    case "ct_sv":
      return "Sverige";
    case "ct_dm":
      return "Danmark";
    case "ct_tl":
      return "Tyskland";
    case "ct_fl":
      return "Finland";
    case "ct_eu":
      return "Europa";
    case "ct_gl":
      return "Global";
    case "ct_unscoped_or_system":
      return "System eller uavklart Collectium-navn";
    default:
      return "Ikke Collectium";
  }
}

function detectObjectArea(objectName: string): ClassifiedObject["object_area"] {
  const n = objectName.toLowerCase();

  if (n.includes("catalog")) return "catalog";
  if (
    n.includes("relation") ||
    n.includes("relasjon") ||
    n.includes("konger") ||
    n.includes("ruler") ||
    n.includes("king") ||
    n.includes("motiv") ||
    n.includes("person") ||
    n.includes("signature") ||
    n.includes("dynasty")
  ) {
    return "relation";
  }
  if (n.includes("source")) return "source";
  if (n.includes("filter")) return "filter";
  if (n.includes("period")) return "period";
  if (n.includes("provenance") || n.includes("funn")) return "provenance";
  if (n.includes("migration")) return "migration";
  if (n.includes("membership")) return "membership";
  if (n.includes("market")) return "market";
  if (n.includes("collection")) return "collection";
  if (n.includes("auction")) return "auction";
  if (n.includes("system") || n.includes("admin")) return "admin_system";

  return "other";
}

function expectedRole(objectName: string): string | null {
  if (objectName === "ct_no_banknote_catalog") {
    return "Norsk objektkatalog for sedler.";
  }

  if (objectName === "ct_no_coin_catalog") {
    return "Norsk objektkatalog for mynter.";
  }

  if (objectName === "ct_sn_konger_relasjon") {
    return "Skandinavisk konge/regent-relasjon.";
  }

  if (objectName === "ct_sn_motiv_relasjon") {
    return "Skandinavisk motiv-/kulturrelasjon.";
  }

  if (objectName === "ct_sn_person_relasjon") {
    return "Skandinavisk personrelasjon.";
  }

  if (objectName === "ct_relation_path_registry") {
    return "Register for relasjonsbaner.";
  }

  if (objectName === "ct_relation_type_registry") {
    return "Register for relasjonstyper.";
  }

  return null;
}

function recommendedAction(objectName: string, prefix: string): string | null {
  const n = objectName.toLowerCase();

  if (objectName === "ct_coin_catalog") {
    return "Bytt til landspesifikk katalog: ct_no_coin_catalog, ct_sv_coin_catalog, ct_dm_coin_catalog osv.";
  }

  if (objectName === "ct_banknote_catalog") {
    return "Bytt til landspesifikk katalog: ct_no_banknote_catalog, ct_sv_banknote_catalog, ct_dm_banknote_catalog osv.";
  }

  if (
    (n.includes("relation") || n.includes("relasjon")) &&
    prefix === "ct_unscoped_or_system" &&
    !SYSTEM_OK_OBJECTS.has(objectName)
  ) {
    return "Relasjonstabell mangler tydelig namespace. Bruk ct_no_*, ct_sn_*, ct_sv_*, ct_dm_* osv.";
  }

  if (
    (n.includes("konger") || n.includes("ruler") || n.includes("king")) &&
    !objectName.startsWith("ct_sn_") &&
    !SYSTEM_OK_OBJECTS.has(objectName)
  ) {
    return "Konge/regent-relasjon som går på tvers bør normalt ligge i ct_sn_*.";
  }

  if (
    n.includes("motiv") &&
    !objectName.startsWith("ct_sn_") &&
    !SYSTEM_OK_OBJECTS.has(objectName)
  ) {
    return "Motiv-/kulturrelasjon som går på tvers bør normalt ligge i ct_sn_*.";
  }

  return null;
}

function namingStatus(
  objectName: string,
  prefix: string,
  area: ClassifiedObject["object_area"]
): ClassifiedObject["naming_status"] {
  if (prefix === "not_collectium") return "NOT_COLLECTIUM";

  if (
    prefix === "ct_no" ||
    prefix === "ct_sn" ||
    prefix === "ct_sv" ||
    prefix === "ct_dm" ||
    prefix === "ct_tl" ||
    prefix === "ct_fl" ||
    prefix === "ct_eu" ||
    prefix === "ct_gl"
  ) {
    return "OK";
  }

  if (SYSTEM_OK_OBJECTS.has(objectName)) {
    return "SYSTEM_OK";
  }

  if (area === "catalog" || area === "relation" || area === "period") {
    return "MA_SJEKKES";
  }

  return "SYSTEM_OR_OTHER";
}

function classifyObject(object: DbObject): ClassifiedObject {
  const prefix = namespacePrefix(object.object_name);
  const area = detectObjectArea(object.object_name);

  return {
    ...object,
    namespace_prefix: prefix,
    namespace_label: namespaceLabel(prefix),
    naming_status: namingStatus(object.object_name, prefix, area),
    object_area: area,
    expected_role: expectedRole(object.object_name),
    recommended_action: recommendedAction(object.object_name, prefix),
  };
}

function groupCount<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const databaseUrl = getDatabaseUrl();
    const sql = neon(databaseUrl);

    const rawObjects = await sql`
      select
        n.nspname as table_schema,
        c.relname as object_name,
        case c.relkind
          when 'r' then 'table'
          when 'p' then 'partitioned_table'
          when 'v' then 'view'
          when 'm' then 'materialized_view'
          else 'unknown'
        end as object_type,
        case
          when c.reltuples >= 0 then c.reltuples::bigint
          else null
        end as estimated_rows
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n
        on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p', 'v', 'm')
      order by c.relname asc
    `;

    const objects = (rawObjects as DbObject[]).map((row) => ({
      table_schema: row.table_schema,
      object_name: row.object_name,
      object_type: row.object_type,
      estimated_rows:
        row.estimated_rows === null || row.estimated_rows === undefined
          ? null
          : Number(row.estimated_rows),
    }));

    const classified = objects.map(classifyObject);

    const objectNameSet = new Set(classified.map((item) => item.object_name));

    const expectedCatalogStatus = EXPECTED_CATALOGS.map((catalog) => {
      const found = objectNameSet.has(catalog.object_name);
      const dbObject = classified.find((item) => item.object_name === catalog.object_name);

      return {
        ...catalog,
        found,
        status: found ? "OK" : catalog.required_now ? "MANGLER" : "IKKE_OPPRETTET",
        estimated_rows: dbObject?.estimated_rows ?? null,
        object_type: dbObject?.object_type ?? null,
      };
    });

    const expectedRelationStatus = EXPECTED_RELATIONS.map((relation) => {
      const found = objectNameSet.has(relation.object_name);
      const dbObject = classified.find((item) => item.object_name === relation.object_name);

      return {
        ...relation,
        found,
        status: found ? "OK" : relation.required_now ? "MANGLER" : "IKKE_OPPRETTET",
        estimated_rows: dbObject?.estimated_rows ?? null,
        object_type: dbObject?.object_type ?? null,
      };
    });

    const catalogs = classified.filter((item) => item.object_area === "catalog");
    const relations = classified.filter((item) => item.object_area === "relation");
    const sources = classified.filter((item) => item.object_area === "source");
    const filters = classified.filter((item) => item.object_area === "filter");
    const periods = classified.filter((item) => item.object_area === "period");

    const namingIssues = classified.filter(
      (item) =>
        item.naming_status === "MA_SJEKKES" ||
        item.recommended_action !== null ||
        item.object_name === "ct_coin_catalog" ||
        item.object_name === "ct_banknote_catalog"
    );

    const missingCritical = [
      ...expectedCatalogStatus
        .filter((item) => item.required_now && !item.found)
        .map((item) => ({
          status: "MANGLER",
          area: "catalog",
          object_name: item.object_name,
          detail: item.label_no,
          recommended_action:
            item.object_name === "ct_no_coin_catalog"
              ? "Opprett eller mapper norsk myntekatalog til ct_no_coin_catalog."
              : "Opprett eller mapper katalogen til riktig landspesifikt navn.",
        })),
      ...expectedRelationStatus
        .filter((item) => item.required_now && !item.found)
        .map((item) => ({
          status: "MANGLER",
          area: "relation",
          object_name: item.object_name,
          detail: item.label_no,
          recommended_action:
            item.object_name === "ct_relation_path_registry"
              ? "Opprett ct_relation_path_registry eller reparer bootstrap."
              : "Opprett relasjonstabell/register eller legg inn mapping.",
        })),
    ];

    const ctNoCoinCatalogFound = objectNameSet.has("ct_no_coin_catalog");
    const oldCtCoinCatalogFound = objectNameSet.has("ct_coin_catalog");
    const ctNoBanknoteCatalogFound = objectNameSet.has("ct_no_banknote_catalog");
    const oldCtBanknoteCatalogFound = objectNameSet.has("ct_banknote_catalog");
    const relationPathRegistryFound = objectNameSet.has("ct_relation_path_registry");
    const relationTypeRegistryFound = objectNameSet.has("ct_relation_type_registry");

    const requiredMissingCount = missingCritical.length;
    const namingIssueCount = namingIssues.length;

    const totalStatus =
      requiredMissingCount > 0
        ? "VARSEL"
        : namingIssueCount > 0
          ? "MA_SJEKKES"
          : "OK";

    const neonTruthStatus =
      requiredMissingCount > 0 || !relationPathRegistryFound
        ? "not_approved"
        : "candidate_ready_for_review";

    const migrationAllowed = false;

    const diagnosis = [
      {
        status: "OK",
        area: "database",
        test: "Neon schema read",
        detail: "Ruten klarte å lese public schema fra Neon.",
        path: "/api/system/source-relation-overview",
        suggestion: "OK.",
      },
      {
        status: ctNoCoinCatalogFound ? "OK" : "MANGLER",
        area: "catalog",
        test: "Norsk myntekatalog",
        detail: ctNoCoinCatalogFound
          ? "ct_no_coin_catalog finnes."
          : "ct_no_coin_catalog ble ikke funnet.",
        path: "ct_no_coin_catalog",
        suggestion: ctNoCoinCatalogFound
          ? "OK."
          : "Opprett/mapp norsk myntekatalog til ct_no_coin_catalog før Neon truth.",
      },
      {
        status: ctNoBanknoteCatalogFound ? "OK" : "MANGLER",
        area: "catalog",
        test: "Norsk seddelkatalog",
        detail: ctNoBanknoteCatalogFound
          ? "ct_no_banknote_catalog finnes."
          : "ct_no_banknote_catalog ble ikke funnet.",
        path: "ct_no_banknote_catalog",
        suggestion: ctNoBanknoteCatalogFound
          ? "OK."
          : "Opprett/mapp norsk seddelkatalog til ct_no_banknote_catalog før Neon truth.",
      },
      {
        status: relationPathRegistryFound ? "OK" : "MANGLER",
        area: "relations",
        test: "Relasjonsbaneregister",
        detail: relationPathRegistryFound
          ? "ct_relation_path_registry finnes."
          : "ct_relation_path_registry ble ikke funnet.",
        path: "ct_relation_path_registry",
        suggestion: relationPathRegistryFound
          ? "OK."
          : "Opprett ct_relation_path_registry. Dette forklarer typisk 404/feil på relation-paths.",
      },
      {
        status: relationTypeRegistryFound ? "OK" : "MANGLER",
        area: "relations",
        test: "Relasjonstyperegister",
        detail: relationTypeRegistryFound
          ? "ct_relation_type_registry finnes."
          : "ct_relation_type_registry ble ikke funnet.",
        path: "ct_relation_type_registry",
        suggestion: relationTypeRegistryFound
          ? "OK."
          : "Opprett ct_relation_type_registry i bootstrap.",
      },
      {
        status: oldCtCoinCatalogFound || oldCtBanknoteCatalogFound ? "MA_SJEKKES" : "OK",
        area: "naming",
        test: "Gammel katalognavning",
        detail:
          oldCtCoinCatalogFound || oldCtBanknoteCatalogFound
            ? "Fant uspesifikk katalogtabell uten landprefix."
            : "Fant ikke ct_coin_catalog eller ct_banknote_catalog.",
        path: "ct_coin_catalog / ct_banknote_catalog",
        suggestion:
          oldCtCoinCatalogFound || oldCtBanknoteCatalogFound
            ? "Bytt til ct_no_coin_catalog / ct_no_banknote_catalog eller tilsvarende landprefix."
            : "OK.",
      },
    ];

    const svarTilChatGPT = [
      "SVAR TIL CHATGPT",
      "",
      "Collectium Source Relation Overview",
      "",
      `Checked at: ${checkedAt}`,
      "",
      "API-status:",
      "- /api/system/source-relation-overview: OK",
      "",
      "Neon schema:",
      `- Totalt public objects: ${classified.length}`,
      `- Katalogobjekter funnet: ${catalogs.length}`,
      `- Relasjonsobjekter funnet: ${relations.length}`,
      `- Kildeobjekter funnet: ${sources.length}`,
      `- Filterobjekter funnet: ${filters.length}`,
      `- Periodeobjekter funnet: ${periods.length}`,
      "",
      "Katalogstatus:",
      `- ct_no_coin_catalog: ${ctNoCoinCatalogFound ? "OK" : "MANGLER"}`,
      `- ct_no_banknote_catalog: ${ctNoBanknoteCatalogFound ? "OK" : "MANGLER"}`,
      `- gammel ct_coin_catalog: ${oldCtCoinCatalogFound ? "FUNNET - MÅ SJEKKES" : "ikke funnet"}`,
      `- gammel ct_banknote_catalog: ${
        oldCtBanknoteCatalogFound ? "FUNNET - MÅ SJEKKES" : "ikke funnet"
      }`,
      "",
      "Relasjonsstatus:",
      `- ct_relation_type_registry: ${relationTypeRegistryFound ? "OK" : "MANGLER"}`,
      `- ct_relation_path_registry: ${relationPathRegistryFound ? "OK" : "MANGLER"}`,
      `- Relasjonstabeller/registere funnet: ${relations.length}`,
      "",
      "Namespace-status:",
      `- Naming-avvik/må sjekkes: ${namingIssueCount}`,
      `- Kritiske mangler: ${requiredMissingCount}`,
      "",
      "Neon truth:",
      `- neon_truth_status: ${neonTruthStatus}`,
      `- migration_allowed: ${migrationAllowed}`,
      "",
      "Konklusjon:",
      requiredMissingCount > 0
        ? "- Neon source/relation-status er delvis, men ikke godkjent."
        : "- Neon source/relation-status kan vurderes videre.",
      !ctNoCoinCatalogFound
        ? "- Norsk myntekatalog mangler fortsatt som ct_no_coin_catalog."
        : "- Norsk myntekatalog finnes som ct_no_coin_catalog.",
      !relationPathRegistryFound
        ? "- Relasjonsbaneregister mangler. Opprett ct_relation_path_registry og route /api/system/relation-paths."
        : "- Relasjonsbaneregister finnes.",
    ].join("\n");

    return NextResponse.json(
      {
        ok: true,
        route: "/api/system/source-relation-overview",
        checked_at: checkedAt,
        runtime: "nodejs",
        source_database: "neon",
        target_schema: "public",
        migration_allowed: migrationAllowed,
        neon_truth_status: neonTruthStatus,
        status: totalStatus,
        summary: {
          total_objects: classified.length,
          by_namespace: groupCount(classified, "namespace_prefix"),
          by_object_type: groupCount(classified, "object_type"),
          by_area: groupCount(classified, "object_area"),
          catalog_objects: catalogs.length,
          relation_objects: relations.length,
          source_objects: sources.length,
          filter_objects: filters.length,
          period_objects: periods.length,
          naming_issues: namingIssueCount,
          required_missing: requiredMissingCount,
          ct_no_coin_catalog_found: ctNoCoinCatalogFound,
          ct_no_banknote_catalog_found: ctNoBanknoteCatalogFound,
          old_ct_coin_catalog_found: oldCtCoinCatalogFound,
          old_ct_banknote_catalog_found: oldCtBanknoteCatalogFound,
          relation_type_registry_found: relationTypeRegistryFound,
          relation_path_registry_found: relationPathRegistryFound,
        },
        expected_catalogs: expectedCatalogStatus,
        expected_relations: expectedRelationStatus,
        catalogs,
        relations,
        sources,
        filters,
        periods,
        naming_issues: namingIssues,
        missing_critical: missingCritical,
        diagnosis,
        all_objects: classified,
        svar_til_chatgpt: svarTilChatGPT,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil.";

    return NextResponse.json(
      {
        ok: false,
        route: "/api/system/source-relation-overview",
        checked_at: checkedAt,
        status: "FEIL",
        error: message,
        migration_allowed: false,
        neon_truth_status: "not_approved",
        svar_til_chatgpt: [
          "SVAR TIL CHATGPT",
          "",
          "Collectium Source Relation Overview",
          "",
          "Status: FEIL",
          `Feil: ${message}`,
          "",
          "Konklusjon:",
          "- Ruten klarte ikke å lese Neon.",
          "- Kontroller DATABASE_URL/POSTGRES_URL og at @neondatabase/serverless er installert.",
        ].join("\n"),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
