"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest
 *
 * Formål:
 * Lesbar periodefilter-test med riktig skall, Rad 1/Rad 2/Rad 3,
 * år fra/til og én enkel klikkbar tidslinje.
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
  if (!option) return "Velg en periode i tidslinjen.";
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

function fallbackObjects(objectType: ObjectType, objectTypeLabel: string, yearFrom: string, yearTo: string): PreviewObject[] {
  const from = Number(yearFrom || "0");
  const to = Number(yearTo || "9999");

  const all: PreviewObject[] =
    objectType === "coin"
      ? [
          {
            object_id: "coin-preview-1875",
            source_key: "norske_mynter",
            object_group: "coin",
            title: "MYNT · Oscar II · 1875",
            subtitle: "Krone- og øreperioden · 1875",
            object_type_label: objectTypeLabel,
            year: "1875",
            period: "Oscar II",
            variant: "Krone",
          },
          {
            object_id: "coin-preview-1905",
            source_key: "norske_mynter",
            object_group: "coin",
            title: "MYNT · Haakon VII · 1905",
            subtitle: "Selvstendig Norge · 1905",
            object_type_label: objectTypeLabel,
            year: "1905",
            period: "Haakon VII",
            variant: "Krone",
          },
        ]
      : objectType === "security"
        ? [
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
            },
          ]
        : [
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
            },
          ];

  return all.filter((item) => {
    const year = Number(item.year);
    return year >= from && year <= to;
  });
}

function SmallValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="ct-v7-small-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function CollectiumPeriodFilterTest() {
  const [country, setCountry] = useState("NO");
  const [objectType, setObjectType] = useState<ObjectType>("banknote");
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
      const secondIndex = Math.min(1, visiblePeriods.length - 1);
      setSubPeriodKey(optionKey(visiblePeriods[secondIndex], secondIndex));
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
        row1_link_type: linkType,
        row2_main_period_key: mainPeriodKey,
        row3_sub_period_key: subPeriodKey,
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

  const cards = apiObjects.length ? apiObjects : fallbackObjects(objectType, objectTypeLabel, yearFrom, yearTo);

  return (
    <main className="ct-v7-shell">
      <section className="ct-v7-hero">
        <p>Periodefilter · DB-test</p>
        <h1>Periodefilter</h1>
        <span>Masterfilter → Rad 1 → Rad 2 → Rad 3 → tidslinje → resultat</span>
      </section>

      <section className="ct-v7-status">
        <SmallValue label="Periodevalg" value={periodOptionsState.status === "ok" ? "OK" : periodOptionsState.status === "error" ? "Feil" : "Laster"} />
        <SmallValue label="Katalog" value={catalogState.status === "ok" ? "OK" : catalogState.status === "error" ? "Feil" : "Laster"} />
        <SmallValue label="Modell" value={`${country} · ${objectTypeLabel} · ${yearFrom}–${yearTo}`} />
      </section>

      <section className="ct-v7-panel">
        <div className="ct-v7-head">
          <div>
            <span>Masterfilter</span>
            <h2>Grunnvalg</h2>
          </div>
          <p>År fra og år til styrer hvilke perioder som kan velges i Rad 2, Rad 3 og tidslinjen.</p>
        </div>

        <div className="ct-v7-master-grid">
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
      </section>

      <section className="ct-v7-rad-grid">
        <article className="ct-v7-panel ct-v7-rad">
          <span>Rad 1 · Nasjonal kobling</span>
          <h2>Kobles mot</h2>
          <select value={linkType} onChange={(event) => setLinkType(event.target.value)}>
            {LINK_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <p>Velger hvilken type relasjon perioden skal kobles mot.</p>
        </article>

        <article className="ct-v7-panel ct-v7-rad">
          <span>Rad 2 · Hovedperiode</span>
          <h2>Hovedperiode</h2>
          <select value={mainPeriodKey} onChange={(event) => setMainPeriodKey(event.target.value)}>
            {visiblePeriods.map((option, index) => (
              <option key={optionKey(option, index)} value={optionKey(option, index)}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
          <p>{selectedMainPeriod ? periodYearText(selectedMainPeriod) : "Ingen periode i valgt årsområde."}</p>
        </article>

        <article className="ct-v7-panel ct-v7-rad">
          <span>Rad 3 · Underperiode / relasjon</span>
          <h2>Underperiode</h2>
          <select value={subPeriodKey} onChange={(event) => setSubPeriodKey(event.target.value)}>
            {visiblePeriods.map((option, index) => (
              <option key={optionKey(option, index)} value={optionKey(option, index)}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
          <p>{selectedSubPeriod ? periodYearText(selectedSubPeriod) : "Ingen periode i valgt årsområde."}</p>
        </article>
      </section>

      <section className="ct-v7-switches">
        {SEGMENTS.map((item) => (
          <button key={item} type="button" className={segment === item ? "is-active" : ""} onClick={() => setSegment(item)}>
            {item === "samler" ? "Samler" : item === "historie" ? "Historie" : "Finans"}
          </button>
        ))}
      </section>

      <section className="ct-v7-panel">
        <div className="ct-v7-head">
          <div>
            <span>Tidslinje</span>
            <h2>Velg periode</h2>
          </div>
          <p>Kun perioder innenfor {yearFrom}–{yearTo} vises. Klikk på et kort for å sette Rad 2.</p>
        </div>

        <div className="ct-v7-timeline">
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

      <section className="ct-v7-two">
        <article className="ct-v7-panel">
          <div className="ct-v7-head">
            <div>
              <span>Valg</span>
              <h2>{segment === "samler" ? "Samler" : segment === "historie" ? "Historie" : "Finans"}</h2>
            </div>
          </div>

          <div className="ct-v7-info-grid">
            <SmallValue label="Rad 1" value={linkTypeLabel(linkType)} />
            <SmallValue label="Rad 2" value={selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ikke valgt"} />
            <SmallValue label="Rad 3" value={selectedSubPeriod ? optionLabel(selectedSubPeriod) : "Ikke valgt"} />
            <SmallValue label="Objekt" value={objectTypeLabel} />
            <SmallValue label="År" value={`${yearFrom}–${yearTo}`} />
            <SmallValue label="Visning" value={view} />
          </div>
        </article>

        <article className="ct-v7-panel">
          <div className="ct-v7-head">
            <div>
              <span>Valgt periode</span>
              <h2>{selectedMainPeriod ? optionLabel(selectedMainPeriod) : "Ingen periode"}</h2>
            </div>
            <p>{selectedMainPeriod ? periodYearText(selectedMainPeriod) : "Velg i tidslinjen."}</p>
          </div>

          <p className="ct-v7-summary">{periodSummary(selectedMainPeriod)}</p>
          <a className="ct-v7-link" href={selectedMainPeriod?.relation_href || "#"}>
            {selectedMainPeriod?.relation_href || "Relasjon mangler"}
          </a>
        </article>
      </section>

      <section className="ct-v7-panel">
        <div className="ct-v7-result-head">
          <div>
            <span>Resultat</span>
            <h2>Katalogresultat</h2>
            <p>{country} · {objectTypeLabel} · {yearFrom}–{yearTo} · {cards.length} treff</p>
          </div>

          <div className="ct-v7-view">
            {VIEW_MODES.map((item) => (
              <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
                {item === "liste" ? "Liste" : item === "horisontal" ? "Horisontal" : "Museum"}
              </button>
            ))}
          </div>
        </div>

        {catalogState.status === "error" ? (
          <details className="ct-v7-error">
            <summary>Katalog API feiler. Viser kontrollkort.</summary>
            <code>{catalogState.url}</code>
          </details>
        ) : null}

        <div className={`ct-v7-cards ct-v7-cards-${view}`}>
          {cards.map((item: any) => (
            <article className="ct-v7-card" key={String(item.object_id)}>
              <div className="ct-v7-card-symbol">{String(item.category ?? "C")}</div>
              <div className="ct-v7-card-body">
                <strong>{String(item.title ?? item.collectium_title_no ?? "Katalogobjekt")}</strong>
                <span>{String(item.subtitle ?? item.denomination_raw_no ?? "")}</span>
                <div className="ct-v7-card-fields">
                  <SmallValue label="Objekttype" value={String(item.object_type_label ?? objectTypeLabel)} />
                  <SmallValue label="Årstall" value={String(item.year ?? item.object_year_label ?? item.publication_year_label ?? "Mangler")} />
                  <SmallValue label="Periode" value={String(item.period ?? item.ruler_name_raw_no ?? "Mangler")} />
                  <SmallValue label="Variant" value={String(item.variant ?? item.variant_type_raw_no ?? "Mangler")} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-v7-debug">
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
            rad1_link_type: linkType,
            rad2_main_period_key: mainPeriodKey,
            rad3_sub_period_key: subPeriodKey,
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
