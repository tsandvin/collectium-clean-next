/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodTimelineClient
 *
 * Definering / formål:
 * React-klientkomponent som henter sanne periode-/tidslinjedata fra API og viser dem som Tidslinjeperiode.
 *
 * Bruksområde:
 * Brukes av /test/Periodetidslinje for å teste periodevisning, nivåer, relasjoner og segmentert informasjon.
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
 * log_action: render
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-CLIENT-0001 / CHANGE-2026-06-19-0001
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumPeriodTimelineClient.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type SortDirection = "asc" | "desc";
type LevelFilter = "all" | "1" | "2" | "3";

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

const SEGMENTS: Array<{ key: SegmentKey; label: string }> = [
  { key: "samler", label: "Samler" },
  { key: "historie", label: "Historie" },
  { key: "finans", label: "Finans" },
];

const LEVELS: Array<{ key: LevelFilter; label: string }> = [
  { key: "all", label: "Alle nivåer" },
  { key: "1", label: "Nivå 1" },
  { key: "2", label: "Nivå 2" },
  { key: "3", label: "Nivå 3" },
];

function yearLabel(startYear: number | null, endYear: number | null) {
  if (startYear == null && endYear == null) return "Udatert";
  if (startYear != null && endYear == null) return `${startYear} ->`;
  if (startYear == null && endYear != null) return `-> ${endYear}`;
  if (startYear === endYear) return String(startYear);
  return `${startYear} -> ${endYear}`;
}

function levelLabel(level: number | null) {
  if (level === 1) return "Nivå 1 · nasjonal hovedperiode";
  if (level === 2) return "Nivå 2 · tematisk hovedperiode";
  if (level === 3) return "Nivå 3 · objektperiode / relasjon";
  return "Nivå ikke satt";
}

function rowSortValue(row: PeriodTimelineRow) {
  if (row.start_year == null) return Number.MAX_SAFE_INTEGER;
  return row.start_year;
}

function pickFirstRow(rows: PeriodTimelineRow[]) {
  return rows.length > 0 ? rows[0] : null;
}

