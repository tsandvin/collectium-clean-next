"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumPeriodFilterTest UI/UX 8.6 - ankerbasert modell
 *
 * Definering / formal:
 * React-komponent for periodefilter-test. Rad 1 er ikke lenger last til nasjonal hovedperiode,
 * men fungerer som anker for periode, konge/regent, person, ar, kilde, utgave, valor og variant.
 * Rad 3 vises bare som konkret valgrad nar API-et har reelle undernoder; ellers flyttes innholdet til Bio og segmentfelt.
 *
 * Bruksomrade:
 * Brukes av /test/periodefilter.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 * - object.relations.view
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
 * log_action: period_test_component_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0004 / CHANGE-2026-06-18-0002
 */

import { useEffect, useMemo, useState } from "react";
import styles from "./CollectiumPeriodFilterTest.module.css";

type SegmentKey = "samler" | "historie" | "finans";
type AnchorKind = "periode" | "regent" | "person" | "ar" | "kilde" | "utgave" | "valor" | "variant";

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

const ANCHORS: Array<{ key: AnchorKind; label: string; help: string }> = [
  { key: "periode", label: "Periode", help: "Nasjonal/historisk hovedperiode" },
  { key: "regent", label: "Konge / regent", help: "Haakon VII, Olav V, Oscar II" },
  { key: "person", label: "Person / signatur", help: "Signaturer og personer" },
  { key: "ar", label: "Ar / publiseringsar", help: "Arstall som relasjon" },
  { key: "kilde", label: "Kilde", help: "Norske sedler og senere andre kilder" },
  { key: "utgave", label: "Utgave", help: "Utgave/serie som relasjon" },
  { key: "valor", label: "Valor", help: "Valor som relasjon" },
  { key: "variant", label: "Variant", help: "Variant/type som relasjon" },
];

