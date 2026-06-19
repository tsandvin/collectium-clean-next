/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodTimelineClient
 *
 * Definering / formål:
 * React client component for Tidslinjeperiode. Viser Masterfilter over innholdet,
 * fire periode-rader som samsvarer med tidslinjen, horisontal tidslinje med lanes,
 * dynamisk felt for valgt tidslinjenode, Samler/Historie/Finans-felt og katalogtreff.
 *
 * Bruksområde:
 * Brukes av /test/Periodetidslinje og alias /test/period-timeline.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 * - /test/period-timeline
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_catalog_period_relations når tilgjengelig
 * - ct_v_object_presentation_resolved når tilgjengelig
 *
 * Dataretning:
 * Neon -> API route -> React -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: interact
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-V4
 */

"use client";

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  GitBranchIcon,
  GlobeIcon,
  CheckCircleIcon,
  BookOpenIcon,
  TagIcon,
  CalendarIcon,
  LayersIcon,
  ShieldIcon,
} from "@/components/templates/ui85/CollectiumUi85Icons";
import styles from "./CollectiumPeriodTimelineClient.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type ViewMode = "timeline" | "table";
type CardLayout = "horizontal" | "standing" | "list" | "museum";

type PeriodRow = {
  period_slug: string;
  display_name_no: string;
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

type CatalogHit = {
  object_id: number | string | null;
  source_key: string | null;
  object_group: string | null;
  title_no: string | null;
  source_catalog_number: string | null;
  denomination_raw_no: string | null;
  object_year_label: string | null;
  publication_year_label: string | null;
  denomination_issue_raw_no: string | null;
  variant_type_raw_no: string | null;
  relation_href?: string | null;
};

type TimelineResponse = {
  ok: boolean;
  source: string;
  title: string;
  rows: PeriodRow[];
  summary: Record<string, number | string | null>;
  relationTypes: string[];
  catalogRows?: CatalogHit[];
  warnings: string[];
  error?: string;
};

type Filters = {
  country: string;
  objectType: string;
  yearFrom: number;
  yearTo: number;
  row1: string;
  row2: string;
  row3: string;
  row4: string;
};

const CURRENT_YEAR = 2024;
const DEFAULT_FILTERS: Filters = {
  country: "Norge",
  objectType: "Verdibrev",
  yearFrom: 1814,
  yearTo: 2024,
  row1: "",
  row2: "",
  row3: "",
  row4: "",
};

const SEGMENT_LABELS: Record<SegmentKey, string> = {
  samler: "Samler",
  historie: "Historie",
  finans: "Finans",
};

function normalizeEndYear(period: PeriodRow): number | null {
  if (typeof period.end_year === "number") return period.end_year;
  if (typeof period.start_year === "number") return CURRENT_YEAR;
  return null;
}

function overlapsWindow(period: PeriodRow, from: number, to: number): boolean {
  if (typeof period.start_year !== "number") return false;
  const end = normalizeEndYear(period) ?? period.start_year;
  return period.start_year <= to && end >= from;
}

function sortPeriods(a: PeriodRow, b: PeriodRow): number {
  const aStart = a.start_year ?? Number.MAX_SAFE_INTEGER;
  const bStart = b.start_year ?? Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) return aStart - bStart;
  const aEnd = normalizeEndYear(a) ?? Number.MAX_SAFE_INTEGER;
  const bEnd = normalizeEndYear(b) ?? Number.MAX_SAFE_INTEGER;
  if (aEnd !== bEnd) return aEnd - bEnd;
  return a.display_name_no.localeCompare(b.display_name_no, "nb");
}

function laneForPeriod(period: PeriodRow): string {
  const key = period.period_type_key ?? "";
  if (key === "regent_period" || key === "dynasty_period") return "Konger / regenter";
  if (key === "union_period" || key === "historical_main_period") return "Nasjonale perioder";
  if (key === "war_period" || key === "conflict_period" || key === "health_period") return "Historiske hendelser";
  if (key === "monetary_period" || key === "banknote_issue_period" || key === "coin_issue_period" || key === "object_issue_period" || key === "economic_period") return "Penge / objektperioder";
  return period.timeline_group || period.period_type_label_no || "Andre perioder";
}

