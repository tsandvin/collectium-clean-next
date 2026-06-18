"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest UI/UX 8.6 - masterfilter, anker og periodetidslinje
 *
 * Definering / formal:
 * React-komponent for /test/periodefilter. Testen viser Filter Master som styrende lag,
 * Rad 1 som anker, Rad 2 som kontekst og Rad 3 som konkret undernode nar data finnes.
 * I tillegg viser siden periodetidslinje for valgt Rad 1 -> Rad 2 -> Rad 3.
 *
 * Bruksomrade:
 * Brukes av /test/periodefilter.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte DB-brytere / feature_keys:
 * - filter.master.resolve
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - object.relations.view
 * - catalog.source.scope.view
 *
 * Berorte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berorte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_master_timeline_test_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0005 / CHANGE-2026-06-18-0003
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type AnchorKind = "periode" | "regent" | "person" | "ar" | "kilde" | "utgave" | "valor" | "variant";
type MasterFocus = "katalog" | "periode" | "relasjon" | "samling" | "marked";

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

type RelationSummary = {
  relation_type: string;
  relation_count: number;
};

type PeriodApiResponse = {
  ok: boolean;
  message?: string;
  rows: PeriodOption[];
  relationNodes?: RelationNode[];
  relationSummary?: RelationSummary[];
  updatedAt?: string;
};

type UiNode = {
  key: string;
  slug: string;
  label: string;
  type: string;
  typeLabel: string;
  startYear: number | null;
  endYear: number | null;
  parentSlug: string | null;
  summary: string | null;
  relevance: string | null;
  href: string | null;
  count: number | null;
  source: "period" | "relation" | "context";
  rawType?: string;
};

const MASTER_FOCUS_OPTIONS: Array<{ key: MasterFocus; label: string; help: string }> = [
  { key: "katalog", label: "Katalog", help: "Kilde, objekttype, utgave, valør, variant" },
  { key: "periode", label: "Periode", help: "År, hovedperiode, underperiode, hendelser" },
  { key: "relasjon", label: "Relasjon", help: "Regent, person, kilde, motiv, funn" },
  { key: "samling", label: "Samling", help: "Brukerstatus, min samling, stjerne, ønskeliste" },
  { key: "marked", label: "Marked", help: "Verdi, trend, auksjon, nettbutikk, indeks" },
];

const ANCHORS: Array<{ key: AnchorKind; label: string; help: string; focus: MasterFocus[] }> = [
  { key: "periode", label: "Periode", help: "Nasjonal/historisk hovedperiode", focus: ["periode", "relasjon"] },
  { key: "regent", label: "Konge / regent", help: "Haakon VII, Olav V, Oscar II", focus: ["relasjon", "periode"] },
  { key: "person", label: "Person / signatur", help: "Signaturer og personer", focus: ["relasjon", "katalog"] },
  { key: "ar", label: "År / publiseringsår", help: "Årstall som relasjon", focus: ["periode", "katalog", "marked"] },
  { key: "kilde", label: "Kilde", help: "Norske sedler og senere andre kilder", focus: ["katalog", "relasjon"] },
  { key: "utgave", label: "Utgave", help: "Utgave/serie som relasjon", focus: ["katalog", "periode"] },
  { key: "valor", label: "Valør", help: "Valør som relasjon", focus: ["katalog", "marked"] },
  { key: "variant", label: "Variant", help: "Variant/type som relasjon", focus: ["katalog", "samling"] },
];

const RELATION_LABELS: Record<string, string> = {
  ar: "År",
  publiseringsar: "Publiseringsår",
  regent: "Konge / regent",
  person: "Person / signatur",
  kilde: "Kilde",
  utgave: "Utgave",
  valor: "Valør",
  variant: "Variant",
};

