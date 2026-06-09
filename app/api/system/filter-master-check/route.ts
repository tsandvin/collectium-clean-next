/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Filter Master Check / Bootstrap
 *
 * Definering / formål:
 * Oppretter og kontrollerer Filter Master, objektspesifikke filter,
 * enkel periodefilter og avansert periodefilter i Neon.
 *
 * Bruksområde:
 * Brukes før katalog, objektpresentasjon, relasjonspresentasjon,
 * index, auksjon, forhandler og samling bygges videre.
 *
 * Berørte sider / routes:
 * - /admin/system/filter-master
 * - /admin/system/period-filter
 * - /filter/master
 * - /filter/periode
 * - /filter/periode/avansert
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[type]/[slug]
 * - /index
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.master.view
 * - filter.master.resolve
 * - filter.object_type.view
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.period.advanced.use
 * - filter.catalog.apply
 * - filter.relation.apply
 * - filter.index.apply
 * - filter.auction.apply
 * - filter.dealer.apply
 * - filter.collection.apply
 *
 * Berørte API-ruter:
 * - GET  /api/system/filter-master-check
 * - POST /api/system/filter-master-check
 * - GET  /api/filter/master
 * - GET  /api/filter/options
 * - POST /api/filter/resolve
 * - GET  /api/filter/period/simple
 * - GET  /api/filter/period/advanced
 *
 * Berørte tabeller / views:
 * - ct_filter_master_registry
 * - ct_filter_object_type_registry
 * - ct_period_filter_registry
 * - ct_filter_usage_registry
 *
 * Dataretning:
 * Neon control registry only. Ingen MariaDB kildedata migreres.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  table_name: string;
  count_value: string;
};

