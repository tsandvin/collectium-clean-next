"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Definering / formål:
 * Frontend-kontrollside for periodefilter med tidslinje og katalogresultater.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter for å vise:
 * - periodefilter/tidslinje øverst
 * - segmentbrytere Samler / Historie / Finans
 * - katalogresultater under tidslinjen
 * - valgt objekt, relasjoner og markedsstatus fra Neon/API
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.view
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 *
 * Berørte routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/filter/period
 * - GET /api/test/period-catalog
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 *
 * Designregel:
 * Bruker eksisterende globalt design. Ingen global CSS, shell, topbar eller sidebar endres.
 */

import { useEffect, useMemo, useState } from "react";

type Segment = "samler" | "historie" | "finans";
type LoadState = "loading" | "ready" | "error";

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
  error?: string;
  period_filters?: PeriodFilterRow[];
  filters?: PeriodFilterRow[];
  rows?: unknown[];
  objects?: CatalogObject[];
  data?: unknown[];
  [key: string]: unknown;
};

type PeriodFilterRow = {
  period_filter_key?: string;
  period_filter_label_no?: string;
  period_filter_level?: string;
  description_no?: string | null;
  sort_order?: number | string | null;
  start_year?: number | string | null;
  end_year?: number | string | null;
  year_from?: number | string | null;
  year_to?: number | string | null;
  period_start_year?: number | string | null;
  period_end_year?: number | string | null;
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
  rarity_raw_no?: string | null;
  market_value_raw_no?: string | null;
  trend_raw_no?: string | null;
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
  periodApi: ApiResult<ApiEnvelope> | null;
  catalogApi: ApiResult<ApiEnvelope> | null;
  periodFilters: PeriodFilterRow[];
  objects: CatalogObject[];
  selectedObject: CatalogObject | null;
  presentation: ApiResult<ObjectPresentationResponse> | null;
  relations: ApiResult<ObjectRelationsResponse> | null;
  market: ApiResult<ObjectMarketResponse> | null;
};

function asText(value: unknown, fallback = "Mangler"): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function asYear(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const match = String(value).match(/-?\d{1,4}/);
  if (!match) {
    return null;
  }

  const numberValue = Number(match[0]);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getPeriodStart(row: PeriodFilterRow): number | null {
  return (
    asYear(row.start_year) ??
    asYear(row.year_from) ??
    asYear(row.period_start_year) ??
    asYear(row.period_filter_key) ??
    null
  );
}

function getPeriodEnd(row: PeriodFilterRow): number | null {
  return (
    asYear(row.end_year) ??
    asYear(row.year_to) ??
    asYear(row.period_end_year) ??
    getPeriodStart(row)
  );
}

function getPeriodFilters(payload: ApiEnvelope | null): PeriodFilterRow[] {
  if (!payload) {
    return [];
  }

  const candidates = [payload.period_filters, payload.filters, payload.rows, payload.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as PeriodFilterRow[];
    }
  }

  return [];
}

function getCatalogObjects(payload: ApiEnvelope | null): CatalogObject[] {
  if (!payload) {
    return [];
  }

  const candidates = [payload.objects, payload.rows, payload.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as CatalogObject[];
    }
  }

  return [];
}

function objectTitle(object: CatalogObject | null): string {
  if (!object) {
    return "Ingen objekt valgt";
  }

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
  const sourceKey = encodeURIComponent(asText(object.source_key, "norske_sedler"));
  const objectGroup = encodeURIComponent(asText(object.object_group, "banknote"));
  const objectId = encodeURIComponent(String(object.object_id));

  return `source_key=${sourceKey}&object_group=${objectGroup}&object_id=${objectId}`;
}

