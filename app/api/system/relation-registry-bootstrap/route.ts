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
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
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

async function getColumns(tableName: string): Promise<ColumnRow[]> {
  return neonQuery<ColumnRow>(
    `
      select column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
      order by ordinal_position
    `,
    [tableName],
  );
}

async function ensureRegistrySchema() {
  await neonQuery(`
    create table if not exists ct_relation_type_registry (
      id bigserial primary key
    )
  `);

  await neonQuery(`
    alter table ct_relation_type_registry
      add column if not exists relation_type_key text,
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
      relation_type_label_no = coalesce(relation_type_label_no, relation_type_key, 'Legacy relation type'),
      relation_domain = coalesce(relation_domain, 'legacy'),
      source_entity_type = coalesce(source_entity_type, 'unknown'),
      target_entity_type = coalesce(target_entity_type, 'unknown')
    where relation_type_key is null
       or relation_type_label_no is null
       or relation_domain is null
       or source_entity_type is null
       or target_entity_type is null
  `);

  await neonQuery(`
    alter table ct_relation_type_registry
      alter column relation_type_key set not null,
      alter column relation_type_label_no set not null,
      alter column relation_domain set not null,
      alter column source_entity_type set not null,
      alter column target_entity_type set not null
  `);

  await neonQuery(`
    create unique index if not exists ct_relation_type_registry_key_uidx
    on ct_relation_type_registry (relation_type_key)
  `);

  await neonQuery(`
    create table if not exists ct_relation_path_registry (
      id bigserial primary key
    )
  `);

  await neonQuery(`
    alter table ct_relation_path_registry
      add column if not exists path_key text,
      add column if not exists path_label_no text,
      add column if not exists relation_type_key text,
      add column if not exists source_table text,
      add column if not exists source_key_field text,
      add column if not exists object_group_field text,
      add column if not exists source_id_field text,
      add column if not exists target_table text,
      add column if not exists target_id_field text,
      add column if not exists resolver_view text,
      add column if not exists required_for_migration boolean not null default false,
      add column if not exists is_active boolean not null default true,
      add column if not exists sort_order integer not null default 100,
      add column if not exists description_no text,
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now()
  `);

  await neonQuery(`
    update ct_relation_path_registry
    set
      path_key = coalesce(path_key, 'legacy_relation_path_' || id::text),
      path_label_no = coalesce(path_label_no, path_key, 'Legacy relation path'),
      relation_type_key = coalesce(relation_type_key, 'manual_review'),
      source_table = coalesce(source_table, 'unknown_source_table'),
      target_table = coalesce(target_table, 'unknown_target_table')
    where path_key is null
       or path_label_no is null
       or relation_type_key is null
       or source_table is null
       or target_table is null
  `);

  await neonQuery(`
    alter table ct_relation_path_registry
      alter column path_key set not null,
      alter column path_label_no set not null,
      alter column relation_type_key set not null,
      alter column source_table set not null,
      alter column target_table set not null
  `);

  await neonQuery(`
    create unique index if not exists ct_relation_path_registry_key_uidx
    on ct_relation_path_registry (path_key)
  `);

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

  return {
    ct_relation_type_registry_columns: await getColumns("ct_relation_type_registry"),
    ct_relation_path_registry_columns: await getColumns("ct_relation_path_registry"),
    ct_relation_missing_links_columns: await getColumns("ct_relation_missing_links"),
  };
}