export function CollectiumPeriodTimelineClient() {
  const [data, setData] = useState<PeriodTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [onlyObjectRelations, setOnlyObjectRelations] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [activeSegment, setActiveSegment] = useState<SegmentKey>("historie");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTimeline() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/test/period-timeline", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const payload = (await response.json()) as PeriodTimelineResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Kunne ikke hente tidslinjeperiode-data.");
        }

        if (!active) return;
        setData(payload);
        setSelectedSlug(pickFirstRow(payload.rows)?.period_slug ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Ukjent feil ved henting av tidslinjeperiode.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTimeline();

    return () => {
      active = false;
    };
  }, []);

  const visibleRows = useMemo(() => {
    const rows = data?.rows ?? [];

    return rows
      .filter((row) => {
        if (levelFilter !== "all" && String(row.period_level ?? "") !== levelFilter) return false;
        if (onlyObjectRelations) {
          const hasObjectCount = typeof row.object_count === "number" && row.object_count > 0;
          const hasRelationCount = typeof row.relation_count === "number" && row.relation_count > 0;
          return hasObjectCount || hasRelationCount || Boolean(row.relation_href);
        }
        return true;
      })
      .sort((a, b) => {
        const diff = rowSortValue(a) - rowSortValue(b);
        if (diff !== 0) return sortDirection === "asc" ? diff : -diff;
        return (a.display_name_no || "").localeCompare(b.display_name_no || "", "nb");
      });
  }, [data?.rows, levelFilter, onlyObjectRelations, sortDirection]);

  const selectedRow = useMemo(() => {
    if (!visibleRows.length) return null;
    return visibleRows.find((row) => row.period_slug === selectedSlug) ?? visibleRows[0];
  }, [selectedSlug, visibleRows]);

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.loadingState}>Henter Tidslinjeperiode fra Neon/API...</section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.errorState}>
          <p className={styles.eyebrow}>Tidslinjeperiode</p>
          <h1 className={styles.title}>Kunne ikke hente periodegrunnlag</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <p className={styles.eyebrow}>Tidslinjeperiode</p>
          <h1 className={styles.title}>Ingen perioder funnet</h1>
          <p>API-et svarte, men returnerte ingen perioder fra Neon.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Collectium · test</p>
        <h1 className={styles.title}>Tidslinjeperiode</h1>
        <p className={styles.subtitle}>
          Historiske perioder, objektperioder og relasjoner vist som tidslinje fra Neon-data.
        </p>
      </section>

      <section className={styles.statusGrid} aria-label="Tidslinjeperiode status">
        <article className={styles.statusCard}>
          <span>Perioder</span>
          <strong>{data.summary.totalPeriods}</strong>
        </article>
        <article className={styles.statusCard}>
          <span>Relasjonstyper</span>
          <strong>{data.summary.relationTypeCount}</strong>
        </article>
        <article className={styles.statusCard}>
          <span>Relation href</span>
          <strong>{data.summary.periodsWithRelationHref}</strong>
        </article>
        <article className={styles.statusCard}>
          <span>Datakilde</span>
          <strong>{data.source}</strong>
        </article>
        <article className={styles.statusCard}>
          <span>API-status</span>
          <strong>{data.ok ? "OK" : "Feil"}</strong>
        </article>
      </section>

      {data.warnings.length > 0 ? (
        <section className={styles.emptyState} aria-label="API-varsler">
          <strong>Varsler fra API:</strong> {data.warnings.join(" · ")}
        </section>
      ) : null}

      <section className={styles.toolbar} aria-label="Tidslinjeperiode kontroller">
        <div className={styles.toolbarGroup}>
          {LEVELS.map((level) => (
            <button
              key={level.key}
              type="button"
              className={`${styles.chip} ${levelFilter === level.key ? styles.chipActive : ""}`}
              aria-pressed={levelFilter === level.key}
              onClick={() => setLevelFilter(level.key)}
            >
              {level.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={`${styles.chip} ${onlyObjectRelations ? styles.chipActive : ""}`}
            aria-pressed={onlyObjectRelations}
            onClick={() => setOnlyObjectRelations((value) => !value)}
          >
            Bare objektkobling
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => setSortDirection((value) => (value === "asc" ? "desc" : "asc"))}
          >
            Sorter {sortDirection === "asc" ? "stigende" : "synkende"}
          </button>
        </div>
      </section>

      <section className={styles.timelineShell} aria-label="Historisk tidslinje">
        <div className={styles.timelineRail} aria-hidden="true" />
        {visibleRows.length === 0 ? (
          <div className={styles.emptyState}>Ingen perioder passer valgte visningskontroller.</div>
        ) : (
          visibleRows.map((row) => {
            const isActive = row.period_slug === selectedRow?.period_slug;
            return (
              <article key={`${row.period_slug}-${row.start_year}-${row.end_year}`} className={styles.timelineItem}>
                <button
                  type="button"
                  className={styles.timelineMarker}
                  aria-label={`Velg ${row.display_name_no || "periode"}`}
                  aria-pressed={isActive}
                  onClick={() => setSelectedSlug(row.period_slug)}
                />
                <button
                  type="button"
                  className={`${styles.timelineCard} ${isActive ? styles.timelineCardActive : ""}`}
                  onClick={() => setSelectedSlug(row.period_slug)}
                >
                  <span className={styles.timelineMeta}>{yearLabel(row.start_year, row.end_year)}</span>
                  <strong>{row.display_name_no || row.period_slug || "Uten navn"}</strong>
                  <span className={styles.levelBadge}>{levelLabel(row.period_level)}</span>
                  <span>{row.period_type_label_no || row.period_type_key || "Ukjent periodetype"}</span>
                  {row.summary_short_no ? <small>{row.summary_short_no}</small> : null}
                </button>
              </article>
            );
          })
        )}
      </section>

      <section className={styles.segmentPanel} aria-label="Segmentert periodeinformasjon">
        <div className={styles.segmentTabs}>
          {SEGMENTS.map((segment) => (
            <button
              key={segment.key}
              type="button"
              className={`${styles.segmentButton} ${activeSegment === segment.key ? styles.segmentButtonActive : ""}`}
              aria-pressed={activeSegment === segment.key}
              onClick={() => setActiveSegment(segment.key)}
            >
              {segment.label}
            </button>
          ))}
        </div>

        <div className={styles.segmentBody}>
          {selectedRow ? (
            <PeriodSegmentContent row={selectedRow} segment={activeSegment} />
          ) : (
            <p>Velg en periode i tidslinjen.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function PeriodSegmentContent({ row, segment }: { row: PeriodTimelineRow; segment: SegmentKey }) {
  const name = row.display_name_no || row.period_slug || "Valgt periode";

  if (segment === "samler") {
    return (
      <div>
        <h2>{name}</h2>
        <p>
          Samlersegmentet viser objektkoblinger, kilde, objekttype og samlerrelevans når dette finnes i Neon/API.
        </p>
        <dl>
          <div>
            <dt>Objektkoblinger</dt>
            <dd>{row.object_count ?? "Ikke tilgjengelig"}</dd>
          </div>
          <div>
            <dt>Relasjonskoblinger</dt>
            <dd>{row.relation_count ?? "Ikke tilgjengelig"}</dd>
          </div>
          <div>
            <dt>Collectium-relevans</dt>
            <dd>{row.collectium_relevance_no || "Ikke registrert"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (segment === "finans") {
    return (
      <div>
        <h2>{name}</h2>
        <p>
          Finanssegmentet skal senere koble perioden mot marked, index, verdiutvikling og økonomisk kontekst.
        </p>
        <dl>
          <div>
            <dt>Marked / index</dt>
            <dd>{row.timeline_group || "Ikke vurdert"}</dd>
          </div>
          <div>
            <dt>Verdi</dt>
            <dd>Mangler markedsverdi</dd>
          </div>
          <div>
            <dt>Trend</dt>
            <dd>Ikke vurdert</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div>
      <h2>{name}</h2>
      <p>{row.summary_short_no || "Historisk beskrivelse er ikke registrert for denne perioden."}</p>
      <dl>
        <div>
          <dt>Periode</dt>
          <dd>{yearLabel(row.start_year, row.end_year)}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{row.period_type_label_no || row.period_type_key || "Ikke registrert"}</dd>
        </div>
        <div>
          <dt>Nivå</dt>
          <dd>{levelLabel(row.period_level)}</dd>
        </div>
        <div>
          <dt>Forelder</dt>
          <dd>{row.parent_period_slug || "Ingen forelder registrert"}</dd>
        </div>
      </dl>
      {row.relation_href ? (
        <a className={styles.relationLink} href={row.relation_href}>
          Åpne relasjon
        </a>
      ) : null}
    </div>
  );
}
