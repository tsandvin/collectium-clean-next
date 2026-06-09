/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Relation Registry Bootstrap
 *
 * Definering / formål:
 * Reparerer og seeder Neon relation registry-tabeller med støtte for både
 * eldre legacy-kolonner og ny Collectium relation registry-modell.
 *
 * Bruksområde:
 * Brukes i MariaDB -> Neon overgang for å klargjøre relasjonstyper og
 * relasjonsbaner før katalog-, objekt-, person-, konge-, kilde- og
 * samlingsdata kan migreres trygt.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - GET  /api/system/relation-registry-bootstrap
 * - POST /api/system/relation-registry-bootstrap
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.view
 * - admin.system.relation_registry.bootstrap
 * - admin.system.relation_registry.check
 *
 * Berørte API-ruter:
 * - GET  /api/system/relation-registry-bootstrap
 * - POST /api/system/relation-registry-bootstrap
 * - GET  /api/system/relation-path-check
 *
 * Berørte tabeller / views:
 * - ct_relation_type_registry
 * - ct_relation_path_registry
 * - ct_relation_missing_links
 *
 * Dataretning:
 * Neon control structure only. Ingen MariaDB kildedata migreres her.
 *
 * Logging:
 * log_category: system.migration
 * log_action: relation_registry.bootstrap
 *
 * Versjon:
 * CT-FILE-RELATION-REGISTRY-BOOTSTRAP-0002
 *
 * Endringsregel:
 * Denne ruten skriver kun Neon kontrollstruktur og registry-startverdier.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  count_value: string;
};

type ColumnRow = {
  column_name: string;
  data_type: string;
  is_nullable: string;
};

type TableExistsRow = {
  table_name: string;
};

type RelationTypeSeed = {
  relation_type_key: string;
  relation_name_no: string;
  relation_domain: string;
  from_entity: string;
  to_entity: string;
  sort_order: number;
  description_no: string;
};

type RelationPathSeed = {
  path_key: string;
  path_name_no: string;
  path_group: string;
  path_order: number;
  relation_type_key: string;
  source_table: string;
  source_key_field: string | null;
  object_group_field: string | null;
  source_id_field: string | null;
  target_table: string;
  target_id_field: string | null;
  resolver_view: string | null;
  required_for_migration: boolean;
  description_no: string;
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

  const exists = await tableExists(tableName);

  if (!exists) {
    return null;
  }

  const rows = await neonQuery<CountRow>(
    `select count(*)::text as count_value from "${tableName}"`,
  );

  return rows[0]?.count_value ?? null;
}

async function getColumns(tableName: string): Promise<ColumnRow[]> {
  return neonQuery<ColumnRow>(
    `
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `,
    [tableName],
  );
}

