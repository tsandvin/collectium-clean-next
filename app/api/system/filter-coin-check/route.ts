/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Norske Mynter / Coin Filter Check
 *
 * Definering / formål:
 * Oppretter og seeder objektspesifikke filter for mynter i Neon Filter Master.
 *
 * Bruksområde:
 * Brukes etter /api/system/filter-master-check slik at Filter Master ikke bare dekker
 * Norske sedler/banknote, men også Norske mynter/coin.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /filter/master
 * - /filter/periode
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[type]/[slug]
 * - /index
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.master.view
 * - filter.object_type.view
 * - filter.catalog.apply
 * - filter.relation.apply
 * - filter.index.apply
 *
 * Berørte API-ruter:
 * - GET  /api/system/filter-coin-check
 * - POST /api/system/filter-coin-check
 *
 * Berørte tabeller / views:
 * - ct_filter_object_type_registry
 *
 * Dataretning:
 * Neon control registry only. Ingen MariaDB kildedata migreres.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  coin_filter_rows: string;
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

async function ensureCoinFilterSchema() {
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
      updated_at timestamptz not null default now()
    )
  `);

  await neonQuery(`
    create unique index if not exists ct_filter_object_type_registry_uidx
    on ct_filter_object_type_registry (
      object_group,
      coalesce(source_key, ''),
      filter_key
    )
  `);
}

async function seedCoinFilters() {
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
      ('coin', 'norske_mynter', 'country_area', 'Land / omraade', 'country_raw_no', null, false, 'free', 10, 'Land eller geografisk omraade for mynt.', now()),
      ('coin', 'norske_mynter', 'source_key', 'Kilde', 'source_key', 'object_source', false, 'free', 20, 'Kilde/source_key, for eksempel norske_mynter.', now()),
      ('coin', 'norske_mynter', 'object_group', 'Objekttype', 'object_group', null, false, 'free', 30, 'Objektgruppe, for eksempel coin.', now()),
      ('coin', 'norske_mynter', 'producer_mint', 'Myntverk / produsent', 'producer_raw_no', 'object_producer', false, 'free', 40, 'Myntverk, produsent eller utstedende autoritet.', now()),
      ('coin', 'norske_mynter', 'denomination', 'Valoer / objektbetegnelse', 'denomination_raw_no', null, false, 'free', 50, 'Valoer eller objektbetegnelse for mynt.', now()),
      ('coin', 'norske_mynter', 'object_year', 'Aarstall', 'object_year_label', 'object_year_context', true, 'free', 60, 'Myntaar, aarsrelasjon og periodekontekst.', now()),
      ('coin', 'norske_mynter', 'edition_series', 'Utgave / serie', 'denomination_issue_raw_no', null, true, 'free', 70, 'Utgave, serie eller pregeperiode.', now()),
      ('coin', 'norske_mynter', 'variant_type', 'Variant / type', 'variant_type_raw_no', 'object_variant', false, 'free', 80, 'Variant/type for mynt.', now()),
      ('coin', 'norske_mynter', 'ruler', 'Konge / regent', 'ruler_name_raw_no', 'object_ruler', true, 'free', 90, 'Regent, konge eller historisk hersker.', now()),
      ('coin', 'norske_mynter', 'historical_period', 'Historisk periode', 'historical_period_label_no', 'object_historical_period', true, 'free', 100, 'Historisk periode og kontekst.', now()),
      ('coin', 'norske_mynter', 'material', 'Materiale', 'material_raw_no', null, false, 'free', 110, 'Materiale for mynt.', now()),
      ('coin', 'norske_mynter', 'metal_alloy', 'Metall / legering', 'metal_raw_no', null, false, 'silver', 120, 'Metall, legering, gull, soelv, kobber eller blanding.', now()),
      ('coin', 'norske_mynter', 'weight', 'Vekt', 'weight_raw_no', null, false, 'silver', 130, 'Vektdata for mynt.', now()),
      ('coin', 'norske_mynter', 'diameter', 'Diameter', 'diameter_raw_no', null, false, 'silver', 140, 'Diameterdata for mynt.', now()),
      ('coin', 'norske_mynter', 'obverse_reverse', 'Forside / bakside', 'obverse_reverse_raw_no', null, false, 'silver', 150, 'Forside, bakside, motiv og pregedetaljer.', now()),
      ('coin', 'norske_mynter', 'grade', 'Kvalitet', 'grade_raw_no', null, false, 'free', 160, 'Kvalitet/grad for mynt.', now()),
      ('coin', 'norske_mynter', 'rarity', 'Sjeldenhet', 'rarity_raw_no', null, false, 'free', 170, 'Sjeldenhet for mynt.', now()),
      ('coin', 'norske_mynter', 'market', 'Marked', 'market_value_raw_no', 'market_object', true, 'silver', 180, 'Marked, verdi og prisobservasjoner.', now()),
      ('coin', 'norske_mynter', 'auction', 'Auksjon', 'auction_status_raw_no', null, true, 'gold', 190, 'Auksjonsstatus og auksjonskoblinger.', now()),
      ('coin', 'norske_mynter', 'shop', 'Nettbutikk', 'shop_status_raw_no', null, false, 'gold', 200, 'Nettbutikkstatus.', now()),
      ('coin', 'norske_mynter', 'collection', 'Samling', 'collection_status_raw_no', 'collection_object', false, 'free', 210, 'Samling, hjerte og stjerne.', now()),
      ('coin', 'norske_mynter', 'trend', 'Trend', 'trend_raw_no', 'market_object', true, 'silver', 220, 'Trendfilter for verdiutvikling.', now()),
      ('coin', 'norske_mynter', 'value', 'Verdi', 'value_raw_no', 'market_object', true, 'silver', 230, 'Verdifilter.', now())
    on conflict (object_group, (coalesce(source_key, '')), filter_key)
    do update set
      filter_label_no = excluded.filter_label_no,
      source_field = excluded.source_field,
      relation_type_key = excluded.relation_type_key,
      period_enabled = excluded.period_enabled,
      access_min_membership = excluded.access_min_membership,
      sort_order = excluded.sort_order,
      description_no = excluded.description_no,
      is_active = true,
      status = 'active',
      updated_at = now()
  `);
}

