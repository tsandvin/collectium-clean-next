import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  count_value: string;
};

type TableExistsRow = {
  table_name: string;
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

async function tableExists(tableName: string): Promise<boolean> {
  const rows = await neonQuery<TableExistsRow>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
      limit 1
    `,
    [tableName],
  );

  return rows.length > 0;
}

async function countTable(tableName: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
    return null;
  }

  const rows = await neonQuery<CountRow>(
    `select count(*)::text as count_value from "${tableName}"`,
  );

  return rows[0]?.count_value ?? null;
}

async function ensureIdentityTables() {
  const statements = [
    {
      table_name: "ct_migration_user_id_map",
      sql: `
        create table if not exists ct_migration_user_id_map (
          id bigserial primary key,
          maria_table_name text not null,
          maria_user_id text not null,
          neon_user_id uuid null,
          neon_numeric_user_id bigint null,
          identity_source text not null default 'mariadb',
          mapping_status text not null default 'pending',
          mapping_reason_no text null,
          payload_json jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (maria_table_name, maria_user_id)
        )
      `,
    },
    {
      table_name: "ct_legacy_user_identity_map",
      sql: `
        create table if not exists ct_legacy_user_identity_map (
          id bigserial primary key,
          legacy_source_key text not null,
          legacy_table_name text not null,
          legacy_user_id text not null,
          maria_user_id text null,
          neon_user_id uuid null,
          neon_numeric_user_id bigint null,
          email_hash text null,
          mapping_status text not null default 'pending',
          mapping_reason_no text null,
          payload_json jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (legacy_source_key, legacy_table_name, legacy_user_id)
        )
      `,
    },
    {
      table_name: "ct_migration_object_id_map",
      sql: `
        create table if not exists ct_migration_object_id_map (
          id bigserial primary key,
          source_key text not null,
          object_group text not null,
          maria_table_name text not null,
          maria_object_id text not null,
          neon_object_id uuid null,
          neon_numeric_object_id bigint null,
          object_identity_key text null,
          mapping_status text not null default 'pending',
          mapping_reason_no text null,
          payload_json jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (source_key, object_group, maria_table_name, maria_object_id)
        )
      `,
    },
    {
      table_name: "ct_object_identity_map",
      sql: `
        create table if not exists ct_object_identity_map (
          id bigserial primary key,
          source_key text not null,
          object_group text not null,
          source_object_id text not null,
          canonical_object_key text not null,
          neon_object_id uuid null,
          neon_numeric_object_id bigint null,
          object_title text null,
          mapping_status text not null default 'pending',
          mapping_reason_no text null,
          payload_json jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (source_key, object_group, source_object_id),
          unique (canonical_object_key)
        )
      `,
    },
  ];

  const results = [];

  for (const statement of statements) {
    await neonQuery(statement.sql);
    results.push({
      table_name: statement.table_name,
      neon_exists: await tableExists(statement.table_name),
      rows: await countTable(statement.table_name),
      status: "ENSURED",
    });
  }

  return results;
}

async function ensureRelationRegistryTables() {
  await neonQuery(`
    create table if not exists ct_relation_type_registry (
      id bigserial primary key,
      relation_type_key text not null unique,
      relation_type_label_no text not null,
      relation_domain text not null,
      source_entity_type text not null,
      target_entity_type text not null,
      direction_mode text not null default 'directed',
      is_active boolean not null default true,
      sort_order integer not null default 100,
      description_no text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await neonQuery(`
    create table if not exists ct_relation_path_registry (
      id bigserial primary key,
      path_key text not null unique,
      path_label_no text not null,
      relation_type_key text not null,
      source_table text not null,
      source_key_field text null,
      object_group_field text null,
      source_id_field text null,
      target_table text not null,
      target_id_field text null,
      resolver_view text null,
      required_for_migration boolean not null default false,
      is_active boolean not null default true,
      sort_order integer not null default 100,
      description_no text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await neonQuery(`
    create table if not exists ct_relation_missing_links (
      id bigserial primary key,
      check_source text not null,
      source_table text not null,
      source_key text null,
      object_group text null,
      source_object_id text null,
      relation_type_key text null,
      missing_target_type text null,
      missing_target_value text null,
      severity text not null default 'warning',
      status text not null default 'open',
      reason_no text null,
      payload_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
}

async function seedRelationTypes() {
  const relationTypes = [
    {
      key: "object_person",
      label: "Objekt til person",
      domain: "catalog",
      source: "object",
      target: "person",
      sort: 10,
      description:
        "Kobler katalogobjekt til person, signaturperson, motivperson eller historisk person.",
    },
    {
      key: "object_ruler",
      label: "Objekt til regent / konge",
      domain: "catalog_history",
      source: "object",
      target: "ruler",
      sort: 20,
      description:
        "Kobler objekt til regent, konge, lokal hersker eller historisk maktperson.",
    },
    {
      key: "object_producer",
      label: "Objekt til produsent / utsteder",
      domain: "catalog",
      source: "object",
      target: "producer",
      sort: 30,
      description:
        "Kobler objekt til produsent, utsteder, trykkeri, myntverk eller autoritet.",
    },
    {
      key: "object_source",
      label: "Objekt til kilde",
      domain: "catalog_source",
      source: "object",
      target: "source",
      sort: 40,
      description:
        "Kobler objekt til katalogkilde som Norske sedler, Norske mynter eller annen kilde.",
    },
    {
      key: "object_historical_period",
      label: "Objekt til historisk periode",
      domain: "catalog_history",
      source: "object",
      target: "historical_period",
      sort: 50,
      description:
        "Kobler objekt til historisk periode, tidslag, dynasti eller maktstruktur.",
    },
    {
      key: "object_year_context",
      label: "Objekt til årskontekst",
      domain: "catalog_history",
      source: "object",
      target: "year_context",
      sort: 60,
      description:
        "Kobler objektets årstall/publiseringsår til historisk og finansiell kontekst.",
    },
    {
      key: "object_variant",
      label: "Objekt til variant / litra / signatur",
      domain: "catalog",
      source: "object",
      target: "variant",
      sort: 70,
      description:
        "Kobler objekt til variant, litra, signaturkombinasjon eller typevariant.",
    },
    {
      key: "collection_object",
      label: "Samling til objekt",
      domain: "collection",
      source: "collection",
      target: "object",
      sort: 80,
      description:
        "Kobler brukerens samling, ønskeliste, stjerne eller eierstatus til objekt.",
    },
    {
      key: "market_object",
      label: "Marked til objekt",
      domain: "market",
      source: "market_observation",
      target: "object",
      sort: 90,
      description:
        "Kobler auksjon, prisobservasjon, forhandlerobjekt eller markedsverdi til objekt.",
    },
    {
      key: "source_object_group",
      label: "Kilde til objektgruppe",
      domain: "catalog_source",
      source: "source",
      target: "object_group",
      sort: 100,
      description:
        "Kobler kilde/source_key til objektgruppe, for eksempel norske_sedler + banknote.",
    },
  ];

  for (const item of relationTypes) {
    await neonQuery(
      `
        insert into ct_relation_type_registry (
          relation_type_key,
          relation_type_label_no,
          relation_domain,
          source_entity_type,
          target_entity_type,
          sort_order,
          description_no
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (relation_type_key)
        do update set
          relation_type_label_no = excluded.relation_type_label_no,
          relation_domain = excluded.relation_domain,
          source_entity_type = excluded.source_entity_type,
          target_entity_type = excluded.target_entity_type,
          sort_order = excluded.sort_order,
          description_no = excluded.description_no,
          is_active = true,
          updated_at = now()
      `,
      [
        item.key,
        item.label,
        item.domain,
        item.source,
        item.target,
        item.sort,
        item.description,
      ],
    );
  }

  return relationTypes.length;
}

async function seedRelationPaths() {
  const relationPaths = [
    {
      path_key: "ct_catalog_object_person_motif_links",
      label: "Katalogobjekt til personmotiv",
      relation_type_key: "object_person",
      source_table: "ct_catalog_object_person_motif_links",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_person_motifs",
      target_id_field: "person_motif_id",
      resolver_view: "ct_v_catalog_object_person_motifs",
      required: true,
      sort: 10,
      description:
        "Brukes for personmotiv og objekt-person-relasjoner i katalogen.",
    },
    {
      path_key: "ct_catalog_object_ruler_relations",
      label: "Katalogobjekt til regent",
      relation_type_key: "object_ruler",
      source_table: "ct_catalog_object_ruler_relations",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_historical_rulers",
      target_id_field: "ruler_id",
      resolver_view: "ct_v_catalog_relation_ruler_candidates",
      required: true,
      sort: 20,
      description:
        "Brukes for objekt til konge/regent/historisk hersker.",
    },
    {
      path_key: "ct_catalog_object_producer_links",
      label: "Katalogobjekt til produsent",
      relation_type_key: "object_producer",
      source_table: "ct_catalog_object_producer_links",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_producers",
      target_id_field: "producer_id",
      resolver_view: "ct_v_catalog_object_producer_link_requests",
      required: true,
      sort: 30,
      description:
        "Brukes for produsent, utsteder, trykkeri, myntverk og tilsvarende autoritet.",
    },
    {
      path_key: "ct_catalog_sources",
      label: "Katalogkilder",
      relation_type_key: "object_source",
      source_table: "ct_catalog_objects",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_catalog_sources",
      target_id_field: "source_key",
      resolver_view: "ct_v_catalog_sources",
      required: true,
      sort: 40,
      description:
        "Brukes for kilde/source_key, blant annet norske_sedler og andre katalogkilder.",
    },
    {
      path_key: "ct_historical_year_contexts",
      label: "Historisk årskontekst",
      relation_type_key: "object_year_context",
      source_table: "ct_catalog_objects",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_year_label",
      target_table: "ct_historical_year_contexts",
      target_id_field: "year_label",
      resolver_view: "ct_v_catalog_historical_year_context",
      required: true,
      sort: 50,
      description:
        "Brukes for underliggende årslinje, kontekst, regent, periode og historisk sammenheng.",
    },
    {
      path_key: "ct_collection_items",
      label: "Samling til objekt",
      relation_type_key: "collection_object",
      source_table: "ct_collection_items",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_catalog_objects",
      target_id_field: "object_id",
      resolver_view: "ct_v_user_private_collection_summary",
      required: true,
      sort: 60,
      description:
        "Brukes for Min samling og brukerens objekttilknytninger.",
    },
  ];

  for (const item of relationPaths) {
    await neonQuery(
      `
        insert into ct_relation_path_registry (
          path_key,
          path_label_no,
          relation_type_key,
          source_table,
          source_key_field,
          object_group_field,
          source_id_field,
          target_table,
          target_id_field,
          resolver_view,
          required_for_migration,
          sort_order,
          description_no
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        on conflict (path_key)
        do update set
          path_label_no = excluded.path_label_no,
          relation_type_key = excluded.relation_type_key,
          source_table = excluded.source_table,
          source_key_field = excluded.source_key_field,
          object_group_field = excluded.object_group_field,
          source_id_field = excluded.source_id_field,
          target_table = excluded.target_table,
          target_id_field = excluded.target_id_field,
          resolver_view = excluded.resolver_view,
          required_for_migration = excluded.required_for_migration,
          sort_order = excluded.sort_order,
          description_no = excluded.description_no,
          is_active = true,
          updated_at = now()
      `,
      [
        item.path_key,
        item.label,
        item.relation_type_key,
        item.source_table,
        item.source_key_field,
        item.object_group_field,
        item.source_id_field,
        item.target_table,
        item.target_id_field,
        item.resolver_view,
        item.required,
        item.sort,
        item.description,
      ],
    );
  }

  return relationPaths.length;
}

export async function POST() {
  try {
    const identityTables = await ensureIdentityTables();
    await ensureRelationRegistryTables();

    const relationTypeSeedCount = await seedRelationTypes();
    const relationPathSeedCount = await seedRelationPaths();

    const relationTypeRows = await countTable("ct_relation_type_registry");
    const relationPathRows = await countTable("ct_relation_path_registry");
    const missingLinkRows = await countTable("ct_relation_missing_links");

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "identity-relation-bootstrap",
      checked_at: new Date().toISOString(),
      status: {
        identity_relation_bootstrap: "completed",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "rerun_id_mapping_and_relation_path_checks",
      },
      identity_tables: identityTables,
      relation_registry: {
        relation_type_seed_count: String(relationTypeSeedCount),
        relation_path_seed_count: String(relationPathSeedCount),
        relation_type_rows: relationTypeRows,
        relation_path_rows: relationPathRows,
        relation_missing_link_rows: missingLinkRows,
      },
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_control_structure_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Denne ruten oppretter kun Neon kontrollstruktur og relasjonsregistry. Den migrerer ikke MariaDB kildedata.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "identity-relation-bootstrap",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown identity relation bootstrap error",
    }), { status: 500 });
  }
}

export async function GET() {
  try {
    const identityTables = [
      "ct_migration_user_id_map",
      "ct_user_identity_map",
      "ct_legacy_user_identity_map",
      "ct_migration_object_id_map",
      "ct_object_identity_map",
    ];

    const checks = [];

    for (const tableName of identityTables) {
      const exists = await tableExists(tableName);
      checks.push({
        table_name: tableName,
        neon_exists: exists,
        rows: exists ? await countTable(tableName) : null,
        status: exists ? "FOUND" : "MISSING",
      });
    }

    const relationTypeExists = await tableExists("ct_relation_type_registry");
    const relationPathExists = await tableExists("ct_relation_path_registry");
    const missingLinksExists = await tableExists("ct_relation_missing_links");

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "identity-relation-bootstrap",
      checked_at: new Date().toISOString(),
      status: {
        identity_relation_bootstrap: "status_only",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "POST this route to ensure missing control structures",
      },
      identity_tables: checks,
      relation_registry: {
        ct_relation_type_registry: {
          neon_exists: relationTypeExists,
          rows: relationTypeExists ? await countTable("ct_relation_type_registry") : null,
        },
        ct_relation_path_registry: {
          neon_exists: relationPathExists,
          rows: relationPathExists ? await countTable("ct_relation_path_registry") : null,
        },
        ct_relation_missing_links: {
          neon_exists: missingLinksExists,
          rows: missingLinksExists ? await countTable("ct_relation_missing_links") : null,
        },
      },
      collectium_rule: {
        write_allowed_on_get: false,
        write_allowed_on_post: true,
        write_scope: "neon_control_structure_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "identity-relation-bootstrap",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown identity relation bootstrap status error",
    }), { status: 500 });
  }
}