async function ensureRelationTypeRegistrySchema() {
  await neonQuery(`
    create table if not exists ct_relation_type_registry (
      id bigserial primary key
    )
  `);

  await neonQuery(`
    alter table ct_relation_type_registry
      add column if not exists relation_type_key text,
      add column if not exists relation_name_no text,
      add column if not exists from_entity text,
      add column if not exists to_entity text,
      add column if not exists privacy_level text not null default 'internal',
      add column if not exists status text not null default 'active',
      add column if not exists payload_json jsonb not null default '{}'::jsonb,
      add column if not exists relation_type_label_no text,
      add column if not exists relation_domain text,
      add column if not exists source_entity_type text,
      add column if not exists target_entity_type text,
      add column if not exists direction_mode text not null default 'directed',
      add column if not exists is_active boolean not null default true,
      add column if not exists sort_order integer not null default 100,
      add column if not exists description_no text,
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now()
  `);

  await neonQuery(`
    update ct_relation_type_registry
    set
      relation_type_key = coalesce(relation_type_key, 'legacy_relation_type_' || id::text),
      relation_name_no = coalesce(relation_name_no, relation_type_label_no, relation_type_key, 'Legacy relation type'),
      from_entity = coalesce(from_entity, source_entity_type, 'unknown'),
      to_entity = coalesce(to_entity, target_entity_type, 'unknown'),
      privacy_level = coalesce(privacy_level, 'internal'),
      status = coalesce(status, 'active'),
      payload_json = coalesce(payload_json, '{}'::jsonb),
      relation_type_label_no = coalesce(relation_type_label_no, relation_name_no, relation_type_key, 'Legacy relation type'),
      relation_domain = coalesce(relation_domain, 'legacy'),
      source_entity_type = coalesce(source_entity_type, from_entity, 'unknown'),
      target_entity_type = coalesce(target_entity_type, to_entity, 'unknown'),
      direction_mode = coalesce(direction_mode, 'directed'),
      is_active = coalesce(is_active, true),
      sort_order = coalesce(sort_order, 100),
      updated_at = now()
    where relation_type_key is null
       or relation_name_no is null
       or from_entity is null
       or to_entity is null
       or privacy_level is null
       or status is null
       or payload_json is null
       or relation_type_label_no is null
       or relation_domain is null
       or source_entity_type is null
       or target_entity_type is null
       or direction_mode is null
       or is_active is null
       or sort_order is null
  `);

  await neonQuery(`
    alter table ct_relation_type_registry
      alter column relation_type_key set not null,
      alter column relation_name_no set not null,
      alter column from_entity set not null,
      alter column to_entity set not null,
      alter column privacy_level set not null,
      alter column status set not null,
      alter column payload_json set not null,
      alter column relation_type_label_no set not null,
      alter column relation_domain set not null,
      alter column source_entity_type set not null,
      alter column target_entity_type set not null,
      alter column direction_mode set not null,
      alter column is_active set not null,
      alter column sort_order set not null
  `);

  await neonQuery(`
    create unique index if not exists ct_relation_type_registry_key_uidx
    on ct_relation_type_registry (relation_type_key)
  `);
}

async function ensureRelationPathRegistrySchema() {
  await neonQuery(`
    create table if not exists ct_relation_path_registry (
      id bigserial primary key
    )
  `);

  await neonQuery(`
    alter table ct_relation_path_registry
      add column if not exists path_key text,
      add column if not exists path_name_no text,
      add column if not exists path_group text,
      add column if not exists path_order integer,
      add column if not exists path_definition_json jsonb not null default '{}'::jsonb,
      add column if not exists required_for_migration boolean not null default false,
      add column if not exists privacy_level text not null default 'internal',
      add column if not exists status text not null default 'active',
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now(),
      add column if not exists path_label_no text,
      add column if not exists relation_type_key text,
      add column if not exists source_table text,
      add column if not exists source_key_field text,
      add column if not exists object_group_field text,
      add column if not exists source_id_field text,
      add column if not exists target_table text,
      add column if not exists target_id_field text,
      add column if not exists resolver_view text,
      add column if not exists is_active boolean not null default true,
      add column if not exists sort_order integer not null default 100,
      add column if not exists description_no text
  `);

  await neonQuery(`
    update ct_relation_path_registry
    set
      path_key = coalesce(path_key, 'legacy_relation_path_' || id::text),
      path_name_no = coalesce(path_name_no, path_label_no, path_key, 'Legacy relation path'),
      path_group = coalesce(path_group, 'migration_control'),
      path_order = coalesce(path_order, sort_order, 100),
      path_definition_json = coalesce(path_definition_json, '{}'::jsonb),
      required_for_migration = coalesce(required_for_migration, false),
      privacy_level = coalesce(privacy_level, 'internal'),
      status = coalesce(status, 'active'),
      path_label_no = coalesce(path_label_no, path_name_no, path_key, 'Legacy relation path'),
      relation_type_key = coalesce(relation_type_key, 'manual_review'),
      source_table = coalesce(source_table, 'unknown_source_table'),
      target_table = coalesce(target_table, 'unknown_target_table'),
      is_active = coalesce(is_active, true),
      sort_order = coalesce(sort_order, path_order, 100),
      updated_at = now()
    where path_key is null
       or path_name_no is null
       or path_group is null
       or path_order is null
       or path_definition_json is null
       or required_for_migration is null
       or privacy_level is null
       or status is null
       or path_label_no is null
       or relation_type_key is null
       or source_table is null
       or target_table is null
       or is_active is null
       or sort_order is null
  `);

  await neonQuery(`
    alter table ct_relation_path_registry
      alter column path_key set not null,
      alter column path_name_no set not null,
      alter column path_group set not null,
      alter column path_order set not null,
      alter column path_definition_json set not null,
      alter column required_for_migration set not null,
      alter column privacy_level set not null,
      alter column status set not null,
      alter column path_label_no set not null,
      alter column relation_type_key set not null,
      alter column source_table set not null,
      alter column target_table set not null,
      alter column is_active set not null,
      alter column sort_order set not null
  `);

  await neonQuery(`
    create unique index if not exists ct_relation_path_registry_key_uidx
    on ct_relation_path_registry (path_key)
  `);
}

