import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const root = process.cwd();
for (const file of [".env.local", ".env.production", ".env", ".env.development"]) {
  loadEnvFile(path.join(root, file));
}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error("FEIL: Mangler DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/NEON_DATABASE_URL.");
  process.exit(2);
}

const sql = neon(databaseUrl);

async function q(text, params = []) {
  return sql.query(text, params);
}

const SOURCE_KEY = "verdibrev";
const OBJECT_GROUP = "security";
const SOURCE_MODE = "neon_first";
const MARIA_STATUS = "NO_MARIADB_SOURCE";

const filters = [
  ["country", "Land / omrÃ¥de", "country_raw_no", 10],
  ["source", "Kilde", "source_key", 20],
  ["object_group", "Objekttype", "object_group", 30],
  ["issuer", "Utsteder / produsent", "issuer_raw_no", 40],
  ["company", "Selskap / entitet", "company_raw_no", 50],
  ["security_type", "Verdibrevtype", "security_type_raw_no", 60],
  ["issue_series", "Utgave / serie", "issue_series_raw_no", 70],
  ["issue_period", "Utgaveperiode", "issue_period_raw_no", 80],
  ["publication_year", "PubliseringsÃ¥r", "publication_year_label", 90],
  ["object_year", "Ã…r / periode", "object_year_label", 100],
  ["denomination", "ValÃ¸r / pÃ¥lydende", "denomination_raw_no", 110],
  ["currency", "Valuta", "currency_code", 120],
  ["serial_number", "Nummer / serie / detalj", "serial_number_raw_no", 130],
  ["variant", "Variant / type", "variant_type_raw_no", 140],
  ["signature", "Signatur / personer", "signature_raw_no", 150],
  ["historical_period", "Historisk periode", "historical_period_label_no", 160],
  ["historical_event", "Historiske hendelser", "historical_event_label_no", 170],
  ["origin_provenance", "Opprinnelse / proveniens", "origin_raw_no", 180],
  ["find", "Funn", "find_raw_no", 190],
  ["material", "Materiale / papirtype", "material_raw_no", 200],
  ["grade", "Kvalitet", "grade_raw_no", 210],
  ["rarity", "Sjeldenhet", "rarity_raw_no", 220],
  ["market", "Marked", "market_status_raw_no", 230],
  ["auction", "Auksjon", "auction_status_raw_no", 240],
  ["shop", "Nettbutikk", "shop_status_raw_no", 250],
  ["collection", "Samling", "collection_status_raw_no", 260],
  ["user_state", "Brukerstatus", "user_state_raw_no", 270],
  ["trend", "Trend", "trend_raw_no", 280],
  ["value", "Verdi", "value_raw_no", 290]
];

const objectIdentity = [
  ["source_key", "Kilde", "text", true, 10],
  ["object_group", "Objekttype", "text", true, 20],
  ["source_catalog_number", "Katalognummer", "text", false, 30],
  ["title_no", "Tittel", "text", false, 40],
  ["country_raw_no", "Land / omrÃ¥de", "text", false, 50],
  ["issuer_raw_no", "Utsteder / produsent", "text", false, 60],
  ["company_raw_no", "Selskap / entitet", "text", false, 70],
  ["security_type_raw_no", "Verdibrevtype", "text", false, 80],
  ["publication_year_label", "PubliseringsÃ¥r", "text", false, 90],
  ["object_year_label", "Ã…r / periode", "text", false, 100],
  ["denomination_raw_no", "ValÃ¸r / pÃ¥lydende", "text", false, 110],
  ["currency_code", "Valuta", "text", false, 120],
  ["serial_number_raw_no", "Nummer / serie / detalj", "text", false, 130],
  ["variant_type_raw_no", "Variant / type", "text", false, 140],
  ["signature_raw_no", "Signatur / personer", "text", false, 150],
  ["material_raw_no", "Materiale / papirtype", "text", false, 160],
  ["grade_raw_no", "Kvalitet", "text", false, 170],
  ["rarity_raw_no", "Sjeldenhet", "text", false, 180],
  ["market_value_amount", "Markedsverdi", "numeric", false, 190],
  ["trend_percent", "Trend %", "numeric", false, 200]
];

const started = new Date().toISOString();

await q(`create table if not exists ct_neon_first_source_registry (
  source_key text primary key,
  source_label_no text not null,
  source_label_en text,
  object_group_default text not null,
  source_mode text not null default 'neon_first',
  maria_source_status text not null default 'NO_MARIADB_SOURCE',
  source_status text not null default 'active',
  is_neon_first boolean not null default true,
  description_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`);

await q(`create table if not exists ct_neon_first_object_group_registry (
  object_group text primary key,
  object_group_label_no text not null,
  object_group_label_en text,
  source_mode text not null default 'neon_first',
  group_status text not null default 'active',
  description_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`);

await q(`create table if not exists ct_neon_first_source_object_groups (
  source_key text not null,
  object_group text not null,
  source_mode text not null default 'neon_first',
  maria_source_status text not null default 'NO_MARIADB_SOURCE',
  relation_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_key, object_group)
)`);

