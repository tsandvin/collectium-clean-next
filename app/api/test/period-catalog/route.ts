/**
 * API: /api/test/period-catalog
 * Purpose: read-only DB backed endpoint for Collectium period filter and view cards.
 *
 * v4 fix:
 * - Does not select u.wishlist_count or u.favorite_count because those columns are not present in current Neon view.
 * - Uses safe default counters until user-state/count resolved views are defined.
 * - Forces sourceKey=norske_sedler to objectGroup=banknote.
 * - Keeps frontend as view only; DB/API remains source of truth.
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  CollectiumResultView,
  CollectiumSegment,
  PeriodCatalogObject,
  PeriodCatalogResponse,
  RelationRow,
} from "@/lib/collectium-period-card-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function s(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function n(value: unknown): number {
  const out = Number(value);
  return Number.isFinite(out) ? out : 0;
}

function objectYearExpression(alias = "p") {
  return `nullif(substring(coalesce(${alias}.object_year_label, ${alias}.publication_year_label, '') from '([0-9]{3,4})'), '')::int`;
}

function relationHref(relations: RelationRow[], wanted: string): string | null {
  return relations.find((r) => r.relation_type === wanted)?.relation_href ?? null;
}

function generatedTitle(row: DbRow): string {
  return [
    s(row.denomination_raw_no),
    s(row.object_year_label),
    s(row.litra_raw_no),
    s(row.variant_type_raw_no),
  ]
    .filter(Boolean)
    .join(" â€¢ ");
}

function toObject(row: DbRow, relations: RelationRow[]): PeriodCatalogObject {
  const title =
    s(row.collectium_title_no) ??
    s(row.title_no) ??
    generatedTitle(row) ||
    "Uten tittel";

  const marketValue = s(row.market_value_raw_no) ?? s(row.value_raw_no);
  const auctionText = s(row.auction_status_raw_no);
  const shopText = s(row.shop_status_raw_no);

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
    auction_status_raw_no: auctionText,
    shop_status_raw_no: shopText,
    collection_status_raw_no: s(row.collection_status_raw_no),
    market_value_status_no: marketValue && marketValue !== "0" && marketValue !== "0 kr" ? "Vurdert" : "Mangler markedsverdi",
    wishlist_count: 0,
    favorite_count: 0,
    auction_count: auctionText ? n(auctionText.match(/[0-9]+/)?.[0]) || 1 : 0,
    shop_count: shopText ? n(shopText.match(/[0-9]+/)?.[0]) || 1 : 0,
    relation_href: s(row.ruler_relation_href) ?? relationHref(relations, "regent") ?? relationHref(relations, "ruler") ?? relationHref(relations, "ar"),
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
  return new mod.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const sourceKey = url.searchParams.get("sourceKey") || "norske_sedler";
  const requestedObjectGroup = url.searchParams.get("objectGroup") || "banknote";
  const objectGroup = sourceKey === "norske_sedler" ? "banknote" : requestedObjectGroup;
  const yearFrom = asNumber(url.searchParams.get("yearFrom"), 1814);
  const yearTo = asNumber(url.searchParams.get("yearTo"), 2024);
  const segment = cleanSegment(url.searchParams.get("segment"));
  const view = cleanView(url.searchParams.get("view"));
  const limit = Math.min(asNumber(url.searchParams.get("limit"), 48), 100);

  const filters = { sourceKey, objectGroup, yearFrom, yearTo, segment, view };

  try {
    const pool = await getPool();
    if (!pool) {
      return NextResponse.json<PeriodCatalogResponse>({
        ok: true,
        source: "fallback",
        message: "DATABASE_URL mangler. Viser fallback-testdata.",
        filters,
        rows: fallbackRows,
      });
    }

    const yearExpr = objectYearExpression("p");
    const sql = `
      select
        p.source_key,
        p.object_group,
        p.object_id,
        p.source_catalog_number,
        p.title_no,
        p.denomination_raw_no,
        p.object_year_label,
        p.publication_year_label,
        p.litra_raw_no,
        p.denomination_issue_raw_no,
        p.variant_type_raw_no,
        p.signature_raw_no,
        p.ruler_name_raw_no,
        p.historical_period_label_no,
        p.rarity_raw_no,
        p.grade_raw_no,
        p.image_path,
        p.presentation_image_path,
        p.banknote_image_path,
        p.market_value_raw_no,
        p.value_raw_no,
        p.trend_raw_no,
        p.auction_status_raw_no,
        p.shop_status_raw_no,
        p.collection_status_raw_no,
        b.collectium_title_no,
        b.ruler_display_name_no,
        b.variant_obverse_image_path,
        b.rarity_catalog_assessment_raw_no,
        b.ruler_relation_href,
        b.main_period_label_no,
        ${yearExpr} as object_year_num
      from ct_v_object_presentation_resolved p
      left join ct_v_no_banknote_object_presentation b
        on b.source_key = p.source_key
       and b.object_group = p.object_group
       and b.object_id = p.object_id
      where p.source_key = $1
        and p.object_group = $2
        and ${yearExpr} between $3 and $4
      order by ${yearExpr} asc nulls last, p.object_id asc
      limit $5
    `;

    const result = await pool.query(sql, [sourceKey, objectGroup, yearFrom, yearTo, limit]);
    const ids = result.rows.map((row: DbRow) => n(row.object_id)).filter(Boolean);

    const relationMap = new Map<number, RelationRow[]>();
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

    const rows = result.rows.map((row: DbRow) =>
      toObject(
        {
          ...row,
          ruler_name_raw_no: s(row.ruler_display_name_no) ?? row.ruler_name_raw_no,
          rarity_raw_no: s(row.rarity_catalog_assessment_raw_no) ?? row.rarity_raw_no,
          historical_period_label_no: s(row.main_period_label_no) ?? row.historical_period_label_no,
          presentation_image_path: s(row.presentation_image_path) ?? s(row.variant_obverse_image_path),
        },
        relationMap.get(n(row.object_id)) ?? []
      )
    );

    return NextResponse.json<PeriodCatalogResponse>({
      ok: true,
      source: "db",
      message: "OK: data lest fra Neon resolved views. User-state count columns mangler og settes midlertidig til 0.",
      filters,
      rows,
    });
  } catch (error) {
    return NextResponse.json<PeriodCatalogResponse>(
      {
        ok: false,
        source: "fallback",
        message: error instanceof Error ? `DB/API-feil: ${error.message}` : "Ukjent DB/API-feil. Viser fallback-testdata.",
        filters,
        rows: fallbackRows,
      },
      { status: 200 }
    );
  }
}