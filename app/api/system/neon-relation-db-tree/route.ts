/**
 * COLLECTIUM FILE HEADER
 * Overskrift:
 * Neon relasjon DB-tree API
 *
 * Definering / formål:
 * - Leser Neon namespace-, relasjons-, entity geography- og katalogmapping-kontroll.
 * - Returnerer et enkelt DB-tree for admin/system og katalogkontroll.
 *
 * Bruksområde:
 * - Brukes av NeonRelationDbTree-komponenten.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - /katalog/kontroll/eksempel
 *
 * Berørte API-ruter:
 * - GET /api/system/neon-relation-db-tree
 *
 * Berørte tabeller / views:
 * - ct_namespace_registry
 * - ct_v_namespace_naming_check
 * - ct_entity_geography_registry
 * - ct_v_entity_geography_admin_control
 * - ct_migration_table_map
 * - ct_relation_type_registry
 * - ct_relation_path_registry
 * - ct_relation_privacy_rules
 * - ct_relation_missing_links
 * - ct_period_filter_registry
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Viktig:
 * - Ruten skriver ikke data.
 * - Ruten migrerer ikke data.
 * - Ruten godkjenner ikke Neon som truth.
 */

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TableExistsResult = {
  table_name: string;
  exists: boolean;
};

function getNeonConnectionString(): string {
  const value =
    process.env.NEON_DATABASE_URL ||
    process.env.neon_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL;

  if (!value) {
    throw new Error("Neon env mangler. Bruk DATABASE_URL eller neon_DATABASE_URL.");
  }

  return value;
}

