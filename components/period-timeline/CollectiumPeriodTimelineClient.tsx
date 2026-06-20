/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodTimelineClient
 *
 * Definering / formÃ¥l:
 * React client component for Tidslinjeperiode (Periode 8.6). Viser sammenligningsbasert
 * tidstabell med 4 rader der dropdown velger gruppe og tidslinjen tegner noder under gruppen.
 * Klikk pÃ¥ node fyller det dynamiske relasjonsfeltet.
 *
 * BruksomrÃ¥de:
 * Brukes av /test/Periodetidslinje og alias /test/period-timeline.
 *
 * BerÃ¸rte sider / routes:
 * - /test/Periodetidslinje
 * - /test/period-timeline
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/period86/groups
 * - GET /api/period86/timeline-nodes
 * - GET /api/period86/node-detail
 * - GET /api/test/period-timeline (for katalogtreff)
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-V8.6
 */

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

type TimelineNode = {
  node_key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  group_key: string;
  group_label_no: string;
  node_type: string;
  relation_href: string | null;
  description_no?: string;
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

type Filters = {
  country: string;
  objectType: string;
  yearFrom: number;
  yearTo: number;
};

const DEFAULT_FILTERS: Filters = {
  country: "Norge",
  objectType: "banknote",
  yearFrom: 1814,
  yearTo: 2024,
};

const GROUP_LABELS: Record<string, string> = {
  ruler_head_of_state: "Herskere / statsoverhoder",
  national_period: "Nasjonale perioder",
  war_conflict: "Krig / konflikt",
  disease_crisis: "Sykdom / krise",
  finance_economy: "Finans / Ã¸konomi",
};

const SEGMENT_LABELS: Record<SegmentKey, string> = {
  samler: "Samler",
  historie: "Historie",
  finans: "Finans",
};

function normalizeEndYear(node: TimelineNode, yearTo: number): number {
  if (typeof node.to_year === "number") return node.to_year;
  if (typeof node.from_year === "number") return yearTo;
  return yearTo;
}

function timelineStackIndex(period: TimelineNode, periods: TimelineNode[], index: number, span: number, yearTo: number) {
  const start = period.from_year ?? 0;
  const end = normalizeEndYear(period, yearTo);
  const threshold = Math.max(2, Math.round(span * 0.025));
  let overlaps = 0;

  for (let previousIndex = 0; previousIndex < index; previousIndex += 1) {
    const previous = periods[previousIndex];
    const previousStart = previous.from_year ?? 0;
    const previousEnd = normalizeEndYear(previous, yearTo);
    if (previousStart <= end + threshold && previousEnd >= start - threshold) {
      overlaps += 1;
    }
  }

  return overlaps % 4;
}

function valueOrMissing(value: string | number | null | undefined, fallback = "Ikke registrert"): string {
  if (value === null || typeof value === "undefined" || value === "") return fallback;
  return String(value);
}

function objectYearLabel(hit: CatalogHit): string {
  return valueOrMissing(hit.object_year_label || hit.publication_year_label);
}

function cardMetaText(hit: CatalogHit, node: TimelineNode | null): string {
  return [
    valueOrMissing(hit.source_key, "Ukjent kilde"),
    valueOrMissing(hit.object_group, "Ukjent gruppe"),
    objectYearLabel(hit),
    node?.label_no,
  ]
    .filter(Boolean)
    .join(" Â· ");
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
        <span>Ã…pne objekt</span>
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
    { label: "Hjerte", meta: "Ã˜nskeliste", count: "0" },
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
      <strong>Ikke estimert</strong>
      <small>
        <span className={styles.cardCheckIcon}><CheckCircleIcon /></span>
        <span>Mangler markedsverdi</span>
      </small>
    </section>
  );
}

