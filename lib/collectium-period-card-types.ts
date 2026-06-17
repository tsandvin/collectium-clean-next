/**
 * Collectium period filter/view-card test types.
 * Purpose: shared contract between test API and React component.
 * DB/features touched: object.presentation.view, object.relations.view,
 * object.market.view, object.user_state.view, catalog.object.open.
 */

export type CollectiumSegment = "samler" | "historie" | "finans";
export type CollectiumResultView = "liste" | "horisontal" | "museum";

export type RelationRow = {
  relation_type: string;
  relation_label_no: string | null;
  relation_slug: string | null;
  relation_href: string | null;
};

export type PeriodCatalogObject = {
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

export type PeriodCatalogResponse = {
  ok: boolean;
  source: "db" | "fallback";
  message: string;
  filters: {
    sourceKey: string;
    objectGroup: string;
    yearFrom: number;
    yearTo: number;
    segment: CollectiumSegment;
    view: CollectiumResultView;
  };
  rows: PeriodCatalogObject[];
};
