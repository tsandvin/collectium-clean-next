-- COLLECTIUM SQL HEADER
-- Overskrift: Neon regelkontrolltabeller v1
-- Definering / formål:
--   Etablerer kontrolltabeller i Neon for regelgodkjenning før katalogdata og flere områder mappes.
-- Bruksområde:
--   Kjøres i Neon SQL Editor eller via kontrollert migreringsscript.
-- Berørte sider/routes:
--   /admin/system/mariadb-neon
--   GET/POST /api/system/neon-rule-establishment
-- Berørte DB-brytere / feature_keys:
--   admin.system.neon_rule_establishment.view
--   admin.system.neon_rule_establishment.run
--   admin.system.neon_rule_establishment.approve
-- Berørte tabeller/views:
--   ct_neon_rule_control_runs
--   ct_neon_rule_control_steps
--   ct_neon_rule_control_findings
--   ct_neon_rule_establishment_registry
--   ct_neon_rule_source_scope_registry
--   ct_neon_rule_truth_gate
-- Dataretning:
--   MariaDB read-only kontroll -> Neon regelkontroll -> Next.js/API -> Admin UI
-- Logging:
--   log_category: system.mariadb_neon
--   log_action: neon_rule_establishment
-- Versjon:
--   CT-SQL-0001 / CHANGE-2026-06-10-0001

begin;

create table if not exists ct_neon_rule_control_runs (
  id bigserial primary key,
  run_key text not null unique,
  run_label text not null,
  source_system text not null default 'mariadb',
  target_system text not null default 'neon',
  source_key text,
  object_group text,
  status text not null default 'draft' check (status in ('draft','running','ok','warning','error','blocked','approved')),
  migration_allowed boolean not null default false,
  truth_approval_allowed boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ct_neon_rule_control_runs_scope
  on ct_neon_rule_control_runs(source_key, object_group, status);

create table if not exists ct_neon_rule_control_steps (
  id bigserial primary key,
  run_key text not null references ct_neon_rule_control_runs(run_key) on delete cascade,
  step_key text not null,
  step_order integer not null default 0,
  phase_key text not null,
  step_label text not null,
  status text not null default 'not_tested' check (status in ('not_tested','ok','warning','error','blocked','missing','info')),
  expected_value text,
  actual_value text,
  detail text,
  suggestion text,
  deploy_blocking boolean not null default false,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_key, step_key)
);

create index if not exists idx_ct_neon_rule_control_steps_run_status
  on ct_neon_rule_control_steps(run_key, status, deploy_blocking);

create table if not exists ct_neon_rule_control_findings (
  id bigserial primary key,
  run_key text not null references ct_neon_rule_control_runs(run_key) on delete cascade,
  finding_key text not null,
  severity text not null default 'info' check (severity in ('info','ok','warning','error','critical','blocked')),
  area_key text not null,
  title text not null,
  detail text,
  path_or_sql text,
  recommendation text,
  is_resolved boolean not null default false,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_key, finding_key)
);

create table if not exists ct_neon_rule_establishment_registry (
  id bigserial primary key,
  rule_key text not null unique,
  rule_group text not null,
  rule_label_no text not null,
  rule_definition_no text not null,
  source_scope_required boolean not null default true,
  object_group_required boolean not null default true,
  mariadb_check_required boolean not null default true,
  neon_table_required boolean not null default true,
  api_route_required boolean not null default true,
  admin_visibility_required boolean not null default true,
  truth_gate_required boolean not null default true,
  status text not null default 'active' check (status in ('active','inactive','draft','deprecated')),
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ct_neon_rule_source_scope_registry (
  id bigserial primary key,
  source_key text not null,
  object_group text not null,
  namespace_prefix text not null,
  canonical_catalog_table text not null,
  canonical_relation_scope text,
  source_label_no text not null,
  object_group_label_no text not null,
  status text not null default 'active' check (status in ('active','inactive','draft','blocked')),
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_key, object_group)
);