await q(`create table if not exists ct_neon_first_filter_contract (
  source_key text not null,
  object_group text not null,
  filter_key text not null,
  label_no text not null,
  field_key text not null,
  sort_order integer not null default 999,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_key, object_group, filter_key)
)`);

await q(`create table if not exists ct_neon_first_object_identity_contract (
  source_key text not null,
  object_group text not null,
  field_key text not null,
  label_no text not null,
  data_type text not null default 'text',
  is_required boolean not null default false,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_key, object_group, field_key)
)`);

await q(`create table if not exists ct_migration_catalog_object_staging (
  staging_id bigserial primary key,
  source_key text not null,
  object_group text not null,
  source_catalog_number text,
  object_status text not null default 'staging',
  proposed_object_id bigint,
  payload_json jsonb not null default '{}'::jsonb,
  relations_json jsonb not null default '{}'::jsonb,
  filters_json jsonb not null default '{}'::jsonb,
  images_json jsonb not null default '{}'::jsonb,
  migration_status text not null default 'not_started',
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`);

await q(`create table if not exists ct_no_security_catalog (
  object_id bigserial primary key,
  source_key text not null default 'verdibrev',
  object_group text not null default 'security',
  object_status text not null default 'draft',

  source_catalog_number text,
  local_catalog_number text,
  collectium_title text,
  title_no text,

  country_raw_no text,
  issuer_raw_no text,
  company_raw_no text,
  security_type_raw_no text,
  issue_series_raw_no text,
  issue_period_raw_no text,

  publication_year_label text,
  object_year_label text,
  issue_date date,
  maturity_date date,

  denomination_raw_no text,
  nominal_value_numeric numeric,
  currency_code text,

  serial_number_raw_no text,
  variant_type_raw_no text,
  signature_raw_no text,
  historical_period_label_no text,
  historical_event_label_no text,
  origin_raw_no text,
  find_raw_no text,
  material_raw_no text,
  grade_raw_no text,
  rarity_raw_no text,

  market_status_raw_no text,
  market_value_amount numeric,
  market_currency_code text,
  trend_raw_no text,
  trend_percent numeric,

  auction_status_raw_no text,
  shop_status_raw_no text,
  collection_status_raw_no text,
  user_state_raw_no text,

  provenance_public_json jsonb not null default '{}'::jsonb,
  relations_json jsonb not null default '{}'::jsonb,
  market_json jsonb not null default '{}'::jsonb,
  images_json jsonb not null default '{}'::jsonb,
  payload_json jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`);

await q(`create unique index if not exists ct_no_security_catalog_source_number_uq
  on ct_no_security_catalog (source_key, object_group, source_catalog_number)
  where source_catalog_number is not null`);

await q(`create index if not exists ct_no_security_catalog_source_group_idx
  on ct_no_security_catalog (source_key, object_group)`);

await q(`create index if not exists ct_no_security_catalog_year_idx
  on ct_no_security_catalog (object_year_label, publication_year_label)`);

await q(`create index if not exists ct_no_security_catalog_issuer_idx
  on ct_no_security_catalog (issuer_raw_no, company_raw_no)`);

await q(`create or replace view ct_v_no_security_catalog_resolved as
  select
    object_id,
    source_key,
    object_group,
    object_status,
    coalesce(collectium_title, title_no, source_catalog_number, 'Verdibrev uten tittel') as display_title,
    source_catalog_number,
    country_raw_no,
    issuer_raw_no,
    company_raw_no,
    security_type_raw_no,
    issue_series_raw_no,
    publication_year_label,
    object_year_label,
    denomination_raw_no,
    currency_code,
    serial_number_raw_no,
    variant_type_raw_no,
    signature_raw_no,
    historical_period_label_no,
    material_raw_no,
    grade_raw_no,
    rarity_raw_no,
    case
      when market_value_amount is null or market_value_amount = 0 then 'Ikke vurdert'
      else concat(market_value_amount::text, ' ', coalesce(market_currency_code, currency_code, ''))
    end as value_label,
    trend_raw_no,
    trend_percent,
    auction_status_raw_no,
    shop_status_raw_no,
    collection_status_raw_no,
    user_state_raw_no,
    relations_json,
    images_json,
    payload_json,
    created_at,
    updated_at
  from ct_no_security_catalog`);

await q(`insert into ct_neon_first_source_registry
  (source_key, source_label_no, source_label_en, object_group_default, source_mode, maria_source_status, source_status, is_neon_first, description_no, updated_at)
values
  ($1, 'Verdibrev', 'Securities / value papers', $2, $3, $4, 'active', true,
   'Neon-first kilde for verdibrev/security. Finnes ikke i MariaDB og skal bygges direkte i Neon.',
   now())
on conflict (source_key) do update set
  source_label_no = excluded.source_label_no,
  source_label_en = excluded.source_label_en,
  object_group_default = excluded.object_group_default,
  source_mode = excluded.source_mode,
  maria_source_status = excluded.maria_source_status,
  source_status = excluded.source_status,
  is_neon_first = excluded.is_neon_first,
  description_no = excluded.description_no,
  updated_at = now()`, [SOURCE_KEY, OBJECT_GROUP, SOURCE_MODE, MARIA_STATUS]);

