/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodTimelineClient
 *
 * Definering / formål:
 * React-klientkomponent som viser Tidslinjeperiode som horisontal tidslinje med årsskala, lanes/spor,
 * periodeblokker, tabellvisning og valgt node-panel.
 *
 * Bruksområde:
 * Brukes av /test/Periodetidslinje for å teste periodevisning, tidslag, relasjoner og segmentert informasjon.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_period_filter_registry_active
 * - ct_catalog_period_relations
 * - ct_v_catalog_period_relations
 * - ct_sn_period_relation
 * - ct_sn_period_relation_links
 * - ct_sn_period_type_registry
 * - ct_v_period_filter_find_relations
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js route handler -> React client component -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: render_horizontal_timeline
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-CLIENT-0002 / CHANGE-2026-06-19-0002
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumPeriodTimelineClient.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type DisplayMode = "timeline" | "table";
type WindowPreset = "modern" | "all";

type PeriodTimelineRow = {
  period_slug: string | null;
  display_name_no: string | null;
  period_type_key: string | null;
  period_type_label_no: string | null;
  period_level: number | null;
  parent_period_slug: string | null;
  start_year: number | null;
  end_year: number | null;
  summary_short_no: string | null;
  collectium_relevance_no: string | null;
  relation_href: string | null;
  object_count: number | null;
  relation_count: number | null;
  timeline_group: string | null;
};

type PeriodTimelineSummary = {
  totalPeriods: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  relationTypeCount: number;
  periodsWithRelationHref: number;
  periodsWithObjectRelation: number | null;
};

type PeriodTimelineResponse = {
  ok: boolean;
  source: string;
  title: string;
  rows: PeriodTimelineRow[];
  summary: PeriodTimelineSummary;
  relationTypes: string[];
  warnings: string[];
  error?: string;
};

type LaneKey = "rulers" | "national" | "people" | "events" | "objects";

type Lane = {
  key: LaneKey;
  label: string;
  hint: string;
  rows: PeriodTimelineRow[];
};

const CURRENT_YEAR = 2024;
const DEFAULT_START = 1814;
const DEFAULT_END = 2024;

const SEGMENTS: Array<{ key: SegmentKey; label: string }> = [
  { key: "samler", label: "Samler" },
  { key: "historie", label: "Historie" },
  { key: "finans", label: "Finans" },
];

function safeName(row: PeriodTimelineRow) {
  return row.display_name_no || row.period_slug || "Uten navn";
}

function resolvedEndYear(row: PeriodTimelineRow) {
  return row.end_year ?? CURRENT_YEAR;
}

function yearLabel(startYear: number | null, endYear: number | null) {
  if (startYear == null && endYear == null) return "Udatert";
  if (startYear != null && endYear == null) return `${startYear}–`;
  if (startYear == null && endYear != null) return `–${endYear}`;
  if (startYear === endYear) return String(startYear);
  return `${startYear}–${endYear}`;
}

function formatPeriodType(row: PeriodTimelineRow) {
  return row.period_type_label_no || row.period_type_key || "Ukjent type";
}

