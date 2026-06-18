"use client";

import React, { useEffect, useMemo, useState } from "react";

type ApiState<T> = {
  ok: boolean;
  status: "idle" | "loading" | "ok" | "error";
  url: string;
  data: T | null;
  error: string | null;
};

type ApiEnvelope = {
  ok?: boolean;
  source?: string;
  count?: number;
  rows?: any[];
  options?: any[];
  filters?: any[];
  filterTypes?: any[];
  data?: any;
  error?: string;
  message?: string;
  [key: string]: any;
};

type Segment = "samler" | "historie" | "finans";
type ViewMode = "liste" | "horisontal" | "kort";

const SEGMENTS: Segment[] = ["samler", "historie", "finans"];
const VIEWS: ViewMode[] = ["liste", "horisontal", "kort"];

function makeState<T>(url: string): ApiState<T> {
  return {
    ok: false,
    status: "idle",
    url,
    data: null,
    error: null,
  };
}

async function fetchJson<T>(url: string): Promise<ApiState<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: "error",
        url,
        data,
        error: `HTTP ${res.status}: ${data?.error || data?.message || text || res.statusText}`,
      };
    }

    return {
      ok: data?.ok !== false,
      status: data?.ok === false ? "error" : "ok",
      url,
      data,
      error: data?.ok === false ? data?.error || data?.message || "API returnerte ok:false" : null,
    };
  } catch (err) {
    return {
      ok: false,
      status: "error",
      url,
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function arr(value: any): any[] {
  if (Array.isArray(value)) return value;
  return [];
}

function rowsFrom(payload: ApiEnvelope | null): any[] {
  if (!payload) return [];
  return (
    arr(payload.rows) ||
    arr(payload.options) ||
    arr(payload.filters) ||
    arr(payload.filterTypes)
  );
}

function getPeriodOptions(payload: ApiEnvelope | null): any[] {
  if (!payload) return [];
  return arr(payload.options).length ? arr(payload.options) : arr(payload.rows);
}

function getFilterTypes(payload: ApiEnvelope | null): any[] {
  if (!payload) return [];
  return arr(payload.rows).length ? arr(payload.rows) : arr(payload.filterTypes);
}

function getMasterRows(payload: ApiEnvelope | null): any[] {
  if (!payload) return [];
  const candidates = [
    payload.rows,
    payload.filters,
    payload.data?.rows,
    payload.data?.filters,
    payload.master,
    payload.data?.master,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) return candidate;
  }

  return [];
}

function label(row: any): string {
  return (
    row?.label_no ||
    row?.filter_label_no ||
    row?.display_name_no ||
    row?.option_label_no ||
    row?.name_no ||
    row?.title_no ||
    row?.filter_value ||
    row?.source_key ||
    row?.object_group ||
    row?.period_slug ||
    row?.filter_key ||
    row?.key ||
    "Uten navn"
  );
}

function keyOf(row: any, index: number): string {
  return String(
    row?.option_key ||
    row?.period_slug ||
    row?.filter_key ||
    row?.filter_value ||
    row?.source_key ||
    row?.object_group ||
    row?.id ||
    index
  );
}

function firstValue(...values: any[]): string {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "Mangler";
}

function ApiBadge({ state, title }: { state: ApiState<ApiEnvelope>; title: string }) {
  return (
    <div className={`ct-api-badge ct-api-${state.status}`}>
      <strong>{title}</strong>
      <span>{state.status === "ok" ? "OK" : state.status === "loading" ? "Laster" : state.status === "error" ? "Feil" : "Ikke kjørt"}</span>
      {state.error ? <small>{state.error}</small> : null}
    </div>
  );
}

function DynamicSegmentPanel({
  segment,
  selectedObject,
}: {
  segment: Segment;
  selectedObject: any | null;
}) {
  if (!selectedObject) {
    return (
      <section className="ct-dynamic-panel">
        <h3>Dynamisk felt A · {segment}</h3>
        <p>Ingen valgt katalograd ennå.</p>
      </section>
    );
  }

  const relations = arr(selectedObject.relations);

  if (segment === "samler") {
    return (
      <section className="ct-dynamic-panel">
        <h3>Dynamisk felt A · Samler</h3>
        <dl>
          <div><dt>Tittel</dt><dd>{firstValue(selectedObject.title, selectedObject.title_no)}</dd></div>
          <div><dt>Katalognummer</dt><dd>{firstValue(selectedObject.source_catalog_number)}</dd></div>
          <div><dt>Valør</dt><dd>{firstValue(selectedObject.denomination_raw_no, selectedObject.valor_raw_no)}</dd></div>
          <div><dt>År</dt><dd>{firstValue(selectedObject.object_year_label, selectedObject.publication_year_label)}</dd></div>
          <div><dt>Variant</dt><dd>{firstValue(selectedObject.variant_type_raw_no)}</dd></div>
          <div><dt>Sjeldenhet</dt><dd>{firstValue(selectedObject.rarity_raw_no, selectedObject.rarity_label_no)}</dd></div>
        </dl>
      </section>
    );
  }

  if (segment === "historie") {
    return (
      <section className="ct-dynamic-panel">
        <h3>Dynamisk felt A · Historie</h3>
        <dl>
          <div><dt>Regent</dt><dd>{firstValue(selectedObject.ruler_name_raw_no, selectedObject.historical_ruler_raw_no)}</dd></div>
          <div><dt>Utgave</dt><dd>{firstValue(selectedObject.denomination_issue_raw_no)}</dd></div>
          <div><dt>Publiseringsår</dt><dd>{firstValue(selectedObject.publication_year_label)}</dd></div>
          <div><dt>Relasjoner</dt><dd>{relations.length}</dd></div>
        </dl>
        <div className="ct-relation-chip-row">
          {relations.slice(0, 8).map((relation: any, index: number) => (
            <a key={`${relation.relation_type}-${index}`} href={relation.relation_href || "#"} className="ct-relation-chip">
              {firstValue(relation.relation_label_no, relation.relation_type)} · {firstValue(relation.relation_slug)}
            </a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ct-dynamic-panel">
      <h3>Dynamisk felt A · Finans</h3>
      <dl>
        <div><dt>Markedsverdi</dt><dd>{firstValue(selectedObject.market_value_raw_no, selectedObject.value_raw_no, "Mangler markedsverdi")}</dd></div>
        <div><dt>Trend</dt><dd>{firstValue(selectedObject.trend_raw_no, "Ikke beregnet trend")}</dd></div>
        <div><dt>Auksjon</dt><dd>{firstValue(selectedObject.auction_status_raw_no, "Ikke registrert på auksjon")}</dd></div>
        <div><dt>Nettbutikk</dt><dd>{firstValue(selectedObject.shop_status_raw_no, "Ikke registrert i nettbutikk")}</dd></div>
      </dl>
    </section>
  );
}

function DynamicSelectionPanel({
  selectedFilterType,
  selectedPeriod,
  selectedMaster,
}: {
  selectedFilterType: any | null;
  selectedPeriod: any | null;
  selectedMaster: any | null;
}) {
  return (
    <section className="ct-dynamic-panel">
      <h3>Dynamisk felt B · Direkte valgt filter</h3>
      <dl>
        <div><dt>Masterfilter</dt><dd>{selectedMaster ? label(selectedMaster) : "Ikke valgt"}</dd></div>
        <div><dt>Filtertype</dt><dd>{selectedFilterType ? label(selectedFilterType) : "Ikke valgt"}</dd></div>
        <div><dt>Periodevalg</dt><dd>{selectedPeriod ? label(selectedPeriod) : "Ikke valgt"}</dd></div>
        <div><dt>Periode-key</dt><dd>{selectedPeriod ? firstValue(selectedPeriod.option_key, selectedPeriod.period_slug) : "Mangler"}</dd></div>
        <div><dt>Filter-key</dt><dd>{selectedPeriod ? firstValue(selectedPeriod.period_filter_key, selectedPeriod.period_type_key) : "Mangler"}</dd></div>
        <div><dt>År</dt><dd>{selectedPeriod ? `${firstValue(selectedPeriod.start_year_label, selectedPeriod.timeline_start_year)} – ${firstValue(selectedPeriod.end_year_label, selectedPeriod.timeline_end_year, "nå")}` : "Mangler"}</dd></div>
        <div><dt>Relasjonsbane</dt><dd>{selectedPeriod?.relation_href ? <a href={selectedPeriod.relation_href}>{selectedPeriod.relation_href}</a> : "Mangler"}</dd></div>
      </dl>
    </section>
  );
}

function ResultCard({
  object,
  view,
  segment,
  selected,
  onSelect,
}: {
  object: any;
  view: ViewMode;
  segment: Segment;
  selected: boolean;
  onSelect: () => void;
}) {
  const title = firstValue(object.title, object.title_no, object.collectium_title_no);
  const href = `/objekt/${firstValue(object.source_key, "norske_sedler")}/${firstValue(object.object_group, "banknote")}/${firstValue(object.object_id)}`;

  return (
    <article className={`ct-result-card ct-view-${view} ${selected ? "is-selected" : ""}`}>
      <button type="button" onClick={onSelect} className="ct-card-select">
        <span className="ct-card-title">{title}</span>
        <span className="ct-card-meta">
          {firstValue(object.source_catalog_number)} · {firstValue(object.denomination_raw_no)} · {firstValue(object.object_year_label, object.publication_year_label)}
        </span>
      </button>

      <div className="ct-card-segment">
        {segment === "samler" ? (
          <>
            <span>Variant: {firstValue(object.variant_type_raw_no)}</span>
            <span>Sjeldenhet: {firstValue(object.rarity_raw_no, object.rarity_label_no)}</span>
          </>
        ) : segment === "historie" ? (
          <>
            <span>Regent: {firstValue(object.ruler_name_raw_no, object.historical_ruler_raw_no)}</span>
            <span>Relasjoner: {arr(object.relations).length}</span>
          </>
        ) : (
          <>
            <span>Verdi: {firstValue(object.market_value_raw_no, object.value_raw_no, "Mangler markedsverdi")}</span>
            <span>Trend: {firstValue(object.trend_raw_no, "Ikke beregnet")}</span>
          </>
        )}
      </div>

      <div className="ct-card-actions">
        <a href={href}>Objekt info</a>
        {arr(object.relations)[0]?.relation_href ? <a href={arr(object.relations)[0].relation_href}>Se relasjon</a> : null}
      </div>
    </article>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [segment, setSegment] = useState<Segment>("historie");
  const [view, setView] = useState<ViewMode>("liste");

  const [masterState, setMasterState] = useState<ApiState<ApiEnvelope>>(makeState("/api/filter/master"));
  const [periodState, setPeriodState] = useState<ApiState<ApiEnvelope>>(makeState("/api/filter/period"));
  const [optionsState, setOptionsState] = useState<ApiState<ApiEnvelope>>(makeState("/api/filter/period/options"));
  const [catalogState, setCatalogState] = useState<ApiState<ApiEnvelope>>(makeState("/api/test/period-catalog"));

  const [selectedMasterKey, setSelectedMasterKey] = useState<string>("");
  const [selectedFilterTypeKey, setSelectedFilterTypeKey] = useState<string>("");
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>("");
  const [selectedObjectKey, setSelectedObjectKey] = useState<string>("");

  const [countryScope, setCountryScope] = useState<string>("NO");
  const [sourceKey, setSourceKey] = useState<string>("norske_sedler");
  const [objectGroup, setObjectGroup] = useState<string>("banknote");
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");


  async function loadAll(activeSegment: Segment) {
    setMasterState({ ...makeState("/api/filter/master"), status: "loading" });
    setPeriodState({ ...makeState("/api/filter/period"), status: "loading" });
    setOptionsState({ ...makeState("/api/filter/period/options"), status: "loading" });

    const [master, period, options] = await Promise.all([
      fetchJson<ApiEnvelope>("/api/filter/master"),
      fetchJson<ApiEnvelope>("/api/filter/period"),
      fetchJson<ApiEnvelope>("/api/filter/period/options"),
    ]);

    setMasterState(master);
    setPeriodState(period);
    setOptionsState(options);

    await loadCatalog(activeSegment);
  }

  async function loadCatalog(activeSegment: Segment) {
    const params = new URLSearchParams({
      source_key: sourceKey,
      object_group: objectGroup,
      segment: activeSegment,
      view: "liste",
      limit: "25",
    });

    if (countryScope) params.set("country_scope", countryScope);
    if (yearFrom.trim()) params.set("year_from", yearFrom.trim());
    if (yearTo.trim()) params.set("year_to", yearTo.trim());

    const url = `/api/test/period-catalog?${params.toString()}`;

    setCatalogState({ ...makeState(url), status: "loading" });
    const catalog = await fetchJson<ApiEnvelope>(url);
    setCatalogState(catalog);

    const objects = rowsFrom(catalog.data);
    if (objects[0]) {
      setSelectedObjectKey(String(objects[0].object_id ?? ""));
    }
  }

  useEffect(() => {
    loadAll(segment);
  }, []);

  useEffect(() => {
    loadCatalog(segment);
  }, [segment, countryScope, sourceKey, objectGroup, yearFrom, yearTo]);

  const masterRows = useMemo(() => getMasterRows(masterState.data), [masterState.data]);
  const filterTypes = useMemo(() => getFilterTypes(periodState.data), [periodState.data]);
  const periodOptions = useMemo(() => getPeriodOptions(optionsState.data), [optionsState.data]);
  const objects = useMemo(() => rowsFrom(catalogState.data), [catalogState.data]);

  const selectedMaster = useMemo(
    () => masterRows.find((row, index) => keyOf(row, index) === selectedMasterKey) || masterRows[0] || null,
    [masterRows, selectedMasterKey]
  );

  const selectedFilterType = useMemo(
    () => filterTypes.find((row, index) => keyOf(row, index) === selectedFilterTypeKey) || null,
    [filterTypes, selectedFilterTypeKey]
  );

  const visiblePeriodOptions = useMemo(() => {
    if (!selectedFilterType) return periodOptions;
    const typeKey = firstValue(selectedFilterType.period_filter_key, selectedFilterType.filter_key, selectedFilterType.period_type_key, "");
    return periodOptions.filter((option) =>
      [option.period_filter_key, option.period_type_key].map((value) => String(value || "")).includes(typeKey)
    );
  }, [periodOptions, selectedFilterType]);

  const selectedPeriod = useMemo(
    () => visiblePeriodOptions.find((row, index) => keyOf(row, index) === selectedPeriodKey) || visiblePeriodOptions[0] || null,
    [visiblePeriodOptions, selectedPeriodKey]
  );

  const selectedObject = useMemo(
    () => objects.find((object) => String(object.object_id ?? "") === selectedObjectKey) || objects[0] || null,
    [objects, selectedObjectKey]
  );

  return (
    <main className="ct-period-test">
      <header className="ct-test-hero">
        <p className="ct-eyebrow">Periodefilter · DB-test</p>
        <h1>Filter Master, periodefilter og søkeresultat</h1>
        <p>
          Denne siden tester om Filter Master, periodevalg, Samler/Historie/Finans,
          dynamiske felt og katalogresultater henger sammen.
        </p>
      </header>

      <section className="ct-status-grid">
        <ApiBadge title="Filter Master" state={masterState} />
        <ApiBadge title="Filtertyper" state={periodState} />
        <ApiBadge title="Periodevalg" state={optionsState} />
        <ApiBadge title="Katalogresultat" state={catalogState} />
      </section>

      <section className="ct-control-panel">
        <div>
          <h2>Rad 1 · Masterfilter</h2>
          <div className="ct-button-row">
            {masterRows.slice(0, 12).map((row, index) => (
              <button
                key={keyOf(row, index)}
                type="button"
                className={keyOf(row, index) === selectedMasterKey ? "is-active" : ""}
                onClick={() => setSelectedMasterKey(keyOf(row, index))}
              >
                {label(row)}
              </button>
            ))}
            {!masterRows.length ? <span>Ingen masterfilter-rader returnert.</span> : null}
          </div>
        </div>
        <div>
          <h2>Rad 1B · Land, kilde og objekttype</h2>
          <div className="ct-filter-grid">
            <label>
              <span>Land</span>
              <select value={countryScope} onChange={(event) => setCountryScope(event.target.value)}>
                <option value="NO">Norge</option>
                <option value="SN">Skandinavia</option>
                <option value="SV">Sverige</option>
                <option value="DM">Danmark</option>
                <option value="EU">Europa</option>
                <option value="GL">Global</option>
              </select>
            </label>

            <label>
              <span>Kilde</span>
              <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)}>
                <option value="norske_sedler">Norske sedler</option>
                <option value="norske_mynter">Norske mynter</option>
                <option value="verdibrev">Verdibrev</option>
                <option value="norark">Funn / Norark</option>
              </select>
            </label>

            <label>
              <span>Objekttype</span>
              <select value={objectGroup} onChange={(event) => setObjectGroup(event.target.value)}>
                <option value="banknote">Seddel</option>
                <option value="coin">Mynt</option>
                <option value="document">Dokument</option>
                <option value="security">Verdibrev</option>
                <option value="find">Funn</option>
                <option value="medal">Medalje</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <h2>Rad 1C · Årstall fra / til</h2>
          <div className="ct-filter-grid">
            <label>
              <span>År fra</span>
              <input
                value={yearFrom}
                onChange={(event) => setYearFrom(event.target.value)}
                inputMode="numeric"
                placeholder="f.eks. 1814"
              />
            </label>

            <label>
              <span>År til</span>
              <input
                value={yearTo}
                onChange={(event) => setYearTo(event.target.value)}
                inputMode="numeric"
                placeholder="f.eks. 1905"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setYearFrom("");
                setYearTo("");
              }}
            >
              Nullstill år
            </button>
          </div>
        </div>
        <div>
          <h2>Rad 1B · Land, kilde og objekttype</h2>
          <div className="ct-filter-grid">
            <label>
              <span>Land</span>
              <select value={countryScope} onChange={(event) => setCountryScope(event.target.value)}>
                <option value="NO">Norge</option>
                <option value="SN">Skandinavia</option>
                <option value="SV">Sverige</option>
                <option value="DM">Danmark</option>
                <option value="EU">Europa</option>
                <option value="GL">Global</option>
              </select>
            </label>

            <label>
              <span>Kilde</span>
              <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)}>
                <option value="norske_sedler">Norske sedler</option>
                <option value="norske_mynter">Norske mynter</option>
                <option value="verdibrev">Verdibrev</option>
                <option value="norark">Funn / Norark</option>
              </select>
            </label>

            <label>
              <span>Objekttype</span>
              <select value={objectGroup} onChange={(event) => setObjectGroup(event.target.value)}>
                <option value="banknote">Seddel</option>
                <option value="coin">Mynt</option>
                <option value="document">Dokument</option>
                <option value="security">Verdibrev</option>
                <option value="find">Funn</option>
                <option value="medal">Medalje</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <h2>Rad 1C · Årstall fra / til</h2>
          <div className="ct-filter-grid">
            <label>
              <span>År fra</span>
              <input
                value={yearFrom}
                onChange={(event) => setYearFrom(event.target.value)}
                inputMode="numeric"
                placeholder="f.eks. 1814"
              />
            </label>

            <label>
              <span>År til</span>
              <input
                value={yearTo}
                onChange={(event) => setYearTo(event.target.value)}
                inputMode="numeric"
                placeholder="f.eks. 1905"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setYearFrom("");
                setYearTo("");
              }}
            >
              Nullstill år
            </button>
          </div>
        </div>

        <div>
          <h2>Rad 2 · Filtertype</h2>
          <div className="ct-button-row">
            <button type="button" className={!selectedFilterTypeKey ? "is-active" : ""} onClick={() => setSelectedFilterTypeKey("")}>
              Alle periodetyper
            </button>
            {filterTypes.slice(0, 18).map((row, index) => (
              <button
                key={keyOf(row, index)}
                type="button"
                className={keyOf(row, index) === selectedFilterTypeKey ? "is-active" : ""}
                onClick={() => setSelectedFilterTypeKey(keyOf(row, index))}
              >
                {label(row)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2>Rad 3 · Periodevalg</h2>
          <div className="ct-timeline-row">
            {visiblePeriodOptions.map((row, index) => (
              <button
                key={keyOf(row, index)}
                type="button"
                className={keyOf(row, index) === selectedPeriodKey ? "is-active" : ""}
                onClick={() => setSelectedPeriodKey(keyOf(row, index))}
              >
                <strong>{label(row)}</strong>
                <span>{firstValue(row.start_year_label, row.timeline_start_year)} – {firstValue(row.end_year_label, row.timeline_end_year, "nå")}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2>Segment</h2>
          <div className="ct-button-row">
            {SEGMENTS.map((item) => (
              <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
                {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2>Visning</h2>
          <div className="ct-button-row">
            {VIEWS.map((item) => (
              <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
                {item === "liste" ? "Liste" : item === "horisontal" ? "Horisontal" : "Kort"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ct-dynamic-grid">
        <DynamicSegmentPanel segment={segment} selectedObject={selectedObject} />
        <DynamicSelectionPanel selectedMaster={selectedMaster} selectedFilterType={selectedFilterType} selectedPeriod={selectedPeriod} />
      </section>

      <section className="ct-result-section">
        <div className="ct-result-header">
          <h2>Søkeresultat</h2>
          <p>
            Viser {objects.length} objekter · segment {segment} · visning {view}
          </p>
        </div>

        {catalogState.status === "error" ? (
          <div className="ct-error-box">
            <strong>Katalog API feiler</strong>
            <p>{catalogState.error}</p>
            <code>{catalogState.url}</code>
          </div>
        ) : null}

        {!objects.length && catalogState.status !== "error" ? (
          <div className="ct-empty-box">Ingen katalogobjekter returnert.</div>
        ) : null}

        <div className={`ct-results ct-results-${view}`}>
          {objects.map((object: any) => (
            <ResultCard
              key={String(object.object_id)}
              object={object}
              view={view}
              segment={segment}
              selected={String(object.object_id) === selectedObjectKey}
              onSelect={() => setSelectedObjectKey(String(object.object_id ?? ""))}
            />
          ))}
        </div>
      </section>

      <section className="ct-debug-box">
        <h2>Svar til ChatGPT</h2>
        <pre>{JSON.stringify({
          filter_master: {
            ok: masterState.ok,
            count: masterRows.length,
            error: masterState.error,
          },
          filter_types: {
            ok: periodState.ok,
            count: filterTypes.length,
            error: periodState.error,
          },
          period_options: {
            ok: optionsState.ok,
            count: periodOptions.length,
            visible: visiblePeriodOptions.length,
            error: optionsState.error,
          },
          catalog: {
            ok: catalogState.ok,
            count: objects.length,
            error: catalogState.error,
            url: catalogState.url,
          },
          selected: {
            segment,
            view,
            master: selectedMaster ? label(selectedMaster) : null,
            filter_type: selectedFilterType ? label(selectedFilterType) : null,
            period: selectedPeriod ? label(selectedPeriod) : null,
            object_id: selectedObject?.object_id ?? null,
            country_scope: countryScope,
            source_key: sourceKey,
            object_group: objectGroup,
            year_from: yearFrom || null,
            year_to: yearTo || null,
          },
        }, null, 2)}</pre>
      </section>
    </main>
  );
}
