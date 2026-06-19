/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Catalog Search API
 *
 * Definering / formål:
 * Neon-basert API-rute for å søke og filtrere objekter fra ct_v_object_presentation_resolved.
 *
 * Bruksområde:
 * Brukes av CollectiumPeriodFilterClient for å hente katalogtreff.
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 *
 * Berørte tabeller / views:
 * - public.ct_v_object_presentation_resolved
 * - public.ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon/Postgres -> API -> JSON -> React UI
 *
 * Versjon:
 * CT-API-SEARCH-V1
 */

import { NextRequest, NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DbRow = Record<string, unknown>;

type RelationRow = {
  source_key: string;
  object_group: string;
  object_id: string;
  relation_type: string | null;
  relation_key: string | null;
  relation_slug: string | null;
  display_name_no: string | null;
  href: string | null;
};

type CatalogObject = {
  source_key: string;
  object_group: string;
  object_id: string;
  title: string;
  source_catalog_number: string | null;
  denomination_raw_no: string | null;
  object_year_label: string | null;
  publication_year_label: string | null;
  litra_raw_no: string | null;
  denomination_issue_raw_no: string | null;
  variant_type_raw_no: string | null;
  signature_raw_no: string | null;
  ruler_name_raw_no: string | null;
  rarity_raw_no: string | null;
  market_value_raw_no: string | null;
  trend_raw_no: string | null;
  auction_status_raw_no: string | null;
  shop_status_raw_no: string | null;
  object_href: string;
  segment_summary: string;
  relations: RelationRow[];
};

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function asPositiveInteger(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function asOffset(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function asOptionalYear(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

function objectHref(row: DbRow): string {
  return `/objekt/${text(row.source_key) ?? "unknown"}/${text(row.object_group) ?? "unknown"}/${String(row.object_id ?? "")}`;
}

function generatedTitle(row: DbRow): string | null {
  return [
    text(row.denomination_raw_no),
    text(row.object_year_label) ?? text(row.publication_year_label),
    text(row.litra_raw_no),
    text(row.denomination_issue_raw_no),
    text(row.variant_type_raw_no),
  ]
    .filter(Boolean)
    .join(" - ");
}

function toRelation(row: DbRow): RelationRow {
  return {
    source_key: text(row.source_key) ?? "unknown",
    object_group: text(row.object_group) ?? "unknown",
    object_id: String(row.object_id ?? ""),
    relation_type: text(row.relation_type),
    relation_key: text(row.relation_key),
    relation_slug: text(row.relation_slug),
    display_name_no: text(row.display_name_no) ?? text(row.relation_label_no),
    href: text(row.href),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const sourceKey = searchParams.get("source_key") ?? "norske_sedler";
    const objectGroup = searchParams.get("object_group") ?? "banknote";
    const periodSlug = text(searchParams.get("period_slug"));
    const yearFrom = asOptionalYear(searchParams.get("year_from"));
    const yearTo = asOptionalYear(searchParams.get("year_to"));
    const limit = asPositiveInteger(searchParams.get("limit"), 12, 100);
    const offset = asOffset(searchParams.get("offset"));

    const whereClauses = [
      "p.source_key = $1",
      "p.object_group = $2"
    ];
    const params: unknown[] = [sourceKey, objectGroup];

    if (periodSlug) {
      params.push(periodSlug);
      whereClauses.push(`
        exists (
          select 1
          from public.ct_v_catalog_period_relations cpr
          where cpr.source_key = p.source_key
            and cpr.object_group = p.object_group
            and cpr.object_id::text = p.object_id::text
            and cpr.period_slug = $${params.length}
        )
      `);
    }

    if (yearFrom !== null) {
      params.push(yearFrom);
      whereClauses.push(`
        coalesce(
          substring(coalesce(p.object_year_label, '') from '-?[0-9]{1,4}')::int,
          substring(coalesce(p.publication_year_label, '') from '-?[0-9]{1,4}')::int
        ) >= $${params.length}
      `);
    }

    if (yearTo !== null) {
      params.push(yearTo);
      whereClauses.push(`
        coalesce(
          substring(coalesce(p.object_year_label, '') from '-?[0-9]{1,4}')::int,
          substring(coalesce(p.publication_year_label, '') from '-?[0-9]{1,4}')::int
        ) <= $${params.length}
      `);
    }

    params.push(limit, offset);

    const rows = await neonQuery<DbRow>(
      `
        select p.*
        from public.ct_v_object_presentation_resolved p
        where ${whereClauses.join("\n          and ")}
        order by p.source_key, p.object_group, p.object_id::text
        limit $${params.length - 1}
        offset $${params.length}
      `,
      params
    );

    const objectKeys = rows
      .map((row) => String(row.object_id ?? "").trim())
      .filter((objectId) => objectId.length > 0);

    let relationRows: RelationRow[] = [];

    if (objectKeys.length > 0) {
      const relationDbRows = await neonQuery<DbRow>(
        `
          select
            source_key,
            object_group,
            object_id,
            relation_type,
            relation_slug,
            relation_label_no,
            relation_href as href
          from public.ct_v_object_relations_resolved
          where source_key = $1
            and object_group = $2
            and object_id::text = any($3::text[])
          order by object_id::text, relation_type, relation_label_no
        `,
        [sourceKey, objectGroup, objectKeys]
      );
      relationRows = relationDbRows.map(toRelation);
    }

    const relationsByObjectId = new Map<string, RelationRow[]>();
    for (const r of relationRows) {
      const list = relationsByObjectId.get(r.object_id) ?? [];
      list.push(r);
      relationsByObjectId.set(r.object_id, list);
    }

    const objects = rows.map((row) => {
      const objectId = String(row.object_id ?? "").trim();
      const rawTitle = text(row.collectium_title_no) ?? text(row.title_no) ?? generatedTitle(row);
      return {
        source_key: text(row.source_key) ?? "unknown",
        object_group: text(row.object_group) ?? "unknown",
        object_id: objectId,
        title: rawTitle || "Uten tittel",
        source_catalog_number: text(row.source_catalog_number),
        denomination_raw_no: text(row.denomination_raw_no),
        object_year_label: text(row.object_year_label),
        publication_year_label: text(row.publication_year_label),
        litra_raw_no: text(row.litra_raw_no),
        denomination_issue_raw_no: text(row.denomination_issue_raw_no),
        variant_type_raw_no: text(row.variant_type_raw_no),
        signature_raw_no: text(row.signature_raw_no),
        ruler_name_raw_no: text(row.ruler_name_raw_no),
        rarity_raw_no: text(row.rarity_raw_no),
        market_value_raw_no: text(row.market_value_raw_no) ?? text(row.value_raw_no),
        trend_raw_no: text(row.trend_raw_no),
        auction_status_raw_no: text(row.auction_status_raw_no),
        shop_status_raw_no: text(row.shop_status_raw_no),
        object_href: objectHref(row),
        relations: relationsByObjectId.get(objectId) ?? [],
      };
    });

    return NextResponse.json({
      ok: true,
      source: "neon",
      route: "/api/catalog/search",
      objects,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "neon",
        route: "/api/catalog/search",
        message: error instanceof Error ? error.message : "Ukjent feil i search-api.",
        objects: [],
      },
      { status: 500 }
    );
  }
}
