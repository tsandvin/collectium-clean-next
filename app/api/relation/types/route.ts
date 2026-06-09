/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Relation Types API
 *
 * Definering / formål:
 * Leser globale relation types fra Neon.
 *
 * Bruksområde:
 * Brukes av katalog, objektpresentasjon, relasjonspresentasjon,
 * Filter Master og Index for å vite hvilke relasjonstyper systemet støtter.
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
 * - relation.types.view
 *
 * Berørte API-ruter:
 * - GET /api/relation/types
 *
 * Berørte tabeller / views:
 * - ct_relation_type_registry
 *
 * Dataretning:
 * Neon relation registry -> API -> frontend.
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

export async function GET() {
  try {
    const rows = await neonQuery(`
      select *
      from ct_relation_type_registry
      order by id asc
    `);

    return NextResponse.json(jsonSafe({
      ok: true,
      source: "relation-types",
      checked_at: new Date().toISOString(),
      count: rows.length,
      relation_types: rows,
      collectium_rule: {
        migration_allowed: false,
        source_data_migration_allowed: false,
        rule: "Dette leser kun relation type registry. Ingen kildedata migreres.",
      },
    }));
  } catch (error) {
    return NextResponse.json(jsonSafe({
      ok: false,
      source: "relation-types",
      status: "FEIL",
      error: error instanceof Error ? error.message : "Unknown relation types error",
      migration_allowed: false,
      source_data_migration_allowed: false,
    }), { status: 500 });
  }
}
