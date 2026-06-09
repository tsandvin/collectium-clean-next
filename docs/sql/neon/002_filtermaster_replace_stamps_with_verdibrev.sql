/*
COLLECTIUM FILTER MASTER UPDATE
File: 002_filtermaster_replace_stamps_with_verdibrev.sql
Version: v1.0
Date: 2026-06-09

Purpose:
- Remove stamps/frimerker as wanted Collectium object group.
- Add verdibrev / value papers / securities as wanted object group.
- Keep update non-destructive where possible.
- Does not migrate source catalog data.
- Only updates Neon filter-control registries.

Affected routes / features:
- /api/system/filter-master-check
- /api/filter/master
- /api/filter/period
- /api/relations/[type]/[slug]
- Filter Master
- Relation registry object-group controls

Rule:
Frimerker/stamps are not a wanted Collectium object group.
Verdibrev/value papers/securities are a wanted object group.
*/

begin;

-- 1. Mark stamps/frimerker inactive where they exist.
update ct_filter_object_type_registry
set
  status = 'inactive',
  is_active = false,
  updated_at = now()
where
  lower(coalesce(object_group_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
  or lower(coalesce(object_type_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
  or lower(coalesce(object_group_label_no, '')) like '%frimerk%'
  or lower(coalesce(object_type_label_no, '')) like '%frimerk%';

-- 2. Insert/update verdibrev as wanted object group/object type.
-- This assumes the registry has these modern columns.
-- If your schema uses different names, use the fallback inspection query below.
insert into ct_filter_object_type_registry (
  object_group_key,
  object_type_key,
  object_group_label_no,
  object_type_label_no,
  object_group_label_en,
  object_type_label_en,
  sort_order,
  status,
  is_active,
  payload_json,
  created_at,
  updated_at
)
values (
  'security',
  'verdibrev',
  'Verdibrev',
  'Verdibrev',
  'Securities / value papers',
  'Value papers',
  30,
  'active',
  true,
  '{
    "collectium_object_group": "security",
    "wanted_object_group": true,
    "aliases_no": ["verdibrev", "aksjebrev", "obligasjon", "sertifikat", "andelsbrev"],
    "aliases_en": ["security", "securities", "share certificate", "bond", "certificate"],
    "filter_fields": [
      "issuer",
      "company",
      "security_type",
      "nominal_value",
      "currency",
      "issue_year",
      "maturity_year",
      "coupons",
      "signature",
      "stamp",
      "serial_number",
      "industry",
      "country",
      "market",
      "stock_exchange",
      "historical_period",
      "financial_context",
      "rarity",
      "condition",
      "provenance"
    ],
    "relation_targets": [
      "issuer",
      "company",
      "industry",
      "year",
      "currency",
      "market",
      "exchange",
      "person",
      "signature",
      "historical_period",
      "financial_index",
      "collection",
      "auction_result"
    ],
    "migration_note": "Added as wanted Collectium object group. Replaces stamps/frimerker in wanted object group list."
  }'::jsonb,
  now(),
  now()
)
on conflict (object_group_key, object_type_key)
do update set
  object_group_label_no = excluded.object_group_label_no,
  object_type_label_no = excluded.object_type_label_no,
  object_group_label_en = excluded.object_group_label_en,
  object_type_label_en = excluded.object_type_label_en,
  status = 'active',
  is_active = true,
  payload_json = excluded.payload_json,
  updated_at = now();

-- 3. Register verdibrev usage in Filter Master usage registry if table exists with expected keys.
insert into ct_filter_usage_registry (
  usage_key,
  usage_label_no,
  usage_group,
  object_group_key,
  status,
  is_active,
  payload_json,
  created_at,
  updated_at
)
values (
  'filter_usage_security_catalog',
  'Verdibrev i katalog/filter/relasjoner',
  'catalog',
  'security',
  'active',
  true,
  '{
    "routes": [
      "/katalog",
      "/api/filter/master",
      "/api/filter/period",
      "/relasjon/[type]/[slug]"
    ],
    "allowed_contexts": [
      "catalog",
      "object_presentation",
      "relation_presentation",
      "index",
      "market",
      "collection",
      "auction"
    ],
    "source_data_migration_allowed": false,
    "control_registry_only": true
  }'::jsonb,
  now(),
  now()
)
on conflict (usage_key)
do update set
  usage_label_no = excluded.usage_label_no,
  usage_group = excluded.usage_group,
  object_group_key = excluded.object_group_key,
  status = 'active',
  is_active = true,
  payload_json = excluded.payload_json,
  updated_at = now();

-- 4. Optional relation type for object -> issuer/company if not already present.
insert into ct_relation_type_registry (
  relation_type_key,
  relation_name_no,
  relation_type_label_no,
  relation_domain,
  from_entity,
  to_entity,
  source_entity_type,
  target_entity_type,
  direction_mode,
  privacy_level,
  status,
  is_active,
  sort_order,
  description_no,
  payload_json,
  created_at,
  updated_at
)
values (
  'object_to_issuer',
  'Objekt til utsteder',
  'Utsteder',
  'catalog',
  'object',
  'issuer',
  'object',
  'issuer',
  'forward',
  'public',
  'active',
  true,
  30,
  'Kobler verdibrev, sedler, mynter og andre objekter til utsteder/produsent/selskap der dette er relevant.',
  '{"wanted_for_object_groups":["security","banknote","coin","advertising"],"frontend_relation":true}'::jsonb,
  now(),
  now()
)
on conflict (relation_type_key)
do update set
  relation_name_no = excluded.relation_name_no,
  relation_type_label_no = excluded.relation_type_label_no,
  relation_domain = excluded.relation_domain,
  from_entity = excluded.from_entity,
  to_entity = excluded.to_entity,
  source_entity_type = excluded.source_entity_type,
  target_entity_type = excluded.target_entity_type,
  direction_mode = excluded.direction_mode,
  privacy_level = excluded.privacy_level,
  status = 'active',
  is_active = true,
  sort_order = excluded.sort_order,
  description_no = excluded.description_no,
  payload_json = excluded.payload_json,
  updated_at = now();

commit;

-- 5. Control summary.
select
  'filtermaster_verdibrev_update' as check_name,
  count(*) filter (
    where lower(coalesce(object_group_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
       or lower(coalesce(object_type_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
  ) as stamp_rows_total,
  count(*) filter (
    where (
      lower(coalesce(object_group_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
      or lower(coalesce(object_type_key, '')) in ('stamp', 'stamps', 'frimerke', 'frimerker')
    )
    and coalesce(is_active, false) = true
  ) as stamp_rows_still_active,
  count(*) filter (
    where lower(coalesce(object_group_key, '')) in ('security', 'securities', 'verdibrev')
       or lower(coalesce(object_type_key, '')) in ('security', 'securities', 'verdibrev')
  ) as verdibrev_rows_total,
  count(*) filter (
    where (
      lower(coalesce(object_group_key, '')) in ('security', 'securities', 'verdibrev')
      or lower(coalesce(object_type_key, '')) in ('security', 'securities', 'verdibrev')
    )
    and coalesce(is_active, false) = true
  ) as verdibrev_rows_active
from ct_filter_object_type_registry;

