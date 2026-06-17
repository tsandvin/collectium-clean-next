"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Definering / formål:
 * Kontrollert frontend-test for periodefilter, objektliste og Neon-svar til UI.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter for å kontrollere at frontend faktisk mottar
 * periodefilter, katalogobjekter, objektpresentasjon, relasjoner og marked fra API.
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.view
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/filter/period
 * - GET /api/test/period-catalog
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 *
 * Dataretning:
 * Neon -> API -> frontend testkomponent -> React/UI.
 *
 * Designregel:
 * Denne komponenten skal ikke definere global layout, shell, topbar, sidebar
 * eller global template. Den bruker enkle lokale testseksjoner inne i eksisterende side.
 */

import { useEffect, useMemo, useState } from "react";

type LoadState = "idle" | "loading" | "ready" | "error";

type ApiEnvelope = {
  ok?: boolean;
  source?: string;
  error?: string;
  [key: string]: unknown;
};

type PeriodFilterRow = {
  period_filter_key?: string;
  period_filter_label_no?: string;
  period_filter_level?: string;
  description_no?: string | null;
  sort_order?: number | string | null;
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
  segment_summary?: string | null;
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
  periodApi: ApiEnvelope | null;
  periodFilters: PeriodFilterRow[];
  catalogApi: ApiEnvelope | null;
  objects: CatalogObject[];
  selectedObject: CatalogObject | null;
  presentation: ObjectPresentationResponse | null;
  relations: ObjectRelationsResponse | null;
  market: ObjectMarketResponse | null;
};

const initialData: PageData = {
  periodApi: null,
  periodFilters: [],
  catalogApi: null,
  objects: [],
  selectedObject: null,
  presentation: null,
  relations: null,
  market: null,
};

function asText(value: unknown, fallback = "Mangler"): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function getPeriodFilters(payload: ApiEnvelope): PeriodFilterRow[] {
  const candidates = [
    payload.period_filters,
    payload.filters,
    payload.rows,
    payload.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate as PeriodFilterRow[];
    }
  }

  return [];
}

