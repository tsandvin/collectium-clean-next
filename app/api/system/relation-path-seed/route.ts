import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

async function countPathRows() {
  const rows = await neonQuery<{ count_value: string }>(
    `select count(*)::text as count_value from ct_relation_path_registry`,
  );

  return rows[0]?.count_value ?? "0";
}

async function ensurePathSchema() {
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
    create unique index if not exists ct_relation_path_registry_key_uidx
    on ct_relation_path_registry (path_key)
  `);
}

async function seedPaths() {
  await neonQuery(`
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
    values
      (
        'ct_catalog_object_person_motif_links',
        'Katalogobjekt til personmotiv',
        'catalog_relation',
        10,
        '{"relation_type_key":"object_person","source_table":"ct_catalog_object_person_motif_links","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_id","target_table":"ct_person_motifs","target_id_field":"person_motif_id","resolver_view":"ct_v_catalog_object_person_motifs"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til personmotiv',
        'object_person',
        'ct_catalog_object_person_motif_links',
        'source_key',
        'object_group',
        'object_id',
        'ct_person_motifs',
        'person_motif_id',
        'ct_v_catalog_object_person_motifs',
        true,
        10,
        'Brukes for personmotiv og objekt-person-relasjoner i katalogen.',
        now()
      ),
      (
        'ct_catalog_object_ruler_relations',
        'Katalogobjekt til regent',
        'catalog_relation',
        20,
        '{"relation_type_key":"object_ruler","source_table":"ct_catalog_object_ruler_relations","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_id","target_table":"ct_historical_rulers","target_id_field":"ruler_id","resolver_view":"ct_v_catalog_relation_ruler_candidates"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til regent',
        'object_ruler',
        'ct_catalog_object_ruler_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_historical_rulers',
        'ruler_id',
        'ct_v_catalog_relation_ruler_candidates',
        true,
        20,
        'Brukes for objekt til konge/regent/historisk hersker.',
        now()
      ),
      (
        'ct_catalog_object_producer_links',
        'Katalogobjekt til produsent',
        'catalog_relation',
        30,
        '{"relation_type_key":"object_producer","source_table":"ct_catalog_object_producer_links","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_id","target_table":"ct_producers","target_id_field":"producer_id","resolver_view":"ct_v_catalog_object_producer_link_requests"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til produsent',
        'object_producer',
        'ct_catalog_object_producer_links',
        'source_key',
        'object_group',
        'object_id',
        'ct_producers',
        'producer_id',
        'ct_v_catalog_object_producer_link_requests',
        true,
        30,
        'Brukes for produsent, utsteder, trykkeri og myntverk.',
        now()
      ),
      (
        'ct_catalog_sources',
        'Katalogkilder',
        'catalog_relation',
        40,
        '{"relation_type_key":"object_source","source_table":"ct_catalog_objects","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_id","target_table":"ct_catalog_sources","target_id_field":"source_key","resolver_view":"ct_v_catalog_sources"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogkilder',
        'object_source',
        'ct_catalog_objects',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_sources',
        'source_key',
        'ct_v_catalog_sources',
        true,
        40,
        'Brukes for kilde/source_key, blant annet norske_sedler.',
        now()
      ),
      (
        'ct_historical_year_contexts',
        'Historisk aarskontekst',
        'catalog_relation',
        50,
        '{"relation_type_key":"object_year_context","source_table":"ct_catalog_objects","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_year_label","target_table":"ct_historical_year_contexts","target_id_field":"year_label","resolver_view":"ct_v_catalog_historical_year_context"}'::jsonb,
        true,
        'internal',
        'active',
        'Historisk aarskontekst',
        'object_year_context',
        'ct_catalog_objects',
        'source_key',
        'object_group',
        'object_year_label',
        'ct_historical_year_contexts',
        'year_label',
        'ct_v_catalog_historical_year_context',
        true,
        50,
        'Brukes for aar, kontekst, regent, periode og historisk sammenheng.',
        now()
      ),
      (
        'ct_collection_items',
        'Samling til objekt',
        'collection_relation',
        60,
        '{"relation_type_key":"collection_object","source_table":"ct_collection_items","source_key_field":"source_key","object_group_field":"object_group","source_id_field":"object_id","target_table":"ct_catalog_objects","target_id_field":"object_id","resolver_view":"ct_v_user_private_collection_summary"}'::jsonb,
        true,
        'internal',
        'active',
        'Samling til objekt',
        'collection_object',
        'ct_collection_items',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_objects',
        'object_id',
        'ct_v_user_private_collection_summary',
        true,
        60,
        'Brukes for Min samling og brukerens objekttilknytninger.',
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
  `);
}

export async function GET() {
  try {
    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-path-seed",
      status: "ready",
      relation_path_registry_rows: await countPathRows(),
      migration_allowed: false,
      source_data_migration_allowed: false,
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-path-seed",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}

export async function POST() {
  try {
    await ensurePathSchema();
    await seedPaths();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-path-seed",
      status: "completed",
      relation_path_registry_rows: await countPathRows(),
      migration_allowed: false,
      source_data_migration_allowed: false,
      next_step: "GET /api/system/relation-path-check",
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-path-seed",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
