-- COLLECTIUM SQL HEADER
-- Overskrift: Periode 8.6 Dynamic Field Resolved View
-- Formål: Samler periodefelt, objektcount, relasjoncount og fallback-image-type i ett lett view.
-- Dataretning: Neon/Postgres -> API -> UI
-- Versjon: CT-PERIOD86-SQL-0001 / CHANGE-2026-06-20-0001

create or replace view ct_v_period86_dynamic_field_resolved as
with object_counts as (
  select
    period_slug,
    count(*) as object_relation_count,
    count(distinct source_key || ':' || object_group || ':' || object_id::text) as object_count
  from ct_v_catalog_period_relations
  group by period_slug
),
relation_counts as (
  select
    period_slug,
    count(*) filter (where coalesce(review_status, '') <> 'duplicate') as relation_count
  from ct_sn_period_relation_links
  group by period_slug
),
relation_preview as (
  select
    period_slug,
    jsonb_agg(
      jsonb_build_object(
        'target_relation_type', target_relation_type,
        'target_relation_slug', target_relation_slug,
        'target_label_no', target_label_no,
        'relation_role_no', relation_role_no,
        'start_year', start_year,
        'end_year', end_year,
        'date_precision', date_precision,
        'certainty_status', certainty_status,
        'source_quality_status', source_quality_status,
        'review_status', review_status
      )
      order by coalesce(start_year, -999999), target_relation_type, target_label_no
    ) filter (where coalesce(review_status, '') <> 'duplicate') as relations_json
  from ct_sn_period_relation_links
  group by period_slug
)
select
  p.period_slug,
  p.display_name_no as periode,
  p.start_year,
  p.end_year,
  case
    when p.start_year is not null and p.end_year is not null and p.start_year <> p.end_year
      then p.start_year::text || '–' || p.end_year::text
    when p.start_year is not null
      then p.start_year::text
    else null
  end as year_label,
  p.period_type_key,
  p.period_type_label_no as type_label_no,
  p.period_level as niva,
  p.parent_period_slug as forelder,
  p.relation_href,
  p.summary_short_no as beskrivelse,
  p.collectium_relevance_no as collectium_relevans,
  coalesce(oc.object_count, 0) as object_count,
  coalesce(oc.object_relation_count, 0) as object_relation_count,
  coalesce(rc.relation_count, 0) as relation_count,
  coalesce(rp.relations_json, '[]'::jsonb) as relations_json,
  null::text as image_url,
  case
    when p.period_type_key in ('war_period', 'conflict_period') then 'war_conflict'
    when p.period_type_key = 'economic_period' then 'economy'
    when p.period_type_key = 'health_period' then 'health'
    when p.period_type_key in ('monetary_period', 'banknote_issue_period') then 'money_period'
    when p.period_type_key = 'union_period' then 'union'
    else 'period'
  end as image_fallback_type
from ct_v_period_filter_options p
left join object_counts oc on oc.period_slug = p.period_slug
left join relation_counts rc on rc.period_slug = p.period_slug
left join relation_preview rp on rp.period_slug = p.period_slug;
