/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Filter Master API
 *
 * Definering / formål:
 * Leser Filter Master, objektspesifikke filter og filter usage-registry fra Neon.
 *
 * Bruksområde:
 * Brukes av katalog, objektpresentasjon, relasjonspresentasjon, index,
 * auksjon, forhandler og samling for å vite hvilke filter som er tillatt.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[type]/[slug]
 * - /index
 * - /filter/master
 * - /auksjon
 * - /forhandler
 * - /min-side/samling
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.master.view
 * - filter.master.resolve
 * - filter.object_type.view
 * - filter.catalog.apply
 * - filter.relation.apply
 * - filter.index.apply
 *
 * Berørte API-ruter:
 * - GET /api/filter/master
 *
 * Berørte tabeller / views:
 * - ct_filter_master_registry
 * - ct_filter_object_type_registry
 * - ct_filter_usage_registry
 *
 * Dataretning:
 * Neon filter registry -> API -> frontend.
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, innerValue) =>
      typeof innerValue === "bigint" ? innerValue.toString() : innerValue,
    ),
  ) as T;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sourceKey = searchParams.get("source_key");
    const objectGroup = searchParams.get("object_group");
    const pageKey = searchParams.get("page_key");
    const activeOnly = searchParams.get("active_only") ?? "1";

    const objectWhere: string[] = [];
    const objectParams: unknown[] = [];

    if (sourceKey) {
      objectParams.push(sourceKey);
      objectWhere.push(`source_key = $${objectParams.length}`);
    }

    if (objectGroup) {
      objectParams.push(objectGroup);
      objectWhere.push(`object_group = $${objectParams.length}`);
    }

    if (activeOnly !== "0") {
      objectWhere.push(`coalesce(is_active, true) = true`);
      objectWhere.push(`coalesce(status, 'active') = 'active'`);
    }

    const objectWhereSql = objectWhere.length ? `where ${objectWhere.join(" and ")}` : "";

    const usageWhere: string[] = [];
    const usageParams: unknown[] = [];

    if (pageKey) {
      usageParams.push(pageKey);
      usageWhere.push(`page_key = $${usageParams.length}`);
    }

    if (activeOnly !== "0") {
      usageWhere.push(`coalesce(is_active, true) = true`);
      usageWhere.push(`coalesce(status, 'active') = 'active'`);
    }

    const usageWhereSql = usageWhere.length ? `where ${usageWhere.join(" and ")}` : "";

    const masterRows = await neonQuery(`
      select *
      from ct_filter_master_registry
      where coalesce(is_active, true) = true
      order by coalesce(sort_order, 100), filter_master_key
    `);

    const objectRows = await neonQuery(`
      select *
      from ct_filter_object_type_registry
      ${objectWhereSql}
      order by
        object_group,
        source_key,
        coalesce(sort_order, 100),
        filter_key
    `, objectParams);

    const usageRows = await neonQuery(`
      select *
      from ct_filter_usage_registry
      ${usageWhereSql}
      order by coalesce(sort_order, 100), page_key, usage_key
    `, usageParams);

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "filter-master",
      checked_at: new Date().toISOString(),
      filters: {
        source_key: sourceKey,
        object_group: objectGroup,
        page_key: pageKey,
        active_only: activeOnly,
      },
      counts: {
        master_filters: masterRows.length,
        object_type_filters: objectRows.length,
        usage_rules: usageRows.length,
      },
      filter_master: masterRows,
      object_type_filters: objectRows,
      usage_rules: usageRows,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Dette leser kun Filter Master registry. Ingen kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "filter-master",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown filter master error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
