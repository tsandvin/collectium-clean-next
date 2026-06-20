-- ============================================================
-- Collectium Period 8.6 Timeline Control
-- Kjor i Neon SQL Editor.
-- Endrer ingenting.
-- ============================================================

-- 1. Finn periodetabeller og views
select
  table_schema,
  table_name,
  table_type
from information_schema.tables
where table_schema = 'public'
  and (
    table_name ilike '%period%'
    or table_name ilike '%periode%'
    or table_name ilike '%king%'
    or table_name ilike '%konge%'
    or table_name ilike '%ruler%'
    or table_name ilike '%regent%'
  )
order by table_name;

-- 2. Kontroller period filter view
select
  period_slug,
  display_name_no,
  period_type_key,
  period_type_label_no,
  period_level,
  parent_period_slug,
  start_year,
  end_year,
  relation_href
from ct_v_period_filter_options
where start_year <= 2024
  and coalesce(end_year, 2024) >= 1507
order by start_year, end_year, display_name_no;

-- 3. Kontroller Row 1: Statsoverhode / maktstruktur
select
  period_slug,
  display_name_no,
  period_type_key,
  period_type_label_no,
  period_level,
  parent_period_slug,
  start_year,
  end_year,
  relation_href
from ct_v_period_filter_options
where start_year <= 2024
  and coalesce(end_year, 2024) >= 1507
  and (
    period_type_key ilike '%konge%'
    or period_type_key ilike '%king%'
    or period_type_key ilike '%regent%'
    or period_type_key ilike '%ruler%'
    or period_type_key ilike '%hersker%'
    or period_type_key ilike '%statsoverhode%'
    or period_type_key ilike '%makt%'
    or period_type_key ilike '%union%'
    or period_type_key ilike '%dynasti%'
    or period_type_key ilike '%occupation%'
    or period_type_key ilike '%okkupasjon%'
    or period_type_label_no ilike '%konge%'
    or period_type_label_no ilike '%regent%'
    or period_type_label_no ilike '%hersker%'
    or period_type_label_no ilike '%statsoverhode%'
    or period_type_label_no ilike '%union%'
    or period_type_label_no ilike '%dynasti%'
    or period_type_label_no ilike '%okkupasjon%'
  )
order by start_year, end_year, display_name_no;

-- 4. Kontroller perioder som mangler start_year eller end_year
select
  period_slug,
  display_name_no,
  period_type_key,
  period_type_label_no,
  period_level,
  start_year,
  end_year
from ct_v_period_filter_options
where start_year is null
   or start_year::text !~ '^-?[0-9]+$'
order by display_name_no;

-- 5. Kontroller perioder som overlapper valgt skala 1507-2024
select
  period_slug,
  display_name_no,
  start_year,
  end_year,
  greatest(start_year, 1507) as visible_start_year,
  least(coalesce(end_year, 2024), 2024) as visible_end_year,
  round(((greatest(start_year, 1507) - 1507)::numeric / nullif((2024 - 1507), 0)) * 100, 4) as left_pct,
  round(((least(coalesce(end_year, 2024), 2024) - greatest(start_year, 1507))::numeric / nullif((2024 - 1507), 0)) * 100, 4) as width_pct
from ct_v_period_filter_options
where start_year <= 2024
  and coalesce(end_year, 2024) >= 1507
order by start_year, end_year;

-- 6. Spesifikk kontroll: Kalmarunionen / Senmiddelalder
select
  period_slug,
  display_name_no,
  start_year,
  end_year,
  greatest(start_year, 1507) as visible_start_year,
  least(coalesce(end_year, 2024), 2024) as visible_end_year
from ct_v_period_filter_options
where display_name_no ilike '%kalmar%'
   or display_name_no ilike '%senmiddelalder%'
   or period_slug ilike '%kalmar%'
   or period_slug ilike '%senmiddel%'
order by start_year;

-- 7. Antall per periodetype
select
  period_type_key,
  period_type_label_no,
  period_level,
  count(*) as node_count,
  min(start_year) as min_start_year,
  max(coalesce(end_year, start_year)) as max_end_year
from ct_v_period_filter_options
group by period_type_key, period_type_label_no, period_level
order by period_level, node_count desc, period_type_key;

-- 8. Kontroller manglende relation_href
select
  period_slug,
  display_name_no,
  period_type_key,
  period_type_label_no,
  start_year,
  end_year,
  relation_href
from ct_v_period_filter_options
where start_year <= 2024
  and coalesce(end_year, 2024) >= 1507
  and (
    relation_href is null
    or relation_href = ''
  )
order by period_type_key, start_year;

-- 9. Foreslatt stabil Row 1-view.
-- OBS: Kommentert ut. Fjern kommentar hvis view skal opprettes.

/*
create or replace view ct_v_period86_row1_statsoverhode_nodes as
select
  'row1'::text as row_key,
  case
    when period_type_key ilike '%konge%' then 'konge'
    when period_type_key ilike '%king%' then 'konge'
    when period_type_key ilike '%regent%' then 'regent'
    when period_type_key ilike '%union%' then 'union'
    when period_type_key ilike '%dynasti%' then 'dynasti'
    when period_type_key ilike '%occupation%' then 'okkupasjonsmakt'
    when period_type_key ilike '%okkupasjon%' then 'okkupasjonsmakt'
    else period_type_key
  end as type_key,
  period_slug as slug,
  display_name_no as label_no,
  period_type_key,
  period_type_label_no,
  period_level,
  parent_period_slug,
  start_year::int as start_year,
  coalesce(end_year, extract(year from now())::int)::int as end_year,
  relation_href,
  summary_short_no,
  collectium_relevance_no
from ct_v_period_filter_options
where start_year is not null
  and (
    period_type_key ilike '%konge%'
    or period_type_key ilike '%king%'
    or period_type_key ilike '%regent%'
    or period_type_key ilike '%ruler%'
    or period_type_key ilike '%hersker%'
    or period_type_key ilike '%statsoverhode%'
    or period_type_key ilike '%makt%'
    or period_type_key ilike '%union%'
    or period_type_key ilike '%dynasti%'
    or period_type_key ilike '%occupation%'
    or period_type_key ilike '%okkupasjon%'
    or period_type_label_no ilike '%konge%'
    or period_type_label_no ilike '%regent%'
    or period_type_label_no ilike '%hersker%'
    or period_type_label_no ilike '%statsoverhode%'
    or period_type_label_no ilike '%union%'
    or period_type_label_no ilike '%dynasti%'
    or period_type_label_no ilike '%okkupasjon%'
  );
*/
