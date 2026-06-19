"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter UI/UX 8.6 - tre-niva periode- og relasjonsmotor
 *
 * Definering / formal:
 * Testside for periodefilter der Rad 1, Rad 2 og Rad 3 bygges fra API-data,
 * uten lokal sidemeny, lokal topbar eller egen designmotor.
 *
 * Bruksomrade:
 * Brukes av /test/periodefilter for a kontrollere periodefiltermodell,
 * objektkoblinger og segmentvisning.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte API-ruter:
 * - GET /api/filter/period/options
 * - GET /api/test/period-catalog
 *
 * Berorte DB/views:
 * - ct_period_filter_registry
 * - ct_period_filter_value_registry
 * - ct_v_period_filter_options
 * - ct_v_period_filter_registry_active
 * - ct_catalog_period_relations
 * - ct_v_catalog_period_relations
 * - ct_sn_period_relation
 * - ct_sn_period_relation_links
 * - ct_sn_period_type_registry
 * - ct_v_period_filter_find_relations
 * - ct_v_object_relations_resolved
 * - ct_v_object_presentation_resolved
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Endring:
 * Erstatter flat/firedelt tidslinje med en ryddig tre-raders periodebane.
 * Valg som allerede er brukt pa hoyere niva fjernes fra lavere niva, og
 * overlappende data vises som kontekst i stedet for dupliserte filtervalg.
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type OptionKind = "period" | "relation";
type PeriodStatus = "OK" | "Varsel" | "Feil";

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
  message?: string;
  rows: PeriodOption[];
  relationNodes?: RelationNode[];
  updatedAt?: string;
};

type CatalogRelation = {
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
  segment_summary: string;
  relations: CatalogRelation[];
};

type CatalogApiResponse = {
  ok: boolean;
  count: number;
  objects: CatalogObject[];
};

type EngineOption = {
  id: string;
  slug: string;
  label: string;
  group: string;
  kind: OptionKind;
  level: number | null;
  parentSlug: string | null;
  startYear: number | null;
  endYear: number | null;
  summary: string | null;
  relevance: string | null;
  href: string | null;
  relationType?: string;
  relationCount?: number;
};

const segmentLabels: Record<SegmentKey, string> = {
  samler: "Samler",
  historie: "Historie",
  finans: "Finans",
};

function cleanText(value: string | null | undefined, fallback = "Ikke vurdert") {
  const normalized = value?.trim();
  return normalized && normalized !== "0" && normalized !== "0 kr" ? normalized : fallback;
}

function labelFromKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function periodLabel(period: PeriodOption) {
  return cleanText(period.display_name_no, labelFromKey(period.period_slug));
}

function yearText(startYear: number | null, endYear: number | null) {
  if (startYear == null && endYear == null) return "Tidsrom mangler";
  if (startYear != null && endYear != null) return `${startYear}-${endYear}`;
  if (startYear != null) return `${startYear}-`;
  return `-${endYear}`;
}

function hasYearOverlap(a: EngineOption | null, b: EngineOption | null) {
  if (!a || !b) return false;
  if (a.startYear == null || a.endYear == null || b.startYear == null || b.endYear == null) {
    return false;
  }

  return a.startYear <= b.endYear && a.endYear >= b.startYear;
}

function toPeriodOption(period: PeriodOption): EngineOption {
  return {
    id: `period:${period.period_slug}`,
    slug: period.period_slug,
    label: periodLabel(period),
    group: cleanText(period.period_type_label_no || period.period_type_key, "Periode"),
    kind: "period",
    level: period.period_level,
    parentSlug: period.parent_period_slug,
    startYear: period.start_year,
    endYear: period.end_year,
    summary: period.summary_short_no,
    relevance: period.collectium_relevance_no,
    href: period.relation_href,
  };
}

