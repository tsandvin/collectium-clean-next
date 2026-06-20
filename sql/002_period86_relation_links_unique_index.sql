-- COLLECTIUM SQL HEADER
-- Overskrift: Periode 8.6 Relation Links Unique Index
-- Formål: Hindrer nye aktive duplikater i ct_sn_period_relation_links.
-- Merk: Kjør først duplikatkontroll. Hvis duplikater finnes, rydd dem før indeks.
-- Versjon: CT-PERIOD86-SQL-0002 / CHANGE-2026-06-20-0001

create unique index if not exists ux_ct_sn_period_relation_links_unique_target
on ct_sn_period_relation_links (
  period_slug,
  target_relation_type,
  target_relation_slug,
  coalesce(start_year, -999999),
  coalesce(end_year, -999999),
  coalesce(date_precision, '')
);
