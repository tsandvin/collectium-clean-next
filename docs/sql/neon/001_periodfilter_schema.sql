/*
COLLECTIUM NEON SQL
File: 001_periodfilter_schema.sql
Purpose: Create period filter schema and relation mapping tables in Neon Postgres.

Safe rule:
- CREATE TABLE IF NOT EXISTS only.
- No DROP.
- No destructive update.
- Existing data is preserved.
*/

create table if not exists ct_period_import_runs (
  run_id uuid primary key default gen_random_uuid(),
  run_key text not null,
  source_system text not null default 'mariadb',
  source_database text,
  source_reference text,
  import_status text not null default 'created',
  import_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ct_period_filter_nodes (
  period_id text primary key,
  period_type text not null,
  period_key text not null unique,
  slug text not null unique,

  navn_no text not null,
  kort_tittel text,

  start_year integer,
  end_year integer,
  historical_start_year integer,
  historical_end_year integer,
  object_first_year integer,
  object_last_year integer,
  publication_first_year integer,
  publication_last_year integer,

  date_precision text not null default 'year_range',

  country_scope text[] not null default array['NO'],
  area_scope text[] not null default array['Norge'],

  simple_filter_enabled boolean not null default true,
  advanced_filter_enabled boolean not null default true,

  simple_filter_group text,
  advanced_filter_group text,

  historical_context_no text,
  lang_beskrivelse_no text,

  source_key_scope text[] not null default array['all'],
  object_group_scope text[] not null default array['all'],

  related_objects jsonb not null default '[]'::jsonb,
  related_sources jsonb not null default '[]'::jsonb,
  related_object_groups jsonb not null default '[]'::jsonb,
  related_producers jsonb not null default '[]'::jsonb,
  related_brands jsonb not null default '[]'::jsonb,
  related_editions jsonb not null default '[]'::jsonb,
  related_series jsonb not null default '[]'::jsonb,
  related_denominations jsonb not null default '[]'::jsonb,
  related_variants jsonb not null default '[]'::jsonb,
  related_materials jsonb not null default '[]'::jsonb,
  related_motifs jsonb not null default '[]'::jsonb,
  related_rulers jsonb not null default '[]'::jsonb,
  related_persons jsonb not null default '[]'::jsonb,
  related_events jsonb not null default '[]'::jsonb,
  related_finds jsonb not null default '[]'::jsonb,
  related_market_data jsonb not null default '[]'::jsonb,
  related_collections jsonb not null default '[]'::jsonb,
  related_index_data jsonb not null default '[]'::jsonb,

  economic_context_no text,
  kpi_inflation_scope jsonb not null default '{}'::jsonb,
  currency_scope jsonb not null default '{}'::jsonb,
  gold_silver_scope jsonb not null default '{}'::jsonb,
  auction_scope jsonb not null default '{}'::jsonb,
  market_trend_scope jsonb not null default '{}'::jsonb,

  filter_count integer not null default 0,
  market_count integer not null default 0,

  relation_href text,
  access_level text not null default 'free',
  status text not null default 'active',
  data_quality_status text not null default 'mariadb_mapped',

  source_references jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ct_period_object_links (
  id bigserial primary key,
  period_id text not null references ct_period_filter_nodes(period_id) on delete cascade,
  source_key text not null,
  object_group text not null,
  object_id text not null,

  relation_type text not null,
  relation_label_no text,
  object_year_label text,
  publication_year_label text,

  confidence numeric(5,4) not null default 1.0,
  source_reference text not null default 'mariadb',
  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(period_id, source_key, object_group, object_id, relation_type)
);

create table if not exists ct_period_relation_links (
  id bigserial primary key,
  period_id text not null references ct_period_filter_nodes(period_id) on delete cascade,

  relation_type text not null,
  target_type text not null,
  target_key text not null,
  target_label_no text,
  target_href text,

  source_key text,
  object_group text,

  confidence numeric(5,4) not null default 1.0,
  source_reference text not null default 'mariadb',
  status text not null default 'active',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(period_id, relation_type, target_type, target_key)
);

create table if not exists ct_period_source_links (
  id bigserial primary key,
  period_id text not null references ct_period_filter_nodes(period_id) on delete cascade,
  source_key text not null,
  object_group text,
  object_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(period_id, source_key, object_group)
);

create table if not exists ct_period_filter_node_staging (
  staging_id bigserial primary key,
  import_run_id uuid references ct_period_import_runs(run_id) on delete set null,

  period_id text,
  period_type text,
  period_key text,
  slug text,
  navn_no text,
  kort_tittel text,

  object_first_year integer,
  object_last_year integer,
  publication_first_year integer,
  publication_last_year integer,

  date_precision text,
  source_key text,
  object_group text,
  filter_count integer,
  object_count integer,
  relation_href text,
  status text,
  data_quality_status text,
  source_reference text,

  staging_status text not null default 'pending',
  staging_note text,

  created_at timestamptz not null default now()
);

create table if not exists ct_period_object_link_staging (
  staging_id bigserial primary key,
  import_run_id uuid references ct_period_import_runs(run_id) on delete set null,

  period_id text,
  source_key text,
  object_group text,
  object_id text,
  relation_type text,
  relation_label_no text,
  object_year_label text,
  publication_year_label text,
  confidence numeric(5,4),
  source_reference text,

  staging_status text not null default 'pending',
  staging_note text,

  created_at timestamptz not null default now()
);

create index if not exists idx_ct_period_filter_nodes_type on ct_period_filter_nodes(period_type);
create index if not exists idx_ct_period_filter_nodes_years on ct_period_filter_nodes(start_year, end_year);
create index if not exists idx_ct_period_filter_nodes_status on ct_period_filter_nodes(status, data_quality_status);
create index if not exists idx_ct_period_object_links_object_key on ct_period_object_links(source_key, object_group, object_id);
create index if not exists idx_ct_period_object_links_period on ct_period_object_links(period_id);
create index if not exists idx_ct_period_relation_links_period on ct_period_relation_links(period_id);
create index if not exists idx_ct_period_relation_links_target on ct_period_relation_links(target_type, target_key);

create or replace view ct_v_period_filter_nodes_public as
select
  period_id,
  period_type,
  period_key,
  slug,
  navn_no,
  kort_tittel,
  coalesce(historical_start_year, object_first_year, start_year) as display_start_year,
  coalesce(historical_end_year, object_last_year, end_year) as display_end_year,
  object_first_year,
  object_last_year,
  publication_first_year,
  publication_last_year,
  date_precision,
  simple_filter_enabled,
  advanced_filter_enabled,
  simple_filter_group,
  advanced_filter_group,
  source_key_scope,
  object_group_scope,
  filter_count,
  market_count,
  relation_href,
  access_level,
  status,
  data_quality_status
from ct_period_filter_nodes
where status = 'active';

create or replace view ct_v_period_filter_ruler_summary as
select
  n.period_id,
  n.navn_no,
  n.slug,
  n.object_first_year,
  n.object_last_year,
  count(l.id) as linked_object_count,
  count(distinct l.source_key) as source_count,
  count(distinct l.object_group) as object_group_count,
  n.relation_href,
  n.data_quality_status
from ct_period_filter_nodes n
left join ct_period_object_links l
  on l.period_id = n.period_id
where n.period_type = 'ruler_period'
group by
  n.period_id,
  n.navn_no,
  n.slug,
  n.object_first_year,
  n.object_last_year,
  n.relation_href,
  n.data_quality_status;

create or replace view ct_v_period_filter_year_summary as
select
  n.period_id,
  n.navn_no,
  n.slug,
  n.start_year,
  n.end_year,
  count(l.id) as linked_object_count,
  count(distinct l.source_key) as source_count,
  count(distinct l.object_group) as object_group_count,
  n.relation_href,
  n.data_quality_status
from ct_period_filter_nodes n
left join ct_period_object_links l
  on l.period_id = n.period_id
where n.period_type = 'year'
group by
  n.period_id,
  n.navn_no,
  n.slug,
  n.start_year,
  n.end_year,
  n.relation_href,
  n.data_quality_status;

insert into ct_period_import_runs (
  run_key,
  source_system,
  source_database,
  source_reference,
  import_status,
  import_note
) values (
  'periodfilter_schema_001',
  'mariadb',
  'collectiumno01',
  'PowerShell Update-Neon-Periodfilter.ps1',
  'schema_ready',
  'Created Neon periodfilter schema, staging tables and views. No MariaDB data imported by this script.'
)
on conflict do nothing;