async function fetchApi<T extends ApiEnvelope>(url: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.text();

    if (!raw || raw.trim().length === 0) {
      return {
        ok: false,
        status: response.status,
        url,
        data: null,
        error: `Tomt API-svar fra ${url}`,
        raw,
      };
    }

    try {
      const data = JSON.parse(raw) as T;

      return {
        ok: response.ok && data.ok !== false,
        status: response.status,
        url,
        data,
        error:
          response.ok && data.ok !== false
            ? null
            : asText(data.error, `HTTP ${response.status} fra ${url}`),
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

function Timeline({
  filters,
  selectedKey,
  onSelect,
}: {
  filters: PeriodFilterRow[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const timelineRows = useMemo(() => {
    const rows = filters.map((filter, index) => {
      const start = getPeriodStart(filter);
      const end = getPeriodEnd(filter);
      const key = asText(filter.period_filter_key ?? `period-${index}`, `period-${index}`);
      const label = asText(filter.period_filter_label_no ?? filter.period_filter_key, "Uten periode");

      return {
        filter,
        key,
        label,
        level: asText(filter.period_filter_level, "periode"),
        start,
        end,
        sort: start ?? Number(filter.sort_order ?? index),
      };
    });

    return rows.sort((a, b) => a.sort - b.sort);
  }, [filters]);

  if (timelineRows.length === 0) {
    return (
      <div className="ct-status-box">
        Ingen periodefilterrader fra API. Tidslinjen venter på registry-data.
      </div>
    );
  }

  return (
    <div className="ct-period-timeline" aria-label="Periodefilter tidslinje">
      <button
        type="button"
        className={selectedKey === null ? "is-active" : ""}
        onClick={() => onSelect(null)}
      >
        Alle perioder
      </button>

      {timelineRows.map((row) => (
        <button
          key={row.key}
          type="button"
          className={selectedKey === row.key ? "is-active" : ""}
          onClick={() => onSelect(row.key)}
          title={`${row.label} ${row.start ?? ""}${row.end && row.end !== row.start ? `-${row.end}` : ""}`}
        >
          <strong>{row.label}</strong>
          <span>
            {row.start ? row.start : "Udatert"}
            {row.end && row.end !== row.start ? `-${row.end}` : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [state, setState] = useState<LoadState>("loading");
  const [segment, setSegment] = useState<Segment>("historie");
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | null>(null);
  const [data, setData] = useState<PageData>({
    periodApi: null,
    catalogApi: null,
    periodFilters: [],
    objects: [],
    selectedObject: null,
    presentation: null,
    relations: null,
    market: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");

      const periodApi = await fetchApi<ApiEnvelope>("/api/filter/period");

      const catalogUrl =
        `/api/test/period-catalog?source_key=norske_sedler&object_group=banknote&segment=${segment}&view=liste&limit=25`;

      const catalogApi = await fetchApi<ApiEnvelope>(catalogUrl);

      const periodFilters = getPeriodFilters(periodApi.data);
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
          periodApi,
          catalogApi,
          periodFilters,
          objects,
          selectedObject,
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

  const filteredObjects = useMemo(() => {
    if (!selectedPeriodKey) {
      return data.objects;
    }

    const selectedPeriod = data.periodFilters.find(
      (filter, index) =>
        asText(filter.period_filter_key ?? `period-${index}`, `period-${index}`) === selectedPeriodKey
    );

    if (!selectedPeriod) {
      return data.objects;
    }

    const start = getPeriodStart(selectedPeriod);
    const end = getPeriodEnd(selectedPeriod);

    if (!start) {
      return data.objects;
    }

    return data.objects.filter((object) => {
      const objectYear = asYear(object.object_year_label ?? object.publication_year_label);
      if (!objectYear) {
        return false;
      }

      return objectYear >= start && objectYear <= (end ?? start);
    });
  }, [data.objects, data.periodFilters, selectedPeriodKey]);

  const relationRows = useMemo(() => {
    const relationData = data.relations?.data;
    if (relationData?.rows && Array.isArray(relationData.rows)) {
      return relationData.rows;
    }

    if (data.selectedObject?.relations && Array.isArray(data.selectedObject.relations)) {
      return data.selectedObject.relations;
    }

    return [];
  }, [data.relations, data.selectedObject]);

  const presentationRow = data.presentation?.data?.row ?? data.selectedObject;
  const marketRow = data.market?.data?.row ?? null;

  const hasApiError =
    data.periodApi?.ok === false ||
    data.catalogApi?.ok === false ||
    data.presentation?.ok === false ||
    data.relations?.ok === false ||
    data.market?.ok === false;

  return (
    <main className="ct-period-test-page">
      <section className="ct-section">
        <p className="ct-eyebrow">Periodefilter - DB-test</p>
        <h1>Periodefilter med tidslinje</h1>
        <p>
          Øverst ligger periodefilteret som tidslinje. Under tidslinjen vises
          katalogresultater fra Neon/API. Segmentene styrer hvilken type
          informasjon som prioriteres i resultatene.
        </p>

        <div className="ct-inline-actions" aria-label="Segmentvalg">
          {(["samler", "historie", "finans"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={segment === item ? "is-active" : ""}
              onClick={() => setSegment(item)}
            >
              {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
            </button>
          ))}
        </div>
      </section>

      <section className="ct-section">
        <h2>Tidslinje / periodefilter</h2>
        {state === "loading" ? (
          <p>Henter periodefilter og katalogresultater...</p>
        ) : (
          <Timeline
            filters={data.periodFilters}
            selectedKey={selectedPeriodKey}
            onSelect={setSelectedPeriodKey}
          />
        )}
      </section>

      <section className="ct-section">
        <h2>Status</h2>

        {state === "loading" && <p>Venter på API...</p>}

        {state === "ready" && (
          <div className="ct-status-grid">
            <div>
              <strong>Periodefilter</strong>
              <span>{data.periodFilters.length} rader</span>
            </div>
            <div>
              <strong>Katalogresultater</strong>
              <span>{filteredObjects.length} av {data.objects.length}</span>
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

        {state === "ready" && hasApiError && (
          <div className="ct-status-box ct-status-error">
            <strong>API-varsel</strong>
            <ul>
              {data.periodApi?.ok === false ? <li>Periodefilter: {data.periodApi.error}</li> : null}
              {data.catalogApi?.ok === false ? <li>Katalog: {data.catalogApi.error}</li> : null}
              {data.presentation?.ok === false ? <li>Objektpresentasjon: {data.presentation.error}</li> : null}
              {data.relations?.ok === false ? <li>Relasjoner: {data.relations.error}</li> : null}
              {data.market?.ok === false ? <li>Marked: {data.market.error}</li> : null}
            </ul>
          </div>
        )}
      </section>

      <section className="ct-section">
        <h2>Katalogresultater</h2>

        {state === "loading" ? (
          <p>Laster katalogresultater...</p>
        ) : filteredObjects.length === 0 ? (
          <p>Ingen katalogobjekter for valgt periode.</p>
        ) : (
          <div className="ct-object-list">
            {filteredObjects.map((object) => (
              <article
                key={`${object.source_key}-${object.object_group}-${object.object_id}`}
                className="ct-object-row"
              >
                <div>
                  <strong>{objectTitle(object)}</strong>
                  <p>
                    {asText(object.denomination_raw_no)} ·{" "}
                    {asText(object.object_year_label ?? object.publication_year_label)} ·{" "}
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
            <div>
              <span>Tittel</span>
              <strong>{objectTitle(presentationRow)}</strong>
            </div>
            <div>
              <span>Kilde</span>
              <strong>{asText(presentationRow.source_key)}</strong>
            </div>
            <div>
              <span>Objektgruppe</span>
              <strong>{asText(presentationRow.object_group)}</strong>
            </div>
            <div>
              <span>Object ID</span>
              <strong>{String(presentationRow.object_id)}</strong>
            </div>
            <div>
              <span>Valør</span>
              <strong>{asText(presentationRow.denomination_raw_no)}</strong>
            </div>
            <div>
              <span>År</span>
              <strong>{asText(presentationRow.object_year_label ?? presentationRow.publication_year_label)}</strong>
            </div>
            <div>
              <span>Utgave</span>
              <strong>{asText(presentationRow.denomination_issue_raw_no)}</strong>
            </div>
            <div>
              <span>Variant</span>
              <strong>{asText(presentationRow.variant_type_raw_no)}</strong>
            </div>
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
              <article
                key={`${relation.relation_type ?? "relation"}-${relation.relation_slug ?? index}`}
                className="ct-mini-card"
              >
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
            <div>
              <span>Markedsverdi</span>
              <strong>{asText(marketRow.market_value_raw_no ?? marketRow.value_raw_no, "Mangler markedsverdi")}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{asText(marketRow.market_value_status_no, "Mangler status")}</strong>
            </div>
            <div>
              <span>Trend</span>
              <strong>{asText(marketRow.trend_raw_no, "Mangler trend")}</strong>
            </div>
            <div>
              <span>Auksjon</span>
              <strong>{asText(marketRow.auction_status_raw_no, "Ingen auksjonsstatus")}</strong>
            </div>
          </div>
        ) : (
          <p>Marked svarer ikke for valgt objekt, eller objektet mangler markedsdata.</p>
        )}
      </section>
    </main>
  );
}