async function getCoinCount() {
  const rows = await neonQuery<CountRow>(`
    select count(*)::text as coin_filter_rows
    from ct_filter_object_type_registry
    where object_group = 'coin'
      and source_key = 'norske_mynter'
  `);

  return rows[0]?.coin_filter_rows ?? "0";
}

export async function GET() {
  try {
    await ensureCoinFilterSchema();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-coin-check",
      checked_at: new Date().toISOString(),
      status: {
        coin_filter_check: "ready",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "POST this route to seed Norske mynter / coin filters",
      },
      summary: {
        object_group: "coin",
        source_key: "norske_mynter",
        coin_filter_rows: await getCoinCount(),
      },
      collectium_rule: {
        write_allowed_on_get: false,
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Filter Master skal dekke baade sedler og mynter. Dette er kun Neon filterkontroll, ikke kildedatamigrering.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-coin-check",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown coin filter check error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}

export async function POST() {
  try {
    await ensureCoinFilterSchema();
    await seedCoinFilters();

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-coin-check",
      checked_at: new Date().toISOString(),
      status: {
        coin_filter_bootstrap: "completed",
        migration_status: "not_started",
        neon_truth_status: "not_approved",
        migration_allowed: false,
        source_data_migration_allowed: false,
        next_step: "GET /api/system/filter-coin-check and then /api/system/filter-master-check",
      },
      summary: {
        object_group: "coin",
        source_key: "norske_mynter",
        coin_filter_rows: await getCoinCount(),
      },
      collectium_rule: {
        write_allowed: true,
        write_scope: "neon_filter_control_registry_only",
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Seeder kun objektspesifikke myntfilter i Neon. Ingen MariaDB kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-coin-check",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown coin filter bootstrap error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}