type MissingRow = {
  table_name: string;
  missing: boolean;
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

async function ensureFilterSchema() {
  await neonQuery(`
    create table if not exists ct_filter_master_registry (
      id bigserial primary key,
      filter_key text not null unique,
      filter_label_no text not null,
      filter_level text not null,
      filter_domain text not null,
      applies_to_json jsonb not null default '{}'::jsonb,
      access_min_membership text not null default 'free',
      api_route text,
      resolver_key text,
      is_active boolean not null default true,
      sort_order integer not null default 100,
      status text not null default 'active',
      description_no text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await neonQuery(`
    create table if not exists ct_filter_object_type_registry (
      id bigserial primary key,
      object_group text not null,
      source_key text,
      filter_key text not null,
      filter_label_no text not null,
      source_field text,
      relation_type_key text,
      period_enabled boolean not null default false,
      access_min_membership text not null default 'free',
      is_active boolean not null default true,
      sort_order integer not null default 100,
      status text not null default 'active',
      description_no text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (object_group, coalesce(source_key, ''), filter_key)
    )
  `);

  await neonQuery(`
    create table if not exists ct_period_filter_registry (
      id bigserial primary key,
      period_filter_key text not null unique,
      period_filter_label_no text not null,
      period_filter_level text not null,
      access_min_membership text not null default 'free',
      applies_to_json jsonb not null default '{}'::jsonb,
      period_fields_json jsonb not null default '{}'::jsonb,
      relation_context_json jsonb not null default '{}'::jsonb,
      api_route text,
      page_route text,
      is_active boolean not null default true,
      sort_order integer not null default 100,
      status text not null default 'active',
      description_no text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await neonQuery(`
    create table if not exists ct_filter_usage_registry (
      id bigserial primary key,
      usage_key text not null unique,
      page_key text not null,
      route_path text not null,
      filter_master_required boolean not null default true,
      simple_period_required boolean not null default false,
      advanced_period_available boolean not null default false,
      object_type_filter_required boolean not null default false,
      access_min_membership text not null default 'free',
      api_contract_key text,
      is_active boolean not null default true,
      sort_order integer not null default 100,
      status text not null default 'active',
      description_no text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
}

async function seedFilterMaster() {
  await neonQuery(`
    insert into ct_filter_master_registry (
      filter_key,
      filter_label_no,
      filter_level,
      filter_domain,
      applies_to_json,
      access_min_membership,
      api_route,
      resolver_key,
      sort_order,
      description_no,
      updated_at
    )
    values
      (
        'filter.master.all_collectibles',
        'Filter Master for alle samletyper',
        'master',
        'all',
        '{"collectible_types":["banknote","coin","stamp","medal","antique","art","document","militaria","other"],"areas":["catalog","object","relation","index","auction","shop","dealer","collection","market"]}'::jsonb,
        'free',
        '/api/filter/master',
        'filter_master_resolver',
        10,
        'Overordnet filterlag som dekker alle samletyper og hovedomraader.',
        now()
      ),
      (
        'filter.master.catalog',
        'Filter Master for katalog',
        'master',
        'catalog',
        '{"areas":["catalog","object","relation"],"requires_relation_registry":true}'::jsonb,
        'free',
        '/api/filter/master',
        'catalog_filter_master_resolver',
        20,
        'Filtergrunnlag for katalog, objektpresentasjon og relasjonspresentasjon.',
        now()
      ),
      (
        'filter.master.market_index',
        'Filter Master for marked og index',
        'master',
        'market_index',
        '{"areas":["index","market","finance","trend","value"],"period_required":true}'::jsonb,
        'silver',
        '/api/filter/master',
        'market_index_filter_master_resolver',
        30,
        'Filtergrunnlag for index, marked, trend og verdi.',
        now()
      ),
      (
        'filter.master.auction_shop',
        'Filter Master for auksjon og nettbutikk',
        'master',
        'auction_shop',
        '{"areas":["auction","shop","dealer"],"object_required":true,"process_required":true}'::jsonb,
        'gold',
        '/api/filter/master',
        'auction_shop_filter_master_resolver',
        40,
        'Filtergrunnlag for auksjon, nettbutikk og forhandlerprosesser.',
        now()
      ),
      (
        'filter.master.collection',
        'Filter Master for samling',
        'master',
        'collection',
        '{"areas":["collection","wishlist","favorites","transactions"],"user_state_required":true}'::jsonb,
        'free',
        '/api/filter/master',
        'collection_filter_master_resolver',
        50,
        'Filtergrunnlag for Min samling, hjerte, stjerne og transaksjoner.',
        now()
      )
    on conflict (filter_key)
    do update set
      filter_label_no = excluded.filter_label_no,
      filter_level = excluded.filter_level,
      filter_domain = excluded.filter_domain,
      applies_to_json = excluded.applies_to_json,
      access_min_membership = excluded.access_min_membership,
      api_route = excluded.api_route,
      resolver_key = excluded.resolver_key,
      sort_order = excluded.sort_order,
      description_no = excluded.description_no,
      updated_at = now()
  `);
}

async function seedObjectTypeFilters() {
  await neonQuery(`
    insert into ct_filter_object_type_registry (
      object_group,
      source_key,
      filter_key,
      filter_label_no,
      source_field,
      relation_type_key,
      period_enabled,
      access_min_membership,
      sort_order,
      description_no,
      updated_at
    )
    values
      ('banknote', 'norske_sedler', 'country_area', 'Land / omraade', 'country_raw_no', null, false, 'free', 10, 'Land eller geografisk omraade.', now()),
      ('banknote', 'norske_sedler', 'source_key', 'Kilde', 'source_key', 'object_source', false, 'free', 20, 'Kilde/source_key, for eksempel norske_sedler.', now()),
      ('banknote', 'norske_sedler', 'object_group', 'Objekttype', 'object_group', null, false, 'free', 30, 'Objektgruppe, for eksempel banknote.', now()),
      ('banknote', 'norske_sedler', 'producer', 'Produsent / utsteder', 'producer_raw_no', 'object_producer', false, 'free', 40, 'Produsent, utsteder, trykkeri eller autoritet.', now()),
      ('banknote', 'norske_sedler', 'denomination', 'Valoer', 'denomination_raw_no', null, false, 'free', 50, 'Valoer eller objektbetegnelse.', now()),
      ('banknote', 'norske_sedler', 'object_year', 'Aarstall', 'object_year_label', 'object_year_context', true, 'free', 60, 'Objektaar, aarsrelasjon og periodekontekst.', now()),
      ('banknote', 'norske_sedler', 'litra_details', 'Litra / signatur / detaljer', 'litra_raw_no', null, false, 'free', 70, 'Litra, nummer eller detaljfelt.', now()),
      ('banknote', 'norske_sedler', 'denomination_issue', 'Valoerutgave / serie', 'denomination_issue_raw_no', null, true, 'free', 80, 'Kritisk felt: valoerutgave / serie etter valoer, aarstall og litra.', now()),
      ('banknote', 'norske_sedler', 'variant_type', 'Variant / type', 'variant_type_raw_no', 'object_variant', false, 'free', 90, 'Variant/type for objektet.', now()),
      ('banknote', 'norske_sedler', 'ruler', 'Konge / regent', 'ruler_name_raw_no', 'object_ruler', true, 'free', 100, 'Regent, konge eller historisk hersker.', now()),
      ('banknote', 'norske_sedler', 'persons_signatures', 'Personer / signaturer', 'signature_raw_no', 'object_person', false, 'free', 110, 'Personer, signaturer og motivpersoner.', now()),
      ('banknote', 'norske_sedler', 'historical_period', 'Historisk periode', 'historical_period_label_no', 'object_historical_period', true, 'free', 120, 'Historisk periode og kontekst.', now()),
      ('banknote', 'norske_sedler', 'material', 'Materiale / papirtype', 'material_raw_no', null, false, 'silver', 130, 'Materiale, papirtype og teknisk objektdata.', now()),
      ('banknote', 'norske_sedler', 'grade', 'Kvalitet', 'grade_raw_no', null, false, 'free', 140, 'Kvalitet/grad.', now()),
      ('banknote', 'norske_sedler', 'rarity', 'Sjeldenhet', 'rarity_raw_no', null, false, 'free', 150, 'Sjeldenhet.', now()),
      ('banknote', 'norske_sedler', 'market', 'Marked', 'market_value_raw_no', 'market_object', true, 'silver', 160, 'Marked, verdi og prisobservasjoner.', now()),
      ('banknote', 'norske_sedler', 'auction', 'Auksjon', 'auction_status_raw_no', null, true, 'gold', 170, 'Auksjonsstatus og auksjonskoblinger.', now()),
      ('banknote', 'norske_sedler', 'shop', 'Nettbutikk', 'shop_status_raw_no', null, false, 'gold', 180, 'Nettbutikkstatus.', now()),
      ('banknote', 'norske_sedler', 'collection', 'Samling', 'collection_status_raw_no', 'collection_object', false, 'free', 190, 'Samling, hjerte og stjerne.', now()),
      ('banknote', 'norske_sedler', 'trend', 'Trend', 'trend_raw_no', 'market_object', true, 'silver', 200, 'Trendfilter for verdiutvikling.', now()),
      ('banknote', 'norske_sedler', 'value', 'Verdi', 'value_raw_no', 'market_object', true, 'silver', 210, 'Verdifilter.', now())
    on conflict (object_group, coalesce(source_key, ''), filter_key)
    do update set
      filter_label_no = excluded.filter_label_no,
      source_field = excluded.source_field,
      relation_type_key = excluded.relation_type_key,
      period_enabled = excluded.period_enabled,
      access_min_membership = excluded.access_min_membership,
      sort_order = excluded.sort_order,
      description_no = excluded.description_no,
      updated_at = now()
  `);
}

async function seedPeriodFilters() {
  await neonQuery(`
    insert into ct_period_filter_registry (
      period_filter_key,
      period_filter_label_no,
      period_filter_level,
      access_min_membership,
      applies_to_json,
      period_fields_json,
      relation_context_json,
      api_route,
      page_route,
      sort_order,
      description_no,
      updated_at
    )
    values
      (
        'period.simple',
        'Enkel periodefilter',
        'simple',
        'free',
        '{"areas":["catalog","object","relation","index","auction","shop","dealer","collection"],"available_for":"below_silver"}'::jsonb,
        '{"fields":["year_from","year_to","century","main_period","ruler","before_after"]}'::jsonb,
        '{"relations":["year","ruler","historical_period"]}'::jsonb,
        '/api/filter/period/simple',
        '/filter/periode',
        10,
        'Enkel periodefilter for alle brukere under Soelv.',
        now()
      ),
      (
        'period.advanced',
        'Avansert periodefilter',
        'advanced',
        'silver',
        '{"areas":["catalog","object","relation","index","auction","shop","dealer","collection","market"],"available_for":"silver_and_above"}'::jsonb,
        '{"fields":["publication_year","object_year","edition_period","production_period","ruler_period","dynasty_power_structure","historical_period","historical_event","find_period","market_period","auction_period","collection_transaction_period","index_period"]}'::jsonb,
        '{"relations":["year","ruler","dynasty","historical_period","historical_event","market_index","auction","collection_transaction"]}'::jsonb,
        '/api/filter/period/advanced',
        '/filter/periode/avansert',
        20,
        'Avansert periodefilter for Soelv og hoeyere. Egen side og gjenbrukbart filterpanel.',
        now()
      )
    on conflict (period_filter_key)
    do update set
      period_filter_label_no = excluded.period_filter_label_no,
      period_filter_level = excluded.period_filter_level,
      access_min_membership = excluded.access_min_membership,
      applies_to_json = excluded.applies_to_json,
      period_fields_json = excluded.period_fields_json,
      relation_context_json = excluded.relation_context_json,
      api_route = excluded.api_route,
      page_route = excluded.page_route,
      sort_order = excluded.sort_order,
      description_no = excluded.description_no,
      updated_at = now()
  `);
}

async function seedFilterUsage() {
  await neonQuery(`
    insert into ct_filter_usage_registry (
      usage_key,
      page_key,
      route_path,
      filter_master_required,
      simple_period_required,
      advanced_period_available,
      object_type_filter_required,
      access_min_membership,
      api_contract_key,
      sort_order,
      description_no,
      updated_at
    )
    values
      ('usage.catalog', 'catalog.index', '/katalog', true, true, true, true, 'free', 'catalog_filter_contract', 10, 'Katalog skal alltid bruke Filter Master, objektfilter og periodefilter.', now()),
      ('usage.object.presentation', 'object.presentation', '/objekt/[sourceKey]/[objectGroup]/[objectId]', true, true, true, true, 'free', 'object_filter_relation_contract', 20, 'Objektpresentasjon skal bruke filter som kontekst og relasjonskobling.', now()),
      ('usage.relation.presentation', 'relation.presentation', '/relasjon/[type]/[slug]', true, true, true, false, 'free', 'relation_filter_contract', 30, 'Relasjonspresentasjon skal vise periode- og filterkontekst.', now()),
      ('usage.index', 'index.market', '/index', true, true, true, false, 'silver', 'index_period_filter_contract', 40, 'Index/marked skal bruke periodefilter og finansfilter.', now()),
      ('usage.auction', 'auction.index', '/auksjon', true, true, true, true, 'gold', 'auction_filter_contract', 50, 'Auksjon skal filtreres gjennom Filter Master og objektfilter.', now()),
      ('usage.dealer', 'dealer.index', '/forhandler', true, true, true, true, 'gold', 'dealer_filter_contract', 60, 'Forhandler skal filtrere objekter, prosesser, auksjon og nettbutikk.', now()),
      ('usage.collection', 'collection.index', '/min-side/samling', true, true, true, true, 'free', 'collection_filter_contract', 70, 'Min samling skal bruke samme filtermotor som katalogen.', now()),
      ('usage.period.advanced.page', 'filter.period.advanced', '/filter/periode/avansert', true, false, true, false, 'silver', 'advanced_period_page_contract', 80, 'Avansert periodefilter er egen side for Soelv og hoeyere.', now())
    on conflict (usage_key)
    do update set
      page_key = excluded.page_key,
      route_path = excluded.route_path,
      filter_master_required = excluded.filter_master_required,
      simple_period_required = excluded.simple_period_required,
      advanced_period_available = excluded.advanced_period_available,
      object_type_filter_required = excluded.object_type_filter_required,
      access_min_membership = excluded.access_min_membership,
      api_contract_key = excluded.api_contract_key,
      sort_order = excluded.sort_order,
      description_no = excluded.description_no,
      updated_at = now()
  `);
}

async function getCounts() {
  return neonQuery<CountRow>(`
    select 'ct_filter_master_registry' as table_name, count(*)::text as count_value from ct_filter_master_registry
    union all
    select 'ct_filter_object_type_registry' as table_name, count(*)::text as count_value from ct_filter_object_type_registry
    union all
    select 'ct_period_filter_registry' as table_name, count(*)::text as count_value from ct_period_filter_registry
    union all
    select 'ct_filter_usage_registry' as table_name, count(*)::text as count_value from ct_filter_usage_registry
    order by table_name
  `);
}

async function getMissingTables() {
  return neonQuery<MissingRow>(`
    with required(table_name) as (
      values
        ('ct_filter_master_registry'),
        ('ct_filter_object_type_registry'),
        ('ct_period_filter_registry'),
        ('ct_filter_usage_registry')
    )
    select
      required.table_name,
      to_regclass('public.' || required.table_name) is null as missing
    from required
    order by required.table_name
  `);
}

export async function GET() {
  try {
    await ensureFilterSchema();

    const counts = await getCounts();
    const missing = await getMissingTables();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-master-check",
      checked_at: new Date().toISOString(),
      status: {
        filter_master_check: "ready",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "POST this route to seed filter master registries",
      },
      summary: {
        missing_tables: missing.filter((row) => row.missing).length,
        tables: counts,
      },
      collectium_rule: {
        write_allowed_on_get: false,
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Ingen katalog, objektpresentasjon, relasjonspresentasjon, index, auksjon, forhandler eller samling uten Filter Master og periodefilter.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-master-check",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown filter master check error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}

export async function POST() {
  try {
    await ensureFilterSchema();
    await seedFilterMaster();
    await seedObjectTypeFilters();
    await seedPeriodFilters();
    await seedFilterUsage();

    const counts = await getCounts();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-master-check",
      checked_at: new Date().toISOString(),
      status: {
        filter_master_bootstrap: "completed",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "Create /api/filter/master and /api/filter/period routes",
      },
      summary: {
        tables: counts,
      },
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_filter_control_registry_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Seeder kun filterkontroll i Neon. Ingen MariaDB kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-master-check",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown filter master bootstrap error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