async function seedRelationTypes() {
  const relationTypes = [
    ["manual_review", "Manuell vurdering", "control", "unknown", "unknown", 1, "Fallback for relasjoner som må vurderes manuelt."],
    ["object_person", "Objekt til person", "catalog", "object", "person", 10, "Kobler katalogobjekt til person, signaturperson, motivperson eller historisk person."],
    ["object_ruler", "Objekt til regent / konge", "catalog_history", "object", "ruler", 20, "Kobler objekt til regent, konge, lokal hersker eller historisk maktperson."],
    ["object_producer", "Objekt til produsent / utsteder", "catalog", "object", "producer", 30, "Kobler objekt til produsent, utsteder, trykkeri, myntverk eller autoritet."],
    ["object_source", "Objekt til kilde", "catalog_source", "object", "source", 40, "Kobler objekt til katalogkilde som Norske sedler, Norske mynter eller annen kilde."],
    ["object_historical_period", "Objekt til historisk periode", "catalog_history", "object", "historical_period", 50, "Kobler objekt til historisk periode, tidslag, dynasti eller maktstruktur."],
    ["object_year_context", "Objekt til årskontekst", "catalog_history", "object", "year_context", 60, "Kobler objektets årstall/publiseringsår til historisk og finansiell kontekst."],
    ["object_variant", "Objekt til variant / litra / signatur", "catalog", "object", "variant", 70, "Kobler objekt til variant, litra, signaturkombinasjon eller typevariant."],
    ["collection_object", "Samling til objekt", "collection", "collection", "object", 80, "Kobler brukerens samling, ønskeliste, stjerne eller eierstatus til objekt."],
    ["market_object", "Marked til objekt", "market", "market_observation", "object", 90, "Kobler auksjon, prisobservasjon, forhandlerobjekt eller markedsverdi til objekt."],
    ["source_object_group", "Kilde til objektgruppe", "catalog_source", "source", "object_group", 100, "Kobler kilde/source_key til objektgruppe, for eksempel norske_sedler + banknote."],
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
          description_no,
          is_active,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, true, now())
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
      item,
    );
  }

  return relationTypes.length;
}

async function seedRelationPaths() {
  const relationPaths = [
    ["ct_catalog_object_person_motif_links", "Katalogobjekt til personmotiv", "object_person", "ct_catalog_object_person_motif_links", "source_key", "object_group", "object_id", "ct_person_motifs", "person_motif_id", "ct_v_catalog_object_person_motifs", true, 10, "Brukes for personmotiv og objekt-person-relasjoner i katalogen."],
    ["ct_catalog_object_ruler_relations", "Katalogobjekt til regent", "object_ruler", "ct_catalog_object_ruler_relations", "source_key", "object_group", "object_id", "ct_historical_rulers", "ruler_id", "ct_v_catalog_relation_ruler_candidates", true, 20, "Brukes for objekt til konge/regent/historisk hersker."],
    ["ct_catalog_object_producer_links", "Katalogobjekt til produsent", "object_producer", "ct_catalog_object_producer_links", "source_key", "object_group", "object_id", "ct_producers", "producer_id", "ct_v_catalog_object_producer_link_requests", true, 30, "Brukes for produsent, utsteder, trykkeri, myntverk og tilsvarende autoritet."],
    ["ct_catalog_sources", "Katalogkilder", "object_source", "ct_catalog_objects", "source_key", "object_group", "object_id", "ct_catalog_sources", "source_key", "ct_v_catalog_sources", true, 40, "Brukes for kilde/source_key, blant annet norske_sedler og andre katalogkilder."],
    ["ct_historical_year_contexts", "Historisk årskontekst", "object_year_context", "ct_catalog_objects", "source_key", "object_group", "object_year_label", "ct_historical_year_contexts", "year_label", "ct_v_catalog_historical_year_context", true, 50, "Brukes for underliggende årslinje, kontekst, regent, periode og historisk sammenheng."],
    ["ct_collection_items", "Samling til objekt", "collection_object", "ct_collection_items", "source_key", "object_group", "object_id", "ct_catalog_objects", "object_id", "ct_v_user_private_collection_summary", true, 60, "Brukes for Min samling og brukerens objekttilknytninger."],
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
          description_no,
          is_active,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, now())
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
      item,
    );
  }

  return relationPaths.length;
}

export async function GET() {
  try {
    const typeColumns = await getColumns("ct_relation_type_registry");
    const pathColumns = await getColumns("ct_relation_path_registry");

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
        ct_relation_type_registry_rows: await countTable("ct_relation_type_registry"),
        ct_relation_path_registry_rows: await countTable("ct_relation_path_registry"),
        ct_relation_missing_links_rows: await countTable("ct_relation_missing_links"),
      },
      columns: {
        ct_relation_type_registry: typeColumns,
        ct_relation_path_registry: pathColumns,
      },
      collectium_rule: {
        write_allowed_on_get: false,
        write_allowed_on_post: true,
        write_scope: "neon_relation_registry_control_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
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
