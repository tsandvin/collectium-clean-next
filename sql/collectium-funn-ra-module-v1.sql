/*
COLLECTIUM SQL MODULE

Overskrift:
Collectium Funn / Norark / RA Brukerminner modul v1

Definering / formal:
Oppretter minimumsstruktur for Norark-utgravinger, Norark Les mer-artikler og Riksantikvaren Brukerminner som kildeposter, med kontrollert kobling mot funn, sted, ar/periode, katalogkategori og objekt.

Bruksomrade:
Neon Postgres / Collectium DB Neon 8.6

Viktig regel:
Norark og RA Brukerminner skal ikke automatisk bli sann katalogrelasjon. Alle koblinger mot katalogobjekt skal starte som candidate/needs_review.
*/

begin;

create extension if not exists pgcrypto;

create table if not exists public.ct_external_source_registry (
  source_key text primary key,
  source_name text not null,
  source_type text not null,
  source_owner text,
  source_description text,
  source_base_url text,
  source_api_url text,
  source_wms_url text,
  source_dataset_uuid text,
  source_license text,
  source_quality_status text not null default 'unknown',
  source_weight integer not null default 50,
  is_active boolean not null default true,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ct_external_source_registry_type_chk check (source_type in ('archaeology_source','geo_source','catalog_source','relation_source','other')),
  constraint ct_external_source_registry_quality_chk check (source_quality_status in ('official_verified','official_unverified','user_generated_not_ra_verified','unknown'))
);

create table if not exists public.ct_funn_source_records (
  funn_record_id uuid primary key default gen_random_uuid(),
  source_key text not null references public.ct_external_source_registry(source_key),
  record_type text not null,
  source_record_id text,
  title_raw_no text not null,
  slug text,
  external_project_url text,
  external_article_url text,
  parent_project_url text,
  external_api_url text,
  external_map_url text,
  kulturminnesok_url text,
  location_raw_no text,
  municipality_raw_no text,
  county_raw_no text,
  country_raw_no text not null default 'Norge',
  gps_lat numeric(10,7),
  gps_lon numeric(10,7),
  geometry_json jsonb,
  source_year_label text,
  excavation_year_label text,
  article_date_label text,
  object_year_label text,
  object_year_from integer,
  object_year_to integer,
  object_period_label text,
  dating_precision text not null default 'unknown',
  dating_note_no text,
  find_title_no text,
  find_description_no text,
  find_type_candidate text,
  find_material_candidate text,
  find_context_candidate text,
  find_quality_status text not null default 'needs_review',
  catalog_object_group_candidate text,
  catalog_category_candidate text,
  catalog_relation_candidate text,
  catalog_object_id_candidate text,
  catalog_match_status text not null default 'candidate',
  catalog_review_note_no text,
  mapping_status text not null default 'unmapped',
  review_status text not null default 'pending_review',
  publish_status text not null default 'draft',
  source_status text not null default 'ok',
  source_confidence integer not null default 50,
  source_last_checked_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ct_funn_source_records_record_type_chk check (record_type in ('norark_project','norark_article','ra_brukerminne','source_index','relation_candidate')),
  constraint ct_funn_source_records_dating_precision_chk check (dating_precision in ('exact','circa','period','uncertain','unknown')),
  constraint ct_funn_source_records_find_quality_chk check (find_quality_status in ('source_text','inferred','needs_review')),
  constraint ct_funn_source_records_catalog_match_chk check (catalog_match_status in ('not_checked','candidate','possible_match','mapped','rejected','needs_review')),
  constraint ct_funn_source_records_mapping_status_chk check (mapping_status in ('unmapped','candidate','needs_review','mapped','approved','rejected')),
  constraint ct_funn_source_records_review_status_chk check (review_status in ('pending_review','approved','needs_more_data','rejected')),
  constraint ct_funn_source_records_publish_status_chk check (publish_status in ('draft','hidden','published','blocked')),
  constraint ct_funn_source_records_source_status_chk check (source_status in ('ok','warning','missing','blocked')),
  constraint ct_funn_source_records_lat_chk check (gps_lat is null or (gps_lat >= -90 and gps_lat <= 90)),
  constraint ct_funn_source_records_lon_chk check (gps_lon is null or (gps_lon >= -180 and gps_lon <= 180))
);

