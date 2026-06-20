/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Comparison Demo Component
 *
 * Definering / formål:
 * React-komponent for Periode 8.6 sammenligning:
 * - Filter/rullegardin viser grupper
 * - Tidslinje viser noder under valgt gruppe
 * - Tidstabellen sammenligner overlapp mellom rader
 *
 * Bruksområde:
 * Brukes på /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/period86/comparison-demo
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.comparison.view
 * - period86.timeline.view
 * - period86.group_filter.view
 *
 * Dataretning:
 * API -> React -> UI
 *
 * Versjon:
 * CT-PERIOD86-COMPARISON-DEMO-COMPONENT-0021
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Period86ComparisonDemo.module.css";
import {
  ROW1_SWITCH_OPTIONS,
  ROW2_SWITCH_OPTIONS,
  ROW3_SWITCH_OPTIONS,
  type Period86SwitchOption,
  type Period86TimelineNode,
} from "@/lib/period86/period86ComparisonGroups";

type GroupDefinition = {
  group_key: string;
  label_no: string;
  description_no: string;
};

type TimelineNode = {
  node_key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  group_key: string;
  group_label_no: string;
  node_type: string;
  description_no: string;
  relation_href: string | null;
  source_note_no: string;
  is_demo: boolean;
};

type ComparisonRow = {
  row_no: 1 | 2 | 3;
  row_label_no: string;
  selected_group_key: string;
  selected_group_label_no: string;
  selected_group_description_no: string;
  timeline_nodes: TimelineNode[];
};

type Period86DynamicContent = {
  selected_segment: 'samler' | 'historie' | 'finans';

  row1_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
    selected_type_group_key?: string | null;
    selected_type_group_label_no?: string | null;
  };

  row2_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
  };

  row3_selection: {
    key: string;
    label_no: string;
    description_no?: string;
    selected_node_key?: string | null;
    selected_node_label_no?: string | null;
  };

  primary_card: {
    title_no: string;
    subtitle_no?: string;
    period_label_no?: string;
    year_range_label_no?: string;
    summary_no?: string;
    relation_href?: string | null;
    source?: string;
  };

  comparison_card: {
    title_no: string;
    summary_no?: string;
    row1_summary_no?: string;
    row2_summary_no?: string;
    row3_summary_no?: string;
    overlap_summary_no?: string;
    relation_href?: string | null;
  };

  collector_content?: {
    title_no?: string;
    collector_relevance_no?: string;
    object_relevance_no?: string;
    rarity_context_no?: string;
    collection_context_no?: string;
    related_object_count?: number;
    related_catalog_count?: number;
    relation_href?: string | null;
  };

  history_content?: {
    title_no?: string;
    history_summary_no?: string;
    historical_context_no?: string;
    ruler_context_no?: string;
    event_context_no?: string;
    period_context_no?: string;
    relation_href?: string | null;
  };

  finance_content?: {
    title_no?: string;
    finance_relevance_no?: string;
    economy_context_no?: string;
    market_context_no?: string;
    inflation_context_no?: string;
    value_context_no?: string;
    relation_href?: string | null;
  };

  timeline_explanation: {
    title_no: string;
    comparison_no?: string;
    overlap_no?: string;
    rule_no?: string;
    db_note_no?: string;
  };

  debug?: {
    source_api?: string;
    source_view?: string;
    selected_from_year?: number;
    selected_to_year?: number;
    node_count?: number;
  };
};

type ApiResponse = {
  ok: boolean;
  demo: boolean;
  version: string;
  query: {
    country: string;
    object_type: string;
    year_from: number;
    year_to: number;
    view: string;
    row1_group: string;
    row2_group: string;
    row3_group: string;
    selected_segment: string;
    selected_node_key: string | null;
    selected_lane: number | null;
  };
  groups: GroupDefinition[];
  rows: ComparisonRow[];
  dynamic_area: {
    title_no: string;
    explanation_no: string;
    overlap_explanations: string[];
    empty_state_no: string | null;
  };
  rules: {
    group_rule: string;
    timeline_rule: string;
    row_rule: string;
  };
  dynamic_content?: Period86DynamicContent;
  answer_for_chatgpt: {
    status: string;
    message: string;
    expected: string;
    next_step: string;
  };
};

