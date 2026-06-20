/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Result Demo Component v2
 *
 * Definering / formål:
 * Viser forklarte resultater for Periode 8.6-radmodellen.
 * v2 retter Rad 1 slik at Konge/hersker viser konger/herskere,
 * ikke generelle historiske perioder.
 *
 * Bruksområde:
 * Brukes på /test/period86-result.
 *
 * Berørte sider / routes:
 * - /test/period86-result
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.result.demo.view
 *
 * Berørte API-ruter:
 * - GET /api/period86/result-demo
 *
 * Dataretning:
 * API -> React -> UI
 *
 * Logging:
 * log_category: period86
 * log_action: result_demo_view
 *
 * Versjon:
 * CT-PERIOD86-RESULT-DEMO-COMPONENT-0002
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Period86ResultDemo.module.css";

type FieldRow = {
  label_no: string;
  value_no: string;
};

type ResultRow = {
  label_no: string;
  selected_group_no: string;
  result_label_no: string;
  year_label: string;
  match_type: string;
  explanation_no: string;
  fields: FieldRow[];
};

type TimelineNode = {
  key: string;
  label_no: string;
  from_year: number | null;
  to_year: number | null;
  year_label: string;
  lane: "master" | "row1" | "row2" | "row3" | "row4";
  node_type: string;
  group_key: string;
  is_active: boolean;
  match_type: string;
  explanation_no: string;
};

type ApiResponse = {
  ok: boolean;
  demo: boolean;
  version: string;
  collectium_standard: string;
  query: {
    master: string;
    year: number;
    row1: string;
    row2: string;
    row3: string;
    row4: string;
  };
  rule: {
    timeline_year_rule: string;
    row1_ruler_rule: string;
    no_fake_match_rule: string;
  };
  result: {
    title_no: string;
    summary_no: string;
    master: {
      label_no: string;
      explanation_no: string;
    };
    selected_year: {
      value: number;
      explanation_no: string;
    };
    row1: ResultRow;
    row2: ResultRow;
    row3: ResultRow;
    row4: ResultRow;
  };
  timeline: TimelineNode[];
  answer_for_chatgpt: {
    status: string;
    message: string;
    correction: string;
    next_step: string;
  };
};

const MATCH_LABELS: Record<string, string> = {
  direct_period_match: "Direkte treff",
  no_direct_match: "Ingen direkte treff",
  context_match: "Konteksttreff",
  catalog_context: "Katalogkobling",
  relation_detail: "Relasjonsdetalj",
  inactive_timeline_node: "Tidslinjenode",
};

const LANE_LABELS: Record<TimelineNode["lane"], string> = {
  master: "Master",
  row1: "Rad 1",
  row2: "Rad 2",
  row3: "Rad 3",
  row4: "Rad 4",
};

function getMatchLabel(matchType: string) {
  return MATCH_LABELS[matchType] || matchType;
}

function getTimelineStyle(node: TimelineNode, minYear: number, maxYear: number) {
  const range = Math.max(1, maxYear - minYear);
  const from = node.from_year ?? minYear;
  const to = node.to_year ?? maxYear;

  const left = Math.max(0, Math.min(100, ((from - minYear) / range) * 100));
  const right = Math.max(0, Math.min(100, ((maxYear - to) / range) * 100));

  return {
    left: `${left}%`,
    right: `${right}%`,
  };
}