create unique index if not exists ux_ct_funn_source_project_url on public.ct_funn_source_records(source_key, external_project_url) where external_project_url is not null and record_type = 'norark_project';
create unique index if not exists ux_ct_funn_source_article_url on public.ct_funn_source_records(source_key, external_article_url) where external_article_url is not null and record_type = 'norark_article';
create unique index if not exists ux_ct_funn_source_record_id on public.ct_funn_source_records(source_key, source_record_id) where source_record_id is not null;
create index if not exists ix_ct_funn_source_records_source_type on public.ct_funn_source_records(source_key, record_type);
create index if not exists ix_ct_funn_source_records_location on public.ct_funn_source_records(county_raw_no, municipality_raw_no, location_raw_no);
create index if not exists ix_ct_funn_source_records_period on public.ct_funn_source_records(object_period_label, object_year_from, object_year_to);
create index if not exists ix_ct_funn_source_records_review on public.ct_funn_source_records(review_status, mapping_status, catalog_match_status, publish_status);
create index if not exists ix_ct_funn_source_records_candidates on public.ct_funn_source_records(catalog_object_group_candidate, catalog_category_candidate, find_type_candidate);

create table if not exists public.ct_funn_source_record_links (
  link_id uuid primary key default gen_random_uuid(),
  funn_record_id uuid not null references public.ct_funn_source_records(funn_record_id) on delete cascade,
  link_type text not null,
  link_url text not null,
  link_title_no text,
  link_description_no text,
  license_label text,
  photographer_raw_no text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ct_funn_source_record_links_type_chk check (link_type in ('source','article','api','map','wms','image','kulturminnesok','other'))
);
create index if not exists ix_ct_funn_source_record_links_record on public.ct_funn_source_record_links(funn_record_id, link_type);

create table if not exists public.ct_funn_catalog_relation_candidates (
  candidate_id uuid primary key default gen_random_uuid(),
  funn_record_id uuid not null references public.ct_funn_source_records(funn_record_id) on delete cascade,
  target_source_key text,
  target_object_group text,
  target_object_id text,
  target_relation_type text,
  target_relation_slug text,
  candidate_label_no text not null,
  candidate_reason_no text,
  match_basis text not null default 'manual_candidate',
  match_confidence integer not null default 50,
  status text not null default 'candidate',
  reviewed_by text,
  reviewed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ct_funn_catalog_relation_candidates_basis_chk check (match_basis in ('manual_candidate','title_location_period','geo_near_match','source_text','object_year_period','ai_suggestion')),
  constraint ct_funn_catalog_relation_candidates_status_chk check (status in ('candidate','needs_review','approved','rejected','published')),
  constraint ct_funn_catalog_relation_candidates_confidence_chk check (match_confidence >= 0 and match_confidence <= 100)
);
create index if not exists ix_ct_funn_catalog_candidates_record on public.ct_funn_catalog_relation_candidates(funn_record_id, status);
create index if not exists ix_ct_funn_catalog_candidates_target on public.ct_funn_catalog_relation_candidates(target_source_key, target_object_group, target_object_id);
create index if not exists ix_ct_funn_catalog_candidates_relation on public.ct_funn_catalog_relation_candidates(target_relation_type, target_relation_slug);