function laneFor(row: PeriodTimelineRow): LaneKey {
  const type = row.period_type_key || "";
  const label = `${row.period_type_label_no || ""} ${row.timeline_group || ""}`.toLowerCase();

  if (type.includes("ruler") || type.includes("regent") || label.includes("regent") || label.includes("konge")) {
    return "rulers";
  }

  if (type.includes("person") || type.includes("signature") || label.includes("person") || label.includes("signatur")) {
    return "people";
  }

  if (
    type === "war_period" ||
    type === "conflict_period" ||
    type === "health_period" ||
    label.includes("krig") ||
    label.includes("konflikt") ||
    label.includes("sykdom") ||
    label.includes("hendelse")
  ) {
    return "events";
  }

  if (
    type === "monetary_period" ||
    type === "banknote_issue_period" ||
    type === "economic_period" ||
    label.includes("penge") ||
    label.includes("seddel") ||
    label.includes("økonom") ||
    label.includes("okonom")
  ) {
    return "objects";
  }

  return "national";
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function periodPosition(row: PeriodTimelineRow, minYear: number, maxYear: number) {
  if (row.start_year == null) {
    return { left: 0, width: 8, isEvent: true };
  }

  const span = Math.max(1, maxYear - minYear);
  const start = Math.max(minYear, row.start_year);
  const end = Math.min(maxYear, resolvedEndYear(row));
  const isEvent = resolvedEndYear(row) === row.start_year;
  const left = clampPercent(((start - minYear) / span) * 100);
  const rawWidth = clampPercent(((Math.max(end, start) - start) / span) * 100);

  return {
    left,
    width: isEvent ? 1.2 : Math.max(5, rawWidth),
    isEvent,
  };
}

function overlapsWindow(row: PeriodTimelineRow, minYear: number, maxYear: number) {
  if (row.start_year == null) return true;
  const end = resolvedEndYear(row);
  return row.start_year <= maxYear && end >= minYear;
}

function chooseInitialRow(rows: PeriodTimelineRow[]) {
  return (
    rows.find((row) => row.period_slug === "svensk-union") ||
    rows.find((row) => row.period_slug === "selvstendig-norge") ||
    rows.find((row) => row.start_year != null && row.start_year >= DEFAULT_START) ||
    rows[0] ||
    null
  );
}

function makeTicks(minYear: number, maxYear: number) {
  const span = Math.max(1, maxYear - minYear);
  const step = span <= 100 ? 10 : span <= 260 ? 25 : span <= 800 ? 100 : 500;
  const first = Math.ceil(minYear / step) * step;
  const ticks: number[] = [minYear];

  for (let year = first; year < maxYear; year += step) {
    if (year > minYear) ticks.push(year);
  }

  if (!ticks.includes(maxYear)) ticks.push(maxYear);
  return ticks;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ukjent feil";
}

function renderSegmentContent(segment: SegmentKey, selected: PeriodTimelineRow | null) {
  if (!selected) {
    return <p>Velg en tidslinjeblokk for å se valgt node med kort bio, nøkkelinformasjon og referanse.</p>;
  }

  if (segment === "samler") {
    return (
      <div className={styles.segmentGrid}>
        <Info label="Periode" value={safeName(selected)} />
        <Info label="Objektkoblinger" value={selected.object_count == null ? "Ikke tilgjengelig i API" : `${selected.object_count} objekter`} />
        <Info label="Collectium-relevans" value={selected.collectium_relevance_no || "Ikke registrert"} />
        <Info label="Samlerstatus" value="Kan kobles til hjerte, stjerne og min samling når objektdata finnes" />
      </div>
    );
  }

  if (segment === "historie") {
    return (
      <div className={styles.segmentGrid}>
        <Info label="Type" value={formatPeriodType(selected)} />
        <Info label="Tidsrom" value={yearLabel(selected.start_year, selected.end_year)} />
        <Info label="Forelder" value={selected.parent_period_slug || "Ingen forelder registrert"} />
        <Info label="Relasjon" value={selected.relation_href || "Mangler relation_href"} />
        <Info label="Beskrivelse" value={selected.summary_short_no || "Mangler historisk beskrivelse"} wide />
      </div>
    );
  }

  return (
    <div className={styles.segmentGrid}>
      <Info label="Finanskontekst" value={selected.period_type_key?.includes("economic") || selected.period_type_key?.includes("monetary") ? "Relevant økonomisk/periodekobling" : "Ikke vurdert"} />
      <Info label="Markedsverdi" value="Mangler markedsverdi" />
      <Info label="Trend" value="Ikke beregnet trend" />
      <Info label="Indexkobling" value="Kan kobles senere til index/performance-data" wide />
    </div>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? `${styles.infoItem} ${styles.infoItemWide}` : styles.infoItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CollectiumPeriodTimelineClient() {
  const [data, setData] = useState<PeriodTimelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [segment, setSegment] = useState<SegmentKey>("samler");
  const [mode, setMode] = useState<DisplayMode>("timeline");
  const [preset, setPreset] = useState<WindowPreset>("modern");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/test/period-timeline", { cache: "no-store" });
        const json = (await response.json()) as PeriodTimelineResponse;

        if (!response.ok || !json.ok) {
          throw new Error(json.error || "API svarte ikke OK");
        }

        if (!ignore) {
          setData(json);
          setSelectedSlug(chooseInitialRow(json.rows)?.period_slug || null);
        }
      } catch (loadError) {
        if (!ignore) setError(getErrorMessage(loadError));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const allRows = data?.rows || [];

  const dataWindow = useMemo(() => {
    const years = allRows.flatMap((row) => [row.start_year, resolvedEndYear(row)]).filter((year): year is number => year != null);
    if (!years.length) return { min: DEFAULT_START, max: DEFAULT_END };
    return { min: Math.min(...years), max: Math.max(...years, DEFAULT_END) };
  }, [allRows]);

  const windowRange = useMemo(() => {
    if (preset === "all") return dataWindow;
    return { min: DEFAULT_START, max: DEFAULT_END };
  }, [dataWindow, preset]);

  const visibleRows = useMemo(
    () => allRows.filter((row) => overlapsWindow(row, windowRange.min, windowRange.max)).sort((a, b) => (a.start_year ?? 999999) - (b.start_year ?? 999999)),
    [allRows, windowRange],
  );

  const lanes: Lane[] = useMemo(() => {
    const initial: Lane[] = [
      { key: "rulers", label: "Konger / regenter", hint: "Regent/person-data kommer når API har egne relation detail rows.", rows: [] },
      { key: "national", label: "Nasjonale perioder", hint: "Hovedperioder, unioner og overordnet historie.", rows: [] },
      { key: "people", label: "Signatur / person", hint: "Person- og signaturspor når API returnerer dette som tidsrader.", rows: [] },
      { key: "events", label: "Historiske hendelser", hint: "Krig, konflikt, sykdom og konkrete hendelsesperioder.", rows: [] },
      { key: "objects", label: "Penge- / seddel- / objektperioder", hint: "Pengeperioder, seddelserier og økonomisk kontekst.", rows: [] },
    ];

    for (const row of visibleRows) {
      const lane = initial.find((item) => item.key === laneFor(row));
      lane?.rows.push(row);
    }

    return initial;
  }, [visibleRows]);

  const selected = useMemo(() => {
    return allRows.find((row) => row.period_slug === selectedSlug) || chooseInitialRow(allRows);
  }, [allRows, selectedSlug]);

  const ticks = useMemo(() => makeTicks(windowRange.min, windowRange.max), [windowRange]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>Henter tidslinjeperioder fra Neon/API...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.errorState}>Tidslinjeperiode kunne ikke lastes: {error}</div>
      </main>
    );
  }

  if (!data || !allRows.length) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>Ingen perioder returnert fra API.</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium UI/UX 8.6 · periode og relasjon</p>
          <h1 className={styles.title}>Tidslinjeperiode</h1>
          <p className={styles.subtitle}>Utforsk perioder, regenter, historiske hendelser og objektrelasjoner over tid.</p>
        </div>

        <div className={styles.toolbar} aria-label="Tidslinjekontroller">
          <button className={styles.toolbarButton} type="button" onClick={() => setPreset("all")}>Zoom ut</button>
          <button className={styles.toolbarButton} type="button" onClick={() => setPreset("modern")}>Zoom inn</button>
          <button className={styles.toolbarButton} type="button" onClick={() => setPreset(preset === "modern" ? "all" : "modern")}>100 år</button>
          <button className={styles.toolbarButton} type="button" onClick={() => setPreset("modern")}>Gå til år</button>
          <button className={mode === "timeline" ? `${styles.toolbarButton} ${styles.toolbarButtonActive}` : styles.toolbarButton} type="button" onClick={() => setMode("timeline")}>Tidslinje</button>
          <button className={mode === "table" ? `${styles.toolbarButton} ${styles.toolbarButtonActive}` : styles.toolbarButton} type="button" onClick={() => setMode("table")}>Tabell</button>
        </div>
      </section>

      <section className={styles.statusGrid} aria-label="Tidslinjestatus">
        <Info label="Perioder" value={`${data.summary.totalPeriods}`} />
        <Info label="Nivå 1 / 2 / 3" value={`${data.summary.level1Count} / ${data.summary.level2Count} / ${data.summary.level3Count}`} />
        <Info label="Relasjonstyper" value={`${data.summary.relationTypeCount}`} />
        <Info label="Datakilde" value={data.source} />
      </section>

      {mode === "timeline" ? (
        <section className={styles.timelinePanel} aria-label="Horisontal tidslinje">
          <div className={styles.timelineHeader}>
            <strong>Periodens tidslinje</strong>
            <span>{windowRange.min}–{windowRange.max}</span>
          </div>

          <div className={styles.yearScale}>
            {ticks.map((tick) => (
              <span key={tick} className={styles.yearTick} style={{ left: `${clampPercent(((tick - windowRange.min) / Math.max(1, windowRange.max - windowRange.min)) * 100)}%` }}>
                {tick}
              </span>
            ))}
          </div>

          <div className={styles.timelineGrid}>
            {ticks.map((tick) => (
              <span key={`grid-${tick}`} className={styles.gridLine} style={{ left: `${clampPercent(((tick - windowRange.min) / Math.max(1, windowRange.max - windowRange.min)) * 100)}%` }} />
            ))}

            {lanes.map((lane) => (
              <div className={styles.lane} key={lane.key}>
                <div className={styles.laneLabel}>
                  <strong>{lane.label}</strong>
                  <span>{lane.hint}</span>
                </div>
                <div className={styles.laneTrack}>
                  {lane.rows.length ? (
                    lane.rows.map((row) => {
                      const pos = periodPosition(row, windowRange.min, windowRange.max);
                      const active = selected?.period_slug === row.period_slug;
                      return (
                        <button
                          className={active ? `${styles.periodBlock} ${styles.periodBlockActive}` : styles.periodBlock}
                          type="button"
                          key={`${lane.key}-${row.period_slug || safeName(row)}`}
                          style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                          onClick={() => setSelectedSlug(row.period_slug)}
                          title={`${safeName(row)} · ${yearLabel(row.start_year, row.end_year)}`}
                        >
                          <span>{safeName(row)}</span>
                          <small>{yearLabel(row.start_year, row.end_year)}</small>
                        </button>
                      );
                    })
                  ) : (
                    <span className={styles.laneEmpty}>Ingen rader i API for dette sporet.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.tablePanel}>
          <table className={styles.periodTable}>
            <thead>
              <tr>
                <th>Navn</th>
                <th>Type</th>
                <th>Nivå</th>
                <th>Fra</th>
                <th>Til</th>
                <th>Forelder</th>
                <th>Relasjon</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.period_slug || safeName(row)}>
                  <td>{safeName(row)}</td>
                  <td>{formatPeriodType(row)}</td>
                  <td>{row.period_level ?? "–"}</td>
                  <td>{row.start_year ?? "–"}</td>
                  <td>{row.end_year ?? "–"}</td>
                  <td>{row.parent_period_slug || "–"}</td>
                  <td>{row.relation_href || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className={styles.detailPanel}>
        <div className={styles.detailHero}>
          <div className={styles.detailBadge}>Valgt periode</div>
          <h2>{selected ? safeName(selected) : "Ingen valgt periode"}</h2>
          <p>{selected ? yearLabel(selected.start_year, selected.end_year) : "Velg en periode i tidslinjen"}</p>
        </div>
        <div className={styles.detailGrid}>
          <Info label="Type" value={selected ? formatPeriodType(selected) : "–"} />
          <Info label="Nivå" value={selected?.period_level == null ? "–" : `${selected.period_level}`} />
          <Info label="Forelder" value={selected?.parent_period_slug || "Ingen"} />
          <Info label="Relation href" value={selected?.relation_href || "Mangler"} />
        </div>

        <div className={styles.segmentTabs} role="tablist" aria-label="Segmenter">
          {SEGMENTS.map((item) => (
            <button
              className={segment === item.key ? `${styles.segmentButton} ${styles.segmentButtonActive}` : styles.segmentButton}
              type="button"
              key={item.key}
              onClick={() => setSegment(item.key)}
              aria-pressed={segment === item.key}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.segmentBody}>{renderSegmentContent(segment, selected)}</div>
      </section>

      <section className={styles.navigator} aria-label="Tidsnavigator">
        <span>{dataWindow.min}</span>
        <div className={styles.navigatorTrack}>
          <span
            className={styles.navigatorWindow}
            style={{
              left: `${clampPercent(((windowRange.min - dataWindow.min) / Math.max(1, dataWindow.max - dataWindow.min)) * 100)}%`,
              width: `${clampPercent(((windowRange.max - windowRange.min) / Math.max(1, dataWindow.max - dataWindow.min)) * 100)}%`,
            }}
          />
        </div>
        <span>{dataWindow.max}</span>
      </section>

      {data.warnings.length ? <p className={styles.warningText}>API-varsel: {data.warnings.join(" · ")}</p> : null}
    </main>
  );
}
