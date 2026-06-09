-- ============================================================
-- Collectium Proveniens kontrollregister
-- Fil: docs/sql/neon/004_provenance_registry.sql
--
-- Formaal:
-- - Dokumenterer Proveniens-registeret lagt inn i Neon.
-- - Definerer Proveniens som strukturert historikk, verdi,
--   transaksjon, relasjon og synlighet/samtykke.
-- - Skiller privat samtykkestyrt proveniens fra offentlig
--   historisk/funnbasert proveniens.
--
-- Viktig:
-- - Dette er kontroll-/registerdata.
-- - Ekte katalogdata, brukerdata og private provenienshendelser
--   skal ikke migreres her.
-- - source_data_migration_allowed = false
-- - control_registry_only = true
-- ============================================================

-- Kontrollsporring etter oppdatering:
select
  'provenance_registry_update' as check_name,
  (select count(*) from ct_provenance_definition_registry where is_active = true) as definition_rows_active,
  (select count(*) from ct_provenance_scope_registry where is_active = true) as scope_rows_active,
  (select count(*) from ct_provenance_event_type_registry where is_active = true) as event_type_rows_active,
  (select count(*) from ct_provenance_visibility_registry where is_active = true) as visibility_rows_active,
  (
    select count(*)
    from ct_period_filter_registry
    where period_filter_key = 'period.provenance_period'
      and is_active = true
  ) as provenance_period_active;

-- Forventet resultat:
-- definition_rows_active = 1
-- scope_rows_active = 9
-- event_type_rows_active = 15
-- visibility_rows_active = 5
-- provenance_period_active = 1

-- Aktiv scope-kontroll:
select
  scope_key,
  scope_label_no,
  scope_group,
  default_visibility_level,
  consent_required,
  public_display_allowed,
  is_active
from ct_provenance_scope_registry
order by sort_order;

-- Aktiv hendelsestype-kontroll:
select
  event_type_key,
  event_type_label_no,
  event_group,
  affects_period,
  affects_value,
  affects_transaction,
  is_active
from ct_provenance_event_type_registry
order by sort_order;

-- Aktiv synlighetskontroll:
select
  visibility_key,
  visibility_label_no,
  can_show_identity,
  can_show_value,
  can_show_transaction,
  can_show_related_objects,
  requires_consent,
  is_active
from ct_provenance_visibility_registry
order by sort_order;

-- Proveniensperiode-kontroll:
select
  period_filter_key,
  period_filter_label_no,
  period_filter_level,
  access_min_membership,
  api_route,
  page_route,
  is_active,
  status,
  description_no
from ct_period_filter_registry
where period_filter_key = 'period.provenance_period';
