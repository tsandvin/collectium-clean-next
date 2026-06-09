/* ============================================================
   COLLECTIUM PERIODFILTER / MARIADB -> NEON MAPPING
   Corrected v1.0
   Date: 2026-06-09

   Purpose:
   - Read existing MariaDB catalog data first.
   - Avoid using missing banknote_catalog_objects.material_raw_no.
   - Use ct_v_catalog_objects_resolved for resolved material where available.
   - Prepare Neon-ready period/filter mapping without overwriting truth.
   ============================================================ */


/* ============================================================
   0. DATABASE CONTEXT CHECK
   ============================================================ */

SET @ct_db = 'collectiumno01';

SELECT
  SCHEMA_NAME AS database_name
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = @ct_db;


/* ============================================================
   1. CORE BANKNOTE DATA COVERAGE
   NOTE:
   banknote_catalog_objects does NOT have material_raw_no.
   Material must be read from ct_v_catalog_objects_resolved or material/link tables.
   ============================================================ */

SELECT
  source_key,
  object_group,
  COUNT(*) AS object_count,

  COUNT(NULLIF(country_raw_no, '')) AS with_country,
  COUNT(NULLIF(ruler_name_raw_no, '')) AS with_ruler,
  COUNT(NULLIF(historical_ruler_raw_no, '')) AS with_historical_ruler,
  COUNT(NULLIF(signature_raw_no, '')) AS with_signature,

  COUNT(NULLIF(publication_year_label, '')) AS with_publication_year,
  COUNT(NULLIF(object_year_label, '')) AS with_object_year,

  COUNT(NULLIF(denomination_raw_no, '')) AS with_denomination,
  COUNT(NULLIF(denomination_issue_raw_no, '')) AS with_denomination_issue,
  COUNT(NULLIF(litra_raw_no, '')) AS with_litra,
  COUNT(NULLIF(variant_type_raw_no, '')) AS with_variant

FROM banknote_catalog_objects
GROUP BY source_key, object_group
ORDER BY object_count DESC;


/* ============================================================
   2. RULER PERIODS FROM ACTUAL CATALOG OBJECTS
   These are object-year ranges, not necessarily historical reign ranges.
   ============================================================ */

SELECT
  source_key,
  object_group,
  ruler_name_raw_no,
  MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS object_first_year,
  MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS object_last_year,
  COUNT(*) AS object_count
FROM banknote_catalog_objects
WHERE ruler_name_raw_no IS NOT NULL
  AND ruler_name_raw_no <> ''
  AND object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, ruler_name_raw_no
ORDER BY object_count DESC, ruler_name_raw_no;


/* ============================================================
   3. YEAR PERIODS FROM ACTUAL CATALOG OBJECTS
   Used for simple period filter: year, before/after, century, main period.
   ============================================================ */

SELECT
  source_key,
  object_group,
  CAST(NULLIF(object_year_label, '') AS UNSIGNED) AS object_year,
  COUNT(*) AS object_count,
  COUNT(DISTINCT NULLIF(ruler_name_raw_no, '')) AS ruler_count,
  COUNT(DISTINCT NULLIF(denomination_raw_no, '')) AS denomination_count,
  COUNT(DISTINCT NULLIF(denomination_issue_raw_no, '')) AS issue_count,
  COUNT(DISTINCT NULLIF(variant_type_raw_no, '')) AS variant_count
FROM banknote_catalog_objects
WHERE object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY
  source_key,
  object_group,
  CAST(NULLIF(object_year_label, '') AS UNSIGNED)
ORDER BY object_year;


/* ============================================================
   4. CENTURY / DECADE PERIODS FROM ACTUAL OBJECT YEARS
   ============================================================ */

SELECT
  source_key,
  object_group,
  FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 100) * 100 AS century_start,
  FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 100) * 100 + 99 AS century_end,
  CONCAT(
    FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 100) * 100,
    '-',
    FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 100) * 100 + 99
  ) AS century_label,
  COUNT(*) AS object_count
FROM banknote_catalog_objects
WHERE object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, century_start, century_end, century_label
ORDER BY century_start;