function getCatalogObjects(payload: ApiEnvelope): CatalogObject[] {
  const candidates = [
    payload.objects,
    payload.rows,
    payload.data,
  ];

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

async function fetchJson<T extends ApiEnvelope>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as T;

  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status} fra ${url}`);
  }

  return payload;
}

export default function CollectiumPeriodFilterTest() {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PageData>(initialData);
  const [segment, setSegment] = useState<"samler" | "historie" | "finans">("historie");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setError(null);

      try {
        const periodApi = await fetchJson<ApiEnvelope>("/api/filter/period");
        const catalogApi = await fetchJson<ApiEnvelope>(
          `/api/test/period-catalog?source_key=norske_sedler&object_group=banknote&segment=${segment}&view=liste&limit=10`
        );

        const periodFilters = getPeriodFilters(periodApi);
        const objects = getCatalogObjects(catalogApi);
        const selectedObject = objects[0] ?? null;

        let presentation: ObjectPresentationResponse | null = null;
        let relations: ObjectRelationsResponse | null = null;
        let market: ObjectMarketResponse | null = null;

        if (selectedObject) {
          const query = objectQuery(selectedObject);

          const [presentationResult, relationsResult, marketResult] =
            await Promise.allSettled([
              fetchJson<ObjectPresentationResponse>(`/api/object/presentation?${query}`),
              fetchJson<ObjectRelationsResponse>(`/api/object/relations?${query}`),
              fetchJson<ObjectMarketResponse>(`/api/object/market?${query}`),
            ]);

          if (presentationResult.status === "fulfilled") {
            presentation = presentationResult.value;
          }

          if (relationsResult.status === "fulfilled") {
            relations = relationsResult.value;
          }

          if (marketResult.status === "fulfilled") {
            market = marketResult.value;
          }
        }

        if (!cancelled) {
          setData({
            periodApi,
            periodFilters,
            catalogApi,
            objects,
            selectedObject,
            presentation,
            relations,
            market,
          });
          setState("ready");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Ukjent API-feil");
          setState("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [segment]);

  const relationRows = useMemo(() => {
    if (data.relations?.rows && Array.isArray(data.relations.rows)) {
      return data.relations.rows;
    }

    if (data.selectedObject?.relations && Array.isArray(data.selectedObject.relations)) {
      return data.selectedObject.relations;
    }

    return [];
  }, [data.relations, data.selectedObject]);

  const presentationRow = data.presentation?.row ?? data.selectedObject;
  const marketRow = data.market?.row ?? null;

  return (
    <main className="ct-period-test-page">
      <section className="ct-section">
        <p className="ct-eyebrow">Periodefilter - DB-test</p>
        <h1>Neon til frontend kontroll</h1>
        <p>
          Layout og design er globalt styrt. Denne siden kontrollerer om frontend
          faktisk mottar periodefilter, katalogobjekter, objektpresentasjon,
          relasjoner og markedsstatus fra API.
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
        <h2>Status</h2>

        {state === "loading" && (
          <p>Venter på API...</p>
        )}

        {state === "error" && (
          <div className="ct-status-box ct-status-error">
            <strong>DB/API-feil:</strong> {error}
          </div>
        )}

        {state === "ready" && (
          <div className="ct-status-grid">
            <div>
              <strong>Periodefilter</strong>
              <span>{data.periodFilters.length} rader</span>
            </div>
            <div>
              <strong>Objekter</strong>
              <span>{data.objects.length} rader</span>
            </div>
            <div>
              <strong>Objektpresentasjon</strong>
              <span>{data.presentation?.found ? "OK" : "Ingen/ikke valgt"}</span>
            </div>
            <div>
              <strong>Relasjoner</strong>
              <span>{relationRows.length} rader</span>
            </div>
            <div>
              <strong>Marked</strong>
              <span>{data.market?.found ? "OK" : "Mangler markedsverdi"}</span>
            </div>
          </div>
        )}
      </section>

      {state === "ready" && (
        <>
          <section className="ct-section">
            <h2>Periodefilter fra Neon</h2>

            {data.periodFilters.length === 0 ? (
              <p>Ingen periodefilterrader returnert fra API.</p>
            ) : (
              <div className="ct-list-grid">
                {data.periodFilters.map((filter, index) => (
                  <article key={`${filter.period_filter_key ?? "filter"}-${index}`} className="ct-mini-card">
                    <strong>{asText(filter.period_filter_label_no ?? filter.period_filter_key, "Uten navn")}</strong>
                    <span>{asText(filter.period_filter_level, "Mangler nivå")}</span>
                    {filter.description_no ? <p>{String(filter.description_no)}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ct-section">
            <h2>Katalogobjekter fra Neon</h2>

            {data.objects.length === 0 ? (
              <p>Ingen objekter returnert fra /api/test/period-catalog.</p>
            ) : (
              <div className="ct-object-list">
                {data.objects.map((object) => (
                  <article key={`${object.source_key}-${object.object_group}-${object.object_id}`} className="ct-object-row">
                    <div>
                      <strong>{objectTitle(object)}</strong>
                      <p>
                        {asText(object.denomination_raw_no)} / {asText(object.object_year_label ?? object.publication_year_label)} / {asText(object.denomination_issue_raw_no)}
                      </p>
                    </div>
                    <div>
                      <span>{asText(object.ruler_name_raw_no, "Mangler regent")}</span>
                      <span>{asText(object.signature_raw_no, "Mangler signatur")}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ct-section">
            <h2>Valgt objektpresentasjon</h2>

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
                  <span>Objekttype</span>
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
                <div>
                  <span>Signatur</span>
                  <strong>{asText(presentationRow.signature_raw_no)}</strong>
                </div>
                <div>
                  <span>Regent</span>
                  <strong>{asText(presentationRow.ruler_name_raw_no)}</strong>
                </div>
              </div>
            ) : (
              <p>Ingen valgt objektpresentasjon.</p>
            )}
          </section>

          <section className="ct-section">
            <h2>Relasjoner</h2>

            {relationRows.length === 0 ? (
              <p>Ingen relasjoner returnert.</p>
            ) : (
              <div className="ct-list-grid">
                {relationRows.map((relation, index) => (
                  <article key={`${relation.relation_type ?? "relation"}-${relation.relation_slug ?? index}`} className="ct-mini-card">
                    <strong>{asText(relation.relation_label_no ?? relation.display_name_no, "Uten relasjonsnavn")}</strong>
                    <span>{asText(relation.relation_type, "Mangler type")}</span>
                    <p>{asText(relation.relation_href ?? relation.href, "Mangler href")}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ct-section">
            <h2>Marked / finans</h2>

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
                <div>
                  <span>Nettbutikk</span>
                  <strong>{asText(marketRow.shop_status_raw_no, "Ingen nettbutikkstatus")}</strong>
                </div>
              </div>
            ) : (
              <p>Marked svarer, men objektet mangler markedsverdi.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}