function textLabel(value: string): string {
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function periodToNode(row: PeriodOption): UiNode {
  return {
    key: `period:${row.period_slug}`,
    slug: row.period_slug,
    label: row.display_name_no || textLabel(row.period_slug),
    type: row.period_type_key || "periode",
    typeLabel: row.period_type_label_no || row.period_type_key || "Periode",
    startYear: row.start_year,
    endYear: row.end_year,
    parentSlug: row.parent_period_slug,
    summary: row.summary_short_no,
    relevance: row.collectium_relevance_no,
    href: row.relation_href,
    count: null,
    source: "period",
    rawType: row.period_type_key || undefined,
  };
}

function relationToNode(row: RelationNode): UiNode {
  const typeLabel = RELATION_LABELS[row.relation_type] || textLabel(row.relation_type);
  const year = row.relation_type === "ar" || row.relation_type === "publiseringsar" ? Number(row.relation_slug) || null : null;

  return {
    key: `relation:${row.relation_type}:${row.relation_slug}`,
    slug: row.relation_slug,
    label: row.relation_label_no || textLabel(row.relation_slug),
    type: row.relation_type,
    typeLabel,
    startYear: year,
    endYear: year,
    parentSlug: null,
    summary: `${typeLabel} brukt som relasjonsanker i Norske sedler.`,
    relevance: `${row.relation_count.toLocaleString("nb-NO")} objektkoblinger i relasjonslaget.`,
    href: row.relation_href,
    count: row.relation_count,
    source: "relation",
    rawType: row.relation_type,
  };
}

function contextNode(type: string, label: string, selected: UiNode | null, count: number | null): UiNode {
  return {
    key: `context:${type}:${selected?.key || "none"}`,
    slug: type,
    label,
    type,
    typeLabel: "Kontekst",
    startYear: selected?.startYear ?? null,
    endYear: selected?.endYear ?? null,
    parentSlug: selected?.slug ?? null,
    summary: `${label} for valgt anker ${selected?.label || "ikke valgt"}.`,
    relevance: count ? `${count.toLocaleString("nb-NO")} koblinger finnes i relasjonslaget.` : "Hentes fra relevante periode-, objekt- og relasjonsviews.",
    href: null,
    count,
    source: "context",
    rawType: type,
  };
}

function label(row: UiNode | null | undefined): string {
  if (!row) return "Ikke valgt";
  return row.label;
}

function yearRange(row: UiNode | null | undefined): string {
  if (!row) return "";
  if (row.startYear === null && row.endYear === null) return "Tidsrom mangler";
  if (row.startYear !== null && row.endYear !== null) return `${row.startYear}–${row.endYear}`;
  if (row.startYear !== null) return `${row.startYear} →`;
  return `→ ${row.endYear}`;
}

function overlaps(parent: UiNode | null, child: UiNode): boolean {
  if (!parent) return true;
  if (child.parentSlug === parent.slug) return true;
  if (parent.startYear === null || child.startYear === null) return false;

  const parentEnd = parent.endYear ?? 999999;
  const childEnd = child.endYear ?? 999999;
  return child.startYear <= parentEnd && childEnd >= parent.startYear;
}

function uniqueByKey(rows: UiNode[]): UiNode[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.key)) return false;
    seen.add(row.key);
    return true;
  });
}

function hasMeaningfulText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function relationCount(relationSummary: RelationSummary[], type: string): number | null {
  const match = relationSummary.find((row) => row.relation_type === type);
  return match ? match.relation_count : null;
}

function getAnchorNodes(anchorKind: AnchorKind, periodNodes: UiNode[], relationNodes: UiNode[]): UiNode[] {
  if (anchorKind === "periode") {
    return periodNodes.filter((row) => row.source === "period" && row.rawType !== "regentperiode" && row.startYear !== null);
  }

  if (anchorKind === "ar") {
    const yearRows = relationNodes.filter((row) => row.rawType === "ar");
    return yearRows.length ? yearRows : relationNodes.filter((row) => row.rawType === "publiseringsar");
  }

  return relationNodes.filter((row) => row.rawType === anchorKind);
}