function RowCard({ row }: { row: ResultRow }) {
  return (
    <article className={styles.rowCard}>
      <div className={styles.rowHeader}>
        <div>
          <p className={styles.rowKicker}>{row.label_no}</p>
          <h3>{row.result_label_no}</h3>
        </div>
        <div className={styles.rowBadge}>{getMatchLabel(row.match_type)}</div>
      </div>

      <div className={styles.rowMeta}>
        <span>Valg: {row.selected_group_no}</span>
        <span>Tid: {row.year_label}</span>
      </div>

      <p className={styles.explanation}>{row.explanation_no}</p>

      <dl className={styles.fieldGrid}>
        {row.fields.map((field) => (
          <div key={`${row.label_no}-${field.label_no}`} className={styles.fieldItem}>
            <dt>{field.label_no}</dt>
            <dd>{field.value_no}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function Period86ResultDemo() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = {
    master: "Norge",
    year: "1900",
    row1: "Konge/hersker",
    row2: "Krig",
    row3: "Historisk",
    row4: "Motiv",
  };

  useEffect(() => {
    const params = new URLSearchParams(query);

    fetch(`/api/period86/result-demo?${params.toString()}`, {
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
  }, []);

  const timelineBounds = useMemo(() => {
    if (!data?.timeline?.length) {
      return { minYear: 1800, maxYear: 2026 };
    }

    const years = data.timeline
      .flatMap((node) => [node.from_year, node.to_year])
      .filter((value): value is number => typeof value === "number");

    return {
      minYear: Math.min(...years, 1800),
      maxYear: Math.max(...years, 2026),
    };
  }, [data]);

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <h1>Periode 8.6 · Resultatdemo</h1>
          <p className={styles.error}>Feil: {error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <h1>Periode 8.6 · Resultatdemo</h1>
          <p>Laster resultat...</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.heroPanel}>
        <div>
          <p className={styles.kicker}>Collectium · Periode 8.6 · {data.version}</p>
          <h1>{data.result.title_no}</h1>
          <p className={styles.summary}>{data.result.summary_no}</p>
        </div>

        <div className={styles.queryBox}>
          <div>
            <span>Master</span>
            <strong>{data.query.master}</strong>
          </div>
          <div>
            <span>År</span>
            <strong>{data.query.year}</strong>
          </div>
          <div>
            <span>Rad 1</span>
            <strong>{data.query.row1}</strong>
          </div>
          <div>
            <span>Rad 2</span>
            <strong>{data.query.row2}</strong>
          </div>
          <div>
            <span>Rad 3</span>
            <strong>{data.query.row3}</strong>
          </div>
          <div>
            <span>Rad 4</span>
            <strong>{data.query.row4}</strong>
          </div>
        </div>
      </section>

      <section className={styles.rulePanel}>
        <h2>Regel for Rad 1 og tidstabell</h2>
        <p>{data.rule.row1_ruler_rule}</p>
        <p>{data.rule.timeline_year_rule}</p>
        <p>{data.rule.no_fake_match_rule}</p>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Tidstabell</p>
            <h2>Konge-/herskerlinje med aktivt år {data.query.year}</h2>
          </div>
          <div className={styles.yearMarkerLabel}>Valgt år: {data.query.year}</div>
        </div>

        <div className={styles.timelineScale}>
          <span>{timelineBounds.minYear}</span>
          <span>{data.query.year}</span>
          <span>{timelineBounds.maxYear}</span>
        </div>

        <div className={styles.timelineRows}>
          <div
            className={styles.selectedYear}
            style={{
              left: `${((data.query.year - timelineBounds.minYear) / Math.max(1, timelineBounds.maxYear - timelineBounds.minYear)) * 100}%`,
            }}
          />

          {data.timeline.map((node) => (
            <div key={node.key} className={styles.timelineRow}>
              <div className={styles.timelineLane}>
                {LANE_LABELS[node.lane]}
                <small>{node.group_key}</small>
              </div>
              <div className={styles.timelineTrack}>
                {node.from_year !== null ? (
                  <div
                    className={[
                      styles.timelineBar,
                      styles[node.lane],
                      node.is_active ? styles.activeBar : "",
                    ].join(" ")}
                    style={getTimelineStyle(node, timelineBounds.minYear, timelineBounds.maxYear)}
                    title={node.explanation_no}
                  >
                    <span>{node.label_no}</span>
                    <small>{node.year_label}</small>
                  </div>
                ) : (
                  <div className={styles.timelineMaster}>
                    <span>{node.label_no}</span>
                    <small>{node.year_label}</small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.resultGrid}>
        <RowCard row={data.result.row1} />
        <RowCard row={data.result.row2} />
        <RowCard row={data.result.row3} />
        <RowCard row={data.result.row4} />
      </section>

      <section className={styles.answerPanel}>
        <h2>Svar til ChatGPT</h2>
        <pre>{JSON.stringify(data.answer_for_chatgpt, null, 2)}</pre>
      </section>
    </main>
  );
}
