/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Comparison Demo API
 *
 * Definering / formål:
 * API for Periode 8.6 sammenligningsmodell.
 * Rullegardinene returnerer grupper, tidslinjen returnerer noder under valgt gruppe.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/period86/comparison-demo
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.comparison.view
 * - period86.group_filter.view
 * - period86.timeline.view
 *
 * Berørte tabeller / views:
 * - Senere: ct_v_period_filter_options
 * - Senere: ct_v_period86_dynamic_field_resolved
 * - Senere: relation registry / period registry
 *
 * Dataretning:
 * Neon/API -> Next.js route -> React -> UI
 *
 * Versjon:
 * CT-PERIOD86-COMPARISON-DEMO-0021
 */

import { NextResponse } from "next/server";
import {
  PERIOD86_GROUPS,
  getGroupDefinition,
  getTimelineNodesForGroup,
  nodeOverlapsRange,
  type Period86ComparisonRow,
  type Period86GroupKey,
  type Period86TimelineNode,
} from "@/lib/period86/period86ComparisonGroups";

function asGroupKey(value: string | null, fallback: Period86GroupKey): Period86GroupKey {
  const allowed = PERIOD86_GROUPS.map((group) => group.group_key);
  if (value && allowed.includes(value as Period86GroupKey)) {
    return value as Period86GroupKey;
  }
  return fallback;
}

function asYear(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createRow(
  row_no: 1 | 2 | 3,
  selected_group_key: Period86GroupKey,
  year_from: number,
  year_to: number
): Period86ComparisonRow {
  const group = getGroupDefinition(selected_group_key);
  const nodes = getTimelineNodesForGroup(selected_group_key).filter((node) =>
    nodeOverlapsRange(node, year_from, year_to)
  );

  return {
    row_no,
    row_label_no:
      row_no === 1
        ? "Rad 1 · hovedanker"
        : row_no === 2
          ? "Rad 2 · sammenligning med"
          : "Rad 3 · sammenligning med",
    selected_group_key,
    selected_group_label_no: group.label_no,
    selected_group_description_no: group.description_no,
    timeline_nodes: nodes,
  };
}

function findOverlapExplanations(rows: Period86ComparisonRow[]) {
  const [row1, row2, row3] = rows;
  const explanations: string[] = [];

  const row1Nodes = row1.timeline_nodes;
  const compareRows = [row2, row3];

  for (const base of row1Nodes) {
    if (base.from_year === null) continue;
    const baseTo = base.to_year ?? 2024;

    for (const compareRow of compareRows) {
      for (const other of compareRow.timeline_nodes) {
        if (other.from_year === null) continue;
        const otherTo = other.to_year ?? 2024;

        const overlaps = base.from_year <= otherTo && other.from_year <= baseTo;

        if (overlaps) {
          explanations.push(
            `${base.label_no} (${base.year_label}) overlapper ${other.label_no} (${other.year_label}) i gruppen ${compareRow.selected_group_label_no}.`
          );
        }
      }
    }
  }

  return explanations.slice(0, 12);
}

function collectAllNodes(rows: Period86ComparisonRow[]): Period86TimelineNode[] {
  return rows.flatMap((row) => row.timeline_nodes);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const country = url.searchParams.get("country") || "Norge";
  const object_type = url.searchParams.get("object_type") || "Verdibrev";
  const year_from = asYear(url.searchParams.get("year_from"), 1707);
  const year_to = asYear(url.searchParams.get("year_to"), 2024);
  const view = url.searchParams.get("view") || "timeline";

  const row1_group = asGroupKey(url.searchParams.get("row1_group"), "ruler_issuer");
  const row2_group = asGroupKey(url.searchParams.get("row2_group"), "national_period");
  const row3_group = asGroupKey(url.searchParams.get("row3_group"), "finance_economy");

  const rows: Period86ComparisonRow[] = [
    createRow(1, row1_group, year_from, year_to),
    createRow(2, row2_group, year_from, year_to),
    createRow(3, row3_group, year_from, year_to),
  ];

  const allNodes = collectAllNodes(rows);
  const overlapExplanations = findOverlapExplanations(rows);

  const response = {
    ok: true,
    demo: true,
    version: "v21-comparison-groups",
    collectium_standard: "period86",
    query: {
      country,
      object_type,
      year_from,
      year_to,
      view,
      row1_group,
      row2_group,
      row3_group,
    },
    groups: PERIOD86_GROUPS,
    rows,
    timeline: {
      year_from,
      year_to,
      nodes: allNodes,
    },
    dynamic_area: {
      title_no: "Valgt tidslinjeinnhold",
      explanation_no:
        "Filter/rullegardinene inneholder grupper. Tidslinjen viser verdier/noder under valgt gruppe. Målet er å se hvilke perioder, konger, konflikter, økonomiske perioder og utgivelser som overlapper i tid.",
      overlap_explanations: overlapExplanations,
      empty_state_no:
        overlapExplanations.length === 0
          ? "Ingen tydelige overlapp funnet i demo-data for valgt kombinasjon."
          : null,
    },
    rules: {
      group_rule:
        "Det som står i rullegardinene er grupper. Det som tegnes i tidslinjen er verdier/noder under valgt gruppe.",
      timeline_rule:
        "Tidstabellen skal vise sammenfall i tid: konge/statsoverhode treffer nasjonal periode, krig/fred, finans/økonomi, objektutgivelser, sykdom, signatur/person og motiv.",
      row_rule:
        "Radene er sammenligningslag, ikke trestruktur. Rad 1 er hovedanker, Rad 2 og Rad 3 er sammenligning med valgte grupper.",
    },
    answer_for_chatgpt: {
      status: "OK",
      message:
        "Periodefilteret er oppdatert til sammenligningsmodell v21: grupper i filter, noder i tidslinjen.",
      expected:
        "Velger man Konge / regent + utgiver i Rad 1, skal tidslinjen vise Karl XIV Johan, Oscar I, Karl IV, Oscar II, Haakon VII, Olav V og Harald V. Velger man Nasjonal periode, skal tidslinjen vise Union med Sverige, Selvstendig Norge og Etterkrigstiden. Velger man Finans / økonomi, skal tidslinjen vise Bank- og pengebygging, Mellomkrig / krise og Olje- og inflasjon.",
      next_step:
        "Koble demo-nodene mot ekte Neon-data fra periode-, relasjons- og katalogviews.",
    },
  };

  return NextResponse.json(response);
}
