"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Definering / formål:
 * Testside for periodefilter med filtertyper, faktiske periodevalg fra
 * ct_v_period_filter_options og katalogresultater under tidslinjen.
 *
 * Routes:
 * - /test/periodefilter
 *
 * API:
 * - /api/filter/period
 * - /api/filter/period/options
 * - /api/test/period-catalog
 * - /api/object/presentation
 * - /api/object/relations
 * - /api/object/market
 */

import { useEffect, useMemo, useState } from "react";

type Segment = "samler" | "historie" | "finans";
type LoadState = "loading" | "ready";

type ApiResult<T> = {
  ok: boolean;
  status: number;
  url: string;
  data: T | null;
  error: string | null;
  raw: string;
};

type ApiEnvelope = {
  ok?: boolean;
  source?: string;
  count?: number;
  error?: string;
  period_filters?: PeriodFilterType[];
  filters?: PeriodFilterType[];
  options?: PeriodOption[];
  rows?: unknown[];
  objects?: CatalogObject[];
  data?: unknown[];
  [key: string]: unknown;
};

type PeriodFilterType = {
  period_filter_key?: string;
  period_filter_label_no?: string;
  period_filter_level?: string;
  sort_order?: number | string | null;
  [key: string]: unknown;
};

type PeriodOption = {
  option_key?: string;
  option_label_no?: string;
  period_filter_key?: string;
  timeline_start_year?: number | string | null;
  timeline_end_year?: number | string | null;
  timeline_sort_year?: number | string | null;
  relation_type?: string | null;
  relation_slug?: string | null;
  relation_href?: string | null;
  period_label_no?: string | null;
  relation_label_no?: string | null;
  display_name_no?: string | null;
  start_year?: number | string | null;
  end_year?: number | string | null;
  year_from?: number | string | null;
  year_to?: number | string | null;
  [key: string]: unknown;
};

type CatalogObject = {
  source_key: string;
  object_group: string;
  object_id: number | string;
  title?: string;
  title_no?: string;
  object_href?: string;
  denomination_raw_no?: string | null;
  object_year_label?: string | null;
  publication_year_label?: string | null;
  denomination_issue_raw_no?: string | null;
  variant_type_raw_no?: string | null;
  signature_raw_no?: string | null;
  ruler_name_raw_no?: string | null;
  alias_ruler_name_raw_no?: string | null;
  relations?: RelationRow[];
  [key: string]: unknown;
};

type RelationRow = {
  relation_type?: string | null;
  relation_label_no?: string | null;
  relation_slug?: string | null;
  relation_href?: string | null;
  display_name_no?: string | null;
  href?: string | null;
  [key: string]: unknown;
};

type ObjectPresentationResponse = ApiEnvelope & {
  found?: boolean;
  row?: CatalogObject;
};

type ObjectRelationsResponse = ApiEnvelope & {
  count?: number;
  rows?: RelationRow[];
};

type ObjectMarketResponse = ApiEnvelope & {
  found?: boolean;
  row?: {
    market_value_raw_no?: string | null;
    value_raw_no?: string | null;
    trend_raw_no?: string | null;
    auction_status_raw_no?: string | null;
    shop_status_raw_no?: string | null;
    market_value_status_no?: string | null;
    [key: string]: unknown;
  };
};

type PageData = {
  filterTypes: PeriodFilterType[];
  periodOptions: PeriodOption[];
  objects: CatalogObject[];
  selectedObject: CatalogObject | null;
  periodApi: ApiResult<ApiEnvelope> | null;
  optionsApi: ApiResult<ApiEnvelope> | null;
  catalogApi: ApiResult<ApiEnvelope> | null;
  presentation: ApiResult<ObjectPresentationResponse> | null;
  relations: ApiResult<ObjectRelationsResponse> | null;
  market: ApiResult<ObjectMarketResponse> | null;
};