function formatPeriodYears(period: PeriodRow): string {
  if (typeof period.start_year !== "number") return "Ukjent";
  if (period.end_year === null || typeof period.end_year === "undefined") return `${period.start_year}–`;
  if (period.end_year === period.start_year) return `${period.start_year}`;
  return `${period.start_year}–${period.end_year}`;
}

function buildQuery(filters: Filters, selectedPeriod: PeriodRow | null): string {
  const params = new URLSearchParams();
  params.set("country", filters.country);
  params.set("object_type", filters.objectType);
  params.set("year_from", String(filters.yearFrom));
  params.set("year_to", String(filters.yearTo));
  const selectedSlug = selectedPeriod?.period_slug || filters.row4 || filters.row3 || filters.row2 || filters.row1;
  if (selectedSlug) params.set("period_slug", selectedSlug);
  return params.toString();
}

function optionLabel(period: PeriodRow): string {
  return `${period.display_name_no} · ${formatPeriodYears(period)}`;
}

function selectedSlugs(filters: Filters): string[] {
  return [filters.row1, filters.row2, filters.row3, filters.row4].filter(Boolean);
}

/* UI 8.5 Dynamic Card Helper Components */

function DynamicBanknote({ isBanknote = false, list = false, title = "" }: { isBanknote?: boolean; list?: boolean; title?: string }) {
  if (isBanknote) {
    return (
      <div className={`${styles.cardBanknote} ${list ? styles.cardBanknoteList : ""}`} aria-label="Objektbilde">
        <img src="/100_kroner_1877.jpg" alt={title} className={styles.cardBanknoteImg} />
      </div>
    );
  }
  return (
    <div className={`${styles.cardBanknote} ${list ? styles.cardBanknoteList : ""}`} aria-label="Objektbilde">
      <strong>100</strong>
      <div className={styles.cardPortrait} />
      <div className={styles.cardBanknoteLine} />
      <span>Norges Bank</span>
    </div>
  );
}

function DynamicActionButtons({ hit }: { hit: CatalogHit }) {
  const detailHref = `/objekt/${hit.source_key || "unknown"}/${hit.object_group || "unknown"}/${hit.object_id || "unknown"}`;
  return (
    <div className={styles.cardActionButtonsRow} aria-label="Kortkommandoer">
      <Link href={detailHref} className={styles.cardBtnAction}>
        <span className={styles.cardBtnActionIcon}><ExternalLinkIcon /></span>
        <span>Åpne objekt</span>
      </Link>
      <Link href={hit.relation_href || "/katalog/kontroll"} className={styles.cardBtnAction}>
        <span className={styles.cardBtnActionIcon}><GitBranchIcon /></span>
        <span>Se relasjon</span>
      </Link>
      <Link href="/min-side" className={styles.cardBtnAction}>
        <span className={styles.cardBtnActionIcon}><GlobeIcon /></span>
        <span>Legg i samling</span>
      </Link>
      <button type="button" className={styles.cardBtnActionMore} aria-label="Flere valg">
        <span>...</span>
      </button>
    </div>
  );
}

function DynamicActionPanel({ listMode = false, compact = false }: { listMode?: boolean; compact?: boolean }) {
  const badges = [
    { label: "Hjerte", meta: "Ønskeliste", count: "0" },
    { label: "Stjerne", meta: "Favoritt", count: "0" },
    { label: "Auksjon", meta: "Aktive treff", count: "3" },
    { label: "Nettbutikk", meta: "Aktive salg", count: "1" },
  ];
  return (
    <div className={`${styles.cardActionPanel} ${listMode ? styles.cardActionPanelList : ""} ${compact ? styles.cardActionPanelCompact : ""}`} aria-label="Objekthandlinger">
      {badges.map((badge) => (
        <button className={`${styles.cardAction} ${listMode ? styles.actionList : ""} ${compact ? styles.cardActionCompact : ""}`} key={badge.label} type="button">
          {compact || listMode ? (
            <b>{badge.label}</b>
          ) : (
            <span>
              <b>{badge.label}</b>
              <small>{badge.meta}</small>
            </span>
          )}
          <em>{badge.count}</em>
        </button>
      ))}
    </div>
  );
}

function DynamicPriceBox({ listMode = false, compact = false }: { listMode?: boolean; compact?: boolean }) {
  return (
    <section className={`${styles.cardPriceBox} ${listMode ? styles.cardPriceBoxList : ""} ${compact ? styles.cardPriceBoxCompact : ""}`} aria-label="Estimert pris">
      <span>Estimert pris</span>
      <strong>15 000 kr</strong>
      <small>
        <span className={styles.cardCheckIcon}><CheckCircleIcon /></span>
        <span>Vurdert</span>
      </small>
    </section>
  );
}

