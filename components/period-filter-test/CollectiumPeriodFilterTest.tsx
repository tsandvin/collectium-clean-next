"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Definering / formål:
 * Testside for Filter Master, land, objekttype, år fra/til og tre dynamiske
 * filterrader. Rad 1, Rad 2 og Rad 3 bruker de samme periodevalgene fra
 * /api/filter/period/options. Rad 1 representerer nasjonal objekt-/relasjonsenhet
 * som konge/regent, signatur/person, motiv, myntperiode, seddelvariant,
 * utgaveperiode, produsent/utgave, funn/proveniens osv.
 *
 * Route:
 * - /test/periodefilter
 *
 * API:
 * - /api/filter/period/options
 * - /api/test/period-catalog
 */

import { useEffect, useMemo, useState } from "react";

type Segment = "samler" | "historie" | "finans";
type ViewMode = "liste" | "horisontal" | "museum";
type ObjectType = "security" | "banknote" | "coin" | "document" | "find";
type RowRole = "national_object_unit" | "period_value" | "relation_period_value";

type ApiState = {
  ok: boolean;
  status: "idle" | "loading" | "ok" | "error";
  url: string;
  data: any | null;
  error: string | null;
};

type PeriodOption = {
  period_slug?: string;
  display_name_no?: string;
  option_key?: string;
  option_label_no?: string;
  period_filter_key?: string;
  period_type_key?: string;
  period_type_label_no?: string;
  period_level?: number | string | null;
  parent_period_slug?: string | null;
  start_year?: number | string | null;
  end_year?: number | string | null;
  start_year_label?: string | null;
  end_year_label?: string | null;
  timeline_start_year?: number | string | null;
  timeline_end_year?: number | string | null;
  timeline_sort_year?: number | string | null;
  relation_href?: string | null;
  summary_short_no?: string | null;
  collectium_relevance_no?: string | null;
  country_scope?: string | null;
  region_scope?: string | null;
  area_scope?: string | null;
  related_object_groups_json?: unknown;
};

type FilterRow = {
  id: "row1" | "row2" | "row3";
  title: string;
  role: RowRole;
  relationType: string;
  periodKey: string;
};

type PreviewObject = {
  object_id: string;
  source_key: string;
  object_group: string;
  title: string;
  subtitle: string;
  object_type_label: string;
  year: string;
  period: string;
  variant: string;
  segment_label: string;
  category: string;
  heart_count: number;
  star_count: number;
  auction_count: number;
  shop_count: number;
};

const SEGMENTS: Segment[] = ["samler", "historie", "finans"];
const VIEW_MODES: ViewMode[] = ["liste", "horisontal", "museum"];

const COUNTRY_OPTIONS = [
  { value: "NO", label: "Norge" },
  { value: "SN", label: "Skandinavia" },
  { value: "SV", label: "Sverige" },
  { value: "DM", label: "Danmark" },
  { value: "EU", label: "Europa" },
  { value: "GL", label: "Global" },
];

const OBJECT_TYPE_OPTIONS: Array<{ value: ObjectType; label: string; sourceKey: string }> = [
  { value: "security", label: "Verdibrev", sourceKey: "verdibrev" },
  { value: "banknote", label: "Sedler", sourceKey: "norske_sedler" },
  { value: "coin", label: "Mynter", sourceKey: "norske_mynter" },
  { value: "document", label: "Dokumenter", sourceKey: "dokument" },
  { value: "find", label: "Funn", sourceKey: "norark" },
];

const NATIONAL_OBJECT_RELATIONS = [
  { value: "ruler", label: "Konge / regent" },
  { value: "signature_person", label: "Signatur / person" },
  { value: "motif_symbol", label: "Motiv / symbol" },
  { value: "coin_period", label: "Myntperiode" },
  { value: "banknote_variant", label: "Seddelvariant" },
  { value: "issue_period", label: "Utgaveperiode" },
  { value: "denomination_variant", label: "Valør / variant" },
  { value: "producer_issue", label: "Produsent / utgave" },
  { value: "find_provenance", label: "Funn / proveniens" },
  { value: "market_index", label: "Marked / index" },
];

