/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Relation Path Extend API
 *
 * Definering / formål:
 * Utvider global ct_relation_path_registry i Neon med flere kontrollerte
 * relasjonsbaner for katalog, objektpresentasjon, relasjonspresentasjon,
 * filter, index, marked, auksjon, forhandler og nettbutikk.
 *
 * Bruksområde:
 * Brukes etter relation-path-seed og før katalog/objekt/relasjon/index
 * får lese-API som bruker relation registry.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[type]/[slug]
 * - /index
 * - /auksjon
 * - /nettbutikk
 * - /forhandler
 * - /min-side/samling
 *
 * Berørte DB-brytere / feature_keys:
 * - relation.registry.view
 * - relation.path.extend
 * - catalog.relations.view
 * - object.relations.view
 * - relation.presentation.view
 * - filter.relation.apply
 * - index.relation.view
 *
 * Berørte API-ruter:
 * - GET  /api/system/relation-path-extend
 * - POST /api/system/relation-path-extend
 * - GET  /api/system/relation-path-check
 *
 * Berørte tabeller / views:
 * - ct_relation_path_registry
 *
 * Dataretning:
 * Neon control registry only. Ingen MariaDB kildedata migreres.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  extended_relation_path_rows: string;
  total_relation_path_rows: string;
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

async function ensureRelationPathSchema() {
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
    create unique index if not exists ct_relation_path_registry_path_key_uidx
    on ct_relation_path_registry (path_key)
  `);
}

async function seedExtendedRelationPaths() {
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
        'ct_catalog_object_variant_relations',
        'Katalogobjekt til variant',
        'catalog_relation',
        70,
        '{"relation_type_key":"object_variant","frontend_path":"/relasjon/variant/{slug}","source_table":"ct_catalog_object_variant_relations","target_table":"ct_catalog_variants"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til variant',
        'object_variant',
        'ct_catalog_object_variant_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_variants',
        'variant_id',
        'ct_v_catalog_object_variant_relations',
        true,
        70,
        'Variant / type skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_denomination_relations',
        'Katalogobjekt til valør',
        'catalog_relation',
        80,
        '{"relation_type_key":"object_denomination","frontend_path":"/relasjon/valor/{slug}","source_table":"ct_catalog_object_denomination_relations","target_table":"ct_catalog_denominations"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til valør',
        'object_denomination',
        'ct_catalog_object_denomination_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_denominations',
        'denomination_id',
        'ct_v_catalog_object_denomination_relations',
        true,
        80,
        'Valør / objektbetegnelse skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_material_relations',
        'Katalogobjekt til materiale',
        'catalog_relation',
        90,
        '{"relation_type_key":"object_material","frontend_path":"/relasjon/materiale/{slug}","source_table":"ct_catalog_object_material_relations","target_table":"ct_materials"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til materiale',
        'object_material',
        'ct_catalog_object_material_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_materials',
        'material_id',
        'ct_v_catalog_object_material_relations',
        true,
        90,
        'Materiale, papirtype og fysisk objektdata.',
        now()
      ),
      (
        'ct_catalog_object_metal_alloy_relations',
        'Katalogobjekt til metall / legering',
        'catalog_relation',
        100,
        '{"relation_type_key":"object_metal_alloy","frontend_path":"/relasjon/metall/{slug}","source_table":"ct_catalog_object_metal_alloy_relations","target_table":"ct_metal_alloys"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til metall / legering',
        'object_metal_alloy',
        'ct_catalog_object_metal_alloy_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_metal_alloys',
        'metal_alloy_id',
        'ct_v_catalog_object_metal_alloy_relations',
        true,
        100,
        'Metall og legering for mynter og andre relevante objekter.',
        now()
      ),
      (
        'ct_catalog_object_historical_period_relations',
        'Katalogobjekt til historisk periode',
        'history_relation',
        110,
        '{"relation_type_key":"object_historical_period","frontend_path":"/relasjon/periode/{slug}","source_table":"ct_catalog_object_historical_period_relations","target_table":"ct_historical_periods"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til historisk periode',
        'object_historical_period',
        'ct_catalog_object_historical_period_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_historical_periods',
        'historical_period_id',
        'ct_v_catalog_object_historical_period_relations',
        true,
        110,
        'Historisk periode skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_historical_event_relations',
        'Katalogobjekt til historisk hendelse',
        'history_relation',
        120,
        '{"relation_type_key":"object_historical_event","frontend_path":"/relasjon/hendelse/{slug}","source_table":"ct_catalog_object_historical_event_relations","target_table":"ct_historical_events"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til historisk hendelse',
        'object_historical_event',
        'ct_catalog_object_historical_event_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_historical_events',
        'historical_event_id',
        'ct_v_catalog_object_historical_event_relations',
        true,
        120,
        'Historiske hendelser skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_find_relations',
        'Katalogobjekt til funn',
        'provenance_relation',
        130,
        '{"relation_type_key":"object_find","frontend_path":"/relasjon/funn/{slug}","source_table":"ct_catalog_object_find_relations","target_table":"ct_catalog_finds"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til funn',
        'object_find',
        'ct_catalog_object_find_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_finds',
        'find_id',
        'ct_v_catalog_object_find_relations',
        true,
        130,
        'Funn og funnsted skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_provenance_relations',
        'Katalogobjekt til proveniens',
        'provenance_relation',
        140,
        '{"relation_type_key":"object_provenance","frontend_path":"/relasjon/proveniens/{slug}","source_table":"ct_catalog_object_provenance_relations","target_table":"ct_catalog_provenance"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til proveniens',
        'object_provenance',
        'ct_catalog_object_provenance_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_catalog_provenance',
        'provenance_id',
        'ct_v_catalog_object_provenance_relations',
        true,
        140,
        'Opprinnelse og proveniens skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_motif_relations',
        'Katalogobjekt til motiv',
        'catalog_relation',
        150,
        '{"relation_type_key":"object_motif","frontend_path":"/relasjon/motiv/{slug}","source_table":"ct_catalog_object_motif_relations","target_table":"ct_motifs"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til motiv',
        'object_motif',
        'ct_catalog_object_motif_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_motifs',
        'motif_id',
        'ct_v_catalog_object_motif_relations',
        true,
        150,
        'Motiv, riksvåpen, portrett og visuelle motiv skal kunne åpnes som relasjon.',
        now()
      ),
      (
        'ct_catalog_object_market_relations',
        'Katalogobjekt til marked',
        'market_relation',
        160,
        '{"relation_type_key":"market_object","frontend_path":"/relasjon/marked/{slug}","source_table":"ct_catalog_object_market_relations","target_table":"ct_market_objects"}'::jsonb,
        true,
        'internal',
        'active',
        'Katalogobjekt til marked',
        'market_object',
        'ct_catalog_object_market_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_market_objects',
        'market_object_id',
        'ct_v_catalog_object_market_relations',
        true,
        160,
        'Marked, verdi, trend og prisobservasjoner.',
        now()
      ),
      (
        'ct_auction_object_relations',
        'Auksjon til objekt',
        'market_relation',
        170,
        '{"relation_type_key":"auction_object","frontend_path":"/relasjon/auksjon/{slug}","source_table":"ct_auction_object_relations","target_table":"ct_auctions"}'::jsonb,
        true,
        'internal',
        'active',
        'Auksjon til objekt',
        'auction_object',
        'ct_auction_object_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_auctions',
        'auction_id',
        'ct_v_auction_object_relations',
        true,
        170,
        'Auksjonsobjekter og auksjonsstatus.',
        now()
      ),
      (
        'ct_dealer_object_relations',
        'Forhandler til objekt',
        'dealer_relation',
        180,
        '{"relation_type_key":"dealer_object","frontend_path":"/relasjon/forhandler/{slug}","source_table":"ct_dealer_object_relations","target_table":"ct_dealers"}'::jsonb,
        true,
        'internal',
        'active',
        'Forhandler til objekt',
        'dealer_object',
        'ct_dealer_object_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_dealers',
        'dealer_id',
        'ct_v_dealer_object_relations',
        true,
        180,
        'Forhandlerobjekter, innlevering og salgsrolle.',
        now()
      ),
      (
        'ct_shop_object_relations',
        'Nettbutikk til objekt',
        'market_relation',
        190,
        '{"relation_type_key":"shop_object","frontend_path":"/relasjon/nettbutikk/{slug}","source_table":"ct_shop_object_relations","target_table":"ct_shop_channels"}'::jsonb,
        true,
        'internal',
        'active',
        'Nettbutikk til objekt',
        'shop_object',
        'ct_shop_object_relations',
        'source_key',
        'object_group',
        'object_id',
        'ct_shop_channels',
        'shop_channel_id',
        'ct_v_shop_object_relations',
        true,
        190,
        'Nettbutikkstatus og salgskanal.',
        now()
      ),
      (
        'ct_index_period_relations',
        'Index til periode',
        'index_relation',
        200,
        '{"relation_type_key":"index_period","frontend_path":"/relasjon/index-periode/{slug}","source_table":"ct_index_period_relations","target_table":"ct_period_index"}'::jsonb,
        true,
        'internal',
        'active',
        'Index til periode',
        'index_period',
        'ct_index_period_relations',
        null,
        null,
        'period_key',
        'ct_period_index',
        'period_index_id',
        'ct_v_index_period_relations',
        true,
        200,
        'Index, marked, finans og periodeanalyse.',
        now()
      ),
      (
        'ct_dynasty_house_relations',
        'Dynasti / kongehus',
        'history_relation',
        210,
        '{"relation_type_key":"dynasty_house","frontend_path":"/relasjon/dynasti/{slug}","source_table":"ct_dynasty_house_relations","target_table":"ct_dynasty_houses"}'::jsonb,
        true,
        'internal',
        'active',
        'Dynasti / kongehus',
        'dynasty_house',
        'ct_dynasty_house_relations',
        null,
        null,
        'dynasty_house_key',
        'ct_dynasty_houses',
        'dynasty_house_id',
        'ct_v_dynasty_house_relations',
        true,
        210,
        'Dynasti, kongehus og historisk maktstruktur.',
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

async function getCounts() {
  const rows = await neonQuery<CountRow>(`
    select
      count(*) filter (
        where path_key in (
          'ct_catalog_object_variant_relations',
          'ct_catalog_object_denomination_relations',
          'ct_catalog_object_material_relations',
          'ct_catalog_object_metal_alloy_relations',
          'ct_catalog_object_historical_period_relations',
          'ct_catalog_object_historical_event_relations',
          'ct_catalog_object_find_relations',
          'ct_catalog_object_provenance_relations',
          'ct_catalog_object_motif_relations',
          'ct_catalog_object_market_relations',
          'ct_auction_object_relations',
          'ct_dealer_object_relations',
          'ct_shop_object_relations',
          'ct_index_period_relations',
          'ct_dynasty_house_relations'
        )
      )::text as extended_relation_path_rows,
      count(*)::text as total_relation_path_rows
    from ct_relation_path_registry
  `);

  return rows[0] ?? {
    extended_relation_path_rows: "0",
    total_relation_path_rows: "0",
  };
}

export async function GET() {
  try {
    await ensureRelationPathSchema();
    const counts = await getCounts();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-path-extend",
      checked_at: new Date().toISOString(),
      status: {
        relation_path_extend_check: "ready",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "POST this route to extend global relation paths",
      },
      summary: counts,
      collectium_rule: {
        write_allowed_on_get: false,
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Relasjon er både DB-kobling og frontend-navigasjon. Dette utvider bare Neon relation registry, ikke kildedata.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-path-extend",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown relation path extend check error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}

export async function POST() {
  try {
    await ensureRelationPathSchema();
    await seedExtendedRelationPaths();
    const counts = await getCounts();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-path-extend",
      checked_at: new Date().toISOString(),
      status: {
        relation_path_extend_bootstrap: "completed",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "GET /api/system/relation-path-check, then build relation read API",
      },
      summary: counts,
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_relation_control_registry_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Seeder kun globale relasjonsbaner i Neon. Ingen MariaDB kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-path-extend",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown relation path extend bootstrap error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