function makeRow2Options(selected: UiNode | null, periodNodes: UiNode[], relationSummary: RelationSummary[]): UiNode[] {
  if (!selected) return [];

  if (selected.source === "period") {
    return uniqueByKey(
      periodNodes
        .filter((row) => row.key !== selected.key)
        .filter((row) => row.source === "period")
        .filter((row) => row.parentSlug === selected.slug || overlaps(selected, row)),
    );
  }

  const contexts: UiNode[] = [];
  const contextTypes = selected.rawType === "regent"
    ? ["regentperiode", "ar", "publiseringsar", "person", "utgave", "valor", "variant"]
    : selected.rawType === "person"
      ? ["personperiode", "regent", "ar", "publiseringsar", "utgave", "valor", "variant"]
      : selected.rawType === "ar" || selected.rawType === "publiseringsar"
        ? ["historisk_periode", "regent", "person", "utgave", "valor", "variant"]
        : ["periode", "ar", "publiseringsar", "regent", "person"];

  for (const type of contextTypes) {
    const labelText = RELATION_LABELS[type] || textLabel(type);
    contexts.push(contextNode(type, labelText, selected, relationCount(relationSummary, type)));
  }

  return contexts;
}

function makeRow3Options(selectedRow1: UiNode | null, selectedRow2: UiNode | null, relationNodes: UiNode[], periodNodes: UiNode[]): UiNode[] {
  if (!selectedRow1 || !selectedRow2) return [];

  if (selectedRow2.source === "period") {
    return uniqueByKey(
      periodNodes
        .filter((row) => row.key !== selectedRow1.key && row.key !== selectedRow2.key)
        .filter((row) => row.parentSlug === selectedRow2.slug || overlaps(selectedRow2, row)),
    ).slice(0, 80);
  }

  if (selectedRow2.source === "context") {
    if (selectedRow2.rawType === "regentperiode" || selectedRow2.rawType === "historisk_periode" || selectedRow2.rawType === "periode") {
      return periodNodes.filter((row) => overlaps(selectedRow1, row)).slice(0, 80);
    }

    const wanted = selectedRow2.rawType === "personperiode" ? "person" : selectedRow2.rawType;
    return relationNodes
      .filter((row) => row.rawType === wanted)
      .filter((row) => row.key !== selectedRow1.key)
      .slice(0, 80);
  }

  return [];
}

function segmentRows(segment: SegmentKey, selected: UiNode | null): [string, string][] {
  const baseName = label(selected);
  const countText = selected?.count ? `${selected.count.toLocaleString("nb-NO")} objektkoblinger` : "Hentes fra katalog/resultat-API";

  if (segment === "samler") {
    return [
      ["Objektantall", countText],
      ["Valør / utgave / variant", "Vises som relasjonschips eller objektfelt, ikke som tvungen Rad 1-periode"],
      ["Signatur / person", "Vises som relasjon når valgt anker eller objekt har personkobling"],
      ["Kvalitet / sjeldenhet", "Hentes fra objektpresentasjonsview og samlerrelevante felt"],
      ["Samlingsrelevans", selected?.relevance || `Vurderes ut fra ${baseName}`],
      ["Relaterte objekter", selected?.href ? `Kan åpnes ${selected.href}` : "Hentes i objekt-/relasjonslisten"],
    ];
  }

  if (segment === "historie") {
    return [
      ["Periode", yearRange(selected) || "Tidsrom hentes fra relation detail view"],
      ["Regent / personer", "Skal kunne velges som anker i Rad 1 og vises som relasjonschips"],
      ["Historiske hendelser", "Fylles dynamisk fra periode-/historie-views for valgt node"],
      ["Kriger / sykdommer", "Overlappende relasjonsperioder; vises i Bio/segmentfelt når de ikke er direkte valg"],
      ["Funn / proveniens", "Skal vises som relasjon eller dynamisk kontekst, ikke nodetvang i Rad 3"],
      ["Relasjonskart", selected?.href || "Relasjonsside/detail view mangler for valgt node"],
    ];
  }

  return [
    ["Markedsverdi", "Vises bare når API har reell verdi. 0 kr skal ikke tolkes som verdi."],
    ["Prisobservasjoner", "Hentes fra markeds-/auksjons-/nettbutikkdata når tilgjengelig"],
    ["Trend", "Krever valgt trendperiode og prisgrunnlag"],
    ["Likviditet", "Beregnes fra observasjoner/transaksjoner når datagrunnlag finnes"],
    ["Valutakontekst / inflasjon", "Kobles mot index/finanshistorisk datagrunnlag"],
    ["Finanshistorisk kontekst", selected?.relevance || `Ikke beregnet for ${baseName}`],
  ];
}