await q(`insert into ct_neon_first_object_group_registry
  (object_group, object_group_label_no, object_group_label_en, source_mode, group_status, description_no, updated_at)
values
  ($1, 'Verdibrev', 'Security / value paper', $2, 'active',
   'Objektgruppe for verdibrev, aksjebrev, obligasjoner, verdipapirer og relaterte samlerobjekter.',
   now())
on conflict (object_group) do update set
  object_group_label_no = excluded.object_group_label_no,
  object_group_label_en = excluded.object_group_label_en,
  source_mode = excluded.source_mode,
  group_status = excluded.group_status,
  description_no = excluded.description_no,
  updated_at = now()`, [OBJECT_GROUP, SOURCE_MODE]);

await q(`insert into ct_neon_first_source_object_groups
  (source_key, object_group, source_mode, maria_source_status, relation_status, updated_at)
values
  ($1, $2, $3, $4, 'active', now())
on conflict (source_key, object_group) do update set
  source_mode = excluded.source_mode,
  maria_source_status = excluded.maria_source_status,
  relation_status = excluded.relation_status,
  updated_at = now()`, [SOURCE_KEY, OBJECT_GROUP, SOURCE_MODE, MARIA_STATUS]);

for (const f of filters) {
  await q(`insert into ct_neon_first_filter_contract
    (source_key, object_group, filter_key, label_no, field_key, sort_order, is_active, updated_at)
  values
    ($1, $2, $3, $4, $5, $6, true, now())
  on conflict (source_key, object_group, filter_key) do update set
    label_no = excluded.label_no,
    field_key = excluded.field_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now()`, [SOURCE_KEY, OBJECT_GROUP, f[0], f[1], f[2], f[3]]);
}

for (const field of objectIdentity) {
  await q(`insert into ct_neon_first_object_identity_contract
    (source_key, object_group, field_key, label_no, data_type, is_required, sort_order, updated_at)
  values
    ($1, $2, $3, $4, $5, $6, $7, now())
  on conflict (source_key, object_group, field_key) do update set
    label_no = excluded.label_no,
    data_type = excluded.data_type,
    is_required = excluded.is_required,
    sort_order = excluded.sort_order,
    updated_at = now()`, [SOURCE_KEY, OBJECT_GROUP, field[0], field[1], field[2], field[3], field[4]]);
}

const sourceRows = await q(`select * from ct_neon_first_source_registry where source_key = $1`, [SOURCE_KEY]);
const groupRows = await q(`select * from ct_neon_first_object_group_registry where object_group = $1`, [OBJECT_GROUP]);
const linkRows = await q(`select * from ct_neon_first_source_object_groups where source_key = $1 and object_group = $2`, [SOURCE_KEY, OBJECT_GROUP]);
const filterCount = await q(`select count(*)::int as count from ct_neon_first_filter_contract where source_key = $1 and object_group = $2`, [SOURCE_KEY, OBJECT_GROUP]);
const identityCount = await q(`select count(*)::int as count from ct_neon_first_object_identity_contract where source_key = $1 and object_group = $2`, [SOURCE_KEY, OBJECT_GROUP]);
const stagingCount = await q(`select count(*)::int as count from ct_migration_catalog_object_staging where source_key = $1 and object_group = $2`, [SOURCE_KEY, OBJECT_GROUP]);
const catalogCount = await q(`select count(*)::int as count from ct_no_security_catalog where source_key = $1 and object_group = $2`, [SOURCE_KEY, OBJECT_GROUP]);

const result = {
  status: "OK",
  source_key: SOURCE_KEY,
  object_group: OBJECT_GROUP,
  source_mode: SOURCE_MODE,
  maria_source_status: MARIA_STATUS,
  source_registry: sourceRows[0] || null,
  object_group_registry: groupRows[0] || null,
  source_object_group_link: linkRows[0] || null,
  filter_contract_count: filterCount[0]?.count ?? 0,
  object_identity_contract_count: identityCount[0]?.count ?? 0,
  staging_rows: stagingCount[0]?.count ?? 0,
  catalog_rows: catalogCount[0]?.count ?? 0,
  created_tables: [
    "ct_neon_first_source_registry",
    "ct_neon_first_object_group_registry",
    "ct_neon_first_source_object_groups",
    "ct_neon_first_filter_contract",
    "ct_neon_first_object_identity_contract",
    "ct_migration_catalog_object_staging",
    "ct_no_security_catalog"
  ],
  created_views: [
    "ct_v_no_security_catalog_resolved"
  ],
  note: "Kilden finnes ikke i MariaDB og er definert som Neon-first. Struktur og kontrakter er opprettet i Neon. Ingen kildedata er importert.",
  started_at: started,
  finished_at: new Date().toISOString()
};

console.log(JSON.stringify(result, null, 2));