function asText(value: unknown, fallback = "Mangler"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function asYear(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const match = String(value).match(/-?\d{1,4}/);
  if (!match) return null;
  const numberValue = Number(match[0]);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function optionKey(option: PeriodOption, index: number): string {
  return asText(option.option_key ?? option.relation_slug ?? `period-option-${index}`, `period-option-${index}`);
}

function optionLabel(option: PeriodOption): string {
  return asText(
    option.option_label_no ??
      option.period_label_no ??
      option.relation_label_no ??
      option.display_name_no ??
      option.relation_slug ??
      option.option_key,
    "Uten periode"
  );
}

function optionStart(option: PeriodOption): number | null {
  return (
    asYear(option.timeline_start_year) ??
    asYear(option.start_year) ??
    asYear(option.year_from) ??
    asYear(option.option_label_no) ??
    asYear(option.period_label_no) ??
    asYear(option.relation_label_no)
  );
}

function optionEnd(option: PeriodOption): number | null {
  return asYear(option.timeline_end_year) ?? asYear(option.end_year) ?? asYear(option.year_to) ?? optionStart(option);
}

function getFilterTypes(payload: ApiEnvelope | null): PeriodFilterType[] {
  if (!payload) return [];
  for (const candidate of [payload.period_filters, payload.filters, payload.rows, payload.data]) {
    if (Array.isArray(candidate)) return candidate as PeriodFilterType[];
  }
  return [];
}

function getPeriodOptions(payload: ApiEnvelope | null): PeriodOption[] {
  if (!payload) return [];
  for (const candidate of [payload.options, payload.rows, payload.data]) {
    if (Array.isArray(candidate)) return candidate as PeriodOption[];
  }
  return [];
}

function getCatalogObjects(payload: ApiEnvelope | null): CatalogObject[] {
  if (!payload) return [];
  for (const candidate of [payload.objects, payload.rows, payload.data]) {
    if (Array.isArray(candidate)) return candidate as CatalogObject[];
  }
  return [];
}

function objectTitle(object: CatalogObject | null): string {
  if (!object) return "Ingen objekt valgt";

  return asText(
    object.title ??
      object.title_no ??
      [
        object.denomination_raw_no,
        object.object_year_label ?? object.publication_year_label,
        object.denomination_issue_raw_no,
        object.variant_type_raw_no,
      ]
        .filter(Boolean)
        .join(" - "),
    "Uten tittel"
  );
}

function objectQuery(object: CatalogObject): string {
  return [
    `source_key=${encodeURIComponent(asText(object.source_key, "norske_sedler"))}`,
    `object_group=${encodeURIComponent(asText(object.object_group, "banknote"))}`,
    `object_id=${encodeURIComponent(String(object.object_id))}`,
  ].join("&");
}

async function fetchApi<T extends ApiEnvelope>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const raw = await response.text();

    if (!raw || raw.trim().length === 0) {
      return { ok: false, status: response.status, url, data: null, error: `Tomt API-svar fra ${url}`, raw };
    }

    try {
      const data = JSON.parse(raw) as T;
      const ok = response.ok && data.ok !== false;
      return {
        ok,
        status: response.status,
        url,
        data,
        error: ok ? null : asText(data.error, `HTTP ${response.status}`),
        raw,
      };
    } catch {
      return {
        ok: false,
        status: response.status,
        url,
        data: null,
        error: `API svarte ikke med gyldig JSON fra ${url}`,
        raw: raw.slice(0, 1000),
      };
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      data: null,
      error: error instanceof Error ? error.message : "Ukjent nettverksfeil",
      raw: "",
    };
  }
}