SELECT
  source_key,
  object_group,
  FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 10) * 10 AS decade_start,
  FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 10) * 10 + 9 AS decade_end,
  CONCAT(
    FLOOR(CAST(NULLIF(object_year_label, '') AS UNSIGNED) / 10) * 10,
    '-tallet'
  ) AS decade_label_no,
  COUNT(*) AS object_count
FROM banknote_catalog_objects
WHERE object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, decade_start, decade_end, decade_label_no
ORDER BY decade_start;


/* ============================================================
   5. MATERIAL CHECK
   Correct place for resolved material is ct_v_catalog_objects_resolved:
   - material
   - material_id

   If the view has limited material values, later connect to:
   - ct_materials
   - catalog_banknote_details.paper_type
   - ct_banknote_issue_producer_links.material_standard_raw_no
   ============================================================ */

SELECT
  source_key,
  object_group,
  material,
  material_id,
  COUNT(*) AS object_count
FROM ct_v_catalog_objects_resolved
WHERE material IS NOT NULL
   OR material_id IS NOT NULL
GROUP BY source_key, object_group, material, material_id
ORDER BY object_count DESC, material;


/* ============================================================
   6. PRODUCER / BRAND / ISSUER CHECK
   Find object producer links and producer issue links.
   ============================================================ */

SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @ct_db
  AND (
    TABLE_NAME LIKE '%producer%'
    OR TABLE_NAME LIKE '%issuer%'
    OR TABLE_NAME LIKE '%brand%'
    OR COLUMN_NAME LIKE '%producer%'
    OR COLUMN_NAME LIKE '%issuer%'
    OR COLUMN_NAME LIKE '%brand%'
    OR COLUMN_NAME LIKE '%produsent%'
    OR COLUMN_NAME LIKE '%utsteder%'
    OR COLUMN_NAME LIKE '%merke%'
  )
ORDER BY TABLE_NAME, COLUMN_NAME;


/* ============================================================
   7. SIGNATURE / PERSON CHECK
   ============================================================ */

SELECT
  source_key,
  object_group,
  signature_raw_no,
  COUNT(*) AS object_count,
  MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS first_object_year,
  MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS last_object_year
FROM banknote_catalog_objects
WHERE signature_raw_no IS NOT NULL
  AND signature_raw_no <> ''
  AND object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, signature_raw_no
ORDER BY object_count DESC, signature_raw_no;


/* ============================================================
   8. DENOMINATION / ISSUE / VARIANT / LITRA PERIOD CHECK
   ============================================================ */

SELECT
  source_key,
  object_group,
  denomination_raw_no,
  denomination_issue_raw_no,
  litra_raw_no,
  variant_type_raw_no,
  MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS first_object_year,
  MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS last_object_year,
  COUNT(*) AS object_count
FROM banknote_catalog_objects
WHERE object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY
  source_key,
  object_group,
  denomination_raw_no,
  denomination_issue_raw_no,
  litra_raw_no,
  variant_type_raw_no
ORDER BY object_count DESC;


/* ============================================================
   9. NEON-READY PERIOD FILTER NODES
   This SELECT can be exported from MariaDB and imported to Neon staging.
   It creates period nodes from existing MariaDB ruler data.
   ============================================================ */

SELECT
  CONCAT(
    'period_ruler_',
    LOWER(REPLACE(REPLACE(REPLACE(ruler_name_raw_no, ' ', '_'), '.', ''), '-', '_')),
    '_',
    MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)),
    '_',
    MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED))
  ) AS period_id,

  'ruler_period' AS period_type,

  CONCAT(
    LOWER(REPLACE(REPLACE(REPLACE(ruler_name_raw_no, ' ', '_'), '.', ''), '-', '_')),
    '_',
    MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)),
    '_',
    MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED))
  ) AS period_key,

  LOWER(REPLACE(REPLACE(REPLACE(ruler_name_raw_no, ' ', '-'), '.', ''), '--', '-')) AS slug,

  ruler_name_raw_no AS navn_no,
  ruler_name_raw_no AS kort_tittel,

  MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS object_first_year,
  MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS object_last_year,

  MIN(CAST(NULLIF(publication_year_label, '') AS UNSIGNED)) AS publication_first_year,
  MAX(CAST(NULLIF(publication_year_label, '') AS UNSIGNED)) AS publication_last_year,

  'object_year_range' AS date_precision,

  source_key,
  object_group,

  COUNT(*) AS filter_count,
  COUNT(*) AS object_count,

  CONCAT('/relasjon/regent/', LOWER(REPLACE(REPLACE(REPLACE(ruler_name_raw_no, ' ', '-'), '.', ''), '--', '-'))) AS relation_href,

  'active' AS status,
  'mariadb_mapped' AS data_quality_status,
  'MariaDB banknote_catalog_objects' AS source_reference

