/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Katalog UI/UX 8.6 typer
 *
 * Definering / formål:
 * Delte TypeScript-typer for katalogside, filter og visningskort.
 *
 * Bruksområde:
 * Brukes av CollectiumCatalog86Client og senere API-mappere.
 *
 * Berørte sider / routes:
 * - /katalog
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 * - catalog.filters
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/catalog/filters
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_catalog_filter_counts
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Logging:
 * log_category: catalog
 * log_action: types
 *
 * Versjon:
 * CT-FILE-CATALOG86-0002 / CHANGE-2026-06-20-0001
 */

export type CatalogSegment = "samler" | "historie" | "finans";
export type CatalogView = "horizontal" | "standing" | "list" | "museum";

export type CatalogObject = {
  object_id: string | number;
  object_group: string;
  source_key: string;
  source_catalog_number?: string | null;
  title_no?: string | null;
  collectium_title_no?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  country_raw_no?: string | null;
  producer_raw_no?: string | null;
  denomination_raw_no?: string | null;
  object_year_label?: string | null;
  publication_year_label?: string | null;
  litra_raw_no?: string | null;
  denomination_issue_raw_no?: string | null;
  variant_type_raw_no?: string | null;
  signature_raw_no?: string | null;
  ruler_name_raw_no?: string | null;
  historical_period_label_no?: string | null;
  material_raw_no?: string | null;
  grade_raw_no?: string | null;
  rarity_raw_no?: string | null;
  market_value_raw_no?: string | null;
  market_value_nok?: number | string | null;
  trend_raw_no?: string | null;
  trend_percent?: number | string | null;
  auction_status_raw_no?: string | null;
  shop_status_raw_no?: string | null;
  dealer_name?: string | null;
  collection_status_raw_no?: string | null;
  user_state?: {
    wishlist?: boolean;
    favorite?: boolean;
    in_collection?: boolean;
  } | null;
  relations?: CatalogRelation[];
  href?: string | null;
};

export type CatalogRelation = {
  relation_type: string;
  relation_key: string;
  label_no: string;
  href?: string | null;
};

export type FilterOption = {
  value: string;
  label: string;
  count?: number | null;
  href?: string | null;
  type?: string | null;
  start_year?: number | null;
  end_year?: number | null;
};

export type CatalogApiPayload = {
  ok?: boolean;
  objects?: CatalogObject[];
  rows?: CatalogObject[];
  data?: CatalogObject[] | { objects?: CatalogObject[]; rows?: CatalogObject[] };
  filters?: Record<string, FilterOption[]>;
  meta?: Record<string, unknown>;
  errors?: unknown[];
};

export type CatalogFilters = {
  q: string;
  masterCountry: string;
  sourceKey: string;
  objectGroup: string;
  dealer: string;
  dealerAuction: boolean;
  dealerShop: boolean;
  periodRow1Type: string;
  periodRow1Node: string;
  periodRow2Node: string;
  denomination: string;
  year: string;
  litra: string;
  issue: string;
  variant: string;
  signature: string;
  ruler: string;
  material: string;
  grade: string;
  rarity: string;
  market: string;
};

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  q: "",
  masterCountry: "Norge",
  sourceKey: "norske_sedler",
  objectGroup: "banknote",
  dealer: "",
  dealerAuction: false,
  dealerShop: false,
  periodRow1Type: "konge",
  periodRow1Node: "",
  periodRow2Node: "",
  denomination: "",
  year: "",
  litra: "",
  issue: "",
  variant: "",
  signature: "",
  ruler: "",
  material: "",
  grade: "",
  rarity: "",
  market: "",
};