async function ensureRelationMissingLinksSchema() {
  await neonQuery(`
    create table if not exists ct_relation_missing_links (
      id bigserial primary key
    )
  `);

  await neonQuery(`
    alter table ct_relation_missing_links
      add column if not exists check_source text,
      add column if not exists source_table text,
      add column if not exists source_key text,
      add column if not exists object_group text,
      add column if not exists source_object_id text,
      add column if not exists relation_type_key text,
      add column if not exists missing_target_type text,
      add column if not exists missing_target_value text,
      add column if not exists severity text not null default 'warning',
      add column if not exists status text not null default 'open',
      add column if not exists reason_no text,
      add column if not exists payload_json jsonb not null default '{}'::jsonb,
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now()
  `);
}

async function ensureRegistrySchema() {
  await ensureRelationTypeRegistrySchema();
  await ensureRelationPathRegistrySchema();
  await ensureRelationMissingLinksSchema();

  return {
    ct_relation_type_registry_columns: await getColumns("ct_relation_type_registry"),
    ct_relation_path_registry_columns: await getColumns("ct_relation_path_registry"),
    ct_relation_missing_links_columns: await getColumns("ct_relation_missing_links"),
  };
}

async function seedRelationTypes() {
  const relationTypes: RelationTypeSeed[] = [
    {
      relation_type_key: "manual_review",
      relation_name_no: "Manuell vurdering",
      relation_domain: "control",
      from_entity: "unknown",
      to_entity: "unknown",
      sort_order: 1,
      description_no: "Fallback for relasjoner som må vurderes manuelt.",
    },
    {
      relation_type_key: "object_person",
      relation_name_no: "Objekt til person",
      relation_domain: "catalog",
      from_entity: "object",
      to_entity: "person",
      sort_order: 10,
      description_no: "Kobler katalogobjekt til person, signaturperson, motivperson eller historisk person.",
    },
    {
      relation_type_key: "object_ruler",
      relation_name_no: "Objekt til regent / konge",
      relation_domain: "catalog_history",
      from_entity: "object",
      to_entity: "ruler",
      sort_order: 20,
      description_no: "Kobler objekt til regent, konge, lokal hersker eller historisk maktperson.",
    },
    {
      relation_type_key: "object_producer",
      relation_name_no: "Objekt til produsent / utsteder",
      relation_domain: "catalog",
      from_entity: "object",
      to_entity: "producer",
      sort_order: 30,
      description_no: "Kobler objekt til produsent, utsteder, trykkeri, myntverk eller autoritet.",
    },
    {
      relation_type_key: "object_source",
      relation_name_no: "Objekt til kilde",
      relation_domain: "catalog_source",
      from_entity: "object",
      to_entity: "source",
      sort_order: 40,
      description_no: "Kobler objekt til katalogkilde som Norske sedler, Norske mynter eller annen kilde.",
    },
    {
      relation_type_key: "object_historical_period",
      relation_name_no: "Objekt til historisk periode",
      relation_domain: "catalog_history",
      from_entity: "object",
      to_entity: "historical_period",
      sort_order: 50,
      description_no: "Kobler objekt til historisk periode, tidslag, dynasti eller maktstruktur.",
    },
    {
      relation_type_key: "object_year_context",
      relation_name_no: "Objekt til årskontekst",
      relation_domain: "catalog_history",
      from_entity: "object",
      to_entity: "year_context",
      sort_order: 60,
      description_no: "Kobler objektets årstall/publiseringsår til historisk og finansiell kontekst.",
    },
    {
      relation_type_key: "object_variant",
      relation_name_no: "Objekt til variant / litra / signatur",
      relation_domain: "catalog",
      from_entity: "object",
      to_entity: "variant",
      sort_order: 70,
      description_no: "Kobler objekt til variant, litra, signaturkombinasjon eller typevariant.",
    },
    {
      relation_type_key: "collection_object",
      relation_name_no: "Samling til objekt",
      relation_domain: "collection",
      from_entity: "collection",
      to_entity: "object",
      sort_order: 80,
      description_no: "Kobler brukerens samling, ønskeliste, stjerne eller eierstatus til objekt.",
    },
    {
      relation_type_key: "market_object",
      relation_name_no: "Marked til objekt",
      relation_domain: "market",
      from_entity: "market_observation",
      to_entity: "object",
      sort_order: 90,
      description_no: "Kobler auksjon, prisobservasjon, forhandlerobjekt eller markedsverdi til objekt.",
    },
    {
      relation_type_key: "source_object_group",
      relation_name_no: "Kilde til objektgruppe",
      relation_domain: "catalog_source",
      from_entity: "source",
      to_entity: "object_group",
      sort_order: 100,
      description_no: "Kobler kilde/source_key til objektgruppe, for eksempel norske_sedler + banknote.",
    },
  ];

  for (const item of relationTypes) {
    await neonQuery(
      `
        insert into ct_relation_type_registry (
          relation_type_key,
          relation_name_no,
          from_entity,
          to_entity,
          privacy_level,
          status,
          payload_json,
          relation_type_label_no,
          relation_domain,
          source_entity_type,
          target_entity_type,
          direction_mode,
          is_active,
          sort_order,
          description_no,
          updated_at
        )
        values (
          $1::text,
          $2::text,
          $4::integer,
          $5::text,
          'internal',
          'active',
          '{}'::jsonb,
          $2::text,
          $3::text,
          $4::integer,
          $5::text,
          'directed',
          true,
          $6::text,
          $7::text,
          now()
        )
        on conflict (relation_type_key)
        do update set
          relation_name_no = excluded.relation_name_no,
          from_entity = excluded.from_entity,
          to_entity = excluded.to_entity,
          privacy_level = excluded.privacy_level,
          status = excluded.status,
          payload_json = excluded.payload_json,
          relation_type_label_no = excluded.relation_type_label_no,
          relation_domain = excluded.relation_domain,
          source_entity_type = excluded.source_entity_type,
          target_entity_type = excluded.target_entity_type,
          direction_mode = excluded.direction_mode,
          is_active = true,
          sort_order = excluded.sort_order,
          description_no = excluded.description_no,
          updated_at = now()
      `,
      [
        item.relation_type_key,
        item.relation_name_no,
        item.relation_domain,
        item.from_entity,
        item.to_entity,
        item.sort_order,
        item.description_no,
      ],
    );
  }

  return relationTypes.length;
}

