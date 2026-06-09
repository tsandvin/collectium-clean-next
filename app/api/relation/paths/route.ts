/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Relation Paths API
 *
 * Definering / formål:
 * Leser globale relation paths fra Neon.
 *
 * Bruksområde:
 * Brukes av katalog, objektpresentasjon, relasjonspresentasjon,
 * Filter Master og Index for å vite hvilke relasjonsbaner som er gyldige.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[type]/[slug]
 * - /index
 * - /filter/master
 *
 * Berørte DB-brytere / feature_keys:
 * - relation.registry.view
 * - relation.paths.view
 *
 * Berørte API-ruter:
 * - GET /api/relation/paths
 *
 * Berørte tabeller / views:
 * - ct_relation_path_registry
 *
 * Dataretning:
 * Neon relation path registry -> API -> frontend.
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

    const relationTypeKey = searchParams.get("relation_type_key");
    const pathGroup = searchParams.get("path_group");
    const activeOnly = searchParams.get("active_only") ?? "1";

    const where: string[] = [];
    const params: unknown[] = [];

    if (relationTypeKey) {
      params.push(relationTypeKey);
      where.push(`relation_type_key = $${params.length}`);
    }

    if (pathGroup) {
      params.push(pathGroup);
      where.push(`path_group = $${params.length}`);
    }

    if (activeOnly !== "0") {
      where.push(`coalesce(is_active, true) = true`);
      where.push(`coalesce(status, 'active') = 'active'`);
    }

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";

    const rows = await neonQuery(`
      select
        id,
        path_key,
        coalesce(path_label_no, path_name_no) as path_label_no,
        path_name_no,
        path_group,
        path_order,
        relation_type_key,
        source_table,
        source_key_field,
        object_group_field,
        source_id_field,
        target_table,
        target_id_field,
        resolver_view,
        path_definition_json,
        required_for_migration,
        privacy_level,
        status,
        is_active,
        sort_order,
        description_no,
        created_at,
        updated_at
      from ct_relation_path_registry
      ${whereSql}
      order by
        coalesce(sort_order, path_order, 100),
        path_key
    `, params);

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-paths",
      checked_at: new Date().toISOString(),
      filters: {
        relation_type_key: relationTypeKey,
        path_group: pathGroup,
        active_only: activeOnly,
      },
      count: rows.length,
      relation_paths: rows,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Dette leser kun relation path registry. Ingen kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-paths",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown relation paths error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
