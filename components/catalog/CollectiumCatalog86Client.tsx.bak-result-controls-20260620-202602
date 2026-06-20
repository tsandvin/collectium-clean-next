"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium katalogklient UI/UX 8.6
 *
 * Definering / formål:
 * Interaktiv katalogflate med filter over resultatene, Filter Master,
 * forhandlerfilter, auksjon/nettbutikk-status, enkel to-raders periodefilter,
 * avansert spesifikasjonsfilter og visningskort som peker til objektpresentasjon.
 *
 * Bruksområde:
 * Brukes av /katalog. Komponenten eier kun UI-state og kaller API. Den lager ikke
 * egen topbar, sidemeny, body, global bakgrunn eller skinmotor.
 *
 * Berørte sider / routes:
 * - /katalog
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[relationKey]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 * - catalog.filters
 * - catalog.object.open
 * - catalog.market
 * - catalog.history
 * - collection.wishlist.toggle
 * - collection.favorite.toggle
 * - collection.item.add
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/catalog/filters
 * - GET /api/period86/row1/nodes
 * - GET /api/period86/row2/nodes
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved
 * - ct_v_catalog_filter_counts
 * - ct_v_object_relations_resolved
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Logging:
 * log_category: catalog
 * log_action: search/filter/view
 *
 * Versjon:
 * CT-FILE-CATALOG86-0003 / CHANGE-2026-06-20-0001
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./CollectiumCatalog86Client.module.css";
import {
  CatalogApiPayload,
  CatalogFilters,
  CatalogObject,
  CatalogRelation,
  CatalogSegment,
  CatalogView,
  DEFAULT_CATALOG_FILTERS,
  FilterOption,
} from "./collectium-catalog86-types";

const VIEW_OPTIONS: { value: CatalogView; label: string }[] = [
  { value: "horizontal", label: "Horisontal" },
  { value: "standing", label: "Stående" },
  { value: "list", label: "Liste" },
  { value: "museum", label: "Museum" },
];

const SEGMENT_OPTIONS: { value: CatalogSegment; label: string }[] = [
  { value: "samler", label: "Samler" },
  { value: "historie", label: "Historie" },
  { value: "finans", label: "Finans" },
];

const ROW1_TYPES: FilterOption[] = [
  { value: "konge", label: "Konge / regent" },
  { value: "dynasti", label: "Dynasti / kongehus" },
  { value: "union", label: "Union / maktstruktur" },
  { value: "okkupasjonsmakt", label: "Okkupasjonsmakt" },
  { value: "lokal_hersker", label: "Lokal hersker / småkonge" },
];

function normalizeObjects(payload: CatalogApiPayload): CatalogObject[] {
  if (Array.isArray(payload.objects)) return payload.objects;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && !Array.isArray(payload.data)) {
    if (Array.isArray(payload.data.objects)) return payload.data.objects;
    if (Array.isArray(payload.data.rows)) return payload.data.rows;
  }
  return [];
}

function objectTitle(object: CatalogObject): string {
  return (
    object.collectium_title_no ||
    object.title_no ||
    [
      object.denomination_raw_no,
      object.denomination_issue_raw_no,
      object.object_year_label || object.publication_year_label,
      object.variant_type_raw_no,
    ]
      .filter(Boolean)
      .join(" · ") ||
    "Objekt uten tittel"
  );
}

function objectHref(object: CatalogObject): string {
  if (object.href) return object.href;
  return `/objekt/${encodeURIComponent(object.source_key)}/${encodeURIComponent(object.object_group)}/${encodeURIComponent(String(object.object_id))}`;
}

function formatValue(value: CatalogObject["market_value_nok"], raw?: string | null): string {
  if (raw && raw.trim() && raw !== "0" && raw !== "0.00") return raw;
  if (value === null || value === undefined || value === "" || value === 0 || value === "0" || value === "0.00") {
    return "Mangler markedsverdi";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Mangler markedsverdi";
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(numeric);
}

function buildCatalogQuery(filters: CatalogFilters, segment: CatalogSegment, view: CatalogView): string {
  const params = new URLSearchParams();
  params.set("source_key", filters.sourceKey);
  params.set("object_group", filters.objectGroup);
  params.set("country", filters.masterCountry);
  params.set("segment", segment);
  params.set("view", view);
  params.set("limit", "60");

  const optional: Record<string, string> = {
    q: filters.q,
    dealer: filters.dealer,
    period_row1_type: filters.periodRow1Type,
    period_row1_node: filters.periodRow1Node,
    period_row2_node: filters.periodRow2Node,
    denomination: filters.denomination,
    year: filters.year,
    litra: filters.litra,
    issue: filters.issue,
    variant: filters.variant,
    signature: filters.signature,
    ruler: filters.ruler,
    material: filters.material,
    grade: filters.grade,
    rarity: filters.rarity,
    market: filters.market,
  };

  Object.entries(optional).forEach(([key, value]) => {
    if (value.trim()) params.set(key, value.trim());
  });

  if (filters.dealerAuction) params.set("auction", "1");
  if (filters.dealerShop) params.set("shop", "1");

  return params.toString();
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === "AbortError") return null;
    return null;
  }
}