async function tableExists(pool: Pool, tableName: string): Promise<boolean> {
  const result = await pool.query(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [tableName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function viewExists(pool: Pool, viewName: string): Promise<boolean> {
  const result = await pool.query(
    `
      select exists (
        select 1
        from information_schema.views
        where table_schema = 'public'
          and table_name = $1
      ) as exists
    `,
    [viewName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function safeCount(pool: Pool, tableName: string): Promise<number | null> {
  const exists = await tableExists(pool, tableName);
  if (!exists) return null;

  const result = await pool.query(`select count(*)::int as row_count from ${tableName}`);
  return Number(result.rows[0]?.row_count ?? 0);
}

async function safeSelect(pool: Pool, sql: string, objectName: string, isView = false) {
  const exists = isView ? await viewExists(pool, objectName) : await tableExists(pool, objectName);
  if (!exists) return [];

  const result = await pool.query(sql);
  return result.rows;
}

export async function GET() {
  const pool = new Pool({
    connectionString: getNeonConnectionString(),
    ssl: { rejectUnauthorized: false }
  });

  try {
    const namespaceRegistry = await safeSelect(
      pool,
      `
        select
          namespace_prefix,
          namespace_label_no,
          namespace_type,
          country_or_region_no,
          applies_to_no,
          example_table_name,
          is_active,
          notes_no
        from ct_namespace_registry
        order by namespace_prefix
      `,
      "ct_namespace_registry"
    );

    const namespaceStatusSummary = await safeSelect(
      pool,
      `
        select
          naming_status,
          count(*)::int as object_count
        from ct_v_namespace_naming_check
        group by naming_status
        order by naming_status
      `,
      "ct_v_namespace_naming_check",
      true
    );

    const namespaceErrors = await safeSelect(
      pool,
      `
        select *
        from ct_v_namespace_naming_check
        where naming_status = 'MÅ_SJEKKES'
           or recommended_action_no is not null
        order by object_name
      `,
      "ct_v_namespace_naming_check",
      true
    );

    const entityGeography = await safeSelect(
      pool,
      `
        select
          entity_type,
          entity_key,
          entity_label_no,
          birth_country_code,
          origin_country_code,
          primary_country_code,
          primary_namespace_prefix,
          relation_scope,
          relation_namespace_prefix,
          related_country_codes,
          related_region_codes,
          admin_scope_override,
          admin_scope_reason_no,
          admin_notes_no,
          is_active
        from ct_entity_geography_registry
        order by entity_type, entity_label_no
        limit 50
      `,
      "ct_entity_geography_registry"
    );

    const entityAdminControl = await safeSelect(
      pool,
      `
        select
          entity_type,
          entity_key,
          entity_label_no,
          primary_namespace_prefix,
          relation_scope,
          relation_namespace_prefix,
          related_country_codes,
          related_region_codes,
          admin_scope_override,
          control_status,
          control_note_no
        from ct_v_entity_geography_admin_control
        order by entity_type, entity_label_no
        limit 50
      `,
      "ct_v_entity_geography_admin_control",
      true
    );

    const catalogMapping = await safeSelect(
      pool,
      `
        select
          source_key,
          object_group,
          canonical_catalog_table,
          physical_mariadb_source,
          legacy_table_name,
          source_table,
          mariadb_table_name,
          source_role,
          source_status,
          row_count,
          notes_no
        from ct_migration_table_map
        order by source_key, object_group, source_role
      `,
      "ct_migration_table_map"
    );

    const relationTables = [
      "ct_relation_type_registry",
      "ct_relation_path_registry",
      "ct_relation_privacy_rules",
      "ct_relation_missing_links"
    ];

    const relationRegistry = [];
    for (const tableName of relationTables) {
      relationRegistry.push({
        table_name: tableName,
        exists: await tableExists(pool, tableName),
        row_count: await safeCount(pool, tableName)
      });
    }

    const platformTables = [
      "ct_filter_master_registry",
      "ct_filter_object_type_registry",
      "ct_filter_usage_registry",
      "ct_period_filter_registry",
      "ct_provenance_definition_registry",
      "ct_provenance_event_type_registry",
      "ct_provenance_scope_registry",
      "ct_provenance_visibility_registry"
    ];

    const platformRegistry = [];
    for (const tableName of platformTables) {
      platformRegistry.push({
        table_name: tableName,
        exists: await tableExists(pool, tableName),
        row_count: await safeCount(pool, tableName)
      });
    }

    const namespaceErrorCount = namespaceErrors.length;

    return NextResponse.json({
      ok: namespaceErrorCount === 0,
      source: "neon-relation-db-tree",
      checked_at: new Date().toISOString(),
      summary: {
        namespace_count: namespaceRegistry.length,
        namespace_error_count: namespaceErrorCount,
        entity_geography_count: entityGeography.length,
        catalog_mapping_count: catalogMapping.length,
        relation_registry_count: relationRegistry.length,
        platform_registry_count: platformRegistry.length
      },
      namespace_registry: namespaceRegistry,
      namespace_status_summary: namespaceStatusSummary,
      namespace_errors: namespaceErrors,
      entity_geography: entityGeography,
      entity_admin_control: entityAdminControl,
      catalog_mapping: catalogMapping,
      relation_registry: relationRegistry,
      platform_registry: platformRegistry,
      tree: [
        {
          key: "namespace",
          label_no: "Namespace / geografi",
          status: namespaceErrorCount === 0 ? "OK" : "VARSEL",
          children: namespaceRegistry.map((row: any) => ({
            key: row.namespace_prefix,
            label_no: `${row.namespace_prefix} · ${row.namespace_label_no}`,
            detail_no: row.applies_to_no,
            example_table_name: row.example_table_name
          }))
        },
        {
          key: "entity-geography",
          label_no: "Entity geography / admin override",
          status: entityAdminControl.length > 0 ? "OK" : "INFO",
          children: entityAdminControl.map((row: any) => ({
            key: `${row.entity_type}:${row.entity_key}`,
            label_no: `${row.entity_label_no} · ${row.primary_namespace_prefix} → ${row.relation_namespace_prefix}`,
            detail_no: row.control_note_no,
            control_status: row.control_status
          }))
        },
        {
          key: "catalog-mapping",
          label_no: "Katalogkilder / canonical catalog",
          status: catalogMapping.length > 0 ? "OK" : "VARSEL",
          children: catalogMapping.map((row: any) => ({
            key: `${row.source_key}:${row.object_group}:${row.source_table}`,
            label_no: `${row.source_key} / ${row.object_group}`,
            canonical_catalog_table: row.canonical_catalog_table,
            physical_mariadb_source: row.physical_mariadb_source,
            legacy_table_name: row.legacy_table_name,
            source_role: row.source_role,
            row_count: row.row_count
          }))
        },
        {
          key: "relations",
          label_no: "Relasjonsregistre",
          status: relationRegistry.every((row) => row.exists) ? "OK" : "VARSEL",
          children: relationRegistry.map((row) => ({
            key: row.table_name,
            label_no: row.table_name,
            exists: row.exists,
            row_count: row.row_count
          }))
        },
        {
          key: "platform",
          label_no: "Filter / periode / proveniens",
          status: platformRegistry.every((row) => row.exists) ? "OK" : "VARSEL",
          children: platformRegistry.map((row) => ({
            key: row.table_name,
            label_no: row.table_name,
            exists: row.exists,
            row_count: row.row_count
          }))
        }
      ],
      collectium_rule: {
        neon_truth_approval_allowed: false,
        reason:
          "DB-tree viser namespace, relasjon, entity geography og katalogmapping. Den skriver ikke data og godkjenner ikke Neon som truth."
      }
    });
  } finally {
    await pool.end();
  }
}