function DynamicFacts({ hit, compact = false }: { hit: CatalogHit; compact?: boolean }) {
  const hitFacts = [
    { label: "Valørutgave", value: hit.denomination_raw_no || "100 kroner", icon: TagIcon },
    { label: "Utgave", value: hit.denomination_issue_raw_no || "1. utgave", icon: CalendarIcon },
    { label: "Variant", value: hit.variant_type_raw_no || "Standardutgave", icon: LayersIcon },
    { label: "Sjeldenhet", value: "Sjelden", icon: ShieldIcon },
  ];
  const rows = compact ? hitFacts.slice(0, 4) : hitFacts;
  return (
    <dl className={styles.cardFactGrid}>
      {rows.map((fact) => {
        const IconComponent = fact.icon;
        return (
          <div key={fact.label} className={styles.cardFactItem}>
            <dt>
              <span className={styles.cardSpecIcon}><IconComponent /></span>
              <span>{fact.label}</span>
            </dt>
            <dd>{fact.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function DynamicHistoryPanel({ hit, showActions = false }: { hit: CatalogHit; showActions?: boolean }) {
  return (
    <section className={styles.cardHistoryPanel} aria-label="Historic dynamisk felt">
      <div className={styles.cardHistoryHeader}>
        <span className={styles.cardBookIcon} aria-hidden="true"><BookOpenIcon /></span>
        <strong>Historie</strong>
        <small>· dynamisk felt</small>
      </div>
      <dl className={styles.cardHistoryGrid}>
        <div className={styles.cardHistoryItem}>
          <dt>Regent / konge</dt>
          <dd>Oscar II</dd>
        </div>
        <div className={styles.cardHistoryItem}>
          <dt>Motiv / person</dt>
          <dd>Riksvåpen</dd>
        </div>
        <div className={styles.cardHistoryItem}>
          <dt>Periode</dt>
          <dd>1872-1905</dd>
        </div>
        <div className={styles.cardHistoryItem}>
          <dt>Historisk kontekst</dt>
          <dd>Unionstid, norsk seddelhistorie</dd>
        </div>
        <div className={styles.cardHistoryItem}>
          <dt>Signatur</dt>
          <dd>Winge / Getz</dd>
        </div>
        <div className={styles.cardHistoryItem}>
          <dt>Kort forklaring</dt>
          <dd>Objektet kobles til regent, signatur og motiv som egne relasjoner.</dd>
        </div>
      </dl>
      {showActions && (
        <div className={styles.cardHistoryActions}>
          <DynamicActionButtons hit={hit} />
        </div>
      )}
    </section>
  );
}

function HorizontalCard({ hit }: { hit: CatalogHit }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85HorizontalCard}`}>
      <div className={styles.cardMainContentFlow}>
        <div className={styles.cardTopSection}>
          <div className={styles.cardMediaContainer}>
            <DynamicBanknote isBanknote={isBanknote} title={title} />
          </div>
          <div className={styles.cardInfoContainer}>
            <h2>{title}</h2>
            <DynamicFacts hit={hit} />
            <p className={styles.cardMeta}>{hit.source_key || "Seddel"} · Norske sedler · Oscar II · NS 1459</p>
          </div>
        </div>
        <div className={styles.cardBottomSection}>
          <DynamicHistoryPanel hit={hit} showActions />
        </div>
      </div>
      <aside className={styles.cardSideColumn}>
        <DynamicActionPanel />
        <DynamicPriceBox />
      </aside>
    </article>
  );
}

function StandingCard({ hit }: { hit: CatalogHit }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85StandingCard}`}>
      <DynamicBanknote isBanknote={isBanknote} title={title} />
      <h2>{title}</h2>
      <DynamicFacts hit={hit} compact />
      <p className={styles.cardMeta}>{hit.source_key || "Seddel"} · Norske sedler · Oscar II · NS 1459</p>
      <div className={styles.cardStandingDetails}>
        <div className={styles.cardStandingLeftColumn}>
          <DynamicHistoryPanel hit={hit} />
        </div>
        <div className={styles.cardStandingRightColumn}>
          <DynamicActionPanel compact />
          <DynamicPriceBox compact />
        </div>
      </div>
      <div className={styles.cardStandingBottomActions}>
        <DynamicActionButtons hit={hit} />
      </div>
    </article>
  );
}

function MuseumCard({ hit }: { hit: CatalogHit }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85MuseumCard}`}>
      <div className={styles.cardMuseumLeft}>
        <DynamicBanknote isBanknote={isBanknote} title={title} />
      </div>
      <div className={styles.cardMuseumRight}>
        <h2>Museum · {title}</h2>
        <DynamicHistoryPanel hit={hit} />
        <div className={styles.cardMuseumActions}>
          <DynamicActionButtons hit={hit} />
        </div>
      </div>
    </article>
  );
}

function ListCard({ hit }: { hit: CatalogHit }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85ListCard}`}>
      <div className={styles.cardListMedia}>
        <DynamicBanknote isBanknote={isBanknote} title={title} list />
      </div>
      <div className={styles.cardListInfo}>
        <h2>{title}</h2>
        <div className={styles.cardListSpecs}>
          <div>
            <span>Valørutgave</span>
            <strong>{hit.denomination_raw_no || "100 kroner"}</strong>
          </div>
          <div>
            <span>Utgave</span>
            <strong>{hit.denomination_issue_raw_no || "1. utgave"}</strong>
          </div>
          <div>
            <span>Variant</span>
            <strong>{hit.variant_type_raw_no || "Standardutgave"}</strong>
          </div>
          <div>
            <span>Sjeldenhet</span>
            <strong>Sjelden</strong>
          </div>
        </div>
        <p className={styles.cardMeta}>{hit.source_key || "Seddel"} · Norske sedler · Oscar II · NS 1459</p>
      </div>
      <div className={styles.cardListActions}>
        <DynamicActionButtons hit={hit} />
      </div>
      <div className={styles.cardListBadges}>
        <DynamicActionPanel compact />
      </div>
      <div className={styles.cardListPrice}>
        <DynamicPriceBox compact />
      </div>
    </article>
  );
}

export function CollectiumPeriodTimelineClient() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodRow | null>(null);
  const [segment, setSegment] = useState<SegmentKey>("samler");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [cardLayout, setCardLayout] = useState<CardLayout>("horizontal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (nextFilters = filters, nextSelected = selectedPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/test/period-timeline?${buildQuery(nextFilters, nextSelected)}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as TimelineResponse;
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Kunne ikke hente periodetidslinje.");
      }
      setData(json);
      const rows = json.rows || [];
      const currentSlug = nextSelected?.period_slug || nextFilters.row4 || nextFilters.row3 || nextFilters.row2 || nextFilters.row1;
      const current = rows.find((row) => row.period_slug === currentSlug) || rows.find((row) => row.period_slug === "svensk-union") || rows.find((row) => overlapsWindow(row, nextFilters.yearFrom, nextFilters.yearTo)) || rows[0] || null;
      setSelectedPeriod(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(DEFAULT_FILTERS, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.rows || [];

  const periodOptions = useMemo(() => {
    return rows.filter((period) => overlapsWindow(period, filters.yearFrom, filters.yearTo)).sort(sortPeriods);
  }, [rows, filters.yearFrom, filters.yearTo]);

  const optionsByRow = useMemo(() => {
    return {
      row1: periodOptions.filter((period) => laneForPeriod(period) === "Nasjonale perioder"),
      row2: periodOptions.filter((period) => laneForPeriod(period) === "Historiske hendelser"),
      row3: periodOptions.filter((period) => laneForPeriod(period) === "Penge / objektperioder"),
      row4: periodOptions,
    };
  }, [periodOptions]);

  const timelineWindow = useMemo(() => {
    return {
      start: filters.yearFrom,
      end: Math.max(filters.yearTo, filters.yearFrom + 1),
      span: Math.max(filters.yearTo - filters.yearFrom, 1),
    };
  }, [filters.yearFrom, filters.yearTo]);

  const visibleTimelineRows = useMemo(() => {
    return rows.filter((period) => overlapsWindow(period, timelineWindow.start, timelineWindow.end)).sort(sortPeriods);
  }, [rows, timelineWindow.start, timelineWindow.end]);

  const lanes = useMemo(() => {
    const laneOrder = ["Konger / regenter", "Nasjonale perioder", "Historiske hendelser", "Penge / objektperioder", "Andre perioder"];
    const grouped = new Map<string, PeriodRow[]>();
    for (const row of visibleTimelineRows) {
      const lane = laneForPeriod(row);
      grouped.set(lane, [...(grouped.get(lane) || []), row]);
    }
    return laneOrder
      .filter((lane) => grouped.has(lane))
      .map((lane) => ({ label: lane, rows: grouped.get(lane) || [] }));
  }, [visibleTimelineRows]);

  const yearTicks = useMemo(() => {
    const span = timelineWindow.span;
    const step = span <= 50 ? 10 : span <= 125 ? 25 : 50;
    const ticks: number[] = [];
    const first = Math.ceil(timelineWindow.start / step) * step;
    ticks.push(timelineWindow.start);
    for (let year = first; year < timelineWindow.end; year += step) {
      if (year > timelineWindow.start) ticks.push(year);
    }
    ticks.push(timelineWindow.end);
    return Array.from(new Set(ticks));
  }, [timelineWindow]);

  const catalogRows = data?.catalogRows || [];

  function updateFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    if (merged.yearTo < merged.yearFrom) {
      merged.yearTo = merged.yearFrom;
    }
    setFilters(merged);
  }

  function applyFilters() {
    void fetchData(filters, selectedPeriod);
  }

  function handlePeriodRowChange(rowKey: keyof Pick<Filters, "row1" | "row2" | "row3" | "row4">, slug: string) {
    const next = { ...filters, [rowKey]: slug };
    const period = rows.find((item) => item.period_slug === slug) || null;
    if (period) {
      next.row4 = period.period_slug;
      const lane = laneForPeriod(period);
      if (lane === "Nasjonale perioder") {
        next.row1 = period.period_slug;
      } else if (lane === "Historiske hendelser") {
        next.row2 = period.period_slug;
      } else if (lane === "Penge / objektperioder") {
        next.row3 = period.period_slug;
      }
    } else {
      if (rowKey === "row4") {
        setSelectedPeriod(null);
      } else {
        if (selectedPeriod) {
          const lane = laneForPeriod(selectedPeriod);
          const clearedLane =
            rowKey === "row1" ? "Nasjonale perioder" :
            rowKey === "row2" ? "Historiske hendelser" :
            rowKey === "row3" ? "Penge / objektperioder" : "";
          if (lane === clearedLane) {
            next.row4 = "";
            setSelectedPeriod(null);
          }
        }
      }
    }
    setFilters(next);
    setSelectedPeriod(period);
    void fetchData(next, period);
  }

  function handleTimelineSelect(period: PeriodRow) {
    setSelectedPeriod(period);
    const next = { ...filters, row4: period.period_slug };
    const lane = laneForPeriod(period);
    if (lane === "Nasjonale perioder") {
      next.row1 = period.period_slug;
    } else if (lane === "Historiske hendelser") {
      next.row2 = period.period_slug;
    } else if (lane === "Penge / objektperioder") {
      next.row3 = period.period_slug;
    }
    setFilters(next);
    void fetchData(next, period);
  }

  function zoom(multiplier: number) {
    const center = Math.round((filters.yearFrom + filters.yearTo) / 2);
    const currentSpan = Math.max(filters.yearTo - filters.yearFrom, 10);
    const nextSpan = Math.max(10, Math.round(currentSpan * multiplier));
    const nextFilters = {
      ...filters,
      yearFrom: center - Math.round(nextSpan / 2),
      yearTo: center + Math.round(nextSpan / 2),
    };
    setFilters(nextFilters);
    void fetchData(nextFilters, selectedPeriod);
  }

  function setWindowSize(years: number) {
    const start = selectedPeriod?.start_year ?? filters.yearFrom;
    const nextFilters = { ...filters, yearFrom: start, yearTo: start + years };
    setFilters(nextFilters);
    void fetchData(nextFilters, selectedPeriod);
  }

  if (loading && !data) {
    return <div className={styles.loadingState}>Laster Tidslinjeperiode fra Neon/API…</div>;
  }

  if (error && !data) {
    return <div className={styles.errorState}>Feil: {error}</div>;
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium UI/UX 8.6 · tidslinje</p>
          <h1 className={styles.title}>Tidslinjeperiode</h1>
          <p className={styles.subtitle}>Masterfilter, perioderader, tidslinjevalg og katalogtreff bygget fra Neon/API.</p>
        </div>
        <div className={styles.heroStatus}>
          <span>Datakilde</span>
          <strong>{data?.source || "Neon/API"}</strong>
        </div>
      </section>

      <section className={styles.masterFilter} aria-label="Masterfilter">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Masterfilter</p>
            <h2>Filter over tidslinjeinnhold</h2>
          </div>
          <button className={styles.primaryButton} type="button" onClick={applyFilters}>Oppdater</button>
        </div>

        <div className={styles.masterGrid}>
          <label className={styles.field}>
            <span>Land</span>
            <select value={filters.country} onChange={(event) => updateFilters({ country: event.target.value })}>
              <option value="Norge">Norge</option>
              <option value="Skandinavia">Skandinavia</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Type objekt</span>
            <select value={filters.objectType} onChange={(event) => updateFilters({ objectType: event.target.value })}>
              <option value="Verdibrev">Verdibrev</option>
              <option value="banknote">Sedler</option>
              <option value="coin">Mynter</option>
              <option value="document">Dokumenter</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>År fra</span>
            <input type="number" value={filters.yearFrom} onChange={(event) => updateFilters({ yearFrom: Number(event.target.value) })} />
          </label>

          <label className={styles.field}>
            <span>År til</span>
            <input type="number" value={filters.yearTo} onChange={(event) => updateFilters({ yearTo: Number(event.target.value) })} />
          </label>
        </div>

        <div className={styles.periodRows}>
          <label className={`${styles.periodField} ${styles.row1}`}>
            <span>Rad 1 · hovedperiode</span>
            <select value={filters.row1} onChange={(event) => handlePeriodRowChange("row1", event.target.value)}>
              <option value="">Velg hovedperiode innen {filters.yearFrom}–{filters.yearTo}</option>
              {optionsByRow.row1.map((period) => <option key={period.period_slug} value={period.period_slug}>{optionLabel(period)}</option>)}
            </select>
            <small className={styles.helperText}>Filtrerer overordnede tidsepoker</small>
          </label>

          <label className={`${styles.periodField} ${styles.row2}`}>
            <span>Rad 2 · tematisk periode</span>
            <select value={filters.row2} onChange={(event) => handlePeriodRowChange("row2", event.target.value)}>
              <option value="">Velg tematisk periode</option>
              {optionsByRow.row2.map((period) => <option key={period.period_slug} value={period.period_slug}>{optionLabel(period)}</option>)}
            </select>
            <small className={styles.helperText}>Historiske, kulturelle eller krigsperioder</small>
          </label>

          <label className={`${styles.periodField} ${styles.row3}`}>
            <span>Rad 3 · objektperiode</span>
            <select value={filters.row3} onChange={(event) => handlePeriodRowChange("row3", event.target.value)}>
              <option value="">Velg objektperiode</option>
              {optionsByRow.row3.map((period) => <option key={period.period_slug} value={period.period_slug}>{optionLabel(period)}</option>)}
            </select>
            <small className={styles.helperText}>Spesifikke penge- og myntutgaver</small>
          </label>

          <label className={`${styles.periodField} ${styles.row4}`}>
            <span>Rad 4 · aktiv tidslinjenode</span>
            <select value={filters.row4} onChange={(event) => handlePeriodRowChange("row4", event.target.value)}>
              <option value="">Velg node fra aktiv tidslinje</option>
              {optionsByRow.row4.map((period) => <option key={period.period_slug} value={period.period_slug}>{optionLabel(period)}</option>)}
            </select>
            <small className={styles.helperText}>Valgt node i det visuelle tidslinjesporet</small>
          </label>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.timelineToolbar}>
          <div>
            <p className={styles.eyebrow}>Periodens tidslinje</p>
            <h2>{filters.yearFrom}–{filters.yearTo}</h2>
          </div>
          <div className={styles.toolbarButtons}>
            <button type="button" onClick={() => zoom(1.4)}>Zoom ut</button>
            <button type="button" onClick={() => zoom(0.7)}>Zoom inn</button>
            <button type="button" onClick={() => setWindowSize(100)}>100 år</button>
            <button className={viewMode === "timeline" ? styles.toolbarButtonActive : ""} type="button" onClick={() => setViewMode("timeline")}>Tidslinje</button>
            <button className={viewMode === "table" ? styles.toolbarButtonActive : ""} type="button" onClick={() => setViewMode("table")}>Tabell</button>
          </div>
        </div>

        {viewMode === "timeline" ? (
          <div className={styles.timelineShell}>
            <div className={styles.yearScale}>
              {yearTicks.map((year) => {
                const left = ((year - timelineWindow.start) / timelineWindow.span) * 100;
                return <span key={year} style={{ left: `${left}%` }}>{year}</span>;
              })}
            </div>
            <div className={styles.timelineGrid}>
              {yearTicks.map((year) => {
                const left = ((year - timelineWindow.start) / timelineWindow.span) * 100;
                return <span key={year} className={styles.yearLine} style={{ left: `${left}%` }} />;
              })}
              {lanes.length === 0 ? (
                <div className={styles.emptyState}>Ingen perioder funnet innen valgt år.</div>
              ) : lanes.map((lane) => (
                <div className={styles.lane} key={lane.label}>
                  <div className={styles.laneLabel}>{lane.label}</div>
                  <div className={styles.laneTrack}>
                    {lane.rows.map((period) => {
                      const start = period.start_year ?? timelineWindow.start;
                      const end = normalizeEndYear(period) ?? start;
                      const left = Math.max(0, ((start - timelineWindow.start) / timelineWindow.span) * 100);
                      const width = Math.max(2, ((end - start || 1) / timelineWindow.span) * 100);
                      const isEvent = start === end;
                      const active = selectedPeriod?.period_slug === period.period_slug;
                      return (
                        <button
                          key={period.period_slug}
                          type="button"
                          className={`${isEvent ? styles.eventMarker : styles.periodBlock} ${active ? styles.periodBlockActive : ""}`}
                          style={{ left: `${left}%`, width: isEvent ? undefined : `${width}%` }}
                          title={`${period.display_name_no} ${formatPeriodYears(period)}`}
                          onClick={() => handleTimelineSelect(period)}
                        >
                          <strong>{period.display_name_no}</strong>
                          <span>{formatPeriodYears(period)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.tablePanel}>
            <table className={styles.periodTable}>
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Type</th>
                  <th>Nivå</th>
                  <th>Fra</th>
                  <th>Til</th>
                  <th>Lenke</th>
                </tr>
              </thead>
              <tbody>
                {periodOptions.map((period) => (
                  <tr key={period.period_slug} onClick={() => handleTimelineSelect(period)}>
                    <td>{period.display_name_no}</td>
                    <td>{period.period_type_label_no || period.period_type_key}</td>
                    <td>{period.period_level ?? "-"}</td>
                    <td>{period.start_year ?? "-"}</td>
                    <td>{period.end_year ?? "nå"}</td>
                    <td>{period.relation_href || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.dynamicGrid}>
        <article className={styles.detailPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Dynamisk felt 1</p>
              <h2>Valgt tidslinjeinnhold</h2>
            </div>
            <span className={styles.badge}>Tidslinje</span>
          </div>
          {selectedPeriod ? (
            <div className={styles.detailInfoList}>
              <div className={styles.detailRow}>
                <span>Periode</span>
                <strong>{selectedPeriod.display_name_no}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>År</span>
                <strong>{formatPeriodYears(selectedPeriod)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Type</span>
                <strong>{selectedPeriod.period_type_label_no || selectedPeriod.period_type_key || "Ikke definert"}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Nivå</span>
                <strong>{selectedPeriod.period_level ?? "Ikke definert"}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Forelder</span>
                <strong>{selectedPeriod.parent_period_slug || "Ingen"}</strong>
              </div>
              {selectedPeriod.relation_href && (
                <div className={styles.detailRow}>
                  <span>Relasjon</span>
                  <Link href={selectedPeriod.relation_href} className={styles.relationLink}>
                    <ExternalLinkIcon />
                    <span>Åpne relasjon</span>
                  </Link>
                </div>
              )}
              <div className={styles.detailRowBlock}>
                <span>Beskrivelse</span>
                <p>{selectedPeriod.summary_short_no || "Mangler beskrivelse"}</p>
              </div>
              <div className={styles.detailRowBlock}>
                <span>Collectium-relevans</span>
                <p>{selectedPeriod.collectium_relevance_no || "Ikke vurdert"}</p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>Velg en periode i tidslinjen.</div>
          )}
        </article>

        <article className={styles.segmentPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Dynamisk felt 2</p>
              <h2>Samler · Historie · Finans</h2>
            </div>
            <div className={styles.segmentTabs}>
              {(Object.keys(SEGMENT_LABELS) as SegmentKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={segment === key ? styles.segmentButtonActive : styles.segmentButton}
                  aria-pressed={segment === key}
                  onClick={() => setSegment(key)}
                >
                  {SEGMENT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.segmentBodyList}>
            {segment === "samler" && (
              <>
                <div className={styles.detailRow}>
                  <span>Land</span>
                  <strong>{filters.country}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Objekttype</span>
                  <strong>{filters.objectType}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Katalogtreff</span>
                  <strong>{catalogRows.length} objekter</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Samlerstatus</span>
                  <strong>Hjerte · stjerne · min samling</strong>
                </div>
              </>
            )}
            {segment === "historie" && (
              <>
                <div className={styles.detailRow}>
                  <span>Periode</span>
                  <strong>{selectedPeriod?.display_name_no || "Ikke valgt"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>År</span>
                  <strong>{selectedPeriod ? formatPeriodYears(selectedPeriod) : `${filters.yearFrom}–${filters.yearTo}`}</strong>
                </div>
                {selectedPeriod?.relation_href && (
                  <div className={styles.detailRow}>
                    <span>Relasjon</span>
                    <Link href={selectedPeriod.relation_href} className={styles.relationLink}>
                      <ExternalLinkIcon />
                      <span>Åpne relasjon</span>
                    </Link>
                  </div>
                )}
                <div className={styles.detailRowBlock}>
                  <span>Kontekst</span>
                  <p>{selectedPeriod?.summary_short_no || "Velg en tidslinjenode"}</p>
                </div>
              </>
            )}
            {segment === "finans" && (
              <>
                <div className={styles.detailRow}>
                  <span>Finansperiode</span>
                  <strong>{selectedPeriod?.period_type_label_no || "Ikke valgt"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Markedsverdi</span>
                  <strong>Mangler markedsverdi</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Trend</span>
                  <strong>Ikke beregnet trend</strong>
                </div>
                <div className={styles.detailRowBlock}>
                  <span>Indexkobling</span>
                  <p>
                    {selectedPeriod?.period_type_key?.includes("economic") || selectedPeriod?.period_type_key?.includes("monetary")
                      ? "Relevant for økonomisk periodeanalyse"
                      : "Ikke vurdert"}
                  </p>
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      <section className={styles.catalogPanel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Katalogtreff</p>
            <h2>Treff fra valgt tidslinje og Masterfilter</h2>
          </div>
          <div className={styles.viewSelectorsContainer}>
            <button
              type="button"
              className={cardLayout === "horizontal" ? styles.viewSelectorActive : styles.viewSelector}
              onClick={() => setCardLayout("horizontal")}
            >
              Horisontal
            </button>
            <button
              type="button"
              className={cardLayout === "standing" ? styles.viewSelectorActive : styles.viewSelector}
              onClick={() => setCardLayout("standing")}
            >
              Stående
            </button>
            <button
              type="button"
              className={cardLayout === "list" ? styles.viewSelectorActive : styles.viewSelector}
              onClick={() => setCardLayout("list")}
            >
              Liste
            </button>
            <button
              type="button"
              className={cardLayout === "museum" ? styles.viewSelectorActive : styles.viewSelector}
              onClick={() => setCardLayout("museum")}
            >
              Museum
            </button>
          </div>
          <span className={styles.badge}>{catalogRows.length} treff</span>
        </div>
        {catalogRows.length === 0 ? (
          <div className={styles.emptyState}>Ingen katalogtreff returnert fra API for dette valget.</div>
        ) : (
          <div className={`${styles.catalogGrid} ${styles[`catalogGrid_${cardLayout}`]}`}>
            {catalogRows.map((hit, index) => {
              if (cardLayout === "horizontal") return <HorizontalCard key={index} hit={hit} />;
              if (cardLayout === "standing") return <StandingCard key={index} hit={hit} />;
              if (cardLayout === "list") return <ListCard key={index} hit={hit} />;
              return <MuseumCard key={index} hit={hit} />;
            })}
          </div>
        )}
      </section>

      {data?.warnings?.length ? <div className={styles.warningState}>Varsler: {data.warnings.join(" · ")}</div> : null}
      {error ? <div className={styles.errorState}>Siste oppdatering feilet: {error}</div> : null}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fieldCard}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