create table if not exists ct_neon_rule_truth_gate (
  id bigserial primary key,
  gate_key text not null unique,
  source_key text,
  object_group text,
  gate_label_no text not null,
  structure_status text not null default 'not_started',
  rules_status text not null default 'not_started',
  source_data_status text not null default 'blocked',
  relation_status text not null default 'not_started',
  api_status text not null default 'not_started',
  admin_status text not null default 'not_started',
  truth_status text not null default 'not_approved',
  migration_allowed boolean not null default false,
  approval_note text,
  approved_by text,
  approved_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into ct_neon_rule_establishment_registry (
  rule_key,
  rule_group,
  rule_label_no,
  rule_definition_no,
  payload_json
) values
(
  'neon.rule.structure_first',
  'migration_gate',
  'Struktur før kildedata',
  'Neon skal først ha kontrolltabeller, mapping, relasjonsbaner og truth gate før kildedata kan migreres.',
  '{"phase":"structure"}'::jsonb
),
(
  'neon.rule.source_scoped_catalog',
  'catalog',
  'Kilde- og objektgruppe-scopet katalog',
  'Katalogdata skal alltid kontrolleres med source_key + object_group + object_id, og filter med source_key + object_group + filter_field + filter_value.',
  '{"required_keys":["source_key","object_group","object_id"]}'::jsonb
),
(
  'neon.rule.norwegian_banknotes_scope',
  'catalog_source',
  'Norske sedler / banknote',
  'For Norske sedler skal source_key være norske_sedler, object_group være banknote og canonical Neon-tabell være ct_no_banknote_catalog.',
  '{"source_key":"norske_sedler","object_group":"banknote","canonical_table":"ct_no_banknote_catalog"}'::jsonb
),
(
  'neon.rule.mariadb_readonly_verification',
  'verification',
  'MariaDB read-only verifikasjon',
  'Neon-regel kan bare etableres som OK når tilsvarende bane er kontrollert mot MariaDB som read-only kildearkiv.',
  '{"source":"MariaDB","mode":"read-only"}'::jsonb
)
on conflict (rule_key) do update set
  rule_group = excluded.rule_group,
  rule_label_no = excluded.rule_label_no,
  rule_definition_no = excluded.rule_definition_no,
  payload_json = excluded.payload_json,
  updated_at = now();

insert into ct_neon_rule_source_scope_registry (
  source_key,
  object_group,
  namespace_prefix,
  canonical_catalog_table,
  canonical_relation_scope,
  source_label_no,
  object_group_label_no,
  payload_json
) values (
  'norske_sedler',
  'banknote',
  'ct_no',
  'ct_no_banknote_catalog',
  'ct_sn / ct_no etter relasjonstype',
  'Norske sedler',
  'Seddel',
  '{"country":"NO","rule":"source_key + object_group + object_id","filter_rule":"source_key + object_group + filter_field + filter_value"}'::jsonb
)
on conflict (source_key, object_group) do update set
  namespace_prefix = excluded.namespace_prefix,
  canonical_catalog_table = excluded.canonical_catalog_table,
  canonical_relation_scope = excluded.canonical_relation_scope,
  source_label_no = excluded.source_label_no,
  object_group_label_no = excluded.object_group_label_no,
  payload_json = excluded.payload_json,
  updated_at = now();

insert into ct_neon_rule_truth_gate (
  gate_key,
  source_key,
  object_group,
  gate_label_no,
  structure_status,
  rules_status,
  source_data_status,
  relation_status,
  api_status,
  admin_status,
  truth_status,
  migration_allowed,
  approval_note,
  payload_json
) values (
  'norske_sedler.banknote.truth_gate',
  'norske_sedler',
  'banknote',
  'Truth gate for Norske sedler / banknote',
  'not_started',
  'not_started',
  'blocked',
  'not_started',
  'not_started',
  'not_started',
  'not_approved',
  false,
  'Kildedata er blokkert til struktur, regler, API, adminvisning og MariaDB-sjekk er OK.',
  '{"canonical_table":"ct_no_banknote_catalog","source_key":"norske_sedler","object_group":"banknote"}'::jsonb
)
on conflict (gate_key) do update set
  source_key = excluded.source_key,
  object_group = excluded.object_group,
  gate_label_no = excluded.gate_label_no,
  approval_note = excluded.approval_note,
  payload_json = excluded.payload_json,
  updated_at = now();

commit;