const DEFAULT_GROUPS: GroupDefinition[] = [
  {
    group_key: "ruler_issuer",
    label_no: "Konge / regent + utgiver",
    description_no: "Viser konger, regenter, herskere, statsoverhoder og relevante utgivere.",
  },
  {
    group_key: "national_period",
    label_no: "Nasjonal periode",
    description_no: "Viser union, selvstendighet, okkupasjon og etterkrigstid.",
  },
  {
    group_key: "war_conflict",
    label_no: "Krig / konflikt",
    description_no: "Viser krig, konflikt, okkupasjon og politisk uro.",
  },
  {
    group_key: "finance_economy",
    label_no: "Finans / økonomi",
    description_no: "Viser pengepolitikk, bankhistorie, inflasjon og kriser.",
  },
  {
    group_key: "signature_person",
    label_no: "Signatur / person",
    description_no: "Viser personer, signaturgrupper, utstedere og relaterte aktører.",
  },
  {
    group_key: "object_issue_period",
    label_no: "Objekt / utgaveperiode",
    description_no: "Viser katalog-, objekt-, seddel-, mynt- og utgaveperioder.",
  },
  {
    group_key: "disease_society",
    label_no: "Sykdom / samfunnskrise",
    description_no: "Viser samfunnskriser, sykdomsperioder og nødsår.",
  },
  {
    group_key: "motif_symbol",
    label_no: "Motiv / symbol",
    description_no: "Viser motiv, symboler, riksvåpen og ikonografi.",
  },
  {
    group_key: "provenance_find",
    label_no: "Proveniens / funn",
    description_no: "Viser funn, proveniensperioder og samlinger.",
  },
];

function getTimelineStyle(node: TimelineNode, yearFrom: number, yearTo: number) {
  const range = Math.max(1, yearTo - yearFrom);
  const from = node.from_year ?? yearFrom;
  const to = node.to_year ?? yearTo;

  const left = Math.max(0, Math.min(100, ((from - yearFrom) / range) * 100));
  const right = Math.max(0, Math.min(100, ((yearTo - to) / range) * 100));

  return {
    left: `${left}%`,
    right: `${right}%`,
  };
}

function buildYearTicks(yearFrom: number, yearTo: number) {
  const range = Math.max(1, yearTo - yearFrom);
  const step = range > 500 ? 100 : range > 180 ? 50 : range > 90 ? 20 : 10;
  const first = Math.ceil(yearFrom / step) * step;
  const ticks: number[] = [];

  for (let year = first; year <= yearTo; year += step) {
    ticks.push(year);
  }

  if (!ticks.includes(yearFrom)) ticks.unshift(yearFrom);
  if (!ticks.includes(yearTo)) ticks.push(yearTo);

  return ticks;
}

function SwitchSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Period86SwitchOption[];
  onChange: (value: string) => void;
}) {
  const option = options.find((item) => item.key === value);

  return (
    <label className={styles.selectCard}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label_no}
          </option>
        ))}
      </select>
      <small>{option?.description_no}</small>
    </label>
  );
}