function FilterTypeBar({
  filters,
  selected,
  onSelect,
}: {
  filters: PeriodFilterType[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div className="ct-inline-actions" aria-label="Periodefiltertype">
      <button type="button" className={selected === null ? "is-active" : ""} onClick={() => onSelect(null)}>
        Alle filtertyper
      </button>

      {filters.map((filter, index) => {
        const key = asText(filter.period_filter_key, `filter-${index}`);
        return (
          <button key={key} type="button" className={selected === key ? "is-active" : ""} onClick={() => onSelect(key)}>
            {asText(filter.period_filter_label_no ?? filter.period_filter_key, key)}
          </button>
        );
      })}
    </div>
  );
}

function Timeline({
  options,
  selected,
  onSelect,
}: {
  options: PeriodOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  const rows = useMemo(() => {
    return options
      .map((option, index) => ({
        option,
        key: optionKey(option, index),
        label: optionLabel(option),
        start: optionStart(option),
        end: optionEnd(option),
        sort: asYear(option.timeline_sort_year) ?? optionStart(option) ?? index,
      }))
      .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label, "nb"));
  }, [options]);

  if (rows.length === 0) {
    return <p>Ingen periodevalg returnert fra ct_v_period_filter_options.</p>;
  }

  return (
    <div className="ct-period-timeline" aria-label="Periodevalg tidslinje">
      <button type="button" className={selected === null ? "is-active" : ""} onClick={() => onSelect(null)}>
        Alle perioder
        <span>{rows.length} valg</span>
      </button>

      {rows.map((row) => (
        <button key={row.key} type="button" className={selected === row.key ? "is-active" : ""} onClick={() => onSelect(row.key)}>
          <strong>{row.label}</strong>
          <span>
            {row.start ? row.start : "Udatert"}
            {row.end && row.start && row.end !== row.start ? `-${row.end}` : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [state, setState] = useState<LoadState>("loading");
  const [segment, setSegment] = useState<Segment>("historie");
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(null);
  const [selectedPeriodOption, setSelectedPeriodOption] = useState<string | null>(null);
  const [data, setData] = useState<PageData>({
    filterTypes: [],
    periodOptions: [],
    objects: [],
    selectedObject: null,
    periodApi: null,
    optionsApi: null,
    catalogApi: null,
    presentation: null,
    relations: null,
    market: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");

      const periodApi = await fetchApi<ApiEnvelope>("/api/filter/period");
      const optionsApi = await fetchApi<ApiEnvelope>("/api/filter/period/options");
      const catalogApi = await fetchApi<ApiEnvelope>(
        `/api/test/period-catalog?source_key=norske_sedler&object_group=banknote&segment=${segment}&view=liste&limit=25`
      );

      const filterTypes = getFilterTypes(periodApi.data);
      const periodOptions = getPeriodOptions(optionsApi.data);
      const objects = getCatalogObjects(catalogApi.data);
      const selectedObject = objects[0] ?? null;

      let presentation: ApiResult<ObjectPresentationResponse> | null = null;
      let relations: ApiResult<ObjectRelationsResponse> | null = null;
      let market: ApiResult<ObjectMarketResponse> | null = null;

      if (selectedObject) {
        const query = objectQuery(selectedObject);
        const [presentationResult, relationsResult, marketResult] = await Promise.all([
          fetchApi<ObjectPresentationResponse>(`/api/object/presentation?${query}`),
          fetchApi<ObjectRelationsResponse>(`/api/object/relations?${query}`),
          fetchApi<ObjectMarketResponse>(`/api/object/market?${query}`),
        ]);

        presentation = presentationResult;
        relations = relationsResult;
        market = marketResult;
      }

      if (!cancelled) {
        setData({
          filterTypes,
          periodOptions,
          objects,
          selectedObject,
          periodApi,
          optionsApi,
          catalogApi,
          presentation,
          relations,
          market,
        });
        setState("ready");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [segment]);

  const visibleOptions = useMemo(() => {
    if (!selectedFilterType) return data.periodOptions;

    return data.periodOptions.filter((option) => {
      return asText(option.period_filter_key ?? option.relation_type, "") === selectedFilterType;
    });
  }, [data.periodOptions, selectedFilterType]);

  const visibleObjects = useMemo(() => {
    if (!selectedPeriodOption) return data.objects;

    const selected = data.periodOptions.find((option, index) => optionKey(option, index) === selectedPeriodOption);
    if (!selected) return data.objects;

    const start = optionStart(selected);
    const end = optionEnd(selected);
    if (!start) return data.objects;

    return data.objects.filter((object) => {
      const objectYear = asYear(object.object_year_label ?? object.publication_year_label);
      if (!objectYear) return false;
      return objectYear >= start && objectYear <= (end ?? start);
    });
  }, [data.objects, data.periodOptions, selectedPeriodOption]);

  const relationRows = useMemo(() => {
    if (data.relations?.data?.rows && Array.isArray(data.relations.data.rows)) {
      return data.relations.data.rows as RelationRow[];
    }

    if (data.selectedObject?.relations && Array.isArray(data.selectedObject.relations)) {
      return data.selectedObject.relations;
    }

    return [];
  }, [data.relations, data.selectedObject]);

  const presentationRow = data.presentation?.data?.row ?? data.selectedObject;
  const marketRow = data.market?.data?.row ?? null;

  const apiWarnings = [
    data.periodApi?.ok === false ? `Filtertyper: ${data.periodApi.error}` : null,
    data.optionsApi?.ok === false ? `Periodevalg: ${data.optionsApi.error}` : null,
    data.catalogApi?.ok === false ? `Katalog: ${data.catalogApi.error}` : null,
    data.presentation?.ok === false ? `Objektpresentasjon: ${data.presentation.error}` : null,
    data.relations?.ok === false ? `Relasjoner: ${data.relations.error}` : null,
    data.market?.ok === false ? `Marked: ${data.market.error}` : null,
  ].filter(Boolean);

  return (
    <main className="ct-period-test-page">
      <section className="ct-section">
        <p className="ct-eyebrow">Periodefilter - DB-test</p>
        <h1>Periodefilter med tidslinje</h1>
        <p>
          Filtertypene kommer fra periodefilter-registeret. Tidslinjeverdiene kommer fra
          ct_v_period_filter_options. Under tidslinjen vises katalogresultater fra Neon/API.
        </p>

        <div className="ct-inline-actions" aria-label="Segmentvalg">
          {(["samler", "historie", "finans"] as const).map((item) => (
            <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
              {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
            </button>
          ))}
        </div>
      </section>

      <section className="ct-section">
        <h2>Filtertype</h2>
        {state === "loading" ? (
          <p>Henter filtertyper...</p>
        ) : (
          <FilterTypeBar
            filters={data.filterTypes}
            selected={selectedFilterType}
            onSelect={(value) => {
              setSelectedFilterType(value);
              setSelectedPeriodOption(null);
            }}
          />
        )}
      </section>

      <section className="ct-section">
        <h2>Tidslinje / periodevalg</h2>
        {state === "loading" ? (
          <p>Henter periodevalg...</p>
        ) : (
          <Timeline options={visibleOptions} selected={selectedPeriodOption} onSelect={setSelectedPeriodOption} />
        )}
      </section>

      <section className="ct-section">
        <h2>Status</h2>

        {state === "loading" ? (
          <p>Venter på API...</p>
        ) : (
          <div className="ct-status-grid">
            <div>
              <strong>Filtertyper</strong>
              <span>{data.filterTypes.length} rader</span>
            </div>
            <div>
              <strong>Periodevalg</strong>
              <span>{visibleOptions.length} av {data.periodOptions.length}</span>
            </div>
            <div>
              <strong>Katalogresultater</strong>
              <span>{visibleObjects.length} av {data.objects.length}</span>
            </div>
            <div>
              <strong>Objektpresentasjon</strong>
              <span>{data.presentation?.ok ? "OK" : "Ikke klar"}</span>
            </div>
            <div>
              <strong>Relasjoner</strong>
              <span>{relationRows.length} rader</span>
            </div>
            <div>
              <strong>Marked</strong>
              <span>{data.market?.ok ? "OK" : "Ikke klar"}</span>
            </div>
          </div>
        )}

        {state === "ready" && apiWarnings.length > 0 ? (
          <div className="ct-status-box ct-status-error">
            <strong>API-varsel</strong>
            <ul>
              {apiWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="ct-section">
        <h2>Katalogresultater</h2>

        {state === "loading" ? (
          <p>Laster katalogresultater...</p>
        ) : visibleObjects.length === 0 ? (
          <p>Ingen katalogobjekter for valgt periode.</p>
        ) : (
          <div className="ct-object-list">
            {visibleObjects.map((object) => (
              <article key={`${object.source_key}-${object.object_group}-${object.object_id}`} className="ct-object-row">
                <div>
                  <strong>{objectTitle(object)}</strong>
                  <p>
                    {asText(object.denomination_raw_no)} · {asText(object.object_year_label ?? object.publication_year_label)} ·{" "}
                    {asText(object.denomination_issue_raw_no)}
                  </p>
                </div>
                <div>
                  <span>{asText(object.alias_ruler_name_raw_no ?? object.ruler_name_raw_no, "Mangler regent")}</span>
                  <span>{asText(object.signature_raw_no, "Mangler signatur")}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ct-section">
        <h2>Valgt objekt</h2>

        {presentationRow ? (
          <div className="ct-detail-grid">
            <div><span>Tittel</span><strong>{objectTitle(presentationRow)}</strong></div>
            <div><span>Kilde</span><strong>{asText(presentationRow.source_key)}</strong></div>
            <div><span>Objektgruppe</span><strong>{asText(presentationRow.object_group)}</strong></div>
            <div><span>Object ID</span><strong>{String(presentationRow.object_id)}</strong></div>
            <div><span>Valør</span><strong>{asText(presentationRow.denomination_raw_no)}</strong></div>
            <div><span>År</span><strong>{asText(presentationRow.object_year_label ?? presentationRow.publication_year_label)}</strong></div>
            <div><span>Utgave</span><strong>{asText(presentationRow.denomination_issue_raw_no)}</strong></div>
            <div><span>Variant</span><strong>{asText(presentationRow.variant_type_raw_no)}</strong></div>
          </div>
        ) : (
          <p>Ingen valgt objektpresentasjon.</p>
        )}
      </section>

      <section className="ct-section">
        <h2>Relasjoner for valgt objekt</h2>

        {relationRows.length === 0 ? (
          <p>Ingen relasjoner returnert.</p>
        ) : (
          <div className="ct-list-grid">
            {relationRows.map((relation, index) => (
              <article key={`${relation.relation_type ?? "relation"}-${relation.relation_slug ?? index}`} className="ct-mini-card">
                <strong>{asText(relation.relation_label_no ?? relation.display_name_no, "Uten navn")}</strong>
                <span>{asText(relation.relation_type, "Mangler type")}</span>
                <p>{asText(relation.relation_href ?? relation.href, "Mangler href")}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="ct-section">
        <h2>Marked / finans for valgt objekt</h2>

        {marketRow ? (
          <div className="ct-detail-grid">
            <div><span>Markedsverdi</span><strong>{asText(marketRow.market_value_raw_no ?? marketRow.value_raw_no, "Mangler markedsverdi")}</strong></div>
            <div><span>Status</span><strong>{asText(marketRow.market_value_status_no, "Mangler status")}</strong></div>
            <div><span>Trend</span><strong>{asText(marketRow.trend_raw_no, "Mangler trend")}</strong></div>
            <div><span>Auksjon</span><strong>{asText(marketRow.auction_status_raw_no, "Ingen auksjonsstatus")}</strong></div>
          </div>
        ) : (
          <p>Marked svarer ikke for valgt objekt, eller objektet mangler markedsdata.</p>
        )}
      </section>
    </main>
  );
}