function toRelationOption(relation: RelationNode): EngineOption {
  return {
    id: `relation:${relation.relation_type}:${relation.relation_slug}`,
    slug: `${relation.relation_type}:${relation.relation_slug}`,
    label: cleanText(relation.relation_label_no, labelFromKey(relation.relation_slug)),
    group: `Relasjon: ${labelFromKey(relation.relation_type)}`,
    kind: "relation",
    level: 3,
    parentSlug: null,
    startYear: null,
    endYear: null,
    summary: `${relation.relation_count.toLocaleString("nb-NO")} objektkoblinger`,
    relevance: "Konkret objektrelasjon fra API.",
    href: relation.relation_href,
    relationType: relation.relation_type,
    relationCount: relation.relation_count,
  };
}

function uniqueBySlug(options: EngineOption[]) {
  const seen = new Set<string>();
  const unique: EngineOption[] = [];

  for (const option of options) {
    const key = option.slug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(option);
  }

  return unique;
}

function sortByPeriodShape(a: EngineOption, b: EngineOption) {
  const levelA = a.level ?? 99;
  const levelB = b.level ?? 99;
  if (levelA !== levelB) return levelA - levelB;

  const startA = a.startYear ?? 999999;
  const startB = b.startYear ?? 999999;
  if (startA !== startB) return startA - startB;

  return a.label.localeCompare(b.label, "nb");
}