FROM banknote_catalog_objects
WHERE ruler_name_raw_no IS NOT NULL
  AND ruler_name_raw_no <> ''
  AND object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, ruler_name_raw_no
ORDER BY object_count DESC;


/* ============================================================
   10. NEON-READY PERIOD OBJECT LINKS
   Links each object to a ruler period node.
   ============================================================ */

SELECT
  CONCAT(
    'period_ruler_',
    LOWER(REPLACE(REPLACE(REPLACE(ruler_name_raw_no, ' ', '_'), '.', ''), '-', '_')),
    '_',
    MIN(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) OVER (PARTITION BY source_key, object_group, ruler_name_raw_no),
    '_',
    MAX(CAST(NULLIF(object_year_label, '') AS UNSIGNED)) OVER (PARTITION BY source_key, object_group, ruler_name_raw_no)
  ) AS period_id,

  source_key,
  object_group,
  object_id,

  'ruler_period' AS relation_type,
  ruler_name_raw_no AS relation_label_no,
  object_year_label AS object_year_label,
  publication_year_label AS publication_year_label,

  1.0 AS confidence,
  'banknote_catalog_objects' AS source_reference

FROM banknote_catalog_objects
WHERE ruler_name_raw_no IS NOT NULL
  AND ruler_name_raw_no <> ''
  AND object_id IS NOT NULL
  AND object_year_label REGEXP '^[0-9]{3,4}$';


/* ============================================================
   11. NEON-READY YEAR PERIOD NODES
   ============================================================ */

SELECT
  CONCAT('period_year_', CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS period_id,
  'year' AS period_type,
  CONCAT('year_', CAST(NULLIF(object_year_label, '') AS UNSIGNED)) AS period_key,
  CAST(NULLIF(object_year_label, '') AS CHAR) AS slug,
  CAST(NULLIF(object_year_label, '') AS CHAR) AS navn_no,
  CAST(NULLIF(object_year_label, '') AS CHAR) AS kort_tittel,
  CAST(NULLIF(object_year_label, '') AS UNSIGNED) AS start_year,
  CAST(NULLIF(object_year_label, '') AS UNSIGNED) AS end_year,
  'exact_year' AS date_precision,
  source_key,
  object_group,
  COUNT(*) AS filter_count,
  CONCAT('/relasjon/ar/', CAST(NULLIF(object_year_label, '') AS CHAR)) AS relation_href,
  'active' AS status,
  'mariadb_mapped' AS data_quality_status,
  'MariaDB banknote_catalog_objects' AS source_reference
FROM banknote_catalog_objects
WHERE object_year_label REGEXP '^[0-9]{3,4}$'
GROUP BY source_key, object_group, CAST(NULLIF(object_year_label, '') AS UNSIGNED)
ORDER BY start_year;


/* ============================================================
   12. Svar til ChatGPT / SUMMARY
   Run this last and paste result back.
   ============================================================ */

SELECT
  'PERIOD FILTER CONTROL SUMMARY' AS report_type,
  COUNT(*) AS total_objects,
  COUNT(DISTINCT source_key) AS source_count,
  COUNT(DISTINCT object_group) AS object_group_count,
  COUNT(DISTINCT ruler_name_raw_no) AS ruler_count,
  COUNT(DISTINCT object_year_label) AS object_year_count,
  COUNT(DISTINCT publication_year_label) AS publication_year_count,
  COUNT(DISTINCT signature_raw_no) AS signature_count,
  COUNT(DISTINCT denomination_raw_no) AS denomination_count,
  COUNT(DISTINCT denomination_issue_raw_no) AS denomination_issue_count,
  COUNT(DISTINCT litra_raw_no) AS litra_count,
  COUNT(DISTINCT variant_type_raw_no) AS variant_count
FROM banknote_catalog_objects;
