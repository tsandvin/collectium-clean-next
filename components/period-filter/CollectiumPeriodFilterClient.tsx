"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterClient
 *
 * Definering / formål:
 * React client component for Periodefilter. Henter data fra NeonDB via API,
 * styrer et fire-raders periodefilter (Nasjonal, Hoved, Under, Valgfri),
 * tegner en interaktiv 4-track tidslinje, og viser kompakte visningskort i
 * fire layouts (Horisontal, Stående, Liste, Museum) med segmentbrytere.
 *
 * Bruksområde:
 * Brukes av app/test/periodefilter/page.tsx.
 *
 * Versjon:
 * CT-PERIOD-FILTER-CLIENT-V1
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  HeartIcon,
  StarIcon,
  CheckCircleIcon,
  TagIcon,
  CalendarIcon,
  LayersIcon,
  ShieldIcon,
  BookOpenIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GlobeIcon,
} from "@/components/templates/ui85/CollectiumUi85Icons";
import styles from "./CollectiumPeriodFilterClient.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type ViewMode = "horizontal" | "standing" | "list" | "museum";

type PeriodOption = {
  period_slug: string;
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
};

type RelationNode = {
  relation_type: string;
  relation_label_no: string | null;
  relation_slug: string;
  relation_href: string | null;
  relation_count: number;
};

type PeriodApiResponse = {
  ok: boolean;
  rows: PeriodOption[];
  relationNodes?: RelationNode[];
  updatedAt?: string;
};

type CatalogRelation = {
  source_key: string;
  object_group: string;
  object_id: string;
  relation_type: string | null;
  relation_key: string | null;
  relation_slug: string | null;
  display_name_no: string | null;
  href: string | null;
};

type CatalogObject = {
  source_key: string;
  object_group: string;
  object_id: string;
  title: string;
  source_catalog_number: string | null;
  denomination_raw_no: string | null;
  object_year_label: string | null;
  publication_year_label: string | null;
  litra_raw_no: string | null;
  denomination_issue_raw_no: string | null;
  variant_type_raw_no: string | null;
  signature_raw_no: string | null;
  ruler_name_raw_no: string | null;
  rarity_raw_no: string | null;
  market_value_raw_no: string | null;
  trend_raw_no: string | null;
  auction_status_raw_no: string | null;
  shop_status_raw_no: string | null;
  object_href: string;
  relations: CatalogRelation[];
};

type CatalogApiResponse = {
  ok: boolean;
  count: number;
  objects: CatalogObject[];
};

function formatValue(value: string | null | undefined, fallback = "Ikke vurdert") {
  if (value === null || value === undefined) return fallback;
  const cleaned = String(value).trim();
  if (cleaned === "" || cleaned === "0" || cleaned === "0 kr" || cleaned === "0.00" || cleaned === "0%") {
    return fallback;
  }
  return cleaned;
}