function timelineBounds(nodes: UiNode[]): { min: number; max: number } {
  const years = nodes.flatMap((node) => [node.startYear, node.endYear]).filter((value): value is number => typeof value === "number");
  if (!years.length) return { min: 1800, max: 2025 };
  const min = Math.min(...years);
  const max = Math.max(...years);
  if (min === max) return { min: min - 5, max: max + 5 };
  return { min, max };
}

function timelinePosition(year: number | null, min: number, max: number): number {
  if (year === null || max <= min) return 50;
  return Math.max(0, Math.min(100, ((year - min) / (max - min)) * 100));
}

export default function CollectiumPeriodFilterTest() {
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterFocus, setMasterFocus] = useState<MasterFocus>("periode");
  const [sourceKey, setSourceKey] = useState("norske_sedler");
  const [objectGroup, setObjectGroup] = useState("banknote");
  const [anchorKind, setAnchorKind] = useState<AnchorKind>("periode");
  const [selectedRow1Key, setSelectedRow1Key] = useState<string | null>(null);
  const [selectedRow2Key, setSelectedRow2Key] = useState<string | null>(null);
  const [selectedRow3Key, setSelectedRow3Key] = useState<string | null>(null);
  const [segment, setSegment] = useState<SegmentKey>("samler");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch("/api/filter/period/options", { cache: "no-store" });
        const json = (await response.json()) as PeriodApiResponse;
        if (!mounted) return;
        if (!response.ok || !json.ok) {
          setError(json.message || "Periodefilter-API svarte med feil.");
          setData(json);
          return;
        }
        setData(json);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Ukjent feil ved lasting av periodefilter.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const relationSummary = data?.relationSummary || [];
  const periodNodes = useMemo(() => (data?.rows || []).map(periodToNode), [data?.rows]);
  const relationUiNodes = useMemo(() => (data?.relationNodes || []).map(relationToNode), [data?.relationNodes]);

  const anchorChoices = useMemo(() => ANCHORS.filter((anchor) => anchor.focus.includes(masterFocus)), [masterFocus]);
  const activeAnchorKind = anchorChoices.some((anchor) => anchor.key === anchorKind) ? anchorKind : anchorChoices[0]?.key || "periode";

  useEffect(() => {
    if (activeAnchorKind !== anchorKind) {
      setAnchorKind(activeAnchorKind);
      setSelectedRow1Key(null);
      setSelectedRow2Key(null);
      setSelectedRow3Key(null);
    }
  }, [activeAnchorKind, anchorKind]);

  const row1Options = useMemo(() => getAnchorNodes(activeAnchorKind, periodNodes, relationUiNodes), [activeAnchorKind, periodNodes, relationUiNodes]);
  const selectedRow1 = row1Options.find((row) => row.key === selectedRow1Key) || null;

  const row2Options = useMemo(() => makeRow2Options(selectedRow1, periodNodes, relationSummary), [selectedRow1, periodNodes, relationSummary]);
  const selectedRow2 = row2Options.find((row) => row.key === selectedRow2Key) || null;

  const row3Options = useMemo(() => makeRow3Options(selectedRow1, selectedRow2, relationUiNodes, periodNodes), [selectedRow1, selectedRow2, relationUiNodes, periodNodes]);
  const selectedRow3 = row3Options.find((row) => row.key === selectedRow3Key) || null;

  const selectedNode = selectedRow3 || selectedRow2 || selectedRow1;
  const dynamicRows = segmentRows(segment, selectedNode);
  const chain = [selectedRow1, selectedRow2, selectedRow3].filter((row): row is UiNode => Boolean(row));

  function chooseMasterFocus(focus: MasterFocus) {
    setMasterFocus(focus);
    setSelectedRow1Key(null);
    setSelectedRow2Key(null);
    setSelectedRow3Key(null);
  }

  function chooseAnchor(kind: AnchorKind) {
    setAnchorKind(kind);
    setSelectedRow1Key(null);
    setSelectedRow2Key(null);
    setSelectedRow3Key(null);
  }

  function chooseRow1(key: string) {
    setSelectedRow1Key(key);
    setSelectedRow2Key(null);
    setSelectedRow3Key(null);
  }

  function chooseRow2(key: string) {
    setSelectedRow2Key(key);
    setSelectedRow3Key(null);
  }

  function chooseRow3(key: string) {
    setSelectedRow3Key(key);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Periodefilter · DB-test · UI/UX 8.6</p>
          <h1>Filter Master + periodetidslinje</h1>
          <p>
            Testen viser Filter Master først, deretter Rad 1 som anker, Rad 2 som kontekst og Rad 3 som konkret undernode. Periodetidslinjen under viser valgt Rad 1 → Rad 2 → Rad 3 og forklarer hva som skal inn i Bio og Samler/Historie/Finans.
          </p>
        </div>
        <aside className={styles.statusBox}>
          <span className={loading ? styles.statusWarn : error ? styles.statusError : styles.statusOk}>
            {loading ? "Henter" : error ? "Feil" : "OK"}
          </span>
          <small>{data?.updatedAt ? `Oppdatert ${new Date(data.updatedAt).toLocaleString("nb-NO")}` : "Ingen tidsstempel"}</small>
        </aside>
      </section>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <section className={styles.masterPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.eyebrow}>Filter Master</p>
          <h2>Styrende filterlag</h2>
        </div>
        <div className={styles.masterGrid}>
          <label>
            <span>Kilde</span>
            <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value)}>
              <option value="norske_sedler">Norske sedler</option>
            </select>
          </label>
          <label>
            <span>Objekttype</span>
            <select value={objectGroup} onChange={(event) => setObjectGroup(event.target.value)}>
              <option value="banknote">Seddel</option>
            </select>
          </label>
          <label>
            <span>Segment</span>
            <select value={segment} onChange={(event) => setSegment(event.target.value as SegmentKey)}>
              <option value="samler">Samler</option>
              <option value="historie">Historie</option>
              <option value="finans">Finans</option>
            </select>
          </label>
        </div>
        <div className={styles.focusSwitch}>
          {MASTER_FOCUS_OPTIONS.map((option) => (
            <button type="button" key={option.key} data-active={masterFocus === option.key} onClick={() => chooseMasterFocus(option.key)}>
              <span>{option.label}</span>
              <small>{option.help}</small>
            </button>
          ))}
        </div>
        <p className={styles.controlNote}>
          Aktiv test: {sourceKey} / {objectGroup}. Masterfilteret bestemmer hvilke Rad 1-ankre som er relevante før brukeren velger periode, regent, person, år, kilde, utgave, valør eller variant.
        </p>
      </section>

      <section className={styles.anchorPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.eyebrow}>Rad 1-type</p>
          <h2>Velg anker for valgt Masterfilter</h2>
        </div>
        <div className={styles.anchorSwitch}>
          {anchorChoices.map((anchor) => (
            <button type="button" key={anchor.key} data-active={activeAnchorKind === anchor.key} onClick={() => chooseAnchor(anchor.key)}>
              <span>{anchor.label}</span>
              <small>{anchor.help}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        <FilterRow title="Rad 1" subtitle="Anker" rows={row1Options} selectedKey={selectedRow1Key} onSelect={chooseRow1} maxVisible={80} />
        <FilterRow title="Rad 2" subtitle="Kontekst for valgt anker" rows={row2Options} selectedKey={selectedRow2Key} onSelect={chooseRow2} disabled={!selectedRow1} disabledText="Velg Rad 1 først" maxVisible={60} />
        <FilterRow title="Rad 3" subtitle="Konkret undernode når den finnes" rows={row3Options} selectedKey={selectedRow3Key} onSelect={chooseRow3} disabled={!selectedRow1 || !selectedRow2} disabledText="Velg Rad 1 og Rad 2 først" emptyText="Ingen konkret Rad 3-node. Bruk Bio og segmentfeltet under." maxVisible={60} />
      </section>

      <section className={styles.selectionPanel}>
        <div className={styles.pathBox}>
          <span>{label(selectedRow1)}</span>
          <span>{"→"}</span>
          <span>{label(selectedRow2)}</span>
          <span>{"→"}</span>
          <span>{label(selectedRow3)}</span>
        </div>
      </section>

      <PeriodTimeline nodes={chain} />

      <section className={styles.dynamicGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk område 1</p>
            <h2>Bio / definisjon</h2>
          </div>

          {selectedNode ? (
            <div className={styles.bioContent}>
              <h3>{label(selectedNode)}</h3>
              <p className={styles.metaLine}>{selectedNode.typeLabel} · {selectedNode.count ? `${selectedNode.count.toLocaleString("nb-NO")} objektkoblinger` : yearRange(selectedNode)}</p>
              <BioQuestion title="Hva er dette?" value={selectedNode.summary || "Kort definisjon mangler i periodedata/relasjonsdata."} />
              <BioQuestion title="Hvorfor er det viktig?" value={selectedNode.relevance || "Collectium-relevans mangler for valgt node."} />
              <BioQuestion title="Når eksisterte det?" value={yearRange(selectedNode)} />
              <BioQuestion title="Hvilke objekter er relatert?" value={selectedNode.count ? `${selectedNode.count.toLocaleString("nb-NO")} objektkoblinger i Norske sedler.` : "Hentes via katalog-, objekt- og relasjons-API."} />
              <BioQuestion title="Hva betyr det for samlere, historie og finans?" value="Se segmentpanelet til høyre. Innholdet skifter etter Samler, Historie og Finans." />
              {hasMeaningfulText(selectedNode.href) ? (
                <a className={styles.relationLink} href={selectedNode.href}>Åpne relasjon: {selectedNode.href}</a>
              ) : (
                <p className={styles.missing}>Relation_href/detail-side mangler for valgt node.</p>
              )}
            </div>
          ) : (
            <p className={styles.empty}>Velg anker i Rad 1 for å vise Bio.</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk område 2</p>
            <h2>Samler · Historie · Finans</h2>
          </div>
          <div className={styles.segmentSwitch} role="tablist" aria-label="Segment">
            <button type="button" data-active={segment === "samler"} onClick={() => setSegment("samler")}>Samler</button>
            <button type="button" data-active={segment === "historie"} onClick={() => setSegment("historie")}>Historie</button>
            <button type="button" data-active={segment === "finans"} onClick={() => setSegment("finans")}>Finans</button>
          </div>

          <div className={styles.factList}>
            {dynamicRows.map(([key, value]) => (
              <div className={styles.factRow} key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.eyebrow}>Kontroll</p>
          <h2>Relasjonstyper fra Norske sedler</h2>
        </div>
        {relationSummary.length ? (
          <div className={styles.relationGrid}>
            {relationSummary.map((row) => (
              <div className={styles.relationPill} key={row.relation_type}>
                <span>{RELATION_LABELS[row.relation_type] || row.relation_type}</span>
                <strong>{row.relation_count.toLocaleString("nb-NO")}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Relasjonsoppsummering er ikke tilgjengelig fra API-et.</p>
        )}
      </section>
    </main>
  );
}

function FilterRow(props: {
  title: string;
  subtitle: string;
  rows: UiNode[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  disabled?: boolean;
  disabledText?: string;
  emptyText?: string;
  maxVisible?: number;
}) {
  const [query, setQuery] = useState("");
  const maxVisible = props.maxVisible || 80;
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return props.rows;
    return props.rows.filter((row) => `${row.label} ${row.typeLabel} ${row.slug}`.toLowerCase().includes(normalized));
  }, [props.rows, query]);
  const visibleRows = filteredRows.slice(0, maxVisible);

  return (
    <article className={styles.panel} data-disabled={props.disabled ? "true" : "false"}>
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>{props.title}</p>
        <h2>{props.subtitle}</h2>
      </div>
      {props.disabled ? <p className={styles.empty}>{props.disabledText}</p> : null}
      {!props.disabled ? (
        <div className={styles.rowSearch}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Søk i raden" />
          <small>{filteredRows.length.toLocaleString("nb-NO")} valg</small>
        </div>
      ) : null}
      {!props.disabled && filteredRows.length === 0 ? <p className={styles.empty}>{props.emptyText || "Ingen tilgjengelige valg for denne raden."}</p> : null}
      <div className={styles.optionList}>
        {visibleRows.map((row) => (
          <button type="button" key={row.key} data-active={props.selectedKey === row.key} onClick={() => props.onSelect(row.key)}>
            <span>{label(row)}</span>
            <small>{row.typeLabel} · {row.count ? `${row.count.toLocaleString("nb-NO")} objektkoblinger` : yearRange(row)}</small>
          </button>
        ))}
      </div>
      {!props.disabled && filteredRows.length > visibleRows.length ? (
        <p className={styles.moreRows}>Viser {visibleRows.length.toLocaleString("nb-NO")} av {filteredRows.length.toLocaleString("nb-NO")}. Bruk søk for å snevre inn.</p>
      ) : null}
    </article>
  );
}

function PeriodTimeline(props: { nodes: UiNode[] }) {
  const bounds = timelineBounds(props.nodes);

  return (
    <section className={styles.timelinePanel}>
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>Periodetidslinje</p>
        <h2>Rad 1 → Rad 2 → Rad 3</h2>
      </div>
      {props.nodes.length ? (
        <div className={styles.timelineCanvas}>
          <div className={styles.timelineScale}>
            <span>{bounds.min}</span>
            <span>{bounds.max}</span>
          </div>
          {props.nodes.map((node, index) => {
            const left = timelinePosition(node.startYear, bounds.min, bounds.max);
            const right = timelinePosition(node.endYear, bounds.min, bounds.max);
            const width = Math.max(4, Math.abs(right - left));
            const start = Math.min(left, right);
            return (
              <div className={styles.timelineLane} key={node.key}>
                <span className={styles.timelineLabel}>Rad {index + 1}</span>
                <div className={styles.timelineTrack}>
                  <span className={styles.timelineBar} style={{ left: `${start}%`, width: `${width}%` }} />
                  <strong className={styles.timelineNode} style={{ left: `${start}%` }}>{node.label}</strong>
                </div>
                <small>{node.typeLabel} · {yearRange(node)}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>Velg Rad 1 for å bygge tidslinje.</p>
      )}
    </section>
  );
}

function BioQuestion(props: { title: string; value: string }) {
  return (
    <div className={styles.bioQuestion}>
      <span>{props.title}</span>
      <p>{props.value}</p>
    </div>
  );
}
