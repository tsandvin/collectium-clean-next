-- ============================================================
-- Collectium Period 8.6 compatibility views
-- KJOR I NEON SQL EDITOR, IKKE I POWERSHELL.
-- ============================================================

create or replace view ct_v_period86_row1_statsoverhode_nodes as
select
  'row1'::text as row_key,
  coalesce(nullif(group_key, ''), 'statsoverhode')::text as type_key,
  node_key::text as slug,
  coalesce(display_name_no, label_no, ruler_name_raw_no, historical_ruler_raw_no, node_key)::text as label_no,
  coalesce(display_name_no, label_no, ruler_name_raw_no, historical_ruler_raw_no, node_key)::text as display_name_no,
  group_key::text as group_key,
  group_label_no::text as group_label_no,
  ruler_name_raw_no::text as ruler_name_raw_no,
  alias_ruler_name_raw_no::text as alias_ruler_name_raw_no,
  historical_ruler_raw_no::text as historical_ruler_raw_no,
  historical_period_label_no::text as historical_period_label_no,
  from_year::int as start_year,
  coalesce(to_year, extract(year from now())::int)::int as end_year,
  year_label::text as year_label,
  authority_role_no::text as authority_role_no,
  period_summary_no::text as summary_short_no,
  biography_no::text as description_no,
  banknote_relation_note_no::text as collectium_relevance_no,
  relation_href::text as relation_href,
  source_key::text as source_key,
  object_group::text as object_group,
  is_usable_for_timeline::boolean as is_usable_for_timeline,
  truth_status::text as truth_status,
  source_view::text as source_view
from ct_v_period86_ruler_timeline_resolved
where from_year is not null
  and coalesce(is_usable_for_timeline, true) = true
  and coalesce(truth_status, 'ok') not in ('rejected', 'blocked');

create or replace view ct_v_period86_row3_context_nodes as
select
  'row3'::text as row_key,
  case
    when period_type_key ilike '%krig%' or period_type_key ilike '%konflikt%' then 'krig_konflikt'
    when period_type_key ilike '%sykdom%' or period_type_key ilike '%krise%' then 'sykdom_krise'
    when period_type_key ilike '%finans%' or period_type_key ilike '%økonomi%' or period_type_key ilike '%okonomi%' then 'finans_okonomi'
    else coalesce(period_type_key, 'periode')
  end::text as type_key,
  period_slug::text as slug,
  display_name_no::text as label_no,
  display_name_no::text as display_name_no,
  period_type_key::text as period_type_key,
  period_type_label_no::text as period_type_label_no,
  period_level::int as period_level,
  parent_period_slug::text as parent_period_slug,
  start_year::int as start_year,
  coalesce(end_year, extract(year from now())::int)::int as end_year,
  summary_short_no::text as summary_short_no,
  collectium_relevance_no::text as collectium_relevance_no,
  relation_href::text as relation_href
from ct_v_period_filter_options
where start_year is not null
  and (
    period_type_key ilike '%krig%'
    or period_type_key ilike '%konflikt%'
    or period_type_key ilike '%sykdom%'
    or period_type_key ilike '%krise%'
    or period_type_key ilike '%finans%'
    or period_type_key ilike '%økonomi%'
    or period_type_key ilike '%okonomi%'
    or period_type_label_no ilike '%krig%'
    or period_type_label_no ilike '%konflikt%'
    or period_type_label_no ilike '%sykdom%'
    or period_type_label_no ilike '%krise%'
    or period_type_label_no ilike '%finans%'
    or period_type_label_no ilike '%økonomi%'
    or period_type_label_no ilike '%okonomi%'
  );

create or replace view ct_v_period86_timeline_nodes as
select
  row_key,
  type_key,
  slug,
  label_no,
  display_name_no,
  start_year,
  end_year,
  relation_href,
  summary_short_no,
  collectium_relevance_no
from ct_v_period86_row1_statsoverhode_nodes

union all

select
  'row2'::text as row_key,
  coalesce(period_type_key, 'nasjonale_perioder')::text as type_key,
  period_slug::text as slug,
  display_name_no::text as label_no,
  display_name_no::text as display_name_no,
  start_year::int as start_year,
  coalesce(end_year, extract(year from now())::int)::int as end_year,
  relation_href::text as relation_href,
  summary_short_no::text as summary_short_no,
  collectium_relevance_no::text as collectium_relevance_no
from ct_v_period_filter_options
where start_year is not null
  and (
    period_type_key ilike '%nasjonal%'
    or period_type_key ilike '%hoved%'
    or period_type_key ilike '%union%'
    or period_type_key ilike '%periode%'
    or period_type_label_no ilike '%nasjonal%'
    or period_type_label_no ilike '%hoved%'
    or period_type_label_no ilike '%union%'
    or period_type_label_no ilike '%periode%'
  )

union all

select
  row_key,
  type_key,
  slug,
  label_no,
  display_name_no,
  start_year,
  end_year,
  relation_href,
  summary_short_no,
  collectium_relevance_no
from ct_v_period86_row3_context_nodes;

select row_key, type_key, count(*) as node_count, min(start_year) as min_year, max(end_year) as max_year
from ct_v_period86_timeline_nodes
group by row_key, type_key
order by row_key, type_key;
