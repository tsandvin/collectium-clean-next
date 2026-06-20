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

type GroupKey =
  | "ruler_issuer"
  | "national_period"
  | "war_conflict"
  | "finance_economy"
  | "signature_person"
  | "object_issue_period"
  | "disease_society"
  | "motif_symbol"
  | "provenance_find";

type GroupDefinition = {
  group_key: GroupKey;
  label_no: string;
  description_no: string;
};

type TimelineNode = {
  node_key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  group_key: GroupKey;
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
  selected_group_key: GroupKey;
  selected_group_label_no: string;
  selected_group_description_no: string;
  timeline_nodes: TimelineNode[];
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
    row1_group: GroupKey;
    row2_group: GroupKey;
    row3_group: GroupKey;
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

function GroupSelect({
  label,
  value,
  groups,
  onChange,
}: {
  label: string;
  value: GroupKey;
  groups: GroupDefinition[];
  onChange: (value: GroupKey) => void;
}) {
  const group = groups.find((item) => item.group_key === value);

  return (
    <label className={styles.selectCard}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as GroupKey)}>
        {groups.map((item) => (
          <option key={item.group_key} value={item.group_key}>
            {item.label_no}
          </option>
        ))}
      </select>
      <small>{group?.description_no}</small>
    </label>
  );
}

function TimelineRow({
  row,
  yearFrom,
  yearTo,
}: {
  row: ComparisonRow;
  yearFrom: number;
  yearTo: number;
}) {
  return (
    <div className={styles.timelineRow}>
      <div className={styles.rowLabel}>
        <strong>{row.selected_group_label_no}</strong>
        <span>{row.row_label_no}</span>
      </div>

      <div className={styles.track}>
        {row.timeline_nodes.length === 0 ? (
          <div className={styles.emptyNode}>Ingen noder i valgt periode</div>
        ) : (
          row.timeline_nodes.map((node) => (
            <div
              key={`${row.row_no}-${node.node_key}`}
              className={`${styles.bar} ${styles[`row${row.row_no}`]}`}
              style={getTimelineStyle(node, yearFrom, yearTo)}
              title={`${node.label_no} · ${node.year_label} · ${node.description_no}`}
            >
              <span>{node.label_no}</span>
              <small>{node.year_label}</small>
            </div>
          ))
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
  const [row1Group, setRow1Group] = useState<GroupKey>("ruler_issuer");
  const [row2Group, setRow2Group] = useState<GroupKey>("national_period");
  const [row3Group, setRow3Group] = useState<GroupKey>("finance_economy");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = data?.groups?.length ? data.groups : DEFAULT_GROUPS;

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
    });

    setError(null);

    fetch(`/api/period86/comparison-demo?${params.toString()}`, {
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
  }, [country, objectType, yearFrom, yearTo, view, row1Group, row2Group, row3Group]);

  const ticks = useMemo(() => buildYearTicks(yearFrom, yearTo), [yearFrom, yearTo]);

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
        <GroupSelect
          label="Rad 1 · hovedanker"
          value={row1Group}
          groups={groups}
          onChange={setRow1Group}
        />
        <GroupSelect
          label="Rad 2 · sammenligning med"
          value={row2Group}
          groups={groups}
          onChange={setRow2Group}
        />
        <GroupSelect
          label="Rad 3 · sammenligning med"
          value={row3Group}
          groups={groups}
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
            <TimelineRow key={row.row_no} row={row} yearFrom={yearFrom} yearTo={yearTo} />
          ))}
        </div>
      </section>

      <section className={styles.dynamicGrid}>
        <article className={styles.dynamicCard}>
          <div className={styles.dynamicTop}>
            <span>Dynamisk område 1</span>
            <small>samler</small>
          </div>
          <h2>Samlerforklaring</h2>
          <p>
            Tabellen viser hvilke konge-/regentperioder, nasjonale perioder, finansperioder,
            konflikter og objektutgivelser som overlapper. Dette gjør det mulig å forstå hvorfor et
            objekt hører hjemme i en historisk og samlermessig periode.
          </p>
        </article>

        <article className={styles.dynamicCard}>
          <div className={styles.dynamicTop}>
            <span>Dynamisk område 2</span>
            <small>valgt tidslinjeinnhold</small>
          </div>
          <h2>{data?.dynamic_area.title_no || "Valgt tidslinjeinnhold"}</h2>
          <p>{data?.dynamic_area.explanation_no}</p>

          {data?.dynamic_area.overlap_explanations?.length ? (
            <ul>
              {data.dynamic_area.overlap_explanations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{data?.dynamic_area.empty_state_no || "Ingen overlapp forklart enda."}</p>
          )}
        </article>
      </section>

      <section className={styles.answerPanel}>
        <h2>Svar til ChatGPT</h2>
        <pre>{JSON.stringify(data?.answer_for_chatgpt || null, null, 2)}</pre>
      </section>
    </main>
  );
}