export default function CollectiumPeriodFilterClient() {
  // Filter states
  const [yearFrom, setYearFrom] = useState<number>(1814);
  const [yearTo, setYearTo] = useState<number>(2024);
  const [country, setCountry] = useState<string>("Norge");
  const [objectType, setObjectType] = useState<string>("Verdibrev");

  // Dropdown states
  const [row1, setRow1] = useState<string>("");
  const [row2, setRow2] = useState<string>("");
  const [row3, setRow3] = useState<string>("");
  const [row4, setRow4] = useState<string>("");

  // UI state
  const [segment, setSegment] = useState<SegmentKey>("historie");
  const [view, setView] = useState<ViewMode>("horizontal");

  // DB Data states
  const [periodData, setPeriodData] = useState<PeriodApiResponse | null>(null);
  const [catalogData, setCatalogData] = useState<CatalogApiResponse | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(true);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Period Options
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        setLoadingPeriods(true);
        const res = await fetch("/api/filter/period/options", { cache: "no-store" });
        const json = await res.json();
        if (active) {
          if (json.ok) {
            setPeriodData(json);
          } else {
            setError(json.message || "Feil under lasting av perioder.");
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Nettverksfeil under lasting av perioder.");
        }
      } finally {
        if (active) setLoadingPeriods(false);
      }
    }
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // Fetch Catalog results based on filters
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const params = new URLSearchParams({
          source_key: "norske_sedler",
          object_group: "banknote",
          year_from: String(yearFrom),
          year_to: String(yearTo),
          limit: "12",
        });

        // Determine active period selection in precedence order
        if (row4) {
          params.set("period_slug", row4);
        } else if (row3) {
          if (row3.startsWith("relation:")) {
            const parts = row3.split(":");
            params.set("relation_type", parts[1]);
            params.set("relation_slug", parts.slice(2).join(":"));
          } else {
            params.set("period_slug", row3);
          }
        } else if (row2) {
          params.set("period_slug", row2);
        } else if (row1) {
          params.set("period_slug", row1);
        }

        const res = await fetch(`/api/catalog/results?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (active) {
          if (json.ok) {
            setCatalogData(json);
          } else {
            setCatalogData({ ok: false, count: 0, objects: [] });
          }
        }
      } catch {
        if (active) {
          setCatalogData({ ok: false, count: 0, objects: [] });
        }
      } finally {
        if (active) setLoadingCatalog(false);
      }
    }

    loadCatalog();
    return () => {
      active = false;
    };
  }, [row1, row2, row3, row4, yearFrom, yearTo]);

  // Compute options for dropdowns
  const allPeriods = periodData?.rows ?? [];
  const relationNodes = periodData?.relationNodes ?? [];

  // Rad 1 Options: level 1 or parent is empty
  const row1Options = useMemo(() => {
    return allPeriods.filter(p => p.period_level === 1 || !p.parent_period_slug);
  }, [allPeriods]);

  // Rad 2 Options: level 2 or children of active Rad 1
  const row2Options = useMemo(() => {
    if (!row1) {
      return allPeriods.filter(p => p.period_level === 2);
    }
    return allPeriods.filter(p => p.parent_period_slug === row1 || p.period_level === 2);
  }, [allPeriods, row1]);

  // Rad 3 Options: level 3 or children of active Rad 2, plus relations
  const row3Options = useMemo(() => {
    let filteredPeriods = allPeriods.filter(p => p.period_level === 3);
    if (row2) {
      filteredPeriods = allPeriods.filter(p => p.parent_period_slug === row2 || p.period_level === 3);
    }

    const periodOpts = filteredPeriods.map(p => ({
      id: p.period_slug,
      label: p.display_name_no || p.period_slug,
      type: "period"
    }));

    const relationOpts = relationNodes.map(r => ({
      id: `relation:${r.relation_type}:${r.relation_slug}`,
      label: `${r.relation_label_no || r.relation_slug} (${r.relation_count})`,
      type: "relation"
    }));

    return [...periodOpts, ...relationOpts];
  }, [allPeriods, relationNodes, row2]);

  // Rad 4 (Valgfri): all periods that overlap with active timeline interval, grouped by period type
  const row4OptionsGrouped = useMemo(() => {
    const overlapping = allPeriods.filter(p => {
      // Overlap math: period.start_year <= yearTo && period.end_year >= yearFrom
      const start = p.start_year ?? -9999;
      const end = p.end_year ?? 9999;
      return start <= yearTo && end >= yearFrom;
    });

    const groups: Record<string, PeriodOption[]> = {};
    overlapping.forEach(p => {
      const typeLabel = p.period_type_label_no || p.period_type_key || "Andre perioder";
      if (!groups[typeLabel]) {
        groups[typeLabel] = [];
      }
      groups[typeLabel].push(p);
    });

    return groups;
  }, [allPeriods, yearFrom, yearTo]);

  // Clean selections if upper layers change
  const handleRow1Change = (val: string) => {
    setRow1(val);
    setRow2("");
    setRow3("");
    setRow4("");
  };

  const handleRow2Change = (val: string) => {
    setRow2(val);
    setRow3("");
    setRow4("");
  };

  const handleRow3Change = (val: string) => {
    setRow3(val);
    setRow4("");
  };

  // Zoom preset handlers
  const handleZoom = (mode: string) => {
    if (mode === "timeline") {
      setYearFrom(1814);
      setYearTo(2024);
    } else if (mode === "zoom_inn") {
      setYearFrom(1900);
      setYearTo(2024);
    } else if (mode === "100aar") {
      setYearFrom(1924);
      setYearTo(2024);
    } else if (mode === "zoom_ut") {
      setYearFrom(1600);
      setYearTo(2024);
    }
  };

  // Timeline position math helper
  const getTimelineBarPosition = (start: number | null, end: number | null) => {
    const s = start ?? yearFrom;
    const e = end ?? yearTo;
    const total = yearTo - yearFrom;
    if (total <= 0) return { left: "0%", width: "100%" };
    const leftVal = Math.max(0, Math.min(100, ((s - yearFrom) / total) * 100));
    const rightVal = Math.max(0, Math.min(100, ((e - yearFrom) / total) * 100));
    return {
      left: `${leftVal}%`,
      width: `${Math.max(2, rightVal - leftVal)}%`
    };
  };

  // Find active period details for status/timeline
  const activeRow1Period = allPeriods.find(p => p.period_slug === row1);
  const activeRow2Period = allPeriods.find(p => p.period_slug === row2);
  const activeRow3Period = allPeriods.find(p => p.period_slug === row3);
  const activeRow4Period = allPeriods.find(p => p.period_slug === row4);

  return (
    <main className={styles.page}>
      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Collectium Next.js</p>
          <h1>Periodefilter & Tidsmotor</h1>
          <p>Søkerelasjoner, periodestyrte visninger og kompakte objektkort fra NeonDB.</p>
        </div>
        <div className={styles.statusIndicator}>
          <span className={styles.statusBadge} data-tone={error ? "error" : loadingPeriods ? "warning" : "ok"}>
            {error ? "Feil" : loadingPeriods ? "Laster" : "Neon DB Aktiv"}
          </span>
        </div>
      </header>

      {error && <section className="ct-alert error">{error}</section>}

      {/* Dropdown Filters Panel */}
      <section className={styles.filterPanel}>
        <div className={styles.masterRow}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Land</span>
            <select className={styles.select} value={country} onChange={e => setCountry(e.target.value)}>
              <option value="Norge">Norge</option>
              <option value="Sverige">Sverige</option>
              <option value="Danmark">Danmark</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Type Objekt</span>
            <select className={styles.select} value={objectType} onChange={e => setObjectType(e.target.value)}>
              <option value="Verdibrev">Verdibrev</option>
              <option value="Seddel">Seddel</option>
              <option value="Mynt">Mynt</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>År Fra</span>
            <input
              className={styles.input}
              type="number"
              value={yearFrom}
              onChange={e => setYearFrom(Number(e.target.value))}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>År Til</span>
            <input
              className={styles.input}
              type="number"
              value={yearTo}
              onChange={e => setYearTo(Number(e.target.value))}
            />
          </label>
        </div>

        {/* 4-Rad Selectors */}
        <div className={styles.selectorsRow}>
          {/* Row 1 Selector */}
          <div className={`${styles.rowSelectBox} ${styles.row1}`}>
            <span>Rad 1 - Hovedperiode</span>
            <select value={row1} onChange={e => handleRow1Change(e.target.value)}>
              <option value="">Velg nasjonal hovedperiode...</option>
              {row1Options.map(p => (
                <option key={p.period_slug} value={p.period_slug}>
                  {p.display_name_no} ({p.start_year ?? "?"}-{p.end_year ?? "?"})
                </option>
              ))}
            </select>
            <p>{activeRow1Period?.summary_short_no || "Ingen valgt"}</p>
          </div>

          {/* Row 2 Selector */}
          <div className={`${styles.rowSelectBox} ${styles.row2}`}>
            <span>Rad 2 - Relasjonsperiode</span>
            <select value={row2} onChange={e => handleRow2Change(e.target.value)}>
              <option value="">Velg hovedperiode...</option>
              {row2Options.map(p => (
                <option key={p.period_slug} value={p.period_slug}>
                  {p.display_name_no} ({p.start_year ?? "?"}-{p.end_year ?? "?"})
                </option>
              ))}
            </select>
            <p>{activeRow2Period?.summary_short_no || "Ingen valgt"}</p>
          </div>

          {/* Row 3 Selector */}
          <div className={`${styles.rowSelectBox} ${styles.row3}`}>
            <span>Rad 3 - Underperiode / Relasjon</span>
            <select value={row3} onChange={e => handleRow3Change(e.target.value)}>
              <option value="">Velg underperiode / relasjon...</option>
              {row3Options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p>
              {row3.startsWith("relation:")
                ? "Konkret objektrelasjon fra NeonDB."
                : activeRow3Period?.summary_short_no || "Ingen valgt"}
            </p>
          </div>

          {/* Row 4 Selector (Valgfri) */}
          <div className={`${styles.rowSelectBox} ${styles.row4}`}>
            <span>Rad 4 - Valgfri periode</span>
            <select value={row4} onChange={e => setRow4(e.target.value)}>
              <option value="">Velg valgfri (aktiv tidslinje)...</option>
              {Object.entries(row4OptionsGrouped).map(([groupName, list]) => (
                <optgroup key={groupName} label={groupName}>
                  {list.map(p => (
                    <option key={p.period_slug} value={p.period_slug}>
                      {p.display_name_no} ({p.start_year ?? "?"}-{p.end_year ?? "?"})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p>{activeRow4Period?.summary_short_no || "Ingen valgt"}</p>
          </div>
        </div>
      </section>

      {/* Timeline Visual Track */}
      <section className={styles.timelineContainer}>
        <div className={styles.timelineHeader}>
          <h3>Periodens Tidslinje ({yearFrom} - {yearTo})</h3>
          <div className={styles.zoomButtons}>
            <button className={styles.zoomBtn} onClick={() => handleZoom("zoom_ut")}>Zoom ut</button>
            <button className={styles.zoomBtn} onClick={() => handleZoom("zoom_inn")}>Zoom inn</button>
            <button className={styles.zoomBtn} onClick={() => handleZoom("100aar")}>100 år</button>
            <button className={styles.zoomBtn} data-active="true" onClick={() => handleZoom("timeline")}>Tidslinje</button>
          </div>
        </div>

        <div className={styles.timelineTracks}>
          {/* Ruler lines */}
          <div className={styles.timelineGridLines}>
            <div className={styles.gridLine}><span className={styles.gridLineLabel}>{yearFrom}</span></div>
            <div className={styles.gridLine}><span className={styles.gridLineLabel}>{Math.floor(yearFrom + (yearTo - yearFrom) * 0.25)}</span></div>
            <div className={styles.gridLine}><span className={styles.gridLineLabel}>{Math.floor(yearFrom + (yearTo - yearFrom) * 0.5)}</span></div>
            <div className={styles.gridLine}><span className={styles.gridLineLabel}>{Math.floor(yearFrom + (yearTo - yearFrom) * 0.75)}</span></div>
            <div className={styles.gridLine}><span className={styles.gridLineLabel}>{yearTo}</span></div>
          </div>

          {/* Row 1 Track */}
          <div className={`${styles.trackRow} ${styles.row1}`}>
            <span className={styles.trackHeader}>Nasjonal</span>
            {activeRow1Period && (
              <div
                className={styles.timelineBar}
                data-active="true"
                style={getTimelineBarPosition(activeRow1Period.start_year, activeRow1Period.end_year)}
              >
                <span>{activeRow1Period.display_name_no}</span>
              </div>
            )}
          </div>

          {/* Row 2 Track */}
          <div className={`${styles.trackRow} ${styles.row2}`}>
            <span className={styles.trackHeader}>Hovedperiode</span>
            {activeRow2Period && (
              <div
                className={styles.timelineBar}
                data-active="true"
                style={getTimelineBarPosition(activeRow2Period.start_year, activeRow2Period.end_year)}
              >
                <span>{activeRow2Period.display_name_no}</span>
              </div>
            )}
          </div>

          {/* Row 3 Track */}
          <div className={`${styles.trackRow} ${styles.row3}`}>
            <span className={styles.trackHeader}>Underperiode</span>
            {activeRow3Period && (
              <div
                className={styles.timelineBar}
                data-active="true"
                style={getTimelineBarPosition(activeRow3Period.start_year, activeRow3Period.end_year)}
              >
                <span>{activeRow3Period.display_name_no}</span>
              </div>
            )}
          </div>

          {/* Row 4 Track */}
          <div className={`${styles.trackRow} ${styles.row4}`}>
            <span className={styles.trackHeader}>Valgfri</span>
            {activeRow4Period && (
              <div
                className={styles.timelineBar}
                data-active="true"
                style={getTimelineBarPosition(activeRow4Period.start_year, activeRow4Period.end_year)}
              >
                <span>{activeRow4Period.display_name_no}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results panel with inline segment controls */}
      <section className={styles.resultsHeader}>
        <div className={styles.resultsTitle}>
          <h3>Katalogresultater</h3>
          <span className={styles.resultsCount}>
            {loadingCatalog ? "Søker..." : `${catalogData?.objects?.length ?? 0} treff`}
          </span>
        </div>

        <div className={styles.controlsRow}>
          {/* Segment selection tabs */}
          <div className={styles.segmentTabs}>
            <button
              className={styles.segmentTab}
              data-active={segment === "samler"}
              onClick={() => setSegment("samler")}
            >
              Samler
            </button>
            <button
              className={styles.segmentTab}
              data-active={segment === "historie"}
              onClick={() => setSegment("historie")}
            >
              Historie
            </button>
            <button
              className={styles.segmentTab}
              data-active={segment === "finans"}
              onClick={() => setSegment("finans")}
            >
              Finans
            </button>
          </div>

          {/* View mode buttons */}
          <div className={styles.viewModes}>
            <button
              className={styles.viewBtn}
              data-active={view === "horizontal"}
              onClick={() => setView("horizontal")}
            >
              Horisontal
            </button>
            <button
              className={styles.viewBtn}
              data-active={view === "standing"}
              onClick={() => setView("standing")}
            >
              Stående
            </button>
            <button
              className={styles.viewBtn}
              data-active={view === "list"}
              onClick={() => setView("list")}
            >
              Liste
            </button>
            <button
              className={styles.viewBtn}
              data-active={view === "museum"}
              onClick={() => setView("museum")}
            >
              Museum
            </button>
          </div>
        </div>
      </section>

      {/* Grid of Results */}
      {loadingCatalog ? (
        <div className={styles.emptyState}>Laster søkeresultater fra NeonDB...</div>
      ) : catalogData?.objects && catalogData.objects.length > 0 ? (
        <section className={styles.resultsGrid} data-layout={view}>
          {catalogData.objects.map(obj => (
            <ObjectCard key={obj.object_id} obj={obj} view={view} segment={segment} />
          ))}
        </section>
      ) : (
        <div className={styles.emptyState}>Ingen objekter matcher gjeldende filtere i databasen.</div>
      )}
    </main>
  );
}

// Single card render component supporting 4 layouts
function ObjectCard({
  obj,
  view,
  segment,
}: {
  obj: CatalogObject;
  view: ViewMode;
  segment: SegmentKey;
}) {
  // Format variables beautifully
  const catalogNum = formatValue(obj.source_catalog_number, "NS-Mangler");
  const yearText = formatValue(obj.object_year_label || obj.publication_year_label, "Ukjent år");
  const marketVal = formatValue(obj.market_value_raw_no, "Mangler markedsverdi");
  const trendPercent = formatValue(obj.trend_raw_no, "+0 %");

  const ratingCountHeart = 0;
  const ratingCountStar = 0;
  const activeAuctions = obj.auction_status_raw_no ? 3 : 0;
  const activeShopSales = obj.shop_status_raw_no ? 1 : 0;

  // Facts grid inside Horisontal and Stående
  const renderFacts = () => {
    if (segment === "samler") {
      return (
        <div className={styles.segmentFacts}>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>I min samling</span>
            <span className={styles.factValue}>Nei</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Katalogstatus</span>
            <span className={styles.factValue}>Godkjent</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Sjeldenhet</span>
            <span className={styles.factValue}>{formatValue(obj.rarity_raw_no, "Ikke vurdert")}</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Kvalitet</span>
            <span className={styles.factValue}>1/1+</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Brukerstatus</span>
            <span className={styles.factValue}>Søker</span>
          </div>
        </div>
      );
    }

    if (segment === "historie") {
      return (
        <div className={styles.segmentFacts}>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Regent / konge</span>
            <span className={styles.factValue}>{formatValue(obj.ruler_name_raw_no, "Ukjent regent")}</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Årstall</span>
            <span className={styles.factValue}>{yearText}</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Historisk periode</span>
            <span className={styles.factValue}>{obj.relations.find(r => r.relation_type === "periode")?.display_name_no || "Ingen relasjon"}</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Motiv / person</span>
            <span className={styles.factValue}>{obj.relations.find(r => r.relation_type === "person")?.display_name_no || "Ikke registrert"}</span>
          </div>
          <div className={styles.factItem}>
            <span className={styles.factLabel}>Signatur</span>
            <span className={styles.factValue}>{formatValue(obj.signature_raw_no, "Mangler signatur")}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.segmentFacts}>
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Estimert verdi</span>
          <span className={styles.factValue}>{marketVal}</span>
        </div>
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Trend %</span>
          <span className={styles.factValue}>{trendPercent}</span>
        </div>
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Trendperiode</span>
          <span className={styles.factValue}>12 mnd</span>
        </div>
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Likviditet</span>
          <span className={styles.factValue}>Middels</span>
        </div>
        <div className={styles.factItem}>
          <span className={styles.factLabel}>Indexperiode</span>
          <span className={styles.factValue}>2024</span>
        </div>
      </div>
    );
  };

  // Card layouts: List
  if (view === "list") {
    return (
      <article className={`${styles.card} ${styles.listCard}`}>
        <div className={styles.listMedia}>
          <div className={styles.banknoteThumb}>
            <span className={styles.banknoteValue}>{obj.denomination_raw_no || "?"}</span>
            <span className={styles.banknoteLabel}>{yearText}</span>
          </div>
        </div>

        <div className={styles.listInfo}>
          <h4>{obj.title}</h4>
          <p>{catalogNum} &middot; {obj.object_group} &middot; {formatValue(obj.variant_type_raw_no, "Standard utgave")}</p>
        </div>

        <div className={styles.listStats}>
          <div className={styles.listStatBadge}>
            <span className={styles.actionIcon}><HeartIcon /></span>
            <em>{ratingCountHeart}</em>
          </div>
          <div className={styles.listStatBadge}>
            <span className={styles.actionIcon}><StarIcon /></span>
            <em>{ratingCountStar}</em>
          </div>
          <div className={styles.listStatBadge}>
            <span className={styles.actionIcon}><GlobeIcon /></span>
            <em>Auksjon: {activeAuctions}</em>
          </div>
          <div className={styles.listStatBadge}>
            <span className={styles.actionIcon}><TagIcon /></span>
            <em>Salg: {activeShopSales}</em>
          </div>
        </div>

        <div className={styles.listPriceBox}>
          <span>Estimert pris</span>
          <strong>{marketVal}</strong>
          <em>Trend: {trendPercent}</em>
        </div>

        <div className={styles.listActions}>
          <Link href={obj.object_href} title="Åpne objekt"><ExternalLinkIcon /></Link>
          <button type="button" title="Se relasjoner"><GitBranchIcon /></button>
          <button type="button" title="Legg til i samling"><GlobeIcon /></button>
        </div>
      </article>
    );
  }

  // Card layouts: Museum
  if (view === "museum") {
    const historicalFact = obj.relations.find(r => r.relation_type === "periode")?.display_name_no || "Ingen registrert historisk periode.";
    return (
      <article className={`${styles.card} ${styles.museumCard}`}>
        <div className={styles.museumLeft}>
          <div className={styles.banknoteThumb}>
            <span className={styles.banknoteValue}>{obj.denomination_raw_no || "?"}</span>
            <div className={styles.banknoteSeal} />
            <span className={styles.banknoteLabel}>{yearText}</span>
          </div>
        </div>
        <div className={styles.museumRight}>
          <div>
            <span className={styles.museumType}>{obj.object_group} &middot; Museum</span>
            <h4>{obj.title}</h4>
            <p className={styles.museumContext}>
              {historicalFact}. Objekttype {obj.object_group} med variant {formatValue(obj.variant_type_raw_no, "Standard utgave")} utgitt under regent {formatValue(obj.ruler_name_raw_no, "Ukjent regent")}.
            </p>
          </div>
          <div className={styles.museumFooter}>
            <div className={styles.museumActions}>
              <Link href={obj.object_href}>Åpne objekt</Link>
              <button type="button">Vis relasjoner</button>
            </div>
            {segment === "finans" && (
              <span style={{ fontSize: "11px", fontWeight: "700" }}>Verdi: {marketVal}</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Card layouts: Stående (Standing)
  if (view === "standing") {
    return (
      <article className={`${styles.card} ${styles.standingCard}`}>
        <div className={styles.standingHeader}>
          <div className={styles.banknoteThumb} style={{ width: "90px", height: "55px" }}>
            <span className={styles.banknoteValue}>{obj.denomination_raw_no || "?"}</span>
          </div>
          <div className={styles.standingInfo}>
            <h4>{obj.title}</h4>
            <div className={styles.horizontalSubtext}>
              {catalogNum} &middot; {obj.object_group} &middot; {yearText}
            </div>
          </div>
        </div>

        {renderFacts()}

        <div className={styles.standingBottom}>
          <div className={styles.standingLeft}>
            <div className={styles.statusMiniGrid}>
              <div className={styles.statusMiniItem}>
                <span><HeartIcon /></span>
                <em>{ratingCountHeart}</em>
              </div>
              <div className={styles.statusMiniItem}>
                <span><StarIcon /></span>
                <em>{ratingCountStar}</em>
              </div>
              <div className={styles.statusMiniItem}>
                <span><GlobeIcon /></span>
                <em>A: {activeAuctions}</em>
              </div>
              <div className={styles.statusMiniItem}>
                <span><TagIcon /></span>
                <em>S: {activeShopSales}</em>
              </div>
            </div>
            <div className={styles.horizontalActions}>
              <Link href={obj.object_href} title="Åpne objekt">
                <span className={styles.actionIcon}><ExternalLinkIcon /></span>
                <span>Åpne</span>
              </Link>
              <button type="button" title="Se relasjoner">
                <span className={styles.actionIcon}><GitBranchIcon /></span>
                <span>Relasjoner</span>
              </button>
            </div>
          </div>

          <div className={styles.standingRight}>
            <div className={styles.priceSection}>
              <span>Est. Verdi</span>
              <strong>{marketVal}</strong>
              <em>{trendPercent} / mnd</em>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Card layouts: Horisontal (Default)
  return (
    <article className={`${styles.card} ${styles.horizontalCard}`}>
      <div className={styles.horizontalLeft}>
        <div className={styles.horizontalTopSection}>
          <div className={styles.banknoteThumb}>
            <span className={styles.banknoteValue}>{obj.denomination_raw_no || "?"}</span>
            <div className={styles.banknoteSeal} />
            <span className={styles.banknoteLabel}>{yearText}</span>
          </div>
          <div className={styles.horizontalMeta}>
            <h4>{obj.title}</h4>
            <div className={styles.horizontalSubtext}>
              {catalogNum} &middot; {obj.object_group} &middot; {yearText}
            </div>
            <div className={styles.specRow}>
              <span className={styles.specChip}>{formatValue(obj.variant_type_raw_no, "Standard")}</span>
              <span className={styles.specChip}>{formatValue(obj.rarity_raw_no, "Vanlig")}</span>
            </div>
          </div>
        </div>

        {renderFacts()}

        <div className={styles.horizontalActions}>
          <Link href={obj.object_href}>
            <span className={styles.actionIcon}><ExternalLinkIcon /></span>
            <span>Åpne objekt</span>
          </Link>
          <button type="button">
            <span className={styles.actionIcon}><GitBranchIcon /></span>
            <span>Se relasjon</span>
          </button>
          <button type="button">
            <span className={styles.actionIcon}><GlobeIcon /></span>
            <span>Legg i samling</span>
          </button>
        </div>
      </div>

      <aside className={styles.statusColumn}>
        <div className={styles.statusMiniGrid}>
          <div className={styles.statusMiniItem} title="Ønskeliste">
            <span><HeartIcon /></span>
            <em>{ratingCountHeart}</em>
          </div>
          <div className={styles.statusMiniItem} title="Favoritt">
            <span><StarIcon /></span>
            <em>{ratingCountStar}</em>
          </div>
          <div className={styles.statusMiniItem} title="Aktive auksjoner">
            <span><GlobeIcon /></span>
            <em>{activeAuctions}</em>
          </div>
          <div className={styles.statusMiniItem} title="Aktive salg">
            <span><TagIcon /></span>
            <em>{activeShopSales}</em>
          </div>
        </div>

        <div className={styles.priceSection}>
          <span>Estimert pris</span>
          <strong>{marketVal}</strong>
          <em>Trend: {trendPercent}</em>
        </div>
      </aside>
    </article>
  );
}