function optionMatchesSearch(option: EngineOption, words: string[]) {
  if (words.length === 0) return true;

  const haystack = [
    option.label,
    option.group,
    option.summary,
    option.relevance,
    option.relationType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return words.some((word) => word.length > 3 && haystack.includes(word));
}

function buildRows(periods: PeriodOption[], relations: RelationNode[], selectedRow1Id: string, selectedRow2Id: string) {
  const periodOptions = uniqueBySlug(periods.filter((period) => period.period_slug).map(toPeriodOption)).sort(sortByPeriodShape);
  const relationOptions = uniqueBySlug(relations.filter((relation) => relation.relation_slug).map(toRelationOption)).sort((a, b) => {
    return (b.relationCount ?? 0) - (a.relationCount ?? 0);
  });

  const row1Options = periodOptions.filter((option) => {
    if (option.kind !== "period") return false;
    return option.level === 1 || option.parentSlug == null;
  });

  const selectedRow1 = row1Options.find((option) => option.id === selectedRow1Id) ?? row1Options[0] ?? null;
  const usedAfterRow1 = new Set(selectedRow1 ? [selectedRow1.slug.toLowerCase()] : []);

  const row2Words = [selectedRow1?.label, selectedRow1?.group, selectedRow1?.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/);

  const row2Options = periodOptions
    .filter((option) => {
      if (usedAfterRow1.has(option.slug.toLowerCase())) return false;
      if (option.level != null && option.level <= 1) return false;
      if (!selectedRow1) return option.level === 2;
      return option.parentSlug === selectedRow1.slug || option.level === 2 || hasYearOverlap(option, selectedRow1) || optionMatchesSearch(option, row2Words);
    })
    .slice(0, 36);

  const selectedRow2 = row2Options.find((option) => option.id === selectedRow2Id) ?? row2Options[0] ?? null;
  const usedAfterRow2 = new Set(usedAfterRow1);
  if (selectedRow2) usedAfterRow2.add(selectedRow2.slug.toLowerCase());

  const row3Words = [selectedRow1?.label, selectedRow2?.label, selectedRow2?.group, selectedRow2?.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/);

  const row3Periods = periodOptions.filter((option) => {
    if (usedAfterRow2.has(option.slug.toLowerCase())) return false;
    if (!selectedRow2) return option.level != null && option.level >= 3;
    return option.parentSlug === selectedRow2.slug || (option.level != null && option.level >= 3 && (hasYearOverlap(option, selectedRow2) || optionMatchesSearch(option, row3Words)));
  });

  const row3Relations = relationOptions.filter((option) => {
    if (usedAfterRow2.has(option.slug.toLowerCase())) return false;
    return optionMatchesSearch(option, row3Words) || row3Periods.length < 12;
  });

  const row3Options = uniqueBySlug([...row3Periods, ...row3Relations]).slice(0, 48);

  return {
    row1Options,
    row2Options,
    row3Options,
    selectedRow1,
    selectedRow2,
  };
}

function statusFromState(loading: boolean, error: string | null, rowCount: number): PeriodStatus {
  if (error) return "Feil";
  if (loading || rowCount === 0) return "Varsel";
  return "OK";
}

function statusTone(status: PeriodStatus) {
  if (status === "OK") return "ok";
  if (status === "Feil") return "error";
  return "warning";
}

function compactObjects(objects: CatalogObject[]) {
  return objects.slice(0, 6);
}

export default function CollectiumPeriodFilterTest() {
  const [periodData, setPeriodData] = useState<PeriodApiResponse | null>(null);
  const [catalogData, setCatalogData] = useState<CatalogApiResponse | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [row1Id, setRow1Id] = useState("");
  const [row2Id, setRow2Id] = useState("");
  const [row3Id, setRow3Id] = useState("");
  const [segment, setSegment] = useState<SegmentKey>("historie");

  useEffect(() => {
    let mounted = true;

    async function loadPeriods() {
      try {
        setLoadingPeriods(true);
        const response = await fetch("/api/filter/period/options", { cache: "no-store" });
        const json = (await response.json()) as PeriodApiResponse;

        if (!mounted) return;

        setPeriodData(json);
        setError(response.ok && json.ok ? null : json.message || "Periodefilter-API svarte med feil.");
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Ukjent feil ved lasting av periodefilter.");
      } finally {
        if (mounted) setLoadingPeriods(false);
      }
    }

    void loadPeriods();

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    return buildRows(periodData?.rows ?? [], periodData?.relationNodes ?? [], row1Id, row2Id);
  }, [periodData?.rows, periodData?.relationNodes, row1Id, row2Id]);

  useEffect(() => {
    if (!rows.selectedRow1) return;
    if (row1Id !== rows.selectedRow1.id) {
      setRow1Id(rows.selectedRow1.id);
      setRow2Id("");
      setRow3Id("");
    }
  }, [row1Id, rows.selectedRow1]);

  useEffect(() => {
    if (!rows.selectedRow2) return;
    if (row2Id !== rows.selectedRow2.id) {
      setRow2Id(rows.selectedRow2.id);
      setRow3Id("");
    }
  }, [row2Id, rows.selectedRow2]);

  const selectedRow3 = rows.row3Options.find((option) => option.id === row3Id) ?? rows.row3Options[0] ?? null;

  useEffect(() => {
    if (!selectedRow3) return;
    if (row3Id !== selectedRow3.id) {
      setRow3Id(selectedRow3.id);
    }
  }, [row3Id, selectedRow3]);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      try {
        setLoadingCatalog(true);

        const params = new URLSearchParams({
          source_key: "norske_sedler",
          object_group: "banknote",
          segment,
          limit: "40",
        });

        if (selectedRow3?.kind === "relation" && selectedRow3.relationType) {
          const relationSlug = selectedRow3.slug.split(":").slice(1).join(":");
          params.set("relation_type", selectedRow3.relationType);
          params.set("relation_slug", relationSlug);
        }

        if (selectedRow3?.kind === "period") {
          if (selectedRow3.startYear != null) params.set("year_from", String(selectedRow3.startYear));
          if (selectedRow3.endYear != null) params.set("year_to", String(selectedRow3.endYear));
        }

        const response = await fetch(`/api/test/period-catalog?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await response.json()) as CatalogApiResponse;

        if (!mounted) return;
        setCatalogData(response.ok && json.ok ? json : { ok: false, count: 0, objects: [] });
      } catch {
        if (!mounted) return;
        setCatalogData({ ok: false, count: 0, objects: [] });
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    }

    void loadCatalog();

    return () => {
      mounted = false;
    };
  }, [segment, selectedRow3]);

  const status = statusFromState(loadingPeriods, error, periodData?.rows.length ?? 0);
  const catalogObjects = catalogData?.objects ?? [];
  const resultObjects = catalogObjects;
  const visibleObjects = compactObjects(catalogObjects);
  const selectedPath = [rows.selectedRow1, rows.selectedRow2, selectedRow3].filter(Boolean) as EngineOption[];
  const usedSlugs = new Set(selectedPath.map((option) => option.slug.toLowerCase()));

  const contextOptions = useMemo(() => {
    const periodOptions = (periodData?.rows ?? []).map(toPeriodOption);
    return periodOptions
      .filter((option) => {
        if (usedSlugs.has(option.slug.toLowerCase())) return false;
        return hasYearOverlap(option, rows.selectedRow1) || hasYearOverlap(option, rows.selectedRow2);
      })
      .sort(sortByPeriodShape)
      .slice(0, 8);
  }, [periodData?.rows, rows.selectedRow1, rows.selectedRow2, usedSlugs]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Collectium tidsmotor</p>
          <h1>Periodefilter</h1>
          <p>Tidsmotor for katalog, relasjoner, index og objektpresentasjon.</p>
        </div>
        <div className={styles.heroMeta}>
          <span data-tone={statusTone(status)}>{status}</span>
          <small>{periodData?.updatedAt ? new Date(periodData.updatedAt).toLocaleString("nb-NO") : "API ikke oppdatert"}</small>
        </div>
      </section>

      {error ? <section className={styles.errorBox}>{error}</section> : null}

      <section className={styles.statusGrid} aria-label="Periodefilter status">
        <StatusCard label="Periodemotor" value={status} detail="/api/filter/period/options" tone={statusTone(status)} />
        <StatusCard label="Antall perioder" value={String(periodData?.rows.length ?? 0)} detail="fra API/Neon" />
        <StatusCard label="Antall objektrelasjoner" value={String(periodData?.relationNodes?.length ?? 0)} detail="relasjonsnoder" />
        <StatusCard label="Valgt hovedperiode" value={rows.selectedRow1?.label ?? "Ikke valgt"} detail={rows.selectedRow1 ? yearText(rows.selectedRow1.startYear, rows.selectedRow1.endYear) : "Mangler"} />
        <StatusCard label="Valgt objektperiode" value={selectedRow3?.label ?? "Ikke valgt"} detail={selectedRow3?.group ?? "Mangler"} />
        <StatusCard label="Resultater" value={loadingCatalog ? "Henter" : String(resultObjects.length || catalogObjects.length)} detail={segmentLabels[segment]} />
      </section>

      <section className={styles.enginePanel}>
        <div className={styles.engineHeader}>
          <div>
            <p className={styles.eyebrow}>Periode-/relasjonsmotor</p>
            <h2>Tre nivaer, en filterbane</h2>
          </div>
          <div className={styles.pathSummary} aria-label="Valgt filterbane">
            {selectedPath.map((option, index) => (
              <span key={option.id}>{index + 1}. {option.label}</span>
            ))}
          </div>
        </div>

        <FilterRow
          title="Rad 1"
          subtitle="Nasjonal hovedperiode"
          options={rows.row1Options}
          selectedId={rows.selectedRow1?.id ?? ""}
          onSelect={(id) => {
            setRow1Id(id);
            setRow2Id("");
            setRow3Id("");
          }}
          tone="row1"
        />

        <FilterRow
          title="Rad 2"
          subtitle="Hovedperiode / tematisk periode"
          options={rows.row2Options}
          selectedId={rows.selectedRow2?.id ?? ""}
          onSelect={(id) => {
            setRow2Id(id);
            setRow3Id("");
          }}
          tone="row2"
        />

        <FilterRow
          title="Rad 3"
          subtitle="Objektperiode / konkret relasjon"
          options={rows.row3Options}
          selectedId={selectedRow3?.id ?? ""}
          onSelect={setRow3Id}
          tone="row3"
        />

        <section className={styles.contextStrip} aria-label="Relasjoner og overlapp">
          <div>
            <p className={styles.eyebrow}>Kontekst, ikke duplikat</p>
            <strong>Overlappende perioder vises som relasjoner</strong>
          </div>
          <div className={styles.contextChips}>
            {contextOptions.length > 0 ? (
              contextOptions.map((option) => (
                <span key={option.id}>{option.label}</span>
              ))
            ) : (
              <span>Ingen overlappende kontekst fra API</span>
            )}
          </div>
        </section>
      </section>

      <section className={styles.resultPanel}>
        <div className={styles.segmentTabs} aria-label="Dynamisk felt">
          {(["samler", "historie", "finans"] as SegmentKey[]).map((key) => (
            <button key={key} type="button" data-active={segment === key} aria-pressed={segment === key} onClick={() => setSegment(key)}>
              {segmentLabels[key]}
            </button>
          ))}
        </div>

        <div className={styles.resultGrid}>
          <article className={styles.detailCard}>
            <p className={styles.eyebrow}>{segmentLabels[segment]}</p>
            <h2>{segmentTitle(segment)}</h2>
            {renderSegmentFacts(segment, rows.selectedRow1, rows.selectedRow2, selectedRow3, visibleObjects)}
          </article>

          <article className={styles.objectList}>
            <div className={styles.objectListHeader}>
              <div>
                <p className={styles.eyebrow}>Relevante objekter</p>
                <h2>{loadingCatalog ? "Henter katalog" : `${visibleObjects.length} vist`}</h2>
              </div>
              <span>{resultObjects.length || catalogObjects.length} treffgrunnlag</span>
            </div>

            {visibleObjects.length > 0 ? (
              visibleObjects.map((object) => <ObjectCard key={`${object.source_key}:${object.object_group}:${object.object_id}`} object={object} segment={segment} />)
            ) : (
              <p className={styles.emptyState}>Ingen katalogobjekter returnert fra API for valgt segment.</p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

function FilterRow(props: {
  title: string;
  subtitle: string;
  options: EngineOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  tone: "row1" | "row2" | "row3";
}) {
  return (
    <section className={styles.filterRow} data-tone={props.tone}>
      <div className={styles.rowLabel}>
        <span>{props.title}</span>
        <strong>{props.subtitle}</strong>
      </div>
      <div className={styles.chipScroller}>
        {props.options.length > 0 ? (
          props.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.periodChip}
              data-active={props.selectedId === option.id}
              data-kind={option.kind}
              aria-pressed={props.selectedId === option.id}
              onClick={() => props.onSelect(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.group} - {yearText(option.startYear, option.endYear)}</span>
            </button>
          ))
        ) : (
          <span className={styles.emptyChip}>Ingen valg returnert fra API</span>
        )}
      </div>
    </section>
  );
}

function StatusCard(props: { label: string; value: string; detail: string; tone?: "ok" | "warning" | "error" }) {
  return (
    <article className={styles.statusCard} data-tone={props.tone ?? "neutral"}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <small>{props.detail}</small>
    </article>
  );
}

function Fact(props: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function segmentTitle(segment: SegmentKey) {
  if (segment === "samler") return "Objekt- og samlerfelt";
  if (segment === "finans") return "Marked og index";
  return "Historisk kontekst";
}

function renderSegmentFacts(
  segment: SegmentKey,
  row1: EngineOption | null,
  row2: EngineOption | null,
  row3: EngineOption | null,
  objects: CatalogObject[],
) {
  const firstObject = objects[0] ?? null;
  const relationHref = row3?.href ?? row2?.href ?? row1?.href ?? firstObject?.relations.find((relation) => relation.href)?.href ?? null;

  if (segment === "samler") {
    return (
      <>
        <Fact label="Kilde" value={cleanText(firstObject?.source_key, "Mangler kilde")} />
        <Fact label="Objekttype" value={cleanText(firstObject?.object_group, "Mangler objekttype")} />
        <Fact label="Valor" value={cleanText(firstObject?.denomination_raw_no, "Mangler valor")} />
        <Fact label="Utgave" value={cleanText(firstObject?.denomination_issue_raw_no, "Mangler utgave")} />
        <Fact label="Variant" value={cleanText(firstObject?.variant_type_raw_no, "Mangler variant")} />
        <Fact label="Sjeldenhet" value={cleanText(firstObject?.rarity_raw_no, "Ikke vurdert")} />
        <Fact label="Samlerstatus" value="Ikke vurdert" />
      </>
    );
  }

  if (segment === "finans") {
    return (
      <>
        <Fact label="Verdi" value={cleanText(firstObject?.market_value_raw_no, "Mangler markedsverdi")} />
        <Fact label="Trend" value={cleanText(firstObject?.trend_raw_no, "Ikke vurdert")} />
        <Fact label="Marked/index" value={cleanText(firstObject?.auction_status_raw_no ?? firstObject?.shop_status_raw_no, "Ikke vurdert")} />
        <Fact label="Periode" value={row3 ? `${row3.label} - ${yearText(row3.startYear, row3.endYear)}` : "Ikke valgt"} />
      </>
    );
  }

  return (
    <>
      <Fact label="Historisk kontekst" value={cleanText(row2?.summary ?? row1?.summary, "Mangler kontekst")} />
      <Fact label="Regent/konge" value={cleanText(firstObject?.ruler_name_raw_no, "Mangler regent")} />
      <Fact label="Periode" value={row1 ? `${row1.label} - ${yearText(row1.startYear, row1.endYear)}` : "Ikke valgt"} />
      <Fact label="Hendelser" value={cleanText(row3?.summary ?? row3?.relevance, "Ikke vurdert")} />
      <Fact label="Relasjoner" value={String(firstObject?.relations.length ?? 0)} />
      <Fact label="relation_href" value={cleanText(relationHref, "Ikke returnert")} />
    </>
  );
}

function ObjectCard({ object, segment }: { object: CatalogObject; segment: SegmentKey }) {
  return (
    <article className={styles.objectCard}>
      <div>
        <strong>{object.title}</strong>
        <span>{cleanText(object.source_catalog_number, "Uten katalognummer")}</span>
      </div>
      <dl>
        {segment === "samler" ? (
          <>
            <FactLine label="Valor" value={cleanText(object.denomination_raw_no, "Mangler")} />
            <FactLine label="Utgave" value={cleanText(object.denomination_issue_raw_no, "Mangler")} />
            <FactLine label="Variant" value={cleanText(object.variant_type_raw_no, "Mangler")} />
            <FactLine label="Sjeldenhet" value={cleanText(object.rarity_raw_no, "Ikke vurdert")} />
          </>
        ) : null}
        {segment === "historie" ? (
          <>
            <FactLine label="Regent" value={cleanText(object.ruler_name_raw_no, "Mangler")} />
            <FactLine label="Ar" value={cleanText(object.object_year_label ?? object.publication_year_label, "Mangler")} />
            <FactLine label="Relasjoner" value={String(object.relations.length)} />
          </>
        ) : null}
        {segment === "finans" ? (
          <>
            <FactLine label="Verdi" value={cleanText(object.market_value_raw_no, "Mangler markedsverdi")} />
            <FactLine label="Trend" value={cleanText(object.trend_raw_no, "Ikke vurdert")} />
            <FactLine label="Marked" value={cleanText(object.auction_status_raw_no ?? object.shop_status_raw_no, "Ikke vurdert")} />
          </>
        ) : null}
      </dl>
    </article>
  );
}

function FactLine(props: { label: string; value: string }) {
  return (
    <>
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </>
  );
}
