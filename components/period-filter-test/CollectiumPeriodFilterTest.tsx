"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Definering / formål:
 * Forenklet testside for Masterfilter + periodefilter.
 * Masterfilter velger land, objekttype og år fra/til.
 * Rad 1 velger nasjonal koblingstype.
 * Rad 2 velger hovedperiode fra ct_v_period_filter_options.
 * Rad 3 velger underperiode/relasjonsperiode fra ct_v_period_filter_options.
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
  { value: "banknote", label: "Sedler", sourceKey: "norske_sedler" },
  { value: "coin", label: "Mynter", sourceKey: "norske_mynter" },
  { value: "security", label: "Verdibrev", sourceKey: "verdibrev" },
  { value: "document", label: "Dokumenter", sourceKey: "dokument" },
  { value: "find", label: "Funn", sourceKey: "norark" },
];

const NATIONAL_LINK_TYPES = [
  { value: "ruler", label: "Konge / regent" },
  { value: "signature_person", label: "Signatur / person" },
  { value: "motif_symbol", label: "Motiv / symbol" },
  { value: "issue_period", label: "Utgave / serie" },
  { value: "variant", label: "Variant / type" },
  { value: "denomination", label: "Valør" },
  { value: "producer", label: "Produsent / utsteder" },
  { value: "material", label: "Materiale" },
  { value: "find_provenance", label: "Funn / proveniens" },
  { value: "market_index", label: "Marked / index" },
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

function relationLabel(value: string): string {
  return NATIONAL_LINK_TYPES.find((item) => item.value === value)?.label ?? value;
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

function buildPreviewObjects(objectType: ObjectType, objectTypeLabel: string, yearFrom: string, yearTo: string, segment: Segment): PreviewObject[] {
  if (objectType === "banknote") {
    return [
      {
        object_id: "banknote-preview-1898",
        source_key: "norske_sedler",
        object_group: "banknote",
        title: "SEDDEL · Oscar II · 1898",
        subtitle: "Norges Bank · utgave I · 1898",
        object_type_label: objectTypeLabel,
        year: "1898",
        period: "Oscar II",
        variant: "Utgave I",
        segment_label: `${objectTypeLabel} · banknote · ${segment} · filtrert ${yearFrom}–${yearTo}`,
        category: "NB",
        heart_count: 0,
        star_count: 0,
        auction_count: 1,
        shop_count: 0,
      },
      {
        object_id: "banknote-preview-1910",
        source_key: "norske_sedler",
        object_group: "banknote",
        title: "SEDDEL · Haakon VII · 1910",
        subtitle: "Norges Bank · unions-/selvstendighetskontekst",
        object_type_label: objectTypeLabel,
        year: "1910",
        period: "Haakon VII",
        variant: "Tidlig moderne",
        segment_label: `${objectTypeLabel} · banknote · ${segment} · filtrert ${yearFrom}–${yearTo}`,
        category: "NB",
        heart_count: 0,
        star_count: 0,
        auction_count: 1,
        shop_count: 0,
      },
      {
        object_id: "banknote-preview-1942",
        source_key: "norske_sedler",
        object_group: "banknote",
        title: "SEDDEL · Andre verdenskrig · 1942",
        subtitle: "Krigsøkonomi · okkupasjonstid",
        object_type_label: objectTypeLabel,
        year: "1942",
        period: "Andre verdenskrig",
        variant: "Krigsperiode",
        segment_label: `${objectTypeLabel} · banknote · ${segment} · filtrert ${yearFrom}–${yearTo}`,
        category: "NB",
        heart_count: 0,
        star_count: 0,
        auction_count: 1,
        shop_count: 0,
      },
      {
        object_id: "banknote-preview-1986",
        source_key: "norske_sedler",
        object_group: "banknote",
        title: "SEDDEL · Olav V · 1986",
        subtitle: "Moderne seddelserie · oljealder",
        object_type_label: objectTypeLabel,
        year: "1986",
        period: "Olav V",
        variant: "Moderne serie",
        segment_label: `${objectTypeLabel} · banknote · ${segment} · filtrert ${yearFrom}–${yearTo}`,
        category: "NB",
        heart_count: 0,
        star_count: 0,
        auction_count: 1,
        shop_count: 0,
      },
    ];
  }

  if (objectType === "security") {
    return [
      {
        object_id: "security-preview-1898",
        source_key: "verdibrev",
        object_group: "security",
        title: "VERDIBREV · Oscar II · 1898",
        subtitle: "Aksjebrev · industri · 1898",
        object_type_label: objectTypeLabel,
        year: "1898",
        period: "Oscar II",
        variant: "Papir",
        segment_label: `${objectTypeLabel} · security · ${segment} · filtrert ${yearFrom}–${yearTo}`,
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
        object_type_label: objectTypeLabel,
        year: "1910",
        period: "Haakon VII",
        variant: "Papir",
        segment_label: `${objectTypeLabel} · security · ${segment} · filtrert ${yearFrom}–${yearTo}`,
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
        object_type_label: objectTypeLabel,
        year: "1942",
        period: "Andre verdenskrig",
        variant: "Obligasjon",
        segment_label: `${objectTypeLabel} · security · ${segment} · filtrert ${yearFrom}–${yearTo}`,
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
        object_type_label: objectTypeLabel,
        year: "1986",
        period: "Olav V",
        variant: "Olje",
        segment_label: `${objectTypeLabel} · security · ${segment} · filtrert ${yearFrom}–${yearTo}`,
        category: "A/S",
        heart_count: 0,
        star_count: 0,
        auction_count: 1,
        shop_count: 0,
      },
    ];
  }

  return [
    {
      object_id: `${objectType}-preview-1905`,
      source_key: sourceForObjectType(objectType),
      object_group: objectType,
      title: `${objectTypeLabel.toUpperCase()} · Haakon VII · 1905`,
      subtitle: `${objectTypeLabel} · eksempelobjekt · 1905`,
      object_type_label: objectTypeLabel,
      year: "1905",
      period: "Haakon VII",
      variant: "Eksempel",
      segment_label: `${objectTypeLabel} · ${objectType} · ${segment} · filtrert ${yearFrom}–${yearTo}`,
      category: "C",
      heart_count: 0,
      star_count: 0,
      auction_count: 0,
      shop_count: 0,
    },
  ];
}

function SimpleFilterRows({
  nationalLinkType,
  setNationalLinkType,
  mainPeriodKey,
  setMainPeriodKey,
  subPeriodKey,
  setSubPeriodKey,
  periodOptions,
}: {
  nationalLinkType: string;
  setNationalLinkType: (value: string) => void;
  mainPeriodKey: string;
  setMainPeriodKey: (value: string) => void;
  subPeriodKey: string;
  setSubPeriodKey: (value: string) => void;
  periodOptions: PeriodOption[];
}) {
  return (
    <section className="ct-mf-simple-rows">
      <article>
        <span>Rad 1 · Nasjonal kobling</span>
        <strong>Hva skal perioden kobles mot?</strong>
        <select value={nationalLinkType} onChange={(event) => setNationalLinkType(event.target.value)}>
          {NATIONAL_LINK_TYPES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <p>Koblingstype. Ikke en ekstra tidslinje.</p>
      </article>

      <article>
        <span>Rad 2 · Hovedperiode</span>
        <strong>Velg hovedperiode</strong>
        <select value={mainPeriodKey} onChange={(event) => setMainPeriodKey(event.target.value)}>
          {periodOptions.map((option, index) => (
            <option key={optionKey(option, index)} value={optionKey(option, index)}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
        <p>Velger hovedperioden som tidslinjen og resultatet skal vektlegge.</p>
      </article>

      <article>
        <span>Rad 3 · Underperiode / relasjon</span>
        <strong>Velg presisering</strong>
        <select value={subPeriodKey} onChange={(event) => setSubPeriodKey(event.target.value)}>
          {periodOptions.map((option, index) => (
            <option key={optionKey(option, index)} value={optionKey(option, index)}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
        <p>Brukes til å presisere relasjon, hendelse, utgave eller kontekst.</p>
      </article>
    </section>
  );
}

function Timeline({
  options,
  selectedKey,
  onSelect,
}: {
  options: PeriodOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <section className="ct-mf-timeline">
      <h2>Periodens tidslinje</h2>
      <p>Alle 40 perioder er tilgjengelige fra API. Her vises perioder som passer valgt år fra/til.</p>

      <div className="ct-mf-one-timeline">
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
    </section>
  );
}

function PreviewCard({ item }: { item: PreviewObject }) {
  return (
    <article className="ct-mf-card">
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
  const [objectType, setObjectType] = useState<ObjectType>("banknote");
  const [yearFrom, setYearFrom] = useState("1814");
  const [yearTo, setYearTo] = useState("2024");
  const [segment, setSegment] = useState<Segment>("historie");
  const [view, setView] = useState<ViewMode>("horisontal");

  const [nationalLinkType, setNationalLinkType] = useState("ruler");
  const [mainPeriodKey, setMainPeriodKey] = useState("");
  const [subPeriodKey, setSubPeriodKey] = useState("");

  const [periodOptionsState, setPeriodOptionsState] = useState<ApiState>(makeState("/api/filter/period/options"));
  const [catalogState, setCatalogState] = useState<ApiState>(makeState("/api/test/period-catalog"));

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

  const periodOptions = useMemo(() => periodOptionsFrom(periodOptionsState.data), [periodOptionsState.data]);

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

    const svenskUnion = periodOptions.find((option) => option.period_slug === "svensk-union") ?? periodOptions[0];
    const selvstendig = periodOptions.find((option) => option.period_slug === "selvstendig-norge") ?? periodOptions[0];

    setMainPeriodKey((current) => current || optionKey(svenskUnion, periodOptions.indexOf(svenskUnion)));
    setSubPeriodKey((current) => current || optionKey(selvstendig, periodOptions.indexOf(selvstendig)));
  }, [periodOptions]);

  const selectedMainPeriod = periodOptions.find((option, index) => optionKey(option, index) === mainPeriodKey) ?? null;
  const selectedSubPeriod = periodOptions.find((option, index) => optionKey(option, index) === subPeriodKey) ?? null;

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
        national_link_type: nationalLinkType,
        main_period_key: mainPeriodKey,
        sub_period_key: subPeriodKey,
      });

      const url = `/api/test/period-catalog?${params.toString()}`;
      setCatalogState({ ...makeState(url), status: "loading" });

      const result = await fetchJson(url);
      setCatalogState(result);
    }

    loadCatalog();
  }, [country, objectType, sourceKey, segment, view, yearFrom, yearTo, nationalLinkType, mainPeriodKey, subPeriodKey]);

  const apiObjects = useMemo(() => {
    const rows = arrayFrom(catalogState.data?.rows);
    const objects = arrayFrom(catalogState.data?.objects);
    return rows.length ? rows : objects;
  }, [catalogState.data]);

  const fallbackObjects = useMemo(() => {
    const from = Number(yearFrom || "0");
    const to = Number(yearTo || "9999");

    return buildPreviewObjects(objectType, objectTypeLabel, yearFrom, yearTo, segment).filter((item) => {
      const year = Number(item.year);
      return year >= from && year <= to;
    });
  }, [objectType, objectTypeLabel, yearFrom, yearTo, segment]);

  const displayObjects = apiObjects.length ? apiObjects : fallbackObjects;
  const usingFallbackPreview = !apiObjects.length;

  return (
    <main className="ct-mf-page">
      <section className="ct-mf-hero">
        <p className="ct-eyebrow">Periodefilter · DB-test</p>
        <h1>Masterfilter</h1>
        <p>Enkel filterflyt: grunnvalg → nasjonal kobling → hovedperiode → underperiode → resultat.</p>
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

      <SimpleFilterRows
        nationalLinkType={nationalLinkType}
        setNationalLinkType={setNationalLinkType}
        mainPeriodKey={mainPeriodKey}
        setMainPeriodKey={setMainPeriodKey}
        subPeriodKey={subPeriodKey}
        setSubPeriodKey={setSubPeriodKey}
        periodOptions={periodOptions}
      />

      <section className="ct-mf-switches">
        <div>
          {SEGMENTS.map((item) => (
            <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
              {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
            </button>
          ))}
        </div>
      </section>

      <Timeline options={visiblePeriodOptions} selectedKey={mainPeriodKey} onSelect={setMainPeriodKey} />

      <section className="ct-mf-dynamic">
        <article className="ct-mf-left-info">
          <small>Collectium</small>
          <h2>{segment === "samler" ? "Samler" : segment === "historie" ? "Historie" : "Finans"} · filterforklaring</h2>
          <p>Dette feltet forklarer hva aktiv filterflyt betyr for valgt segment.</p>

          <div className="ct-mf-info-grid">
            <div><span>Nasjonal kobling</span><strong>{relationLabel(nationalLinkType)}</strong></div>
            <div><span>Hovedperiode</span><strong>{selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ikke valgt"}</strong></div>
            <div><span>Underperiode</span><strong>{selectedSubPeriod ? optionLabel(selectedSubPeriod) : "Ikke valgt"}</strong></div>
            <div><span>Objekt</span><strong>{objectTypeLabel}</strong></div>
            <div><span>År</span><strong>{yearFrom}–{yearTo}</strong></div>
            <div><span>Resultatmodus</span><strong>{view}</strong></div>
          </div>
        </article>

        <article className="ct-mf-selected-node">
          <h2>Valgt periode</h2>
          <p>Høyre felt viser valgt hovedperiode fra tidslinjen.</p>

          <div className="ct-mf-node-card">
            <span>Hovedperiode</span>
            <strong>{selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ikke valgt"}</strong>
            <p>{periodSummary(selectedMainPeriod)}</p>

            <table>
              <tbody>
                <tr><th>Felt</th><th>Verdi</th></tr>
                <tr><td>Kobling</td><td>{relationLabel(nationalLinkType)}</td></tr>
                <tr><td>Underperiode</td><td>{selectedSubPeriod ? optionLabel(selectedSubPeriod) : "Ikke valgt"}</td></tr>
                <tr><td>Relasjon</td><td>{selectedMainPeriod?.relation_href ? <a href={selectedMainPeriod.relation_href}>{selectedMainPeriod.relation_href}</a> : "Mangler"}</td></tr>
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
                period: String(item.ruler_name_raw_no ?? item.period ?? (selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Mangler periode")),
                variant: String(item.variant_type_raw_no ?? item.variant ?? "Mangler variant"),
                segment_label: String(item.segment_label ?? `${objectTypeLabel} · ${objectType} · ${segment} · filtrert ${yearFrom}–${yearTo}`),
                category: String(item.category ?? "C"),
                heart_count: Number(item.heart_count ?? 0),
                star_count: Number(item.star_count ?? 0),
                auction_count: Number(item.auction_count ?? 0),
                shop_count: Number(item.shop_count ?? 0),
              }}
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
          simple_flow: {
            row1_national_link_type: nationalLinkType,
            row2_main_period_key: mainPeriodKey,
            row3_sub_period_key: subPeriodKey,
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