function DynamicFacts({ hit, compact = false }: { hit: CatalogHit; compact?: boolean }) {
  const hitFacts = [
    { label: "ValÃ¸rutgave", value: valueOrMissing(hit.denomination_raw_no), icon: TagIcon },
    { label: "Utgave", value: valueOrMissing(hit.denomination_issue_raw_no), icon: CalendarIcon },
    { label: "Variant", value: valueOrMissing(hit.variant_type_raw_no), icon: LayersIcon },
    { label: "Sjeldenhet", value: "Ikke vurdert", icon: ShieldIcon },
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

function DynamicCardPanel({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
  return (
    <section className={`${styles.cardHistoryPanel} ${styles[`cardPanel_${segment}`]}`} aria-label="Dynamisk kortfelt">
      <div className={styles.cardHistoryHeader}>
        <span className={styles.cardBookIcon} aria-hidden="true"><BookOpenIcon /></span>
        <strong>{SEGMENT_LABELS[segment]}</strong>
        <small>{segment === "historie" && period ? period.year_label : cardMetaText(hit, period)}</small>
      </div>
      <dl className={styles.cardHistoryGrid}>
        {segment === "samler" && (
          <>
            <div className={styles.cardHistoryItem}>
              <dt>Hjerte</dt>
              <dd>Ikke vurdert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Stjerne</dt>
              <dd>Ikke vurdert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>I samling</dt>
              <dd>Ikke registrert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Katalogstatus</dt>
              <dd>{valueOrMissing(hit.source_catalog_number, "Katalogtreff")}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Kilde / type</dt>
              <dd>{valueOrMissing(hit.source_key)} Â· {valueOrMissing(hit.object_group)}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Variant / status</dt>
              <dd>{valueOrMissing(hit.variant_type_raw_no)} Â· Ikke vurdert</dd>
            </div>
          </>
        )}
        {segment === "historie" && (
          <>
            <div className={styles.cardHistoryItem}>
              <dt>Regent / konge</dt>
              <dd>{period && period.group_key === "ruler_head_of_state" ? period.label_no : "Ikke registrert"}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Motiv / person</dt>
              <dd>{valueOrMissing(hit.title_no || hit.source_catalog_number)}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Ã…rstall</dt>
              <dd>{objectYearLabel(hit)}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Historisk kontekst</dt>
              <dd>{period?.description_no || period?.label_no || "Ikke vurdert"}</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Signatur</dt>
              <dd>Ikke registrert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Relasjon</dt>
              <dd>{period?.relation_href ? "Relasjon tilgjengelig" : "Ikke registrert"}</dd>
            </div>
          </>
        )}
        {segment === "finans" && (
          <>
            <div className={styles.cardHistoryItem}>
              <dt>Estimert verdi</dt>
              <dd>Ikke estimert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Markedsverdi</dt>
              <dd>Mangler markedsverdi</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Trend</dt>
              <dd>Ikke vurdert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Likviditet</dt>
              <dd>Ikke vurdert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Auksjon / nettbutikk</dt>
              <dd>Ikke vurdert</dd>
            </div>
            <div className={styles.cardHistoryItem}>
              <dt>Indeksperiode</dt>
              <dd>{period ? period.year_label : "Ikke valgt"}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}

function ListSegmentSummary({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
  if (segment === "samler") {
    return (
      <div className={styles.cardListDynamic}>
        <span>Samler</span>
        <strong>Hjerte 0 Â· Stjerne 0 Â· Ikke i samling</strong>
      </div>
    );
  }

  if (segment === "finans") {
    return (
      <div className={styles.cardListDynamic}>
        <span>Finans</span>
        <strong>Ikke estimert Â· Mangler markedsverdi</strong>
      </div>
    );
  }

  return (
    <div className={styles.cardListDynamic}>
      <span>Historie</span>
      <strong>{period?.label_no || "Ikke valgt"} Â· {objectYearLabel(hit)}</strong>
    </div>
  );
}

function HorizontalCard({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
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
            <p className={styles.cardMeta}>{cardMetaText(hit, period)}</p>
          </div>
        </div>
        <div className={styles.cardBottomSection}>
          <DynamicCardPanel hit={hit} period={period} segment={segment} />
          <div className={styles.cardUnderDynamicActions}>
            <DynamicActionButtons hit={hit} />
          </div>
        </div>
      </div>
      <aside className={styles.cardSideColumn}>
        <DynamicActionPanel />
        <DynamicPriceBox />
      </aside>
    </article>
  );
}

function StandingCard({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85StandingCard}`}>
      <DynamicBanknote isBanknote={isBanknote} title={title} />
      <h2>{title}</h2>
      <DynamicFacts hit={hit} compact />
      <p className={styles.cardMeta}>{cardMetaText(hit, period)}</p>
      <div className={styles.cardStandingDetails}>
        <div className={styles.cardStandingLeftColumn}>
          <DynamicCardPanel hit={hit} period={period} segment={segment} />
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

function MuseumCard({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
  const isBanknote = hit.object_group === "banknote";
  const title = hit.title_no || hit.source_catalog_number || "Uten tittel";
  return (
    <article className={`${styles.ui85Card} ${styles.ui85MuseumCard}`}>
      <div className={styles.cardMuseumLeft}>
        <DynamicBanknote isBanknote={isBanknote} title={title} />
      </div>
      <div className={styles.cardMuseumRight}>
        <h2>Museum Â· {title}</h2>
        <DynamicCardPanel hit={hit} period={period} segment={segment} />
        <div className={styles.cardMuseumActions}>
          <DynamicActionButtons hit={hit} />
        </div>
      </div>
    </article>
  );
}

function ListCard({ hit, period, segment }: { hit: CatalogHit; period: TimelineNode | null; segment: SegmentKey }) {
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
            <span>ValÃ¸rutgave</span>
            <strong>{valueOrMissing(hit.denomination_raw_no)}</strong>
          </div>
          <div>
            <span>Utgave</span>
            <strong>{valueOrMissing(hit.denomination_issue_raw_no)}</strong>
          </div>
          <div>
            <span>Variant</span>
            <strong>{valueOrMissing(hit.variant_type_raw_no)}</strong>
          </div>
          <div>
            <span>Sjeldenhet</span>
            <strong>Ikke vurdert</strong>
          </div>
        </div>
        <p className={styles.cardMeta}>{cardMetaText(hit, period)}</p>
      </div>
      <ListSegmentSummary hit={hit} period={period} segment={segment} />
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
  const [groups, setGroups] = useState<{ group_key: string; label_no: string }[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  // Rows selected groups states
  const [row1Group, setRow1Group] = useState<string>("ruler_head_of_state");
  const [row2Group, setRow2Group] = useState<string>("national_period");
  const [row3Group, setRow3Group] = useState<string>("war_conflict");
  const [row4Group, setRow4Group] = useState<string>("finance_economy");

  // Loaded nodes for each row
  const [row1Nodes, setRow1Nodes] = useState<TimelineNode[]>([]);
  const [row2Nodes, setRow2Nodes] = useState<TimelineNode[]>([]);
  const [row3Nodes, setRow3Nodes] = useState<TimelineNode[]>([]);
  const [row4Nodes, setRow4Nodes] = useState<TimelineNode[]>([]);

  // Selected node and detailed information
  const [selectedNode, setSelectedNode] = useState<TimelineNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any | null>(null);

  // Catalog items section
  const [catalogRows, setCatalogRows] = useState<CatalogHit[]>([]);
  const [segment, setSegment] = useState<SegmentKey>("samler");
  const [cardSegment, setCardSegment] = useState<SegmentKey>("historie");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [cardLayout, setCardLayout] = useState<CardLayout>("horizontal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Groups list on component load
  useEffect(() => {
    fetch("/api/period86/groups")
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) {
          setGroups(data.groups);
        }
      })
      .catch((err) => console.error("Error loading groups:", err));
  }, []);

  // Fetch timeline nodes for the 4 rows when filters or selected groups change
  const fetchTimelineData = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`/api/period86/timeline-nodes?country=${nextFilters.country}&group_key=${row1Group}&year_from=${nextFilters.yearFrom}&year_to=${nextFilters.yearTo}`),
        fetch(`/api/period86/timeline-nodes?country=${nextFilters.country}&group_key=${row2Group}&year_from=${nextFilters.yearFrom}&year_to=${nextFilters.yearTo}`),
        fetch(`/api/period86/timeline-nodes?country=${nextFilters.country}&group_key=${row3Group}&year_from=${nextFilters.yearFrom}&year_to=${nextFilters.yearTo}`),
        fetch(`/api/period86/timeline-nodes?country=${nextFilters.country}&group_key=${row4Group}&year_from=${nextFilters.yearFrom}&year_to=${nextFilters.yearTo}`),
      ]);

      const [j1, j2, j3, j4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()]);

      const nodes1 = j1.nodes || [];
      const nodes2 = j2.nodes || [];
      const nodes3 = j3.nodes || [];
      const nodes4 = j4.nodes || [];

      setRow1Nodes(nodes1);
      setRow2Nodes(nodes2);
      setRow3Nodes(nodes3);
      setRow4Nodes(nodes4);

      // Automatically select the first node of row 1 if nothing is selected or if previously selected is missing
      const allNodes = [...nodes1, ...nodes2, ...nodes3, ...nodes4];
      const match = allNodes.find((n) => n.node_key === selectedNode?.node_key);
      if (match) {
        handleTimelineSelect(match, nextFilters);
      } else if (allNodes.length > 0) {
        handleTimelineSelect(allNodes[0], nextFilters);
      } else {
        setSelectedNode(null);
        setNodeDetail(null);
        setCatalogRows([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente periodetidslinje.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.country, filters.yearFrom, filters.yearTo, row1Group, row2Group, row3Group, row4Group]);

  const handleTimelineSelect = async (node: TimelineNode, currentFilters = filters) => {
    setSelectedNode(node);
    try {
      // 1. Fetch detailed metadata including relationships
      const detailRes = await fetch(`/api/period86/node-detail?node_key=${node.node_key}&node_type=${node.node_type}`);
      const detailJson = await detailRes.json();
      setNodeDetail(detailJson);

      // 2. Fetch catalog rows for catalog section linked to this node
      const catalogRes = await fetch(
        `/api/test/period-timeline?period_slug=${node.node_key}&year_from=${currentFilters.yearFrom}&year_to=${currentFilters.yearTo}&object_type=${currentFilters.objectType}`
      );
      const catalogJson = await catalogRes.json();
      setCatalogRows(catalogJson.catalogRows || []);
    } catch (e) {
      console.error("Error fetching details for node:", e);
    }
  };

  const timelineWindow = useMemo(() => {
    return {
      start: filters.yearFrom,
      end: Math.max(filters.yearTo, filters.yearFrom + 1),
      span: Math.max(filters.yearTo - filters.yearFrom, 1),
    };
  }, [filters.yearFrom, filters.yearTo]);

  const timelineRows = [
    { key: "row1", label: GROUP_LABELS[row1Group], groupKey: row1Group, periods: row1Nodes, setGroup: setRow1Group, className: "row1" },
    { key: "row2", label: GROUP_LABELS[row2Group], groupKey: row2Group, periods: row2Nodes, setGroup: setRow2Group, className: "row2" },
    { key: "row3", label: GROUP_LABELS[row3Group], groupKey: row3Group, periods: row3Nodes, setGroup: setRow3Group, className: "row3" },
    { key: "row4", label: GROUP_LABELS[row4Group], groupKey: row4Group, periods: row4Nodes, setGroup: setRow4Group, className: "row4" },
  ];

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

  function updateFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next };
    if (merged.yearTo < merged.yearFrom) {
      merged.yearTo = merged.yearFrom;
    }
    setFilters(merged);
  }

  function applyFilters() {
    void fetchTimelineData(filters);
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
    void fetchTimelineData(nextFilters);
  }

  function setWindowSize(years: number) {
    const start = selectedNode?.from_year ?? filters.yearFrom;
    const nextFilters = { ...filters, yearFrom: start, yearTo: start + years };
    setFilters(nextFilters);
    void fetchTimelineData(nextFilters);
  }

  if (loading && !row1Nodes.length && !row2Nodes.length && !row3Nodes.length && !row4Nodes.length) {
    return <div className={styles.loadingState}>Laster tidslinje fra Neon/APIâ€¦</div>;
  }

  const apiOnline = !loading && !error;

return (
  <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium UI/UX 8.6 Â· tidslinje</p>
          <h1 className={styles.title}>Tidslinjeperiode</h1>
          <p className={styles.subtitle}>Sammenligningsbasert tidslinje med grupper i dropdowns og noder i tidslinjen hentet fra Neon/API.</p>
        </div>
        <div className={styles.heroStatus}>
          <span>Status</span>
          <strong>Aktiv V8.6</strong>
        </div>
      </section>

      <section className={styles.masterFilter} aria-label="Masterfilter">
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Masterfilter</p>
            <h2>Filter over tidslinjeinnhold</h2>
          </div>
          <button className={`${styles.primaryButton} ct-btn ct-btn-primary`} type="button" onClick={applyFilters}>Oppdater</button>
        </div>

        <div className={styles.masterGrid}>
          <label className={styles.field}>
            <span>Land</span>
            <select value={filters.country} onChange={(event) => updateFilters({ country: event.target.value })} className="ct-select">
              <option value="Norge">Norge</option>
              <option value="Skandinavia">Skandinavia</option>
              <option value="Sverige">Sverige</option>
              <option value="Danmark">Danmark</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Type objekt</span>
            <select value={filters.objectType} onChange={(event) => updateFilters({ objectType: event.target.value })} className="ct-select">
              <option value="banknote">Sedler</option>
              <option value="coin">Mynter</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Ã…r fra</span>
            <input type="number" value={filters.yearFrom} onChange={(event) => updateFilters({ yearFrom: Number(event.target.value) })} className="ct-input" />
          </label>

          <label className={styles.field}>
            <span>Ã…r til</span>
            <input type="number" value={filters.yearTo} onChange={(event) => updateFilters({ yearTo: Number(event.target.value) })} className="ct-input" />
          </label>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.timelineToolbar}>
          <div>
            <p className={styles.eyebrow}>Periodens tidslinje</p>
            <h2>{filters.yearFrom}â€“{filters.yearTo}</h2>
          </div>
          <div className={styles.toolbarButtons}>
            <button type="button" onClick={() => zoom(1.4)} className="ct-btn">Zoom ut</button>
            <button type="button" onClick={() => zoom(0.7)} className="ct-btn">Zoom inn</button>
            <button type="button" onClick={() => setWindowSize(100)} className="ct-btn">100 Ã¥r</button>
            <button className={`${viewMode === "timeline" ? styles.toolbarButtonActive : ""} ct-btn`} type="button" onClick={() => setViewMode("timeline")}>Tidslinje</button>
            <button className={`${viewMode === "table" ? styles.toolbarButtonActive : ""} ct-btn`} type="button" onClick={() => setViewMode("table")}>Tabell</button>
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
              {timelineRows.map((lane) => (
                <div className={`${styles.lane} ${styles[lane.className]}`} key={lane.key}>
                  <div className={styles.laneLabel} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", padding: "4px", gap: "2px" }}>
                    <span style={{ fontSize: "9px", fontWeight: "900", opacity: 0.6, letterSpacing: "0.05em" }}>{lane.key.toUpperCase()}</span>
                    <select
                      value={lane.groupKey}
                      onChange={(e) => lane.setGroup(e.target.value)}
                      className="ct-select"
                      style={{ fontSize: "11px", padding: "4px", minHeight: "28px", width: "100%", borderRadius: "6px" }}
                    >
                      {Object.entries(GROUP_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.laneTrack}>
                    {lane.periods.length === 0 ? (
                      <div className={styles.laneEmpty}>Ingen perioder i valgt Ã¥rsspenn</div>
                    ) : lane.periods.map((period, index) => {
                      const start = period.from_year ?? timelineWindow.start;
                      const end = normalizeEndYear(period, timelineWindow.end);
                      const left = Math.max(0, ((start - timelineWindow.start) / timelineWindow.span) * 100);
                      const width = Math.max(2, ((end - start || 1) / timelineWindow.span) * 100);
                      const isEvent = start === end;
                      const active = selectedNode?.node_key === period.node_key;
                      const stackTop = 8 + timelineStackIndex(period, lane.periods, index, timelineWindow.span, timelineWindow.end) * 24;
                      return (
                        <button
                          key={period.node_key}
                          type="button"
                          className={`${isEvent ? styles.eventMarker : styles.periodBlock} ${active ? styles.periodBlockActive : ""}`}
                          style={{ left: `${left}%`, top: `${stackTop}px`, width: isEvent ? undefined : `${width}%` }}
                          title={`${period.label_no} ${period.year_label}`}
                          onClick={() => handleTimelineSelect(period)}
                        >
                          <strong>{period.label_no}</strong>
                          <span>{period.year_label}</span>
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
                  <th>Fra</th>
                  <th>Til</th>
                  <th>Lenke</th>
                </tr>
              </thead>
              <tbody>
                {[...row1Nodes, ...row2Nodes, ...row3Nodes, ...row4Nodes].map((node) => (
                  <tr key={node.node_key} onClick={() => handleTimelineSelect(node)}>
                    <td>{node.label_no}</td>
                    <td>{node.group_label_no}</td>
                    <td>{node.from_year ?? "-"}</td>
                    <td>{node.to_year ?? "nÃ¥"}</td>
                    <td>{node.relation_href || "-"}</td>
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
          {nodeDetail ? (
            <div className={styles.detailInfoList} style={{ display: "grid", gap: "10px" }}>
              <div className={styles.detailRow}>
                <span>Tittel</span>
                <strong>{nodeDetail.title_no}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Type</span>
                <strong>{nodeDetail.type_label_no}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Periode</span>
                <strong>{nodeDetail.year_label}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Land/omrÃ¥de</span>
                <strong>{nodeDetail.land_omrade}</strong>
              </div>
              <div className={styles.detailRowBlock}>
                <span>Beskrivelse / Historisk kontekst</span>
                <p style={{ margin: "4px 0", fontSize: "13px", lineHeight: "1.4" }}>
                  {nodeDetail.summary_no}
                </p>
              </div>
              <div className={styles.detailRowBlock}>
                <span>Relevans for Collectium</span>
                <p style={{ margin: "4px 0", fontSize: "13px", lineHeight: "1.4" }}>
                  {nodeDetail.collectium_relevance_no}
                </p>
              </div>

              {nodeDetail.media && nodeDetail.media.length > 0 && (
                <div className={styles.detailRowBlock}>
                  <span>Media / Bilde</span>
                  <div style={{ marginTop: "6px", display: "grid", gap: "8px" }}>
                    {nodeDetail.media.map((img: any, idx: number) => (
                      <div key={idx} style={{ display: "grid", gap: "4px" }}>
                        <img 
                          src={img.blob_url} 
                          alt={img.alt_text_no || nodeDetail.title_no} 
                          style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid var(--ct-border)" }}
                        />
                        {img.caption_no && (
                          <small style={{ color: "var(--ct-muted)", fontSize: "11px" }}>{img.caption_no}</small>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {nodeDetail.relation_href && (
                <div className={styles.detailRow} style={{ marginTop: "12px" }}>
                  <span>Handling</span>
                  <Link href={nodeDetail.relation_href} className={`${styles.relationLink} ct-btn ct-btn-primary`} style={{ textDecoration: "none", color: "var(--ct-card-bg)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <ExternalLinkIcon />
                    <span>Se relasjon</span>
                  </Link>
                </div>
              )}

              {/* Relations sections */}
              {nodeDetail.related_objects && nodeDetail.related_objects.length > 0 && (
                <div className={styles.detailRowBlock} style={{ borderTop: "1px solid var(--ct-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <span>Relaterte objekter i katalogen</span>
                  <ul style={{ margin: "6px 0", paddingLeft: "20px", fontSize: "13px" }}>
                    {nodeDetail.related_objects.map((obj: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        <Link href={`/objekt/${obj.source_key}/${obj.object_group}/${obj.object_id}`} style={{ color: "var(--ct-accent)", fontWeight: "bold" }}>
                          {obj.title_no} ({obj.source_catalog_number || "Uten nr"}) Â· {obj.object_year_label || "Ukjent Ã¥r"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {nodeDetail.related_periods && nodeDetail.related_periods.length > 0 && (
                <div className={styles.detailRowBlock} style={{ borderTop: "1px solid var(--ct-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <span>Relaterte perioder</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {nodeDetail.related_periods.map((p: any, idx: number) => (
                      <Link 
                        key={idx} 
                        href={p.relation_href || "#"} 
                        className="ct-badge" 
                        style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px", background: "var(--ct-panel-soft)", border: "1px solid var(--ct-border)", borderRadius: "12px" }}
                      >
                        {p.label_no} ({p.year_label})
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {nodeDetail.related_people && nodeDetail.related_people.length > 0 && (
                <div className={styles.detailRowBlock} style={{ borderTop: "1px solid var(--ct-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <span>Relaterte personer / signaturer</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {nodeDetail.related_people.map((p: any, idx: number) => (
                      <Link 
                        key={idx} 
                        href={p.href} 
                        className="ct-badge" 
                        style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px", background: "var(--ct-panel-soft)", border: "1px solid var(--ct-border)", borderRadius: "12px" }}
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {nodeDetail.related_motifs && nodeDetail.related_motifs.length > 0 && (
                <div className={styles.detailRowBlock} style={{ borderTop: "1px solid var(--ct-border)", paddingTop: "12px", marginTop: "12px" }}>
                  <span>Relaterte motiv / symboler</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                    {nodeDetail.related_motifs.map((m: any, idx: number) => (
                      <Link 
                        key={idx} 
                        href={m.href} 
                        className="ct-badge" 
                        style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px", background: "var(--ct-panel-soft)", border: "1px solid var(--ct-border)", borderRadius: "12px" }}
                      >
                        {m.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>Velg en periode i tidslinjen.</div>
          )}
        </article>

        <article className={styles.segmentPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Dynamisk felt 2</p>
              <h2>{SEGMENT_LABELS[segment]}</h2>
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
                  <span>Hjerte</span>
                  <strong>Ikke vurdert</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Stjerne</span>
                  <strong>Ikke vurdert</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>I samling</span>
                  <strong>Ikke registrert</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Katalogstatus</span>
                  <strong>{catalogRows.length} treff</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Objekttype</span>
                  <strong>{filters.objectType === "banknote" ? "Sedler" : "Mynter"}</strong>
                </div>
              </>
            )}
            {segment === "historie" && (
              <>
                <div className={styles.detailRow}>
                  <span>Regent / konge</span>
                  <strong>{selectedNode && selectedNode.group_key === "ruler_head_of_state" ? selectedNode.label_no : "Ikke registrert"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Periode</span>
                  <strong>{selectedNode?.label_no || "Ikke valgt"}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Ã…r</span>
                  <strong>{selectedNode ? selectedNode.year_label : `${filters.yearFrom}â€“${filters.yearTo}`}</strong>
                </div>
              </>
            )}
            {segment === "finans" && (
              <>
                <div className={styles.detailRow}>
                  <span>Estimert verdi</span>
                  <strong>Ikke estimert</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Markedsverdi</span>
                  <strong>Mangler markedsverdi</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Trend</span>
                  <strong>Ikke vurdert</strong>
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
          <h2>Katalogtreff {filters.yearFrom}–{filters.yearTo}</h2>
        </div>
        <span className={styles.badge}>{catalogRows.length} treff</span>
      </div>

      <div className={styles.catalogControlBar}>
        <div className={styles.cardSegmentTabs} aria-label="Dynamisk kortfelt">
          {(Object.keys(SEGMENT_LABELS) as SegmentKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={cardSegment === key ? styles.segmentButtonActive : styles.segmentButton}
              aria-pressed={cardSegment === key}
              onClick={() => setCardSegment(key)}
            >
              {SEGMENT_LABELS[key]}
            </button>
          ))}
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
      </div>
      {catalogRows.length === 0 ? (
          <div className={styles.emptyState}>Ingen katalogtreff returnert fra API for dette valget.</div>
        ) : (
          <div className={`${styles.catalogGrid} ${styles[`catalogGrid_${cardLayout}`]}`}>
            {catalogRows.map((hit, index) => {
              if (cardLayout === "horizontal") return <HorizontalCard key={index} hit={hit} period={selectedNode} segment={cardSegment} />;
              if (cardLayout === "standing") return <StandingCard key={index} hit={hit} period={selectedNode} segment={cardSegment} />;
              if (cardLayout === "list") return <ListCard key={index} hit={hit} period={selectedNode} segment={cardSegment} />;
              return <MuseumCard key={index} hit={hit} period={selectedNode} segment={cardSegment} />;
            })}
          </div>
        )}
      </section>

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