export function CollectiumCatalog86Client() {
  const [segment, setSegment] = useState<CatalogSegment>("samler");
  const [view, setView] = useState<CatalogView>("horizontal");
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [objects, setObjects] = useState<CatalogObject[]>([]);
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption[]>>({});
  const [row1Nodes, setRow1Nodes] = useState<FilterOption[]>([]);
  const [row2Nodes, setRow2Nodes] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("Henter katalogdata");

  const queryString = useMemo(() => buildCatalogQuery(filters, segment, view), [filters, segment, view]);

  const updateFilter = useCallback(<K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_CATALOG_FILTERS);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilters() {
      const payload = await fetchJson<CatalogApiPayload>(
        `/api/catalog/filters?source_key=${encodeURIComponent(filters.sourceKey)}&object_group=${encodeURIComponent(filters.objectGroup)}&country=${encodeURIComponent(filters.masterCountry)}`,
        controller.signal,
      );
      if (payload?.filters) setFilterOptions(payload.filters);
    }

    loadFilters();
    return () => controller.abort();
  }, [filters.sourceKey, filters.objectGroup, filters.masterCountry]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPeriodRows() {
      const row1 = await fetchJson<{ ok?: boolean; nodes?: FilterOption[]; rows?: FilterOption[] }>(
        `/api/period86/row1/nodes?master=${encodeURIComponent(filters.masterCountry)}&type=${encodeURIComponent(filters.periodRow1Type)}&from=800&to=2026&limit=200`,
        controller.signal,
      );
      const nextRow1 = row1?.nodes || row1?.rows || [];
      setRow1Nodes(nextRow1);

      const selectedRow1 = filters.periodRow1Node || nextRow1[0]?.value || "";
      const row2 = await fetchJson<{ ok?: boolean; nodes?: FilterOption[]; rows?: FilterOption[] }>(
        `/api/period86/row2/nodes?master=${encodeURIComponent(filters.masterCountry)}&parent=${encodeURIComponent(selectedRow1)}&source_key=${encodeURIComponent(filters.sourceKey)}&object_group=${encodeURIComponent(filters.objectGroup)}&limit=200`,
        controller.signal,
      );
      setRow2Nodes(row2?.nodes || row2?.rows || []);
    }

    loadPeriodRows();
    return () => controller.abort();
  }, [filters.masterCountry, filters.periodRow1Type, filters.periodRow1Node, filters.sourceKey, filters.objectGroup]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setStatusText("Henter katalogdata");

    async function loadCatalog() {
      const payload = await fetchJson<CatalogApiPayload>(`/api/catalog/search?${queryString}`, controller.signal);
      const nextObjects = payload ? normalizeObjects(payload) : [];
      setObjects(nextObjects);
      setIsLoading(false);
      setStatusText(nextObjects.length > 0 ? `${nextObjects.length} objekter vist` : "Ingen objekter returnert fra API");
    }

    loadCatalog();
    return () => controller.abort();
  }, [queryString]);

  return (
    <section className={styles.catalogPage} data-view={view} data-segment={segment} aria-labelledby="collectium-katalog-title">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Collectium katalog</p>
          <h1 id="collectium-katalog-title">Relasjonskatalog</h1>
          <p className={styles.lead}>
            Filter Master, forhandler, auksjon, nettbutikk, periode og objektspesifikasjoner ligger over resultatene. Resultatene viser kun data fra API.
          </p>
        </div>
        <div className={styles.headerStatus}>
          <span>{statusText}</span>
          <strong>{filters.sourceKey}</strong>
          <small>{filters.objectGroup}</small>
        </div>
      </header>

      <div className={styles.controlBand}>
        <div className={styles.segmentSwitch} aria-label="Segment">
          {SEGMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={segment === option.value ? styles.activeButton : styles.softButton}
              onClick={() => setSegment(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.viewSwitch} aria-label="Visning">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={view === option.value ? styles.activeButton : styles.softButton}
              onClick={() => setView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <form className={styles.filterDeck} onSubmit={(event) => event.preventDefault()}>
        <fieldset className={styles.filterGroup}>
          <legend>Masterfilter</legend>
          <label>
            <span>Søk</span>
            <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Søk i katalog / objekt / relasjon" />
          </label>
          <label>
            <span>Land / område</span>
            <input value={filters.masterCountry} onChange={(event) => updateFilter("masterCountry", event.target.value)} />
          </label>
          <label>
            <span>Kilde</span>
            <input value={filters.sourceKey} onChange={(event) => updateFilter("sourceKey", event.target.value)} />
          </label>
          <label>
            <span>Objekttype</span>
            <input value={filters.objectGroup} onChange={(event) => updateFilter("objectGroup", event.target.value)} />
          </label>
        </fieldset>

        <fieldset className={styles.filterGroup}>
          <legend>Forhandler / marked</legend>
          <label>
            <span>Forhandler</span>
            <input list="dealer-options" value={filters.dealer} onChange={(event) => updateFilter("dealer", event.target.value)} placeholder="Alle forhandlere" />
            <datalist id="dealer-options">
              {(filterOptions.dealers || []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </datalist>
          </label>
          <div className={styles.checkGrid}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={filters.dealerAuction} onChange={(event) => updateFilter("dealerAuction", event.target.checked)} />
              <span>Tilknyttet auksjon</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={filters.dealerShop} onChange={(event) => updateFilter("dealerShop", event.target.checked)} />
              <span>Tilknyttet nettbutikk</span>
            </label>
          </div>
          <label>
            <span>Marked / verdi</span>
            <input value={filters.market} onChange={(event) => updateFilter("market", event.target.value)} placeholder="verdi, trend, status" />
          </label>
        </fieldset>

        <fieldset className={`${styles.filterGroup} ${styles.periodGroup}`}>
          <legend>Periodefilter · enkel</legend>
          <div className={styles.periodRows}>
            <div className={styles.periodRow}>
              <span>Rad 1 · Statsoverhode / maktstruktur</span>
              <div className={styles.chipRow}>
                {ROW1_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={filters.periodRow1Type === option.value ? styles.activeChip : styles.chip}
                    onClick={() => updateFilter("periodRow1Type", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <select value={filters.periodRow1Node} onChange={(event) => updateFilter("periodRow1Node", event.target.value)}>
                <option value="">Alle noder</option>
                {row1Nodes.map((option) => (
                  <option key={option.value || option.label} value={option.value || option.label}>
                    {option.label} {option.count ? `(${option.count})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.periodRow}>
              <span>Rad 2 · Objektperiode / utgave / relasjon</span>
              <select value={filters.periodRow2Node} onChange={(event) => updateFilter("periodRow2Node", event.target.value)}>
                <option value="">Alle objektperioder</option>
                {row2Nodes.map((option) => (
                  <option key={option.value || option.label} value={option.value || option.label}>
                    {option.label} {option.count ? `(${option.count})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className={`${styles.filterGroup} ${styles.advancedGroup}`}>
          <legend>Avansert filter · samleobjekt</legend>
          <div className={styles.specGrid}>
            <label><span>Valør</span><input value={filters.denomination} onChange={(event) => updateFilter("denomination", event.target.value)} /></label>
            <label><span>Årstall</span><input value={filters.year} onChange={(event) => updateFilter("year", event.target.value)} /></label>
            <label><span>Litra / nummer</span><input value={filters.litra} onChange={(event) => updateFilter("litra", event.target.value)} /></label>
            <label><span>Valørutgave / serie</span><input value={filters.issue} onChange={(event) => updateFilter("issue", event.target.value)} /></label>
            <label><span>Variant / type</span><input value={filters.variant} onChange={(event) => updateFilter("variant", event.target.value)} /></label>
            <label><span>Signatur / personer</span><input value={filters.signature} onChange={(event) => updateFilter("signature", event.target.value)} /></label>
            <label><span>Konge / regent</span><input value={filters.ruler} onChange={(event) => updateFilter("ruler", event.target.value)} /></label>
            <label><span>Materiale</span><input value={filters.material} onChange={(event) => updateFilter("material", event.target.value)} /></label>
            <label><span>Kvalitet</span><input value={filters.grade} onChange={(event) => updateFilter("grade", event.target.value)} /></label>
            <label><span>Sjeldenhet</span><input value={filters.rarity} onChange={(event) => updateFilter("rarity", event.target.value)} /></label>
          </div>
          <div className={styles.filterActions}>
            <button type="button" className={styles.softButton} onClick={resetFilters}>Nullstill filter</button>
          </div>
        </fieldset>
      </form>

      <section className={styles.resultToolbar} aria-label="Resultatstatus">
        <div>
          <strong>{isLoading ? "Henter" : objects.length}</strong>
          <span>{isLoading ? " katalogobjekter" : " katalogobjekter"}</span>
        </div>
        <div className={styles.queryPreview}>{queryString}</div>
      </section>

      {isLoading ? (
        <div className={styles.emptyState}>Henter dynamisk kataloginnhold fra API ...</div>
      ) : objects.length === 0 ? (
        <div className={styles.emptyState}>
          <strong>Ingen objekter returnert.</strong>
          <span>Kontroller at /api/catalog/search returnerer objekter for valgt source_key, object_group og filter.</span>
        </div>
      ) : (
        <div className={styles.results} data-view={view}>
          {objects.map((object) => (
            <CatalogObjectCard key={`${object.source_key}-${object.object_group}-${object.object_id}`} object={object} segment={segment} />
          ))}
        </div>
      )}
    </section>
  );
}

function CatalogObjectCard({ object, segment }: { object: CatalogObject; segment: CatalogSegment }) {
  const href = objectHref(object);
  const title = objectTitle(object);
  const image = object.thumbnail_url || object.image_url;
  const value = formatValue(object.market_value_nok, object.market_value_raw_no);
  const relations = Array.isArray(object.relations) ? object.relations.slice(0, 5) : buildFallbackRelations(object);

  return (
    <article className={styles.objectCard}>
      <a className={styles.imageArea} href={`${href}?segment=${segment}&from=katalog`} aria-label={`Åpne ${title}`}>
        {image ? <img src={image} alt={title} /> : <span>Bilde ikke registrert</span>}
      </a>

      <div className={styles.identityArea}>
        <div className={styles.cardHeaderLine}>
          <p>{object.source_catalog_number || object.source_key}</p>
          <span>{object.object_group}</span>
        </div>
        <h2><a href={`${href}?segment=${segment}&from=katalog`}>{title}</a></h2>
        <div className={styles.metaGrid}>
          <Meta label="Valør" value={object.denomination_raw_no} />
          <Meta label="År" value={object.object_year_label || object.publication_year_label} />
          <Meta label="Litra" value={object.litra_raw_no} />
          <Meta label="Valørutgave / serie" value={object.denomination_issue_raw_no} />
          <Meta label="Variant" value={object.variant_type_raw_no} />
          <Meta label="Signatur" value={object.signature_raw_no} />
          <Meta label="Konge / regent" value={object.ruler_name_raw_no} />
          <Meta label="Sjeldenhet" value={object.rarity_raw_no} />
        </div>
      </div>

      <div className={styles.relationArea}>
        <strong>Relasjoner</strong>
        <div className={styles.relationChips}>
          {relations.map((relation) => (
            <a key={`${relation.relation_type}-${relation.relation_key}`} href={relation.href || `/relasjon/${relation.relation_type}/${relation.relation_key}`}>
              {relation.label_no}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.marketArea}>
        <div className={styles.valueBox}>
          <span>Verdi</span>
          <strong>{value}</strong>
        </div>
        <div className={styles.trendBox}>
          <span>Trend</span>
          <strong>{object.trend_raw_no || object.trend_percent || "Ikke vurdert"}</strong>
        </div>
        <div className={styles.channelBox}>
          <span>{object.auction_status_raw_no || "Ingen auksjon"}</span>
          <span>{object.shop_status_raw_no || "Ikke i nettbutikk"}</span>
        </div>
      </div>

      <div className={styles.actionArea}>
        <button type="button" aria-label="Ønskeliste" data-feature-key="collection.wishlist.toggle">♡</button>
        <button type="button" aria-label="Favoritt" data-feature-key="collection.favorite.toggle">☆</button>
        <a href={`${href}?segment=${segment}&from=katalog`} className={styles.openButton}>Objekt info</a>
        <button type="button" data-feature-key="collection.item.add">Legg i samling</button>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildFallbackRelations(object: CatalogObject): CatalogRelation[] {
  const relations: CatalogRelation[] = [];
  const add = (relation_type: string, value?: string | number | null) => {
    if (!value) return;
    const key = String(value).toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");
    relations.push({ relation_type, relation_key: key, label_no: String(value), href: `/relasjon/${relation_type}/${key}` });
  };
  add("ar", object.object_year_label || object.publication_year_label);
  add("regent", object.ruler_name_raw_no);
  add("signatur", object.signature_raw_no);
  add("utgave", object.denomination_issue_raw_no);
  add("variant", object.variant_type_raw_no);
  add("kilde", object.source_key);
  return relations;
}
