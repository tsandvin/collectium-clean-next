import { NextRequest, NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Segment = "samler" | "historie" | "finans";
type ResultView = "liste" | "horisontal" | "museum";

type DbRow = Record<string, unknown>;

type RelationRow = {
  source_key: string;
  object_group: string;
  object_id: number;
  relation_type: string | null;
  relation_key: string | null;
  relation_slug: string | null;
  display_name_no: string | null;
  href: string | null;
};

type PeriodCatalogObject = {
  source_key: string;
  object_group: string;
  object_id: number;
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

const SEGMENTS: Segment[] = ["samler", "historie", "finans"];
const VIEWS: ResultView[] = ["liste", "horisontal", "museum"];

function text(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asPositiveInteger(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function asOffset(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function asSegment(value: string | null): Segment {
  if (value && SEGMENTS.includes(value as Segment)) {
    return value as Segment;
  }

  return "historie";
}

function asView(value: string | null): ResultView {
  if (value && VIEWS.includes(value as ResultView)) {
    return value as ResultView;
  }

  return "liste";
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

function objectHref(row: DbRow): string {
  return `/objekt/${text(row.source_key) ?? "unknown"}/${text(row.object_group) ?? "unknown"}/${numberValue(row.object_id)}`;
}

function segmentSummary(row: DbRow, segment: Segment): string {
  if (segment === "finans") {
    const market = text(row.market_value_raw_no) ?? text(row.value_raw_no) ?? "Mangler markedsverdi";
    const trend = text(row.trend_raw_no) ?? "Mangler trend";
    const auction = text(row.auction_status_raw_no) ?? "Ingen auksjonsstatus";
    const shop = text(row.shop_status_raw_no) ?? "Ingen nettbutikkstatus";

    return `${market} / ${trend} / ${auction} / ${shop}`;
  }

  if (segment === "samler") {
    const rarity = text(row.rarity_raw_no) ?? "Mangler sjeldenhet";
    const signature = text(row.signature_raw_no) ?? "Mangler signatur";
    const variant = text(row.variant_type_raw_no) ?? "Mangler variant";

    return `${rarity} / ${signature} / ${variant}`;
  }

  const ruler = text(row.ruler_name_raw_no) ?? "Mangler regent";
  const year = text(row.object_year_label) ?? text(row.publication_year_label) ?? "Mangler år";
  const issue = text(row.denomination_issue_raw_no) ?? "Mangler valørutgave / serie";

  return `${year} / ${ruler} / ${issue}`;
}

function toRelation(row: DbRow): RelationRow {
  return {
    source_key: text(row.source_key) ?? "unknown",
    object_group: text(row.object_group) ?? "unknown",
    object_id: numberValue(row.object_id),
    relation_type: text(row.relation_type),
    relation_key: text(row.relation_key),
    relation_slug: text(row.relation_slug),
    display_name_no: text(row.display_name_no) ?? text(row.relation_label_no),
    href: text(row.href),
  };
}

function toObject(row: DbRow, relations: RelationRow[], segment: Segment): PeriodCatalogObject {
  const rawTitle = text(row.collectium_title_no) ?? text(row.title_no) ?? generatedTitle(row);
  const title = rawTitle || "Uten tittel";

  return {
    source_key: text(row.source_key) ?? "unknown",
    object_group: text(row.object_group) ?? "unknown",
    object_id: numberValue(row.object_id),
    title,
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
    segment_summary: segmentSummary(row, segment),
    relations,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const sourceKey = searchParams.get("source_key") ?? "norske_sedler";
  const objectGroup = searchParams.get("object_group") ?? "banknote";
  const segment = asSegment(searchParams.get("segment"));
  const view = asView(searchParams.get("view"));
  const limit = asPositiveInteger(searchParams.get("limit"), 25, 100);
  const offset = asOffset(searchParams.get("offset"));

  const rows = await neonQuery<DbRow>(
    `
      select
        *
      from public.ct_v_object_presentation_resolved
      where source_key = $1
        and object_group = $2
      order by object_id
      limit $3
      offset $4
    `,
    [sourceKey, objectGroup, limit, offset]
  );

  const objectKeys = rows
    .map((row) => numberValue(row.object_id))
    .filter((objectId) => objectId > 0);

  let relationRows: RelationRow[] = [];

  if (objectKeys.length > 0) {
    const relationDbRows = await neonQuery<DbRow>(
      `
        select
          source_key,
          object_group,
          object_id,
          relation_type,
          relation_key,
          relation_slug,
          display_name_no,
          relation_label_no,
          href
        from public.ct_v_object_relations_resolved
        where source_key = $1
          and object_group = $2
          and object_id = any($3::bigint[])
        order by object_id, relation_type, display_name_no
      `,
      [sourceKey, objectGroup, objectKeys]
    );

    relationRows = relationDbRows.map(toRelation);
  }

  const relationsByObjectId = new Map<number, RelationRow[]>();

  for (const relation of relationRows) {
    const group = relationsByObjectId.get(relation.object_id) ?? [];
    group.push(relation);
    relationsByObjectId.set(relation.object_id, group);
  }

  const objects = rows.map((row) => {
    const objectId = numberValue(row.object_id);
    return toObject(row, relationsByObjectId.get(objectId) ?? [], segment);
  });

  return NextResponse.json({
    ok: true,
    source: "neon",
    route: "/api/test/period-catalog",
    source_key: sourceKey,
    object_group: objectGroup,
    segment,
    view,
    limit,
    offset,
    count: objects.length,
    objects,
  });
}