create table if not exists public.ct_funn_geo_match_candidates (
  geo_match_id uuid primary key default gen_random_uuid(),
  norark_record_id uuid references public.ct_funn_source_records(funn_record_id) on delete cascade,
  ra_record_id uuid references public.ct_funn_source_records(funn_record_id) on delete cascade,
  match_status text not null default 'possible_match',
  match_key text not null default 'title_location_period',
  distance_meters numeric(12,2),
  match_confidence integer not null default 50,
  review_note_no text,
  reviewed_by text,
  reviewed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ct_funn_geo_match_status_chk check (match_status in ('not_checked','possible_match','geo_near_match','title_location_match','matched','rejected','needs_review')),
  constraint ct_funn_geo_match_key_chk check (match_key in ('coordinates','place_name','kulturminne_id','title_location_period','manual')),
  constraint ct_funn_geo_match_confidence_chk check (match_confidence >= 0 and match_confidence <= 100),
  constraint ct_funn_geo_match_pair_chk check (norark_record_id is distinct from ra_record_id)
);
create index if not exists ix_ct_funn_geo_match_norark on public.ct_funn_geo_match_candidates(norark_record_id, match_status);
create index if not exists ix_ct_funn_geo_match_ra on public.ct_funn_geo_match_candidates(ra_record_id, match_status);

create table if not exists public.ct_funn_import_run_log (
  import_run_id uuid primary key default gen_random_uuid(),
  source_key text not null references public.ct_external_source_registry(source_key),
  import_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'started',
  rows_seen integer not null default 0,
  rows_inserted integer not null default 0,
  rows_updated integer not null default 0,
  rows_skipped integer not null default 0,
  error_message text,
  payload_json jsonb not null default '{}'::jsonb,
  constraint ct_funn_import_run_log_type_chk check (import_type in ('manual_sql','norark_list','norark_project','ra_brukerminner_api','ra_brukerminner_wms_check','review_import')),
  constraint ct_funn_import_run_log_status_chk check (status in ('started','ok','warning','failed','blocked'))
);

create or replace function public.ct_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ct_external_source_registry_updated_at on public.ct_external_source_registry;
create trigger trg_ct_external_source_registry_updated_at before update on public.ct_external_source_registry for each row execute function public.ct_set_updated_at();

drop trigger if exists trg_ct_funn_source_records_updated_at on public.ct_funn_source_records;
create trigger trg_ct_funn_source_records_updated_at before update on public.ct_funn_source_records for each row execute function public.ct_set_updated_at();

drop trigger if exists trg_ct_funn_catalog_candidates_updated_at on public.ct_funn_catalog_relation_candidates;
create trigger trg_ct_funn_catalog_candidates_updated_at before update on public.ct_funn_catalog_relation_candidates for each row execute function public.ct_set_updated_at();

drop trigger if exists trg_ct_funn_geo_match_updated_at on public.ct_funn_geo_match_candidates;
create trigger trg_ct_funn_geo_match_updated_at before update on public.ct_funn_geo_match_candidates for each row execute function public.ct_set_updated_at();

create or replace view public.ct_v_funn_source_records_review as
select
  r.funn_record_id, r.source_key, s.source_name, s.source_quality_status,
  r.record_type, r.source_record_id, r.title_raw_no,
  r.location_raw_no, r.municipality_raw_no, r.county_raw_no,
  r.source_year_label, r.excavation_year_label, r.article_date_label,
  r.object_year_label, r.object_year_from, r.object_year_to, r.object_period_label,
  r.find_title_no, r.find_description_no, r.find_type_candidate, r.find_material_candidate,
  r.catalog_object_group_candidate, r.catalog_category_candidate, r.catalog_match_status,
  r.mapping_status, r.review_status, r.publish_status,
  r.external_project_url, r.external_article_url, r.parent_project_url, r.kulturminnesok_url,
  r.gps_lat, r.gps_lon, r.source_last_checked_at, r.created_at, r.updated_at
from public.ct_funn_source_records r
join public.ct_external_source_registry s on s.source_key = r.source_key;