const FALLBACK_OBJECTS: PreviewObject[] = [
  {
    object_id: "security-preview-1898",
    source_key: "verdibrev",
    object_group: "security",
    title: "VERDIBREV · Oscar II · 1898",
    subtitle: "Aksjebrev · industri · 1898",
    object_type_label: "Verdibrev",
    year: "1898",
    period: "Oscar II",
    variant: "Papir",
    segment_label: "Verdibrev · security · Finans · filtrert 1814–2024",
    category: "A/S",
    heart_count: 0,
    star_count: 0,
    auction_count: 1,
    shop_count: 0,
  },
  {
    object_id: "security-preview-1910",
    source_key: "verdibrev",
    object_group: "security",
    title: "VERDIBREV · Haakon VII · 1910",
    subtitle: "Aksjebrev · industri · 1910",
    object_type_label: "Verdibrev",
    year: "1910",
    period: "Haakon VII",
    variant: "Papir",
    segment_label: "Verdibrev · security · Finans · filtrert 1814–2024",
    category: "A/S",
    heart_count: 0,
    star_count: 0,
    auction_count: 1,
    shop_count: 0,
  },
  {
    object_id: "security-preview-1942",
    source_key: "verdibrev",
    object_group: "security",
    title: "VERDIBREV · Andre verdenskrig · 1942",
    subtitle: "Krigsobligasjon · 1942",
    object_type_label: "Verdibrev",
    year: "1942",
    period: "Andre verdenskrig",
    variant: "Obligasjon",
    segment_label: "Verdibrev · security · Krig · filtrert 1814–2024",
    category: "A/S",
    heart_count: 0,
    star_count: 0,
    auction_count: 1,
    shop_count: 0,
  },
  {
    object_id: "security-preview-1986",
    source_key: "verdibrev",
    object_group: "security",
    title: "VERDIBREV · Olav V · 1986",
    subtitle: "Moderne aksjebrev · olje · 1986",
    object_type_label: "Verdibrev",
    year: "1986",
    period: "Olav V",
    variant: "Olje",
    segment_label: "Verdibrev · security · Indeks · filtrert 1814–2024",
    category: "A/S",
    heart_count: 0,
    star_count: 0,
    auction_count: 1,
    shop_count: 0,
  },
];

function makeState(url: string): ApiState {
  return {
    ok: false,
    status: "idle",
    url,
    data: null,
    error: null,
  };
}