async function seedRelationPaths() {
  const relationPaths: RelationPathSeed[] = [
    {
      path_key: "ct_catalog_object_person_motif_links",
      path_name_no: "Katalogobjekt til personmotiv",
      path_group: "catalog_relation",
      path_order: 10,
      relation_type_key: "object_person",
      source_table: "ct_catalog_object_person_motif_links",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_person_motifs",
      target_id_field: "person_motif_id",
      resolver_view: "ct_v_catalog_object_person_motifs",
      required_for_migration: true,
      description_no: "Brukes for personmotiv og objekt-person-relasjoner i katalogen.",
    },
    {
      path_key: "ct_catalog_object_ruler_relations",
      path_name_no: "Katalogobjekt til regent",
      path_group: "catalog_relation",
      path_order: 20,
      relation_type_key: "object_ruler",
      source_table: "ct_catalog_object_ruler_relations",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_historical_rulers",
      target_id_field: "ruler_id",
      resolver_view: "ct_v_catalog_relation_ruler_candidates",
      required_for_migration: true,
      description_no: "Brukes for objekt til konge/regent/historisk hersker.",
    },
    {
      path_key: "ct_catalog_object_producer_links",
      path_name_no: "Katalogobjekt til produsent",
      path_group: "catalog_relation",
      path_order: 30,
      relation_type_key: "object_producer",
      source_table: "ct_catalog_object_producer_links",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_producers",
      target_id_field: "producer_id",
      resolver_view: "ct_v_catalog_object_producer_link_requests",
      required_for_migration: true,
      description_no: "Brukes for produsent, utsteder, trykkeri, myntverk og tilsvarende autoritet.",
    },
    {
      path_key: "ct_catalog_sources",
      path_name_no: "Katalogkilder",
      path_group: "catalog_relation",
      path_order: 40,
      relation_type_key: "object_source",
      source_table: "ct_catalog_objects",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_catalog_sources",
      target_id_field: "source_key",
      resolver_view: "ct_v_catalog_sources",
      required_for_migration: true,
      description_no: "Brukes for kilde/source_key, blant annet norske_sedler og andre katalogkilder.",
    },
    {
      path_key: "ct_historical_year_contexts",
      path_name_no: "Historisk årskontekst",
      path_group: "catalog_relation",
      path_order: 50,
      relation_type_key: "object_year_context",
      source_table: "ct_catalog_objects",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_year_label",
      target_table: "ct_historical_year_contexts",
      target_id_field: "year_label",
      resolver_view: "ct_v_catalog_historical_year_context",
      required_for_migration: true,
      description_no: "Brukes for underliggende årslinje, kontekst, regent, periode og historisk sammenheng.",
    },
    {
      path_key: "ct_collection_items",
      path_name_no: "Samling til objekt",
      path_group: "collection_relation",
      path_order: 60,
      relation_type_key: "collection_object",
      source_table: "ct_collection_items",
      source_key_field: "source_key",
      object_group_field: "object_group",
      source_id_field: "object_id",
      target_table: "ct_catalog_objects",
      target_id_field: "object_id",
      resolver_view: "ct_v_user_private_collection_summary",
      required_for_migration: true,
      description_no: "Brukes for Min samling og brukerens objekttilknytninger.",
    },
  ];

  for (const item of relationPaths) {
    await neonQuery(
      `
        insert into ct_relation_path_registry (
          path_key,
          path_name_no,
          path_group,
          path_order,
          path_definition_json,
          required_for_migration,
          privacy_level,
          status,
          path_label_no,
          relation_type_key,
          source_table,
          source_key_field,
          object_group_field,
          source_id_field,
          target_table,
          target_id_field,
          resolver_view,
          is_active,
          sort_order,
          description_no,
          updated_at
        )
        values (
          $1::text,
          $2::text,
          $3::text,
          $4::integer,
          jsonb_build_object(
            'relation_type_key', $5::text,
            'source_table', $6::text,
            'source_key_field', $7::text,
            'object_group_field', $8::text,
            'source_id_field', $9::text,
            'target_table', $10::text,
            'target_id_field', $11::text,
            'resolver_view', ::text$12
          ),
          $13::boolean,
          'internal',
          'active',
          $2::text,
          $5::text,
          $6::text,
          $7::text,
          $8::text,
          $9::text,
          $10::text,
          $11::text,
          $12::text,
          true,
          $4::integer,
          $14::text,
          now()
        )
        on conflict (path_key)
        do update set
          path_name_no = excluded.path_name_no,
          path_group = excluded.path_group,
          path_order = excluded.path_order,
          path_definition_json = excluded.path_definition_json,
          required_for_migration = excluded.required_for_migration,
          privacy_level = excluded.privacy_level,
          status = excluded.status,
          path_label_no = excluded.path_label_no,
          relation_type_key = excluded.relation_type_key,
          source_table = excluded.source_table,
          source_key_field = excluded.source_key_field,
          object_group_field = excluded.object_group_field,
          source_id_field = excluded.source_id_field,
          target_table = excluded.target_table,
          target_id_field = excluded.target_id_field,
          resolver_view = excluded.resolver_view,
          is_active = true,
          sort_order = excluded.sort_order,
          description_no = excluded.description_no,
          updated_at = now()
      `,
      [
        item.path_key,
        item.path_name_no,
        item.path_group,
        item.path_order,
        item.relation_type_key,
        item.source_table,
        item.source_key_field,
        item.object_group_field,
        item.source_id_field,
        item.target_table,
        item.target_id_field,
        item.resolver_view,
        item.required_for_migration,
        item.description_no,
      ],
    );
  }

  return relationPaths.length;
}

