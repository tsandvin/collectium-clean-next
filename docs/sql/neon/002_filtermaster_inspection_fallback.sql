/*
COLLECTIUM FILTER MASTER INSPECTION FALLBACK
Use this if 002_filtermaster_replace_stamps_with_verdibrev.sql fails because column names differ.
Run in Neon SQL Editor and paste result to ChatGPT.
*/

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ct_filter_object_type_registry'
order by ordinal_position;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ct_filter_usage_registry'
order by ordinal_position;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'ct_relation_type_registry'
order by ordinal_position;

select *
from ct_filter_object_type_registry
where
  lower(cast(to_jsonb(ct_filter_object_type_registry) as text)) like '%frimerk%'
  or lower(cast(to_jsonb(ct_filter_object_type_registry) as text)) like '%stamp%'
  or lower(cast(to_jsonb(ct_filter_object_type_registry) as text)) like '%verdibrev%'
  or lower(cast(to_jsonb(ct_filter_object_type_registry) as text)) like '%security%';