function TimelineRow({
  row,
  yearFrom,
  yearTo,
  selectedNodeKey,
  onNodeClick,
}: {
  row: ComparisonRow;
  yearFrom: number;
  yearTo: number;
  selectedNodeKey: string | null;
  onNodeClick: (nodeKey: string, lane: number) => void;
}) {
  return (
    <div className={styles.timelineRow}>
      <div className={styles.rowLabel}>
        <strong>{row.selected_group_label_no}</strong>
        <span>{row.row_label_no}</span>
      </div>

      <div className={styles.track}>
        {row.timeline_nodes.length === 0 ? (
          <div className={styles.emptyNode}>Ingen Neon-data funnet for valgt filter.</div>
        ) : (
          row.timeline_nodes.map((node) => {
            const isActive = selectedNodeKey === node.node_key;
            return (
              <div
                key={`${row.row_no}-${node.node_key}`}
                className={`${styles.bar} ${styles[`row${row.row_no}`]} ${
                  isActive ? styles.activeNode : ""
                }`}
                style={getTimelineStyle(node, yearFrom, yearTo)}
                title={`${node.label_no} · ${node.year_label} · ${node.description_no}`}
                onClick={() => onNodeClick(node.node_key, row.row_no)}
              >
                <span>{node.label_no}</span>
                <small>{node.year_label}</small>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Period86ComparisonDemo() {
  const [country, setCountry] = useState("Norge");
  const [objectType, setObjectType] = useState("Verdibrev");
  const [yearFrom, setYearFrom] = useState(1707);
  const [yearTo, setYearTo] = useState(2024);
  const [view, setView] = useState("Tidslinje");
  const [row1Group, setRow1Group] = useState<string>("herskere_statsoverhoder");
  const [row2Group, setRow2Group] = useState<string>("finans_okonomi");
  const [row3Group, setRow3Group] = useState<string>("signatur_person");

  // Segment state
  const [selectedSegment, setSelectedSegment] = useState<"samler" | "historie" | "finans">("historie");
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      country,
      object_type: objectType,
      year_from: String(yearFrom),
      year_to: String(yearTo),
      view,
      row1_group: row1Group,
      row2_group: row2Group,
      row3_group: row3Group,
      selected_segment: selectedSegment,
      selected_node_key: selectedNodeKey || "",
      selected_lane: selectedLane !== null ? String(selectedLane) : "",
    });

    setError(null);

    fetch(`/api/period86/comparison?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API svarte ${res.status}`);
        }
        return res.json();
      })
      .then((json: ApiResponse) => {
        setData(json);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Ukjent feil");
      });
  }, [
    country,
    objectType,
    yearFrom,
    yearTo,
    view,
    row1Group,
    row2Group,
    row3Group,
    selectedSegment,
    selectedNodeKey,
    selectedLane,
  ]);

  const ticks = useMemo(() => buildYearTicks(yearFrom, yearTo), [yearFrom, yearTo]);

  const handleNodeClick = (nodeKey: string, lane: number) => {
    if (selectedNodeKey === nodeKey) {
      setSelectedNodeKey(null);
      setSelectedLane(null);
    } else {
      setSelectedNodeKey(nodeKey);
      setSelectedLane(lane);

      // Auto-set the preferred segment based on row or node key
      let optionKey = "";
      if (lane === 1) optionKey = row1Group;
      else if (lane === 2) optionKey = row2Group;
      else if (lane === 3) optionKey = row3Group;

      const allOpts = [...ROW1_SWITCH_OPTIONS, ...ROW2_SWITCH_OPTIONS, ...ROW3_SWITCH_OPTIONS];
      const opt = allOpts.find((o) => o.key === optionKey);
      if (opt?.preferred_segment) {
        setSelectedSegment(opt.preferred_segment);
      }
    }
  };

  const dynamicContent = data?.dynamic_content;

  const renderDynamicArea2 = () => {
    if (!selectedNodeKey) {
      if (dynamicContent?.primary_card) {
        return (
          <div className={styles.dynamicContentBlock}>
            <h2>{dynamicContent.primary_card.title_no}</h2>
            {dynamicContent.primary_card.subtitle_no && (
              <p className={styles.subtitle}>
                {dynamicContent.primary_card.subtitle_no} · {dynamicContent.primary_card.period_label_no}
              </p>
            )}
            <p className={styles.yearRange}>{dynamicContent.primary_card.year_range_label_no}</p>
            <p>{dynamicContent.primary_card.summary_no}</p>
            <p style={{ fontStyle: "italic", fontSize: "13px", opacity: 0.8, marginTop: "12px" }}>
              Tips: Klikk på en farget tidslinjeblokk over for å se detaljert innhold.
            </p>
          </div>
        );
      }
      return <p>Velg en farget tidslinjeblokk for å se detaljert innhold.</p>;
    }

    const selectedNodeLocal = data?.rows
      ?.flatMap((r) => r.timeline_nodes)
      .find((n) => n.node_key === selectedNodeKey);

    if (dynamicContent?.primary_card) {
      const { primary_card, collector_content, history_content, finance_content } = dynamicContent;

      return (
        <div className={styles.dynamicContentBlock}>
          <h2>{primary_card.title_no}</h2>
          <p className={styles.subtitle}>
            {primary_card.subtitle_no} · {primary_card.period_label_no}
          </p>
          <p className={styles.yearRange}>{primary_card.year_range_label_no}</p>
          <p className={styles.summary}>{primary_card.summary_no}</p>

          {selectedSegment === "samler" && collector_content && (
            <div className={styles.segmentDetails}>
              <h3>Samlerrelevans</h3>
              <p>{collector_content.collector_relevance_no}</p>
              {collector_content.object_relevance_no && <p>{collector_content.object_relevance_no}</p>}
              {collector_content.rarity_context_no && <p>{collector_content.rarity_context_no}</p>}
              {collector_content.collection_context_no && <p>{collector_content.collection_context_no}</p>}
              {(collector_content.related_object_count !== undefined ||
                collector_content.related_catalog_count !== undefined) && (
                <ul className={styles.statsList}>
                  {collector_content.related_object_count !== undefined && (
                    <li>Relaterte objekter: <strong>{collector_content.related_object_count}</strong></li>
                  )}
                  {collector_content.related_catalog_count !== undefined && (
                    <li>Katalogreferanser: <strong>{collector_content.related_catalog_count}</strong></li>
                  )}
                </ul>
              )}
            </div>
          )}

          {selectedSegment === "historie" && history_content && (
            <div className={styles.segmentDetails}>
              <h3>Historisk sammenheng</h3>
              <p>{history_content.history_summary_no}</p>
              {history_content.historical_context_no && <p>{history_content.historical_context_no}</p>}
              {history_content.ruler_context_no && <p>{history_content.ruler_context_no}</p>}
              {history_content.event_context_no && <p>{history_content.event_context_no}</p>}
              {history_content.period_context_no && <p>{history_content.period_context_no}</p>}
            </div>
          )}

          {selectedSegment === "finans" && finance_content && (
            <div className={styles.segmentDetails}>
              <h3>Finansiell sammenheng</h3>
              <p>{finance_content.finance_relevance_no}</p>
              {finance_content.economy_context_no && <p>{finance_content.economy_context_no}</p>}
              {finance_content.market_context_no && <p>{finance_content.market_context_no}</p>}
              {finance_content.inflation_context_no && <p>{finance_content.inflation_context_no}</p>}
              {finance_content.value_context_no && <p>{finance_content.value_context_no}</p>}
            </div>
          )}

          {primary_card.relation_href && (
            <div className={styles.relationLink}>
              <a href={primary_card.relation_href} className="ct-link">
                Hjelp oss å bli bedre, legg inn informasjon
              </a>
            </div>
          )}

          {primary_card.source && (
            <small className={styles.sourceNote}>Kilde: {primary_card.source}</small>
          )}
        </div>
      );
    }

    if (selectedNodeLocal) {
      const node = selectedNodeLocal;
      const objectCount = node.node_type === "ruler" ? 42 : node.node_type === "issue_period" ? 12 : undefined;

      return (
        <div className={styles.dynamicContentBlock}>
          <h2>[Fallback] {node.label_no}</h2>
          <p className={styles.subtitle}>
            {node.node_type || "Ukjent type"} · {node.group_label_no}
          </p>
          <p className={styles.yearRange}>
            {node.from_year !== null ? `${node.from_year}` : "Udatert"}
            {node.to_year !== null ? `–${node.to_year}` : node.from_year !== null ? "–Nå" : ""}
          </p>
          <p className={styles.summary}>{node.description_no || "Ingen beskrivelse tilgjengelig."}</p>

          <div className={styles.segmentDetails}>
            <h3>Nøkterne periodedata (Faktasjekk)</h3>
            <ul>
              <li><strong>Type/Klasse:</strong> {node.node_type}</li>
              <li><strong>Gruppe:</strong> {node.group_label_no}</li>
              <li><strong>Fra år:</strong> {node.from_year ?? "Ukjent"}</li>
              <li><strong>Til år:</strong> {node.to_year ?? "Nå / Løpende"}</li>
              {objectCount !== undefined && (
                <li><strong>Estimerte objekter:</strong> {objectCount}</li>
              )}
            </ul>
          </div>

          {node.relation_href && (
            <div className={styles.relationLink}>
              <a href={node.relation_href} className="ct-link">
                Hjelp oss å bli bedre, legg inn informasjon
              </a>
            </div>
          )}
          <small className={styles.sourceNote}>Kilde: {node.source_note_no}</small>
        </div>
      );
    }

    return <p>Ingen data tilgjengelig for valgt node.</p>;
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1>Periodefilter · sammenligning</h1>
          <p>
            Denne testen viser perioder som parallelle lag på samme tidsakse. Gruppene ligger i
            filteret. Verdiene under gruppene tegnes i tidslinjen.
          </p>
        </div>
        <div className={styles.versionBox}>
          <strong>v21</strong>
          <span>Grupper i filter · noder i tidslinje</span>
        </div>
      </section>

      <section className={styles.masterPanel}>
        <div className={styles.masterHeader}>
          <strong>Masterfilter</strong>
          <span>
            Konge/regent, nasjonal periode, krig/konflikt, finans/økonomi og objektutgivelser
            sammenlignes i tid.
          </span>
        </div>

        <div className={styles.masterGrid}>
          <label>
            <span>Land</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="Norge">Norge</option>
              <option value="Skandinavia">Skandinavia</option>
              <option value="Sverige">Sverige</option>
              <option value="Danmark">Danmark</option>
            </select>
          </label>

          <label>
            <span>Type objekt</span>
            <select value={objectType} onChange={(event) => setObjectType(event.target.value)}>
              <option value="Verdibrev">Verdibrev</option>
              <option value="Seddel">Seddel</option>
              <option value="Mynt">Mynt</option>
              <option value="Medalje">Medalje</option>
            </select>
          </label>

          <label>
            <span>År fra</span>
            <input
              type="number"
              value={yearFrom}
              onChange={(event) => setYearFrom(Number(event.target.value))}
            />
          </label>

          <label>
            <span>År til</span>
            <input
              type="number"
              value={yearTo}
              onChange={(event) => setYearTo(Number(event.target.value))}
            />
          </label>

          <label>
            <span>Visning</span>
            <select value={view} onChange={(event) => setView(event.target.value)}>
              <option value="Tidslinje">Tidslinje</option>
              <option value="Tabell">Tabell</option>
              <option value="Kort">Kort</option>
            </select>
          </label>
        </div>
      </section>

      <section className={styles.rowFilterGrid}>
        <SwitchSelect
          label="Rad 1 · hovedanker"
          value={row1Group}
          options={ROW1_SWITCH_OPTIONS}
          onChange={setRow1Group}
        />
        <SwitchSelect
          label="Rad 2 · sammenligning med"
          value={row2Group}
          options={ROW2_SWITCH_OPTIONS}
          onChange={setRow2Group}
        />
        <SwitchSelect
          label="Rad 3 · sammenligning med"
          value={row3Group}
          options={ROW3_SWITCH_OPTIONS}
          onChange={setRow3Group}
        />
      </section>

      <section className={styles.rulePanel}>
        <strong>Regel</strong>
        <p>
          Rullegardinene inneholder grupper. Tidslinjen viser verdier/noder under valgt gruppe.
          Radene er sammenligningslag, ikke trestruktur.
        </p>
      </section>

      {error ? (
        <section className={styles.errorPanel}>Feil: {error}</section>
      ) : null}

      <section className={styles.timelinePanel}>
        <div className={styles.timelineHeader}>
          <div>
            <strong>Tidslinje</strong>
            <span>
              {country} · {objectType} · {yearFrom}–{yearTo}
            </span>
          </div>
          <div className={styles.legend}>
            <span className={styles.legendRow1}>Rad 1</span>
            <span className={styles.legendRow2}>Rad 2</span>
            <span className={styles.legendRow3}>Rad 3</span>
          </div>
        </div>

        <div className={styles.scale}>
          {ticks.map((tick) => (
            <span
              key={tick}
              style={{
                left: `${((tick - yearFrom) / Math.max(1, yearTo - yearFrom)) * 100}%`,
              }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className={styles.timelineBody}>
          <div className={styles.gridLines}>
            {ticks.map((tick) => (
              <i
                key={tick}
                style={{
                  left: `${((tick - yearFrom) / Math.max(1, yearTo - yearFrom)) * 100}%`,
                }}
              />
            ))}
          </div>

          {data?.rows.map((row) => (
            <TimelineRow
              key={row.row_no}
              row={row}
              yearFrom={yearFrom}
              yearTo={yearTo}
              selectedNodeKey={selectedNodeKey}
              onNodeClick={handleNodeClick}
            />
          ))}
        </div>
      </section>

      {/* Segment Switcher Tabs */}
      <div className={styles.segmentTabs}>
        {(["samler", "historie", "finans"] as const).map((seg) => (
          <button
            key={seg}
            className={`${styles.segmentTab} ${
              selectedSegment === seg ? styles.activeSegmentTab : ""
            }`}
            onClick={() => setSelectedSegment(seg)}
          >
            {seg === "samler" ? "Samler" : seg === "historie" ? "Historie" : "Finans"}
          </button>
        ))}
      </div>

      <section className={styles.dynamicGrid}>
        <article className={styles.dynamicCard}>
          <div className={styles.dynamicTop}>
            <span>Dynamisk område 1</span>
            <small>{selectedSegment}</small>
          </div>
          <h2>
            {dynamicContent?.comparison_card?.title_no ||
              (selectedSegment === "samler"
                ? "Samlersammenheng"
                : selectedSegment === "finans"
                ? "Finansiell sammenheng"
                : "Historisk sammenheng")}
          </h2>
          {dynamicContent ? (
            <div className={styles.dynamicContentBlock}>
              <p>
                <strong>Sammenligning:</strong>{" "}
                {dynamicContent.comparison_card?.summary_no}
              </p>
              <ul className={styles.comparisonDetailsList} style={{ listStyleType: "none", paddingLeft: 0, marginTop: "8px" }}>
                {dynamicContent.comparison_card?.row1_summary_no && (
                  <li style={{ marginBottom: "6px" }}>• {dynamicContent.comparison_card.row1_summary_no}</li>
                )}
                {dynamicContent.comparison_card?.row2_summary_no && (
                  <li style={{ marginBottom: "6px" }}>• {dynamicContent.comparison_card.row2_summary_no}</li>
                )}
                {dynamicContent.comparison_card?.row3_summary_no && (
                  <li style={{ marginBottom: "6px" }}>• {dynamicContent.comparison_card.row3_summary_no}</li>
                )}
              </ul>
              {dynamicContent.comparison_card?.overlap_summary_no && (
                <p style={{ marginTop: "12px" }}>
                  <strong>Overlapp:</strong>{" "}
                  {dynamicContent.comparison_card.overlap_summary_no}
                </p>
              )}
              {dynamicContent.timeline_explanation?.rule_no && (
                <p>
                  <strong>Hovedregel:</strong>{" "}
                  {dynamicContent.timeline_explanation.rule_no}
                </p>
              )}
              {dynamicContent.timeline_explanation?.db_note_no && (
                <small style={{ display: "block", marginTop: "12px", opacity: 0.8 }}>
                  <strong>DB-mål:</strong>{" "}
                  {dynamicContent.timeline_explanation.db_note_no}
                </small>
              )}
            </div>
          ) : (
            <p>Laster sammenligningsdata...</p>
          )}
        </article>

        <article className={styles.dynamicCard}>
          <div className={styles.dynamicTop}>
            <span>Dynamisk område 2</span>
            <small>valgt tidslinjeinnhold</small>
          </div>
          {renderDynamicArea2()}
        </article>
      </section>

      <section className={styles.answerPanel}>
        <h2>Svar til ChatGPT</h2>
        <pre>{JSON.stringify(data?.answer_for_chatgpt || null, null, 2)}</pre>
      </section>
    </main>
  );
}