export async function GET() {
  try {
    const typeExists = await tableExists("ct_relation_type_registry");
    const pathExists = await tableExists("ct_relation_path_registry");
    const missingLinksExists = await tableExists("ct_relation_missing_links");

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-registry-bootstrap",
      checked_at: new Date().toISOString(),
      status: {
        relation_registry_bootstrap: "status_only",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "POST this route to repair and seed relation registry",
      },
      relation_registry: {
        ct_relation_type_registry_exists: typeExists,
        ct_relation_type_registry_rows: await countTable("ct_relation_type_registry"),
        ct_relation_path_registry_exists: pathExists,
        ct_relation_path_registry_rows: await countTable("ct_relation_path_registry"),
        ct_relation_missing_links_exists: missingLinksExists,
        ct_relation_missing_links_rows: await countTable("ct_relation_missing_links"),
      },
      columns: {
        ct_relation_type_registry: typeExists ? await getColumns("ct_relation_type_registry") : [],
        ct_relation_path_registry: pathExists ? await getColumns("ct_relation_path_registry") : [],
        ct_relation_missing_links: missingLinksExists ? await getColumns("ct_relation_missing_links") : [],
      },
      collectium_rule: {
        write_allowed_on_get: false,
        write_allowed_on_post: true,
        write_scope: "neon_relation_registry_control_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        relation_definition:
          "Relasjon er både datakobling og frontend-navigasjon til relasjonspresentasjon.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-registry-bootstrap",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown relation registry status error",
    }), { status: 500 });
  }
}

