/**
 * API: /api/test/period-catalog
 * Purpose: read-only DB backed test endpoint for Collectium period filter and view cards.
 * Reads resolved views; never writes truth to DB.
 *
 * Expected env:
 * DATABASE_URL=postgres://...
 *
 * If DATABASE_URL or pg is unavailable, returns fallback rows with source="fallback"
 * so the UI test page still renders and clearly shows that DB is not connected.
 */

import { NextRequest, NextResponse } from "next/server";
import type { CollectiumResultView, CollectiumSegment, PeriodCatalogObject, PeriodCatalogResponse, RelationRow } from "@/lib/collectium-period-card-types";

export const dynamic = "force-dynamic";

type DbRow = Record<string, unknown>;

const SEGMENTS: CollectiumSegment[] = ["samler", "historie", "finans"];
const VIEWS: CollectiumResultView[] = ["liste", "horisontal", "museum"];

function asNumber(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanSegment(value: string | null): CollectiumSegment {
  return SEGMENTS.includes(value as CollectiumSegment) ? (value as CollectiumSegment) : "historie";
}

function cleanView(value: string | null): CollectiumResultView {
  return VIEWS.includes(value as CollectiumResultView) ? (value as CollectiumResultView) : "horisontal";
}

function objectYearSql(): string {
  // object_year_label is text in the resolved view. This extracts first 3-4 digit year safely.
  return `nullif(substring(coalesce(p.object_year_label, p.publication_year_label, '') from '([0-9]{3,4})'), '')::int`;
}

function s(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function n(value: unknown): number {
  const out = Number(value);
  return Number.isFinite(out) ? out : 0;
}

function relationHref(relations: RelationRow[], wanted: string): string | null {
  return relations.find((r) => r.relation_type === wanted)?.relation_href ?? null;
}

function toObject(row: DbRow, relations: RelationRow[]): PeriodCatalogObject {
  const generatedTitle = [
    s(row.denomination_raw_no),
    s(row.object_year_label),
    s(row.litra_raw_no),
    s(row.variant_type_raw_no),
  ]
    .filter(Boolean)
    .join(" â€¢ ");

  const title =
    s(row.collectium_title_no) ??
    s(row.title_no) ??
    (generatedTitle || "Uten tittel");
  const marketValue = s(row.market_value_raw_no) ?? s(row.value_raw_no);

  return {
    source_key: s(row.source_key) ?? "norske_sedler",
    object_group: s(row.object_group) ?? "banknote",
    object_id: n(row.object_id),
    title_no: title,
    source_catalog_number: s(row.source_catalog_number),
    denomination_raw_no: s(row.denomination_raw_no),
    object_year_label: s(row.object_year_label),
    publication_year_label: s(row.publication_year_label),
    litra_raw_no: s(row.litra_raw_no),
    denomination_issue_raw_no: s(row.denomination_issue_raw_no),
    variant_type_raw_no: s(row.variant_type_raw_no),
    signature_raw_no: s(row.signature_raw_no),
    ruler_name_raw_no: s(row.ruler_display_name_no) ?? s(row.ruler_name_raw_no),
    historical_period_label_no: s(row.main_period_label_no) ?? s(row.historical_period_label_no),
    rarity_raw_no: s(row.rarity_catalog_assessment_raw_no) ?? s(row.rarity_raw_no),
    grade_raw_no: s(row.grade_raw_no),
    image_path: s(row.image_path),
    presentation_image_path: s(row.presentation_image_path) ?? s(row.variant_obverse_image_path),
    banknote_image_path: s(row.banknote_image_path) ?? s(row.variant_obverse_image_path),
    market_value_raw_no: marketValue,
    value_raw_no: s(row.value_raw_no),
    trend_raw_no: s(row.trend_raw_no),
    auction_status_raw_no: s(row.auction_status_raw_no),
    shop_status_raw_no: s(row.shop_status_raw_no),
    collection_status_raw_no: s(row.collection_status_raw_no),
    market_value_status_no: marketValue && marketValue !== "0" ? "Vurdert" : "Mangler markedsverdi",
    wishlist_count: n(row.wishlist_count),
    favorite_count: n(row.favorite_count),
    auction_count: n(row.auction_count),
    shop_count: n(row.shop_count),
    relation_href: s(row.ruler_relation_href) ?? relationHref(relations, "regent") ?? relationHref(relations, "ar"),
    relations,
  };
}

const fallbackRows: PeriodCatalogObject[] = [
  {
    source_key: "norske_sedler",
    object_group: "banknote",
    object_id: 1459,
    title_no: "100 kroner 1877",
    source_catalog_number: "NS 1459",
    denomination_raw_no: "100 kroner",
    object_year_label: "1877",
    publication_year_label: "1877",
    litra_raw_no: null,
    denomination_issue_raw_no: "1. utgave",
    variant_type_raw_no: "Standardutgave",
    signature_raw_no: "Winge / Getz",
    ruler_name_raw_no: "Oscar II",
    historical_period_label_no: "Unionstid",
    rarity_raw_no: "Sjelden",
    grade_raw_no: null,
    image_path: null,
    presentation_image_path: null,
    banknote_image_path: null,
    market_value_raw_no: "15 000 kr",
    value_raw_no: null,
    trend_raw_no: null,
    auction_status_raw_no: "3 aktive treff",
    shop_status_raw_no: "1 aktivt salg",
    collection_status_raw_no: null,
    market_value_status_no: "Vurdert",
    wishlist_count: 0,
    favorite_count: 0,
    auction_count: 3,
    shop_count: 1,
    relation_href: "/relasjon/regent/oscar-ii",
    relations: [
      { relation_type: "regent", relation_label_no: "Oscar II", relation_slug: "oscar-ii", relation_href: "/relasjon/regent/oscar-ii" },
      { relation_type: "ar", relation_label_no: "1877", relation_slug: "1877", relation_href: "/relasjon/ar/1877" },
      { relation_type: "kilde", relation_label_no: "Norske sedler", relation_slug: "norske-sedler", relation_href: "/relasjon/kilde/norske-sedler" },
    ],
  },
];

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  const mod = await import("pg");
  return new mod.Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false } });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const sourceKey = url.searchParams.get("sourceKey") || "norske_sedler";
  const objectGroup = url.searchParams.get("objectGroup") || "banknote";
  const yearFrom = asNumber(url.searchParams.get("yearFrom"), 1814);
  const yearTo = asNumber(url.searchParams.get("yearTo"), 2024);
  const segment = cleanSegment(url.searchParams.get("segment"));
  const view = cleanView(url.searchParams.get("view"));
  const limit = Math.min(asNumber(url.searchParams.get("limit"), 24), 100);

  const filters = { sourceKey, objectGroup, yearFrom, yearTo, segment, view };

  try {
    const pool = await getPool();
    if (!pool) {
      return NextResponse.json<PeriodCatalogResponse>({ ok: true, source: "fallback", message: "DATABASE_URL mangler. Viser fallback-testdata.", filters, rows: fallbackRows });
    }

    const yearExpr = objectYearSql();
    const sql = `
      with base as (
        select
          p.*,
          b.collectium_title_no,
          b.litra_raw_no as b_litra_raw_no,
          b.ruler_display_name_no,
          b.variant_obverse_image_path,
          b.rarity_catalog_assessment_raw_no,
          b.ruler_relation_href,
          b.main_period_label_no,
          m.market_value_raw_no as m_market_value_raw_no,
          m.value_raw_no as m_value_raw_no,
          m.trend_raw_no as m_trend_raw_no,
          m.auction_status_raw_no as m_auction_status_raw_no,
          m.shop_status_raw_no as m_shop_status_raw_no,
          u.wishlist_count,
          u.favorite_count,
          u.collection_status_raw_no as u_collection_status_raw_no,
          ${yearExpr} as object_year_num
        from ct_v_object_presentation_resolved p
        left join ct_v_no_banknote_object_presentation b
          on b.source_key = p.source_key
         and b.object_group = p.object_group
         and b.object_id = p.object_id
        left join ct_v_object_market_resolved m
          on m.source_key = p.source_key
         and m.object_group = p.object_group
         and m.object_id = p.object_id
        left join ct_v_object_user_state_resolved u
          on u.source_key = p.source_key
         and u.object_group = p.object_group
         and u.object_id = p.object_id
        where p.source_key = $1
          and p.object_group = $2
          and ${yearExpr} between $3 and $4
        order by ${yearExpr} asc nulls last, p.object_sort_number asc nulls last, p.object_id asc
        limit $5
      )
      select * from base;
    `;

    const result = await pool.query(sql, [sourceKey, objectGroup, yearFrom, yearTo, limit]);
    const ids = result.rows.map((r: DbRow) => n(r.object_id)).filter(Boolean);

    let relationMap = new Map<number, RelationRow[]>();
    if (ids.length) {
      const relResult = await pool.query(
        `select object_id, relation_type, relation_label_no, relation_slug, relation_href
         from ct_v_object_relations_resolved
         where source_key = $1
           and object_group = $2
           and object_id = any($3::bigint[])
         order by object_id, relation_type`,
        [sourceKey, objectGroup, ids]
      );
      for (const rel of relResult.rows as DbRow[]) {
        const objectId = n(rel.object_id);
        const list = relationMap.get(objectId) ?? [];
        list.push({
          relation_type: s(rel.relation_type) ?? "relasjon",
          relation_label_no: s(rel.relation_label_no),
          relation_slug: s(rel.relation_slug),
          relation_href: s(rel.relation_href),
        });
        relationMap.set(objectId, list);
      }
    }

    const rows = result.rows.map((row: DbRow) => toObject({
      ...row,
      litra_raw_no: s(row.b_litra_raw_no) ?? row.litra_raw_no,
      market_value_raw_no: s(row.m_market_value_raw_no) ?? row.market_value_raw_no,
      value_raw_no: s(row.m_value_raw_no) ?? row.value_raw_no,
      trend_raw_no: s(row.m_trend_raw_no) ?? row.trend_raw_no,
      auction_status_raw_no: s(row.m_auction_status_raw_no) ?? row.auction_status_raw_no,
      shop_status_raw_no: s(row.m_shop_status_raw_no) ?? row.shop_status_raw_no,
      collection_status_raw_no: s(row.u_collection_status_raw_no) ?? row.collection_status_raw_no,
    }, relationMap.get(n(row.object_id)) ?? []));

    return NextResponse.json<PeriodCatalogResponse>({ ok: true, source: "db", message: "OK: data lest fra resolved views.", filters, rows });
  } catch (error) {
    return NextResponse.json<PeriodCatalogResponse>({
      ok: false,
      source: "fallback",
      message: error instanceof Error ? `DB/API-feil: ${error.message}` : "Ukjent DB/API-feil. Viser fallback-testdata.",
      filters,
      rows: fallbackRows,
    }, { status: 200 });
  }
}