create or replace view public.ct_v_funn_catalog_candidates_review as
select
  c.candidate_id, r.funn_record_id, r.source_key, r.record_type,
  r.title_raw_no as source_title_no, r.find_title_no, r.find_type_candidate,
  r.object_period_label, r.object_year_label, r.municipality_raw_no, r.county_raw_no,
  c.candidate_label_no, c.candidate_reason_no,
  c.target_source_key, c.target_object_group, c.target_object_id,
  c.target_relation_type, c.target_relation_slug,
  c.match_basis, c.match_confidence, c.status, c.reviewed_by, c.reviewed_at,
  c.created_at, c.updated_at
from public.ct_funn_catalog_relation_candidates c
join public.ct_funn_source_records r on r.funn_record_id = c.funn_record_id;

create or replace view public.ct_v_funn_duplicate_candidates as
select
  source_key,
  coalesce(external_project_url, external_article_url, source_record_id, lower(title_raw_no)) as duplicate_key,
  count(*) as record_count,
  array_agg(funn_record_id order by created_at) as record_ids,
  array_agg(title_raw_no order by created_at) as titles
from public.ct_funn_source_records
group by source_key, coalesce(external_project_url, external_article_url, source_record_id, lower(title_raw_no))
having count(*) > 1;

create or replace view public.ct_v_funn_dashboard_status as
select
  count(*) filter (where source_key = 'norark') as norark_records,
  count(*) filter (where source_key = 'ra_brukerminner') as ra_brukerminner_records,
  count(*) filter (where record_type = 'norark_project') as norark_projects,
  count(*) filter (where record_type = 'norark_article') as norark_articles,
  count(*) filter (where record_type = 'ra_brukerminne') as ra_records,
  count(*) filter (where review_status = 'pending_review') as pending_review,
  count(*) filter (where mapping_status in ('unmapped','candidate','needs_review')) as mapping_open,
  count(*) filter (where catalog_match_status in ('candidate','possible_match','needs_review')) as catalog_candidates,
  count(*) filter (where publish_status = 'published') as published_records,
  now() as checked_at
from public.ct_funn_source_records;

insert into public.ct_external_source_registry (
  source_key, source_name, source_type, source_owner, source_description,
  source_base_url, source_api_url, source_wms_url, source_dataset_uuid,
  source_license, source_quality_status, source_weight, payload_json
)
values
('norark','Norark / Norsk arkeologi','archaeology_source','Norark','Faglig kilde for arkeologiske prosjekter, utgravinger og artikler.','https://norark.no',null,null,null,null,'official_verified',90,'{"list_url":"https://norark.no/liste-over-utgravinger/"}'::jsonb),
('ra_brukerminner','Riksantikvaren Brukerminner','geo_source','Riksantikvaren','Mulige kulturminner opprettet av brukere av kulturminnesok.no. Ikke kvalitetssikret av Riksantikvaren.','https://api.ra.no/brukerminner','https://api.ra.no/brukerminner','https://kart.ra.no/wms/brukerminner','bb9d0ad5-aaac-48bb-9a4f-29e99d0bd32a','CC BY 4.0','user_generated_not_ra_verified',55,'{"geonorge_uuid":"bb9d0ad5-aaac-48bb-9a4f-29e99d0bd32a","wms_getcapabilities":"https://kart.ra.no/wms/brukerminner?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"}'::jsonb)
on conflict (source_key) do update set
  source_name = excluded.source_name,
  source_type = excluded.source_type,
  source_owner = excluded.source_owner,
  source_description = excluded.source_description,
  source_base_url = excluded.source_base_url,
  source_api_url = excluded.source_api_url,
  source_wms_url = excluded.source_wms_url,
  source_dataset_uuid = excluded.source_dataset_uuid,
  source_license = excluded.source_license,
  source_quality_status = excluded.source_quality_status,
  source_weight = excluded.source_weight,
  payload_json = public.ct_external_source_registry.payload_json || excluded.payload_json,
  updated_at = now();

insert into public.ct_funn_import_run_log (source_key, import_type, finished_at, status, payload_json)
values ('norark','manual_sql',now(),'ok','{"module":"collectium-funn-ra-module-v1","action":"schema_created"}'::jsonb);

commit;