export async function POST() {
  try {
    const schema = await ensureRegistrySchema();
    const relationTypeSeedCount = await seedRelationTypes();
    const relationPathSeedCount = await seedRelationPaths();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-registry-bootstrap",
      checked_at: new Date().toISOString(),
      status: {
        relation_registry_bootstrap: "completed",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "rerun_relation_path_check",
      },
      seed: {
        relation_type_seed_count: String(relationTypeSeedCount),
        relation_path_seed_count: String(relationPathSeedCount),
      },
      relation_registry: {
        ct_relation_type_registry_rows: await countTable("ct_relation_type_registry"),
        ct_relation_path_registry_rows: await countTable("ct_relation_path_registry"),
        ct_relation_missing_links_rows: await countTable("ct_relation_missing_links"),
      },
      schema,
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_relation_registry_control_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        reason:
          "Denne ruten reparerer og seeder kun Neon relation registry. Den migrerer ikke MariaDB kildedata.",
        relation_definition:
          "Relasjon er både datakobling og frontend-navigasjon til relasjonspresentasjon.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-registry-bootstrap",
      status: "FEIL",
      migration_allowed: false,
      source_data_migration_allowed: false,
      error: error instanceof Error ? error.message : "Unknown relation registry bootstrap error",
    }), { status: 500 });
  }
}

