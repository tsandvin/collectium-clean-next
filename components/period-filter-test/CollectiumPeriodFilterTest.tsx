"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Formål:
 * Enkel og lesbar periodefilter-test.
 * Masterfilter styrer land, objekttype og år fra/til.
 * Hurtigvalg setter årstall og periode.
 * Rad 2 og Rad 3 viser bare perioder som passer valgt år fra/til.
 * Tidslinjen vises én gang og kan klikkes direkte.
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
type ObjectType = "banknote" | "coin" | "security" | "document" | "find";

type ApiState = {
  ok: boolean;
  status: "idle" | "loading" | "ok" | "error";
  url: string;
  data: any | null;
  error: string | null;
};

type PeriodOption = {
  period_slug?: string;
  option_key?: string;
  display_name_no?: string;
  option_label_no?: string;
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

const LINK_TYPES = [
  { value: "ruler", label: "Konge / regent" },
  { value: "signature_person", label: "Signatur / person" },
  { value: "motif_symbol", label: "Motiv / symbol" },
  { value: "issue_period", label: "Utgave / serie" },
  { value: "variant", label: "Variant / type" },
  { value: "denomination", label: "Valør" },
  { value: "producer", label: "Produsent / utsteder" },
  { value: "find_provenance", label: "Funn / proveniens" },
  { value: "market_index", label: "Marked / index" },
];

const QUICK_PRESETS = [
  {
    label: "1814–1905",
    yearFrom: "1814",
    yearTo: "1905",
    mainSlug: "unionen-sverige-norge",
    subSlug: "norges-bank-speciedaler",
  },
  {
    label: "1875–1914",
    yearFrom: "1875",
    yearTo: "1914",
    mainSlug: "krone-oreperioden",
    subSlug: "skandinavisk-myntunion-kroneinnforing",
  },
  {
    label: "1940–1945",
    yearFrom: "1940",
    yearTo: "1945",
    mainSlug: "andre-verdenskrig-okkupasjon",
    subSlug: "forste-verdenskrig-norge",
  },
  {
    label: "1905–2024",
    yearFrom: "1905",
    yearTo: "2024",
    mainSlug: "selvstendig-norge",
    subSlug: "oljealderen",
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
        error: `HTTP ${response.status}`,
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

function periodYearText(option: PeriodOption): string {
  const start = option.start_year_label ?? option.timeline_start_year ?? "?";
  const end = option.end_year_label ?? option.timeline_end_year ?? "nå";
  return `${start}–${end}`;
}

function periodSummary(option: PeriodOption | null): string {
  if (!option) return "Velg en periode fra tidslinjen.";
  return String(option.summary_short_no || option.collectium_relevance_no || "Periode fra Collectium perioderegister.");
}

function sourceForObjectType(value: ObjectType): string {
  return OBJECT_TYPE_OPTIONS.find((option) => option.value === value)?.sourceKey ?? "norske_sedler";
}

function labelForObjectType(value: ObjectType): string {
  return OBJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function linkTypeLabel(value: string): string {
  return LINK_TYPES.find((item) => item.value === value)?.label ?? value;
}

function findPeriodKey(options: PeriodOption[], slug: string): string {
  const found = options.find((option) => option.period_slug === slug || option.option_key === slug);
  if (!found) return options[0] ? optionKey(options[0], 0) : "";
  return optionKey(found, options.indexOf(found));
}

function fallbackObjects(objectType: ObjectType, objectTypeLabel: string, yearFrom: string, yearTo: string, segment: Segment): PreviewObject[] {
  const common = {
    object_type_label: objectTypeLabel,
  };

  if (objectType === "coin") {
    return [
      {
        ...common,
        object_id: "coin-preview-1875",
        source_key: "norske_mynter",
        object_group: "coin",
        title: "MYNT · Oscar II · 1875",
        subtitle: "Krone- og øreperioden · 1875",
        year: "1875",
        period: "Oscar II",
        variant: "Krone",
      },
      {
        ...common,
        object_id: "coin-preview-1905",
        source_key: "norske_mynter",
        object_group: "coin",
        title: "MYNT · Haakon VII · 1905",
        subtitle: "Selvstendig Norge · 1905",
        year: "1905",
        period: "Haakon VII",
        variant: "Krone",
      },
    ];
  }

  if (objectType === "security") {
    return [
      {
        ...common,
        object_id: "security-preview-1898",
        source_key: "verdibrev",
        object_group: "security",
        title: "VERDIBREV · Oscar II · 1898",
        subtitle: "Aksjebrev · industri · 1898",
        year: "1898",
        period: "Oscar II",
        variant: "Papir",
      },
      {
        ...common,
        object_id: "security-preview-1942",
        source_key: "verdibrev",
        object_group: "security",
        title: "VERDIBREV · Andre verdenskrig · 1942",
        subtitle: "Krigsobligasjon · 1942",
        year: "1942",
        period: "Andre verdenskrig",
        variant: "Obligasjon",
      },
    ];
  }

  return [
    {
      ...common,
      object_id: "banknote-preview-1898",
      source_key: "norske_sedler",
      object_group: "banknote",
      title: "SEDDEL · Oscar II · 1898",
      subtitle: "Norges Bank · utgave I · 1898",
      year: "1898",
      period: "Oscar II",
      variant: "Utgave I",
    },
    {
      ...common,
      object_id: "banknote-preview-1942",
      source_key: "norske_sedler",
      object_group: "banknote",
      title: "SEDDEL · Andre verdenskrig · 1942",
      subtitle: "Krigsøkonomi · okkupasjonstid",
      year: "1942",
      period: "Andre verdenskrig",
      variant: "Krigsperiode",
    },
  ].filter((item) => {
    const year = Number(item.year);
    return year >= Number(yearFrom || "0") && year <= Number(yearTo || "9999");
  });
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="ct-v6-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [country, setCountry] = useState("NO");
  const [objectType, setObjectType] = useState<ObjectType>("coin");
  const [yearFrom, setYearFrom] = useState("1814");
  const [yearTo, setYearTo] = useState("2024");
  const [segment, setSegment] = useState<Segment>("historie");
  const [view, setView] = useState<ViewMode>("horisontal");

  const [linkType, setLinkType] = useState("ruler");
  const [mainPeriodKey, setMainPeriodKey] = useState("");
  const [subPeriodKey, setSubPeriodKey] = useState("");

  const [periodOptionsState, setPeriodOptionsState] = useState<ApiState>(makeState("/api/filter/period/options"));
  const [catalogState, setCatalogState] = useState<ApiState>(makeState("/api/test/period-catalog"));

  const sourceKey = sourceForObjectType(objectType);
  const objectTypeLabel = labelForObjectType(objectType);

  useEffect(() => {
    async function loadPeriods() {
      setPeriodOptionsState({ ...makeState("/api/filter/period/options"), status: "loading" });
      const result = await fetchJson("/api/filter/period/options");
      setPeriodOptionsState(result);
    }

    loadPeriods();
  }, []);

  const allPeriods = useMemo(() => periodOptionsFrom(periodOptionsState.data), [periodOptionsState.data]);

  const visiblePeriods = useMemo(() => {
    return allPeriods
      .filter((option) => inYearRange(option, yearFrom, yearTo))
      .sort((a, b) => {
        const aSort = Number(a.timeline_sort_year ?? optionStart(a) ?? 0);
        const bSort = Number(b.timeline_sort_year ?? optionStart(b) ?? 0);
        return aSort - bSort || optionLabel(a).localeCompare(optionLabel(b), "nb");
      });
  }, [allPeriods, yearFrom, yearTo]);

  useEffect(() => {
    if (!visiblePeriods.length) {
      setMainPeriodKey("");
      setSubPeriodKey("");
      return;
    }

    const visibleKeys = new Set(visiblePeriods.map((option, index) => optionKey(option, index)));

    if (!mainPeriodKey || !visibleKeys.has(mainPeriodKey)) {
      setMainPeriodKey(optionKey(visiblePeriods[0], 0));
    }

    if (!subPeriodKey || !visibleKeys.has(subPeriodKey)) {
      setSubPeriodKey(optionKey(visiblePeriods[Math.min(1, visiblePeriods.length - 1)], Math.min(1, visiblePeriods.length - 1)));
    }
  }, [visiblePeriods, mainPeriodKey, subPeriodKey]);

  const selectedMainPeriod = visiblePeriods.find((option, index) => optionKey(option, index) === mainPeriodKey) ?? null;
  const selectedSubPeriod = visiblePeriods.find((option, index) => optionKey(option, index) === subPeriodKey) ?? null;

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
        national_link_type: linkType,
        main_period_key: mainPeriodKey,
        sub_period_key: subPeriodKey,
      });

      const url = `/api/test/period-catalog?${params.toString()}`;
      setCatalogState({ ...makeState(url), status: "loading" });

      const result = await fetchJson(url);
      setCatalogState(result);
    }

    loadCatalog();
  }, [country, objectType, sourceKey, segment, view, yearFrom, yearTo, linkType, mainPeriodKey, subPeriodKey]);

  const apiObjects = useMemo(() => {
    const rows = arrayFrom(catalogState.data?.rows);
    const objects = arrayFrom(catalogState.data?.objects);
    return rows.length ? rows : objects;
  }, [catalogState.data]);

  const cards = apiObjects.length
    ? apiObjects
    : fallbackObjects(objectType, objectTypeLabel, yearFrom, yearTo, segment);

  function applyPreset(preset: (typeof QUICK_PRESETS)[number]) {
    setYearFrom(preset.yearFrom);
    setYearTo(preset.yearTo);

    const nextVisible = allPeriods.filter((option) => inYearRange(option, preset.yearFrom, preset.yearTo));
    if (!nextVisible.length) return;

    setMainPeriodKey(findPeriodKey(nextVisible, preset.mainSlug));
    setSubPeriodKey(findPeriodKey(nextVisible, preset.subSlug));
  }

  return (
    <main className="ct-v6-page">
      <section className="ct-v6-hero">
        <p className="ct-eyebrow">Periodefilter · DB-test</p>
        <h1>Velg periode</h1>
        <p>Velg land, objekttype og år. Klikk deretter direkte i tidslinjen.</p>
      </section>

      <section className="ct-v6-status">
        <FieldValue label="Periodevalg" value={periodOptionsState.status === "ok" ? "OK" : periodOptionsState.status === "error" ? "Feil" : "Laster"} />
        <FieldValue label="Katalog" value={catalogState.status === "ok" ? "OK" : catalogState.status === "error" ? "Feil" : "Laster"} />
        <FieldValue label="Modell" value={`${country} · ${objectTypeLabel} · ${yearFrom}–${yearTo}`} />
      </section>

      <section className="ct-v6-panel">
        <div className="ct-v6-head">
          <div>
            <span>Steg 1</span>
            <h2>Masterfilter</h2>
          </div>
          <p>Disse feltene styrer hvilke perioder som vises.</p>
        </div>

        <div className="ct-v6-master">
          <label>
            <span>Land</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Type objekt</span>
            <select value={objectType} onChange={(event) => setObjectType(event.target.value as ObjectType)}>
              {OBJECT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>År fra</span>
            <input value={yearFrom} onChange={(event) => setYearFrom(event.target.value)} inputMode="numeric" />
          </label>

          <label>
            <span>År til</span>
            <input value={yearTo} onChange={(event) => setYearTo(event.target.value)} inputMode="numeric" />
          </label>
        </div>

        <div className="ct-v6-presets">
          <span>Hurtigvalg</span>
          {QUICK_PRESETS.map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="ct-v6-panel">
        <div className="ct-v6-head">
          <div>
            <span>Steg 2</span>
            <h2>Filterfelt</h2>
          </div>
          <p>Enkle felt. Tidslinjen under er hovedvalget.</p>
        </div>

        <div className="ct-v6-fields">
          <label>
            <span>Kobles mot</span>
            <select value={linkType} onChange={(event) => setLinkType(event.target.value)}>
              {LINK_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Hovedperiode</span>
            <select value={mainPeriodKey} onChange={(event) => setMainPeriodKey(event.target.value)}>
              {visiblePeriods.map((option, index) => (
                <option key={optionKey(option, index)} value={optionKey(option, index)}>
                  {optionLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Underperiode</span>
            <select value={subPeriodKey} onChange={(event) => setSubPeriodKey(event.target.value)}>
              {visiblePeriods.map((option, index) => (
                <option key={optionKey(option, index)} value={optionKey(option, index)}>
                  {optionLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="ct-v6-switches">
        {SEGMENTS.map((item) => (
          <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
            {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
          </button>
        ))}
      </section>

      <section className="ct-v6-panel">
        <div className="ct-v6-head">
          <div>
            <span>Steg 3</span>
            <h2>Tidslinje</h2>
          </div>
          <p>Klikk på en periode for å velge hovedperiode.</p>
        </div>

        <div className="ct-v6-timeline">
          {visiblePeriods.map((option, index) => {
            const key = optionKey(option, index);

            return (
              <button key={key} type="button" className={mainPeriodKey === key ? "is-active" : ""} onClick={() => setMainPeriodKey(key)}>
                <strong>{optionLabel(option)}</strong>
                <span>{periodYearText(option)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ct-v6-two">
        <article className="ct-v6-panel">
          <div className="ct-v6-head">
            <div>
              <span>Valg</span>
              <h2>{segment === "samler" ? "Samler" : segment === "historie" ? "Historie" : "Finans"}</h2>
            </div>
          </div>

          <div className="ct-v6-info">
            <FieldValue label="Kobling" value={linkTypeLabel(linkType)} />
            <FieldValue label="Hovedperiode" value={selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ikke valgt"} />
            <FieldValue label="Underperiode" value={selectedSubPeriod ? optionLabel(selectedSubPeriod) : "Ikke valgt"} />
            <FieldValue label="Objekt" value={objectTypeLabel} />
            <FieldValue label="År" value={`${yearFrom}–${yearTo}`} />
            <FieldValue label="Visning" value={view} />
          </div>
        </article>

        <article className="ct-v6-panel">
          <div className="ct-v6-head">
            <div>
              <span>Valgt periode</span>
              <h2>{selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ingen periode"}</h2>
            </div>
            <p>{selectedMainPeriod ? periodYearText(selectedMainPeriod) : "Velg i tidslinjen."}</p>
          </div>

          <p className="ct-v6-summary">{periodSummary(selectedMainPeriod)}</p>
          <a className="ct-v6-relation" href={selectedMainPeriod?.relation_href || "#"}>
            {selectedMainPeriod?.relation_href || "Relasjon mangler"}
          </a>
        </article>
      </section>

      <section className="ct-v6-panel">
        <div className="ct-v6-result-head">
          <div>
            <span>Steg 4</span>
            <h2>Katalogresultat</h2>
            <p>{country} · {objectTypeLabel} · {yearFrom}–{yearTo} · {cards.length} treff</p>
          </div>

          <div className="ct-v6-view">
            {VIEW_MODES.map((item) => (
              <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
                {item === "liste" ? "Liste" : item === "horisontal" ? "Horisontal" : "Museum"}
              </button>
            ))}
          </div>
        </div>

        {catalogState.status === "error" ? (
          <details className="ct-v6-error">
            <summary>Katalog API feiler. Viser kontrollkort.</summary>
            <code>{catalogState.url}</code>
          </details>
        ) : null}

        <div className={`ct-v6-cards ct-v6-cards-${view}`}>
          {cards.map((item: any) => (
            <article className="ct-v6-card" key={String(item.object_id)}>
              <div className="ct-v6-card-symbol">{String(item.category ?? "C")}</div>
              <div>
                <strong>{String(item.title ?? item.collectium_title_no ?? "Katalogobjekt")}</strong>
                <span>{String(item.subtitle ?? item.denomination_raw_no ?? "")}</span>
                <div className="ct-v6-card-fields">
                  <FieldValue label="Objekttype" value={String(item.object_type_label ?? objectTypeLabel)} />
                  <FieldValue label="Årstall" value={String(item.year ?? item.object_year_label ?? item.publication_year_label ?? "Mangler")} />
                  <FieldValue label="Periode" value={String(item.period ?? item.ruler_name_raw_no ?? "Mangler")} />
                  <FieldValue label="Variant" value={String(item.variant ?? item.variant_type_raw_no ?? "Mangler")} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-v6-debug">
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
          flow: {
            link_type: linkType,
            main_period_key: mainPeriodKey,
            sub_period_key: subPeriodKey,
          },
          period_options: {
            api_ok: periodOptionsState.ok,
            total: allPeriods.length,
            visible: visiblePeriods.length,
          },
          segment,
          view,
          catalog: {
            ok: catalogState.ok,
            error: catalogState.error,
            url: catalogState.url,
            api_rows: apiObjects.length,
            using_fallback_preview: !apiObjects.length,
          },
        }, null, 2)}</pre>
      </section>
    </main>
  );
}
