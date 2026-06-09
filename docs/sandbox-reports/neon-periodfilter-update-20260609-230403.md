# Collectium Neon Periodfilter Update

Dato: 2026-06-09 23:04:03
Prosjektrot: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next

## Status

- SQL-fil opprettet: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next\docs\sql\neon\001_periodfilter_schema.sql
- Apply-status: not_requested
- psql funnet: False
- NEON_DATABASE_URL satt: True

## Opprettede Neon-objekter

Tabeller:
- ct_period_import_runs
- ct_period_filter_nodes
- ct_period_object_links
- ct_period_relation_links
- ct_period_source_links
- ct_period_filter_node_staging
- ct_period_object_link_staging

Views:
- ct_v_period_filter_nodes_public
- ct_v_period_filter_ruler_summary
- ct_v_period_filter_year_summary

## Viktig regel

Dette scriptet oppretter Neon-struktur for periodefilter. Det importerer ikke direkte fra MariaDB og overskriver ikke eksisterende sannhet.

Riktig videre flyt:
1. KjÃ¸r MariaDB kontroll-SQL i phpMyAdmin.
2. Eksporter resultat for Neon-ready period nodes og object links som CSV.
3. Importer CSV til staging-tabellene i Neon.
4. KjÃ¸r kontroll fÃ¸r insert/upsert til aktive tabeller.
5. Godkjenn i MariaDB -> Neon Control.

## Svar til ChatGPT

NEON_PERIODFILTER_UPDATE:
ProjectRoot: C:\Users\Bruker\Pictures\Collectium clean rebuild\collectium-clean-next
SQL created: YES
Applied to Neon: not_requested
psql available: False
NEON_DATABASE_URL present: True
Deploy/migration truth status: STRUCTURE_READY_ONLY