const RELATION_LABELS: Record<string, string> = {
  ar: "Ar",
  publiseringsar: "Publiseringsar",
  regent: "Konge / regent",
  person: "Person / signatur",
  kilde: "Kilde",
  utgave: "Utgave",
  valor: "Valor",
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
  return {
    key: `relation:${row.relation_type}:${row.relation_slug}`,
    slug: row.relation_slug,
    label: row.relation_label_no || textLabel(row.relation_slug),
    type: row.relation_type,
    typeLabel,
    startYear: row.relation_type === "ar" || row.relation_type === "publiseringsar" ? Number(row.relation_slug) || null : null,
    endYear: row.relation_type === "ar" || row.relation_type === "publiseringsar" ? Number(row.relation_slug) || null : null,
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
  if (row.startYear !== null && row.endYear !== null) return `${row.startYear}-${row.endYear}`;
  if (row.startYear !== null) return `${row.startYear} ->`;
  return `-> ${row.endYear}`;
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
  if (anchorKind === "periode") return periodNodes.filter((row) => row.source === "period" && row.rawType !== "regentperiode" && row.startYear !== null);
  if (anchorKind === "ar") return relationNodes.filter((row) => row.rawType === "ar" || row.rawType === "publiseringsar");
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

function segmentRows(segment: SegmentKey, selected: UiNode | null, relationSummary: RelationSummary[]) {
  const baseName = label(selected);
  const countText = selected?.count ? `${selected.count.toLocaleString("nb-NO")} objektkoblinger` : "Hentes fra katalog/resultat-API";

  if (segment === "samler") {
    return [
      ["Objektantall", countText],
      ["Valør / utgave / variant", "Vises som relasjonschips eller objektfelt, ikke som tvungen Rad 1-periode"],
      ["Signatur / person", "Vises som relasjon når valgt anker eller objekt har personkobling"],
      ["Kvalitet / sjeldenhet", "Hentes fra objektpresentasjonsview og samlerrelevante felt"],
      ["Samlingsrelevans", selected?.relevance || `Vurderes ut fra ${baseName}`],
      ["Relaterte objekter", selected?.href ? `Kan apnes ${selected.href}` : "Hentes i objekt-/relasjonslisten"],
    ];
  }

  if (segment === "historie") {
    return [
      ["Periode", yearRange(selected) || "Tidsrom hentes fra relation detail view"],
      ["Regent / personer", "Skal kunne velges som anker i Rad 1 og vises som relasjonschips"],
      ["Historiske hendelser", "Fylles dynamisk fra periode-/historie-views for valgt node"],
      ["Kriger / sykdommer", "Overlappende relasjonsperioder; vises i Bio/segmentfelt nar de ikke er direkte valg"],
      ["Funn / proveniens", "Skal vises som relasjon eller dynamisk kontekst, ikke nodetvang i Rad 3"],
      ["Relasjonskart", selected?.href || "Relasjonsside/detail view mangler for valgt node"],
    ];
  }

  return [
    ["Markedsverdi", "Vises bare nar API har reell verdi. 0 kr skal ikke tolkes som verdi."],
    ["Prisobservasjoner", "Hentes fra markeds-/auksjons-/nettbutikkdata nar tilgjengelig"],
    ["Trend", "Krever valgt trendperiode og prisgrunnlag"],
    ["Likviditet", "Beregnes fra observasjoner/transaksjoner nar datagrunnlag finnes"],
    ["Valutakontekst / inflasjon", "Kobles mot index/finanshistorisk datagrunnlag"],
    ["Finanshistorisk kontekst", selected?.relevance || `Ikke beregnet for ${baseName}`],
  ];
}

export default function CollectiumPeriodFilterTest() {
  const [data, setData] = useState<PeriodApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const row1Options = useMemo(() => getAnchorNodes(anchorKind, periodNodes, relationUiNodes), [anchorKind, periodNodes, relationUiNodes]);
  const selectedRow1 = row1Options.find((row) => row.key === selectedRow1Key) || null;

  const row2Options = useMemo(() => makeRow2Options(selectedRow1, periodNodes, relationSummary), [selectedRow1, periodNodes, relationSummary]);
  const selectedRow2 = row2Options.find((row) => row.key === selectedRow2Key) || null;

  const row3Options = useMemo(() => makeRow3Options(selectedRow1, selectedRow2, relationUiNodes, periodNodes), [selectedRow1, selectedRow2, relationUiNodes, periodNodes]);
  const selectedRow3 = row3Options.find((row) => row.key === selectedRow3Key) || null;

  const selectedNode = selectedRow3 || selectedRow2 || selectedRow1;
  const dynamicRows = segmentRows(segment, selectedNode, relationSummary);

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
          <h1>Periodefilter</h1>
          <p>
            Testen bruker en ankerbasert modell. <strong>Rad 1</strong> kan vaere periode, konge/regent, person, ar, kilde, utgave, valor eller variant. <strong>Rad 2</strong> viser kontekst for valgt anker. <strong>Rad 3</strong> vises bare nar det finnes konkrete undernoder; ellers skal informasjonen fylles i Bio og Samler/Historie/Finans.
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

      <section className={styles.anchorPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.eyebrow}>Rad 1-type</p>
          <h2>Velg anker for filteret</h2>
        </div>
        <div className={styles.anchorSwitch}>
          {ANCHORS.map((anchor) => (
            <button type="button" key={anchor.key} data-active={anchorKind === anchor.key} onClick={() => chooseAnchor(anchor.key)}>
              <span>{anchor.label}</span>
              <small>{anchor.help}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        <FilterRow
          title="Rad 1"
          subtitle="Anker"
          rows={row1Options}
          selectedKey={selectedRow1Key}
          onSelect={chooseRow1}
        />
        <FilterRow
          title="Rad 2"
          subtitle="Kontekst for valgt anker"
          rows={row2Options}
          selectedKey={selectedRow2Key}
          onSelect={chooseRow2}
          disabled={!selectedRow1}
          disabledText="Velg Rad 1 først"
        />
        <FilterRow
          title="Rad 3"
          subtitle="Konkret undernode nar den finnes"
          rows={row3Options}
          selectedKey={selectedRow3Key}
          onSelect={chooseRow3}
          disabled={!selectedRow1 || !selectedRow2}
          disabledText="Velg Rad 1 og Rad 2 først"
          emptyText="Ingen konkret Rad 3-node. Bruk Bio og segmentfeltet under."
        />
      </section>

      <section className={styles.selectionPanel}>
        <div className={styles.pathBox}>
          <span>{label(selectedRow1)}</span>
          <span>-></span>
          <span>{label(selectedRow2)}</span>
          <span>-></span>
          <span>{label(selectedRow3)}</span>
        </div>
      </section>

      <section className={styles.dynamicGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk omrade 1</p>
            <h2>Bio / definisjon</h2>
          </div>

          {selectedNode ? (
            <div className={styles.bioContent}>
              <h3>{label(selectedNode)}</h3>
              <p className={styles.metaLine}>{selectedNode.typeLabel} · {selectedNode.count ? `${selectedNode.count.toLocaleString("nb-NO")} objektkoblinger` : yearRange(selectedNode)}</p>
              <BioQuestion title="Hva er dette?" value={selectedNode.summary || "Kort definisjon mangler i periodedata/relasjonsdata."} />
              <BioQuestion title="Hvorfor er det viktig?" value={selectedNode.relevance || "Collectium-relevans mangler for valgt node."} />
              <BioQuestion title="Nar eksisterte det?" value={yearRange(selectedNode)} />
              <BioQuestion title="Hvilke objekter er relatert?" value={selectedNode.count ? `${selectedNode.count.toLocaleString("nb-NO")} objektkoblinger i Norske sedler.` : "Hentes via katalog-, objekt- og relasjons-API."} />
              <BioQuestion title="Hva betyr det for samlere, historie og finans?" value="Se segmentpanelet til høyre. Innholdet skifter etter Samler, Historie og Finans." />
              {hasMeaningfulText(selectedNode.href) ? (
                <a className={styles.relationLink} href={selectedNode.href}>Apne relasjon: {selectedNode.href}</a>
              ) : (
                <p className={styles.missing}>Relation_href/detail-side mangler for valgt node.</p>
              )}
            </div>
          ) : (
            <p className={styles.empty}>Velg anker i Rad 1 for a vise Bio.</p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>Dynamisk omrade 2</p>
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
}) {
  return (
    <article className={styles.panel} data-disabled={props.disabled ? "true" : "false"}>
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>{props.title}</p>
        <h2>{props.subtitle}</h2>
      </div>
      {props.disabled ? <p className={styles.empty}>{props.disabledText}</p> : null}
      {!props.disabled && props.rows.length === 0 ? <p className={styles.empty}>{props.emptyText || "Ingen tilgjengelige valg for denne raden."}</p> : null}
      <div className={styles.optionList}>
        {props.rows.map((row) => (
          <button
            type="button"
            key={row.key}
            data-active={props.selectedKey === row.key}
            onClick={() => props.onSelect(row.key)}
          >
            <span>{label(row)}</span>
            <small>{row.typeLabel} · {row.count ? `${row.count.toLocaleString("nb-NO")} objektkoblinger` : yearRange(row)}</small>
          </button>
        ))}
      </div>
    </article>
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
