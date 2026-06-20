-- Collectium Period86 Neon Inspection
-- Run in Neon SQL Editor. Do not run in PowerShell.

-- A. Columns in ruler timeline view
select
  column_name,
  data_type,
  ordinal_position
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ct_v_period86_ruler_timeline_resolved'
order by ordinal_position;

-- B. Sample ruler timeline rows
select *
from ct_v_period86_ruler_timeline_resolved
order by start_year nulls last
limit 50;

-- C. Row 1 candidates from ruler timeline view
select *
from ct_v_period86_ruler_timeline_resolved
where start_year <= 2024
  and coalesce(end_year, 2024) >= 1507
order by start_year nulls last
limit 200;

-- D. Generic period filter row 1 candidates
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
    or period_type_key ilike '%union%'
    or period_type_key ilike '%dynasti%'
    or period_type_key ilike '%makt%'
    or period_type_label_no ilike '%konge%'
    or period_type_label_no ilike '%king%'
    or period_type_label_no ilike '%regent%'
    or period_type_label_no ilike '%ruler%'
    or period_type_label_no ilike '%union%'
    or period_type_label_no ilike '%dynasti%'
    or period_type_label_no ilike '%makt%'
  )
order by start_year, end_year, display_name_no;

-- E. Period clipping test for visible scale 1507-2024
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

-- F. Specific check for Kalmarunionen and Senmiddelalder
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
