/**
 * API: /api/test/period-catalog
 * Collectium UI/UX 8.6 periodfilter test.
 *
<<<<<<< HEAD
 * v10 fix:
 * - Fixes Turbopack parse error by never mixing ?? and || in the same title expression.
 * - Does not select u.wishlist_count or u.favorite_count because those columns are not present in current Neon view.
 * - Uses safe default counters until user-state/count resolved views are defined.
 * - Forces sourceKey=norske_sedler to objectGroup=banknote.
 * - Keeps frontend as view only; DB/API remains source of truth.
=======
 * Read-only route. No DB writes. No migrations.
 *
 * v5 fix:
 * - Does NOT read u.wishlist_count / u.favorite_count.
 * - Does NOT join ct_v_object_user_state_resolved.
 * - Introspects available columns before building SELECT.
 * - Uses fallback values for user-state counts until user-state view is defined.
>>>>>>> bd5696c (Fix Neon database compatibility and period catalog build)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Segment = "samler" | "historie" | "finans";
type ResultView = "liste" | "horisontal" | "museum";
type DbRow = Record<string, unknown>;

type RelationRow = {
  relation_type: string;
  relation_label_no: string | null;
  relation_slug: string | null;
  relation_href: string | null;
};

<<<<<<< HEAD
function asNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
=======
type PeriodCatalogObject = {
  source_key: string;
  object_group: string;
  object_id: number;
  title_no: string;
  source_catalog_number: string | null;
  denomination_raw_no: string | null;
  object_year_label: string | null;
  publication_year_label: string | null;
  litra_raw_no: string | null;
  denomination_issue_raw_no: string | null;
  variant_type_raw_no: string | null;
  signature_raw_no: string | null;
  ruler_name_raw_no: string | null;
  historical_period_label_no: string | null;
  rarity_raw_no: string | null;
  grade_raw_no: string | null;
  image_path: string | null;
  presentation_image_path: string | null;
  banknote_image_path: string | null;
  market_value_raw_no: string | null;
  value_raw_no: string | null;
  trend_raw_no: string | null;
  auction_status_raw_no: string | null;
  shop_status_raw_no: string | null;
  collection_status_raw_no: string | null;
  market_value_status_no: string;
  wishlist_count: number;
  favorite_count: number;
  auction_count: number;
  shop_count: number;
  relation_href: string | null;
  relations: RelationRow[];
};
>>>>>>> bd5696c (Fix Neon database compatibility and period catalog build)

const SEGMENTS: Segment[] = ["samler", "historie", "finans"];
const VIEWS: ResultView[] = ["liste", "horisontal", "museum"];

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const out = String(value).trim();
  return out.length ? out : null;
}

function intValue(value: unknown): number {
  const out = Number(value);
  return Number.isFinite(out) ? out : 0;
}

function numberParam(value: string | null, fallback: number): number {
  const out = Number(value);
  return Number.isFinite(out) ? out : fallback;
}

function segmentParam(value: string | null): Segment {
  return SEGMENTS.includes(value as Segment) ? (value as Segment) : "historie";
}

function viewParam(value: string | null): ResultView {
  return VIEWS.includes(value as ResultView) ? (value as ResultView) : "horisontal";
}

function qident(identifier: string): string {
  return '"' + identifier.replaceAll('"', '""') + '"';
}

function has(cols: Set<string>, name: string): boolean {
  return cols.has(name);
}

function selectExpr(cols: Set<string>, name: string, alias = name): string {
  if (has(cols, name)) return `p.${qident(name)} as ${qident(alias)}`;
  return `null::text as ${qident(alias)}`;
}

function selectFirst(cols: Set<string>, candidates: string[], alias: string): string {
  const parts = candidates.filter((c) => has(cols, c)).map((c) => `p.${qident(c)}::text`);
  if (parts.length === 0) return `null::text as ${qident(alias)}`;
  return `coalesce(${parts.join(", ")}) as ${qident(alias)}`;
}

function yearExpression(cols: Set<string>): string {
  const parts = ["object_year_label", "publication_year_label", "object_year_raw_no", "publication_year_raw_no", "year_label"]
    .filter((c) => has(cols, c))
    .map((c) => `p.${qident(c)}::text`);

  if (parts.length === 0) return "null::int";
  return `nullif(substring(coalesce(${parts.join(", ")}, '') from '([0-9]{3,4})'), '')::int`;
}

function generatedTitle(row: DbRow): string {
  return [
    text(row.denomination_raw_no),
    text(row.object_year_label),
    text(row.litra_raw_no),
    text(row.variant_type_raw_no),
  ]
    .filter(Boolean)
<<<<<<< HEAD
    .join(" • ");
}

function toObject(row: DbRow, relations: RelationRow[]): PeriodCatalogObject {
  const rawTitle =
    s(row.collectium_title_no) ??
    s(row.title_no) ??
    generatedTitle(row);

  const title = rawTitle || "Uten tittel";

  const marketValue = s(row.market_value_raw_no) ?? s(row.value_raw_no);
  const auctionText = s(row.auction_status_raw_no);
  const shopText = s(row.shop_status_raw_no);
=======
    .join(" ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ ");
}

function relationHref(relations: RelationRow[], preferred: string[]): string | null {
  for (const type of preferred) {
    const found = relations.find((r) => r.relation_type === type && r.relation_href);
    if (found?.relation_href) return found.relation_href;
  }
  return relations.find((r) => r.relation_href)?.relation_href ?? null;
}

function toObject(row: DbRow, relations: RelationRow[]): PeriodCatalogObject {
  const marketValue = text(row.market_value_raw_no) ?? text(row.value_raw_no);
  const rawTitle = text(row.collectium_title_no) ?? text(row.title_no) ?? generatedTitle(row);
  const title = rawTitle || "Uten tittel";
  const auctionText = text(row.auction_status_raw_no);
  const shopText = text(row.shop_status_raw_no);
>>>>>>> bd5696c (Fix Neon database compatibility and period catalog build)

  return {
    source_key: text(row.source_key) ?? "norske_sedler",
    object_group: text(row.object_group) ?? "banknote",
    object_id: intValue(row.object_id),
    title_no: title,
    source_catalog_number: text(row.source_catalog_number),
    denomination_raw_no: text(row.denomination_raw_no),
    object_year_label: text(row.object_year_label),
    publication_year_label: text(row.publication_year_label),
    litra_raw_no: text(row.litra_raw_no),
    denomination_issue_raw_no: text(row.denomination_issue_raw_no),
    variant_type_raw_no: text(row.variant_type_raw_no),
    signature_raw_no: text(row.signature_raw_no),
    ruler_name_raw_no: text(row.ruler_name_raw_no),
    historical_period_label_no: text(row.historical_period_label_no),
    rarity_raw_no: text(row.rarity_raw_no),
    grade_raw_no: text(row.grade_raw_no),
    image_path: text(row.image_path),
    presentation_image_path: text(row.presentation_image_path),
    banknote_image_path: text(row.banknote_image_path),
    market_value_raw_no: marketValue,
    value_raw_no: text(row.value_raw_no),
    trend_raw_no: text(row.trend_raw_no),
    auction_status_raw_no: auctionText,
    shop_status_raw_no: shopText,
    collection_status_raw_no: null,
    market_value_status_no: marketValue && marketValue !== "0" && marketValue !== "0 kr" ? "Vurdert" : "Mangler markedsverdi",
    wishlist_count: 0,
    favorite_count: 0,
    auction_count: auctionText ? 1 : 0,
    shop_count: shopText ? 1 : 0,
    relation_href: relationHref(relations, ["regent", "ruler", "ar", "year", "period", "periode"]),
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
    ],
  },
];

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  const pg = await import("pg");
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
}

async function tableExists(client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: DbRow[] }> }, tableName: string): Promise<boolean> {
  const result = await client.query(
    `select exists (
       select 1
       from information_schema.tables
       where table_schema = 'public'
         and table_name = $1
     ) as exists`,
    [tableName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function tableColumns(client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: DbRow[] }> }, tableName: string): Promise<Set<string>> {
  const result = await client.query(
    `select column_name
     from information_schema.columns
     where table_schema = 'public'
       and table_name = $1`,
    [tableName],
  );
  return new Set(result.rows.map((r) => String(r.column_name)));
}

async function readRelations(
  client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: DbRow[] }> },
  sourceKey: string,
  objectGroup: string,
  objectIds: number[],
): Promise<Map<number, RelationRow[]>> {
  const map = new Map<number, RelationRow[]>();
  if (objectIds.length === 0) return map;
  const exists = await tableExists(client, "ct_v_object_relations_resolved");
  if (!exists) return map;

  const cols = await tableColumns(client, "ct_v_object_relations_resolved");
  if (!has(cols, "object_id")) return map;

  const selectParts = [
    has(cols, "object_id") ? "object_id" : "null::bigint as object_id",
    has(cols, "relation_type") ? "relation_type" : "'relasjon'::text as relation_type",
    has(cols, "relation_label_no") ? "relation_label_no" : has(cols, "display_name_no") ? "display_name_no as relation_label_no" : "null::text as relation_label_no",
    has(cols, "relation_slug") ? "relation_slug" : "null::text as relation_slug",
    has(cols, "relation_href") ? "relation_href" : "null::text as relation_href",
  ];

  const whereParts = ["object_id = any($1::bigint[])"];
  const params: unknown[] = [objectIds];
  if (has(cols, "source_key")) {
    params.push(sourceKey);
    whereParts.push(`source_key = $${params.length}`);
  }
  if (has(cols, "object_group")) {
    params.push(objectGroup);
    whereParts.push(`object_group = $${params.length}`);
  }

  const result = await client.query(
    `select ${selectParts.join(", ")}
     from ct_v_object_relations_resolved
     where ${whereParts.join(" and ")}
     order by object_id asc, relation_type asc nulls last`,
    params,
  );

  for (const rel of result.rows) {
    const objectId = intValue(rel.object_id);
    const list = map.get(objectId) ?? [];
    list.push({
      relation_type: text(rel.relation_type) ?? "relasjon",
      relation_label_no: text(rel.relation_label_no),
      relation_slug: text(rel.relation_slug),
      relation_href: text(rel.relation_href),
    });
    map.set(objectId, list);
  }

  return map;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  let sourceKey = url.searchParams.get("sourceKey") || "norske_sedler";
  let objectGroup = url.searchParams.get("objectGroup") || "banknote";

  if (sourceKey === "norske_sedler") objectGroup = "banknote";

  const yearFrom = numberParam(url.searchParams.get("yearFrom"), 1814);
  const yearTo = numberParam(url.searchParams.get("yearTo"), 2024);
  const segment = segmentParam(url.searchParams.get("segment"));
  const view = viewParam(url.searchParams.get("view"));
  const limit = Math.min(Math.max(numberParam(url.searchParams.get("limit"), 24), 1), 100);

  const filters = { sourceKey, objectGroup, yearFrom, yearTo, segment, view };

  let pool: Awaited<ReturnType<typeof getPool>> = null;

  try {
    pool = await getPool();
    if (!pool) {
      return NextResponse.json({ ok: true, source: "fallback", message: "DATABASE_URL mangler. Viser fallback-testdata.", filters, rows: fallbackRows });
    }

    const client = await pool.connect();
    try {
      const baseTable = (await tableExists(client, "ct_v_object_presentation_resolved"))
        ? "ct_v_object_presentation_resolved"
        : (await tableExists(client, "ct_v_no_banknote_object_presentation"))
          ? "ct_v_no_banknote_object_presentation"
          : null;

      if (!baseTable) {
        return NextResponse.json({ ok: true, source: "fallback", message: "Fant ikke resolved presentation-view. Viser fallback-testdata.", filters, rows: fallbackRows });
      }

      const cols = await tableColumns(client, baseTable);
      const yearExpr = yearExpression(cols);
      const selectParts = [
        selectExpr(cols, "source_key"),
        selectExpr(cols, "object_group"),
        has(cols, "object_id") ? "p.object_id::bigint as object_id" : "0::bigint as object_id",
        selectFirst(cols, ["collectium_title_no", "title_no", "title_raw_no", "display_title_no"], "collectium_title_no"),
        selectExpr(cols, "source_catalog_number"),
        selectExpr(cols, "denomination_raw_no"),
        selectExpr(cols, "object_year_label"),
        selectExpr(cols, "publication_year_label"),
        selectFirst(cols, ["litra_raw_no", "litra_label_no"], "litra_raw_no"),
        selectFirst(cols, ["denomination_issue_raw_no", "denomination_issue_label_no", "issue_raw_no"], "denomination_issue_raw_no"),
        selectFirst(cols, ["variant_type_raw_no", "variant_raw_no", "variant_label_no"], "variant_type_raw_no"),
        selectFirst(cols, ["signature_raw_no", "signatures_raw_no", "signature_label_no"], "signature_raw_no"),
        selectFirst(cols, ["ruler_name_raw_no", "ruler_display_name_no", "historical_ruler_raw_no"], "ruler_name_raw_no"),
        selectFirst(cols, ["historical_period_label_no", "main_period_label_no", "period_label_no"], "historical_period_label_no"),
        selectFirst(cols, ["rarity_raw_no", "rarity_catalog_assessment_raw_no"], "rarity_raw_no"),
        selectExpr(cols, "grade_raw_no"),
        selectFirst(cols, ["image_path", "image_url", "object_image_path"], "image_path"),
        selectFirst(cols, ["presentation_image_path", "variant_obverse_image_path"], "presentation_image_path"),
        selectFirst(cols, ["banknote_image_path", "variant_obverse_image_path"], "banknote_image_path"),
        selectExpr(cols, "market_value_raw_no"),
        selectExpr(cols, "value_raw_no"),
        selectExpr(cols, "trend_raw_no"),
        selectExpr(cols, "auction_status_raw_no"),
        selectExpr(cols, "shop_status_raw_no"),
        `${yearExpr} as object_year_num`,
      ];

      const whereParts: string[] = [];
      const params: unknown[] = [];

      if (has(cols, "source_key")) {
        params.push(sourceKey);
        whereParts.push(`p.source_key = $${params.length}`);
      }
      if (has(cols, "object_group")) {
        params.push(objectGroup);
        whereParts.push(`p.object_group = $${params.length}`);
      }
      if (yearExpr !== "null::int") {
        params.push(yearFrom);
        whereParts.push(`${yearExpr} >= $${params.length}`);
        params.push(yearTo);
        whereParts.push(`${yearExpr} <= $${params.length}`);
      }
      params.push(limit);
      const limitParam = `$${params.length}`;

      const whereSql = whereParts.length ? `where ${whereParts.join(" and ")}` : "";
      const orderSql = yearExpr !== "null::int" ? "object_year_num asc nulls last," : "";

      const result = await client.query(
        `select ${selectParts.join(",\n               ")}
         from ${qident(baseTable)} p
         ${whereSql}
         order by ${orderSql} object_id asc nulls last
         limit ${limitParam}`,
        params,
      );

      const ids = result.rows.map((r) => intValue(r.object_id)).filter((id) => id > 0);
      const relationMap = await readRelations(client, sourceKey, objectGroup, ids);
      const rows = result.rows.map((row) => toObject(row, relationMap.get(intValue(row.object_id)) ?? []));

      return NextResponse.json({
        ok: true,
        source: "db",
        message: `OK: ${rows.length} rader lest fra ${baseTable}. User-state counts er midlertidig 0 fordi wishlist/favorite-kolonner ikke finnes i Neon-viewet.`,
        filters,
        rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({
      ok: false,
      source: "fallback",
      message: error instanceof Error ? `DB/API-feil: ${error.message}` : "Ukjent DB/API-feil. Viser fallback-testdata.",
      filters,
      rows: fallbackRows,
    }, { status: 200 });
  } finally {
    await pool?.end().catch(() => undefined);
  }
}