async function fetchJson(url: string): Promise<ApiState> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: "error",
        url,
        data,
        error: `HTTP ${response.status}: ${data?.error || data?.message || ""}`,
      };
    }

    return {
      ok: data?.ok !== false,
      status: data?.ok === false ? "error" : "ok",
      url,
      data,
      error: data?.ok === false ? data?.error || data?.message || "API returnerte ok:false" : null,
    };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      url,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function arrayFrom(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function periodOptionsFrom(data: any): PeriodOption[] {
  const options = arrayFrom(data?.options);
  if (options.length) return options as PeriodOption[];

  const rows = arrayFrom(data?.rows);
  return rows as PeriodOption[];
}

function optionKey(option: PeriodOption, index: number): string {
  return String(option.option_key || option.period_slug || option.display_name_no || index);
}

function optionLabel(option: PeriodOption): string {
  return String(option.option_label_no || option.display_name_no || option.period_slug || "Uten periode");
}

function optionStart(option: PeriodOption): number | null {
  const raw = option.timeline_start_year ?? option.start_year ?? option.start_year_label;
  const match = String(raw ?? "").match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function optionEnd(option: PeriodOption): number | null {
  const raw = option.timeline_end_year ?? option.end_year ?? option.end_year_label ?? option.timeline_start_year ?? option.start_year;
  const match = String(raw ?? "").match(/-?\d+/);
  return match ? Number(match[0]) : optionStart(option);
}

function inYearRange(option: PeriodOption, yearFrom: string, yearTo: string): boolean {
  const start = optionStart(option);
  const end = optionEnd(option);
  const from = Number(yearFrom || "-99999");
  const to = Number(yearTo || "99999");

  if (start === null && end === null) return true;
  return (end ?? start ?? to) >= from && (start ?? end ?? from) <= to;
}

function labelForObjectType(value: ObjectType): string {
  return OBJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function sourceForObjectType(value: ObjectType): string {
  return OBJECT_TYPE_OPTIONS.find((option) => option.value === value)?.sourceKey ?? "norske_sedler";
}

function periodSummary(option: PeriodOption | null): string {
  if (!option) return "Ingen periode valgt.";
  return String(option.summary_short_no || option.collectium_relevance_no || "Periodevalg fra ct_v_period_filter_options.");
}

function ApiBadge({ title, state }: { title: string; state: ApiState }) {
  return (
    <div className={`ct-mf-api ct-mf-api-${state.status}`}>
      <strong>{title}</strong>
      <span>{state.status === "ok" ? "OK" : state.status === "error" ? "Feil" : state.status === "loading" ? "Laster" : "Ikke kjørt"}</span>
      {state.error ? <small>{state.error}</small> : null}
    </div>
  );
}

function FilterRowEditor({
  row,
  periodOptions,
  onChange,
}: {
  row: FilterRow;
  periodOptions: PeriodOption[];
  onChange: (next: FilterRow) => void;
}) {
  const selectedOption = periodOptions.find((option, index) => optionKey(option, index) === row.periodKey) ?? null;

  return (
    <article className="ct-mf-row-editor">
      <div>
        <span>{row.title}</span>
        <strong>
          {row.id === "row1"
            ? "Nasjonal objekt-/relasjonsenhet"
            : row.id === "row2"
              ? "Periodeverdi"
              : "Periodeverdi / relasjonsverdi"}
        </strong>
      </div>

      <label>
        <span>Felt / relasjonstype</span>
        <select value={row.relationType} onChange={(event) => onChange({ ...row, relationType: event.target.value })}>
          {row.id === "row1" ? (
            NATIONAL_OBJECT_RELATIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))
          ) : (
            <>
              <option value="national_period">Nasjonal periode</option>
              <option value="historical_period">Historisk periode</option>
              <option value="war_period">Krig / konflikt</option>
              <option value="economic_period">Økonomi / finans</option>
              <option value="banknote_issue_period">Seddelutgaveperiode</option>
              <option value="monetary_period">Penge-/valutaperiode</option>
              <option value="person_signature_period">Signatur / person</option>
              <option value="find_provenance_period">Funn / proveniens</option>
            </>
          )}
        </select>
      </label>

      <label>
        <span>Periodevalg / 40 tilgjengelige</span>
        <select value={row.periodKey} onChange={(event) => onChange({ ...row, periodKey: event.target.value })}>
          <option value="">Velg periode</option>
          {periodOptions.map((option, index) => (
            <option key={optionKey(option, index)} value={optionKey(option, index)}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <p>
        {selectedOption
          ? `${optionLabel(selectedOption)} · ${selectedOption.start_year_label ?? selectedOption.timeline_start_year ?? ""}–${selectedOption.end_year_label ?? selectedOption.timeline_end_year ?? "nå"}`
          : "Alle 40 periodevalg er tilgjengelige i denne raden."}
      </p>
    </article>
  );
}

function TimelineLane({
  title,
  options,
  selectedKey,
  onSelect,
}: {
  title: string;
  options: PeriodOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="ct-mf-lane">
      <h3>{title}</h3>
      <div className="ct-mf-lane-track">
        {options.map((option, index) => {
          const key = optionKey(option, index);
          return (
            <button
              key={key}
              type="button"
              className={selectedKey === key ? "is-active" : ""}
              onClick={() => onSelect(key)}
            >
              <strong>{optionLabel(option)}</strong>
              <span>
                {option.start_year_label ?? option.timeline_start_year ?? "?"}
                {"–"}
                {option.end_year_label ?? option.timeline_end_year ?? "nå"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewCard({
  item,
  view,
}: {
  item: PreviewObject;
  view: ViewMode;
}) {
  return (
    <article className={`ct-mf-card ct-mf-card-${view}`}>
      <div className="ct-mf-card-mark">{item.category}</div>

      <div className="ct-mf-card-main">
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>

        <dl>
          <div><dt>Objekttype</dt><dd>{item.object_type_label}</dd></div>
          <div><dt>Årstall</dt><dd>{item.year}</dd></div>
          <div><dt>Periode</dt><dd>{item.period}</dd></div>
          <div><dt>Variant</dt><dd>{item.variant}</dd></div>
        </dl>

        <p>{item.segment_label}</p>

        <div className="ct-mf-card-actions">
          <a href={`/objekt/${item.source_key}/${item.object_group}/${item.object_id}`}>↗ Åpne objekt</a>
          <a href={`/relasjon/periode/${item.period.toLowerCase().replaceAll(" ", "-")}`}>⌘ Se relasjon</a>
          <button type="button">⊕ Legg i samling</button>
          <button type="button">…</button>
        </div>
      </div>

      <aside className="ct-mf-card-status">
        <div><span>Hjerte</span><strong>{item.heart_count}</strong></div>
        <div><span>Stjerne</span><strong>{item.star_count}</strong></div>
        <div><span>Auksjon</span><strong>{item.auction_count}</strong></div>
        <div><span>Nettbutikk</span><strong>{item.shop_count}</strong></div>
      </aside>
    </article>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [country, setCountry] = useState("NO");
  const [objectType, setObjectType] = useState<ObjectType>("security");
  const [yearFrom, setYearFrom] = useState("1814");
  const [yearTo, setYearTo] = useState("2024");
  const [segment, setSegment] = useState<Segment>("historie");
  const [view, setView] = useState<ViewMode>("horisontal");

  const [periodOptionsState, setPeriodOptionsState] = useState<ApiState>(makeState("/api/filter/period/options"));
  const [catalogState, setCatalogState] = useState<ApiState>(makeState("/api/test/period-catalog"));

  const [row1, setRow1] = useState<FilterRow>({
    id: "row1",
    title: "Rad 1 · objekt/enhet",
    role: "national_object_unit",
    relationType: "ruler",
    periodKey: "",
  });

  const [row2, setRow2] = useState<FilterRow>({
    id: "row2",
    title: "Rad 2 · periodeverdi",
    role: "period_value",
    relationType: "national_period",
    periodKey: "",
  });

  const [row3, setRow3] = useState<FilterRow>({
    id: "row3",
    title: "Rad 3 · periodeverdi",
    role: "relation_period_value",
    relationType: "person_signature_period",
    periodKey: "",
  });

  const sourceKey = sourceForObjectType(objectType);
  const objectTypeLabel = labelForObjectType(objectType);

  useEffect(() => {
    async function load() {
      setPeriodOptionsState({ ...makeState("/api/filter/period/options"), status: "loading" });
      const result = await fetchJson("/api/filter/period/options");
      setPeriodOptionsState(result);
    }

    load();
  }, []);

  const periodOptions = useMemo(() => {
    return periodOptionsFrom(periodOptionsState.data);
  }, [periodOptionsState.data]);

  const visiblePeriodOptions = useMemo(() => {
    return periodOptions
      .filter((option) => inYearRange(option, yearFrom, yearTo))
      .sort((a, b) => {
        const aSort = Number(a.timeline_sort_year ?? optionStart(a) ?? 0);
        const bSort = Number(b.timeline_sort_year ?? optionStart(b) ?? 0);
        return aSort - bSort || optionLabel(a).localeCompare(optionLabel(b), "nb");
      });
  }, [periodOptions, yearFrom, yearTo]);

  useEffect(() => {
    if (!periodOptions.length) return;

    const first = periodOptions[0] ? optionKey(periodOptions[0], 0) : "";
    const national =
      periodOptions.find((option) => option.period_slug === "svensk-union") ??
      periodOptions.find((option) => option.period_slug === "selvstendig-norge") ??
      periodOptions[0];

    const banknoteIssue =
      periodOptions.find((option) => option.period_filter_key === "banknote_issue_period") ??
      national;

    const personContext =
      periodOptions.find((option) => option.period_slug === "moderne-seddelserier") ??
      national;

    setRow1((current) => current.periodKey ? current : { ...current, periodKey: optionKey(national, periodOptions.indexOf(national)) || first });
    setRow2((current) => current.periodKey ? current : { ...current, periodKey: optionKey(banknoteIssue, periodOptions.indexOf(banknoteIssue)) || first });
    setRow3((current) => current.periodKey ? current : { ...current, periodKey: optionKey(personContext, periodOptions.indexOf(personContext)) || first });
  }, [periodOptions]);

  useEffect(() => {
    async function loadCatalog() {
      const params = new URLSearchParams({
        source_key: sourceKey,
        object_group: objectType,
        segment,
        view,
        limit: "25",
        country_scope: country,
        year_from: yearFrom,
        year_to: yearTo,
        row1_relation_type: row1.relationType,
        row1_period_key: row1.periodKey,
        row2_relation_type: row2.relationType,
        row2_period_key: row2.periodKey,
        row3_relation_type: row3.relationType,
        row3_period_key: row3.periodKey,
      });

      const url = `/api/test/period-catalog?${params.toString()}`;
      setCatalogState({ ...makeState(url), status: "loading" });

      const result = await fetchJson(url);
      setCatalogState(result);
    }

    loadCatalog();
  }, [
    country,
    objectType,
    sourceKey,
    segment,
    view,
    yearFrom,
    yearTo,
    row1.relationType,
    row1.periodKey,
    row2.relationType,
    row2.periodKey,
    row3.relationType,
    row3.periodKey,
  ]);

  const selectedRow1Option = periodOptions.find((option, index) => optionKey(option, index) === row1.periodKey) ?? null;
  const selectedRow2Option = periodOptions.find((option, index) => optionKey(option, index) === row2.periodKey) ?? null;
  const selectedRow3Option = periodOptions.find((option, index) => optionKey(option, index) === row3.periodKey) ?? null;

  const apiObjects = useMemo(() => {
    const rows = arrayFrom(catalogState.data?.rows);
    const objects = arrayFrom(catalogState.data?.objects);
    return rows.length ? rows : objects;
  }, [catalogState.data]);

  const filteredPreviewObjects = useMemo(() => {
    const from = Number(yearFrom || "0");
    const to = Number(yearTo || "9999");

    return FALLBACK_OBJECTS.filter((item) => {
      const year = Number(item.year);
      return year >= from && year <= to;
    });
  }, [yearFrom, yearTo]);

  const displayObjects = apiObjects.length ? apiObjects : filteredPreviewObjects;
  const usingFallbackPreview = !apiObjects.length;

  return (
    <main className="ct-mf-page">
      <section className="ct-mf-hero">
        <p className="ct-eyebrow">Periodefilter · DB-test</p>
        <h1>Masterfilter</h1>
        <p>Land + type objekt + årstall fra/til. Rad 1, Rad 2 og Rad 3 bruker alle periodevalg fra ct_v_period_filter_options.</p>
      </section>

      <section className="ct-mf-status">
        <ApiBadge title="Periodevalg API" state={periodOptionsState} />
        <ApiBadge title="Katalog API" state={catalogState} />
        <div className="ct-mf-api ct-mf-api-ok">
          <strong>Valgt modell</strong>
          <span>{country} · {objectTypeLabel} · {yearFrom}–{yearTo}</span>
        </div>
      </section>

      <section className="ct-mf-master">
        <div className="ct-mf-field">
          <label>Land</label>
          <select value={country} onChange={(event) => setCountry(event.target.value)}>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="ct-mf-field">
          <label>Type objekt</label>
          <select value={objectType} onChange={(event) => setObjectType(event.target.value as ObjectType)}>
            {OBJECT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="ct-mf-field">
          <label>År fra</label>
          <input value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} inputMode="numeric" />
        </div>

        <div className="ct-mf-field">
          <label>År til</label>
          <input value={yearTo} onChange={(event) => setYearTo(event.target.value)} inputMode="numeric" />
        </div>

        <button type="button" className="ct-mf-popup-button">
          Hurtigvalg periode
          <span>Åpne periodevalg / popup</span>
        </button>
      </section>

      <section className="ct-mf-filterrows">
        <FilterRowEditor row={row1} periodOptions={periodOptions} onChange={setRow1} />
        <FilterRowEditor row={row2} periodOptions={periodOptions} onChange={setRow2} />
        <FilterRowEditor row={row3} periodOptions={periodOptions} onChange={setRow3} />
      </section>

      <p className="ct-mf-note">Masterfilterverdier er samlet i de tre radfeltene over. Alle tre rader kan bruke alle {periodOptions.length} periodevalg.</p>

      <section className="ct-mf-switches">
        <div>
          {SEGMENTS.map((item) => (
            <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
              {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
            </button>
          ))}
        </div>
      </section>

      <section className="ct-mf-timeline">
        <h2>Periodens tidslinje</h2>

        <div className="ct-mf-period-strip">
          {visiblePeriodOptions.slice(0, 12).map((option, index) => {
            const key = optionKey(option, index);
            return (
              <button key={key} type="button" className={row2.periodKey === key ? "is-active" : ""} onClick={() => setRow2({ ...row2, periodKey: key })}>
                {optionLabel(option)}
              </button>
            );
          })}
        </div>

        <TimelineLane title="Rad 1 · nasjonal objekt/enhet" options={visiblePeriodOptions} selectedKey={row1.periodKey} onSelect={(key) => setRow1({ ...row1, periodKey: key })} />
        <TimelineLane title="Rad 2 · periodeverdi" options={visiblePeriodOptions} selectedKey={row2.periodKey} onSelect={(key) => setRow2({ ...row2, periodKey: key })} />
        <TimelineLane title="Rad 3 · periodeverdi" options={visiblePeriodOptions} selectedKey={row3.periodKey} onSelect={(key) => setRow3({ ...row3, periodKey: key })} />

        <div className="ct-mf-year-row">
          <h3>Årstall</h3>
          <div>
            {["1814", "1840", "1867", "1893", "1919", "1945", "1972", "1998", "2024"].map((year) => (
              <span key={year}>{year}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="ct-mf-dynamic">
        <article className="ct-mf-left-info">
          <small>Collectium</small>
          <h2>{segment === "samler" ? "Samler · periodeinformasjon" : segment === "historie" ? "Historie · periodeinformasjon" : "Finans · periodeinformasjon"}</h2>
          <p>Venstre felt er segmentstyrt oppsummering, ikke samme data som høyre valgt-node-felt.</p>

          <div className="ct-mf-info-grid">
            <div><span>Rad 1</span><strong>{NATIONAL_OBJECT_RELATIONS.find((item) => item.value === row1.relationType)?.label ?? row1.relationType}</strong></div>
            <div><span>Rad 1 periode</span><strong>{selectedRow1Option ? optionLabel(selectedRow1Option) : "Ikke valgt"}</strong></div>
            <div><span>Rad 2 periode</span><strong>{selectedRow2Option ? optionLabel(selectedRow2Option) : "Ikke valgt"}</strong></div>
            <div><span>Rad 3 periode</span><strong>{selectedRow3Option ? optionLabel(selectedRow3Option) : "Ikke valgt"}</strong></div>
            <div><span>Objekt</span><strong>{objectTypeLabel}</strong></div>
            <div><span>År</span><strong>{yearFrom}–{yearTo}</strong></div>
          </div>
        </article>

        <article className="ct-mf-selected-node">
          <h2>Valgt tidslinjeinnhold</h2>
          <p>Høyre felt viser valgt periodeboks og valgt radkobling.</p>

          <div className="ct-mf-node-card">
            <span>Rad 1 · valgt nasjonal enhet</span>
            <strong>{selectedRow1Option ? optionLabel(selectedRow1Option) : "Ikke valgt"}</strong>
            <p>{periodSummary(selectedRow1Option)}</p>

            <table>
              <tbody>
                <tr><th>Felt</th><th>Verdi</th></tr>
                <tr><td>Rad 1 type</td><td>{NATIONAL_OBJECT_RELATIONS.find((item) => item.value === row1.relationType)?.label ?? row1.relationType}</td></tr>
                <tr><td>Rad 2 periode</td><td>{selectedRow2Option ? optionLabel(selectedRow2Option) : "Ikke valgt"}</td></tr>
                <tr><td>Rad 3 periode</td><td>{selectedRow3Option ? optionLabel(selectedRow3Option) : "Ikke valgt"}</td></tr>
                <tr><td>Relasjon</td><td>{selectedRow1Option?.relation_href ? <a href={selectedRow1Option.relation_href}>{selectedRow1Option.relation_href}</a> : "Mangler"}</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="ct-mf-results">
        <div className="ct-mf-result-top">
          <div>
            <h2>Katalogresultat</h2>
            <p>{country} · {objectTypeLabel} · {yearFrom}–{yearTo} · {displayObjects.length} treff</p>
            {usingFallbackPreview ? <small>API returnerte ikke objekter. Viser kontrollkort for layout og koblingstest.</small> : null}
          </div>

          <div className="ct-mf-view-buttons">
            <span>Vis resultat som</span>
            {VIEW_MODES.map((item) => (
              <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
                {item === "liste" ? "Liste" : item === "horisontal" ? "Horisontal" : "Museum"}
              </button>
            ))}
          </div>
        </div>

        {catalogState.status === "error" ? (
          <div className="ct-mf-error">
            <strong>Katalog API feiler</strong>
            <span>{catalogState.error}</span>
            <code>{catalogState.url}</code>
          </div>
        ) : null}

        <div className={`ct-mf-card-grid ct-mf-card-grid-${view}`}>
          {displayObjects.map((item: any) => (
            <PreviewCard
              key={String(item.object_id)}
              item={{
                object_id: String(item.object_id ?? item.source_catalog_number ?? "api-object"),
                source_key: String(item.source_key ?? sourceKey),
                object_group: String(item.object_group ?? objectType),
                title: String(item.title ?? item.collectium_title_no ?? item.title_no ?? "Katalogobjekt"),
                subtitle: String(item.subtitle ?? `${item.denomination_raw_no ?? objectTypeLabel} · ${item.object_year_label ?? item.publication_year_label ?? ""}`),
                object_type_label: objectTypeLabel,
                year: String(item.object_year_label ?? item.publication_year_label ?? item.year ?? "Mangler"),
                period: String(item.ruler_name_raw_no ?? item.period ?? (selectedRow1Option ? optionLabel(selectedRow1Option) : "Mangler periode")),
                variant: String(item.variant_type_raw_no ?? item.variant ?? "Mangler variant"),
                segment_label: String(item.segment_label ?? `${objectTypeLabel} · ${objectType} · ${segment} · filtrert ${yearFrom}–${yearTo}`),
                category: String(item.category ?? "A/S"),
                heart_count: Number(item.heart_count ?? 0),
                star_count: Number(item.star_count ?? 0),
                auction_count: Number(item.auction_count ?? 0),
                shop_count: Number(item.shop_count ?? 0),
              }}
              view={view}
            />
          ))}
        </div>
      </section>

      <section className="ct-mf-debug">
        <h2>Svar til ChatGPT</h2>
        <pre>{JSON.stringify({
          masterfilter: {
            country,
            source_key: sourceKey,
            object_group: objectType,
            object_type_label: objectTypeLabel,
            year_from: yearFrom,
            year_to: yearTo,
          },
          rows: {
            row1,
            row2,
            row3,
          },
          period_options: {
            api_ok: periodOptionsState.ok,
            total: periodOptions.length,
            visible_in_year_range: visiblePeriodOptions.length,
          },
          segment,
          view,
          catalog: {
            ok: catalogState.ok,
            error: catalogState.error,
            url: catalogState.url,
            api_rows: apiObjects.length,
            using_fallback_preview: usingFallbackPreview,
          },
        }, null, 2)}</pre>
      </section>
    </main>
  );
}
