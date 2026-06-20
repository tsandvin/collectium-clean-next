/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Live Comparison API
 *
 * Definering / formål:
 * Live, Neon DB-tilkoblet API for Periode 8.6 sammenligningsmodell.
 * Henter virkelige perioder og herskere fra databasen.
 *
 * Bruksområde:
 * Brukes av /test/periodefilter.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/period86/comparison
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.comparison.view
 * - period86.group_filter.view
 * - period86.timeline.view
 *
 * Berørte tabeller / views:
 * - ct_v_period86_row1_statsoverhode_nodes_v2
 * - ct_v_period_filter_options
 * - ct_v_period86_dynamic_field_resolved
 * - ct_v_catalog_period_relations
 *
 * Dataretning:
 * Neon/API -> Next.js route -> React -> UI
 *
 * Versjon:
 * CT-PERIOD86-COMPARISON-LIVE-0001
 */

import { NextResponse } from "next/server";
import { period86Query } from "@/lib/period86/period86Db";
import {
  ROW1_SWITCH_OPTIONS,
  ROW2_SWITCH_OPTIONS,
  ROW3_SWITCH_OPTIONS,
  type Period86SwitchOption,
} from "@/lib/period86/period86ComparisonGroups";

export const dynamic = "force-dynamic";

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
};

type ComparisonRow = {
  row_no: 1 | 2 | 3;
  row_label_no: string;
  selected_group_key: string;
  selected_group_label_no: string;
  selected_group_description_no: string;
  timeline_nodes: TimelineNode[];
};

function asYear(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getYearLabel(start: number | null, end: number | null): string {
  if (start === null) return "Udatert";
  if (end === null) return `${start}–`;
  if (start === end) return `${start}`;
  return `${start}–${end}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const country = url.searchParams.get("country") || "Norge";
  const object_type = url.searchParams.get("object_type") || "Verdibrev";
  const year_from = asYear(url.searchParams.get("year_from"), 1707);
  const year_to = asYear(url.searchParams.get("year_to"), 2024);
  const view = url.searchParams.get("view") || "Tidslinje";

  const row1_group = url.searchParams.get("row1_group") || "herskere_statsoverhoder";
  const row2_group = url.searchParams.get("row2_group") || "finans_okonomi";
  const row3_group = url.searchParams.get("row3_group") || "signatur_person";

  const selected_segment = (url.searchParams.get("selected_segment") || "historie") as "samler" | "historie" | "finans";
  const selected_node_key = url.searchParams.get("selected_node_key") || null;
  const selected_lane = url.searchParams.get("selected_lane") ? Number(url.searchParams.get("selected_lane")) : null;

  try {
    // 1. Fetch Row 1 Nodes (Rulers / Statsoverhoder)
    const opt1 = ROW1_SWITCH_OPTIONS.find((o: Period86SwitchOption) => o.key === row1_group) || { key: row1_group, label_no: row1_group, description_no: "" };
    const row1DbNodes = await period86Query<{
      node_key: string;
      label_no: string;
      start_year: number | null;
      end_year: number | null;
      relation_href: string | null;
      count: string;
      source: string;
      type_group_key: string;
      type_group_label_no: string;
      short_summary_no: string | null;
    }>(`
      select
        node_key,
        label_no,
        start_year,
        end_year,
        relation_href,
        coalesce(object_count, 0)::text as count,
        'ct_v_period86_row1_statsoverhode_nodes_v2'::text as source,
        type_group_key,
        type_group_label_no,
        short_summary_no
      from ct_v_period86_row1_statsoverhode_nodes_v2
      where start_year <= $2
        and coalesce(end_year, $2) >= $1
        and (
          $3 = 'herskere_statsoverhoder' or $3 = 'all'
          or ($3 = 'konge_kongemakt' and type_group_key = 'konge')
          or ($3 = 'regent_fungerende_statsmakt' and type_group_key = 'regent')
          or ($3 = 'union' and type_group_key = 'union')
          or ($3 = 'styreform_maktstruktur' and type_group_key = 'styreform')
          or ($3 = 'lokal_hersker_smakonge' and type_group_key = 'lokal_hersker')
          or ($3 = 'okkuperende_makt' and type_group_key = 'okkuperende_makt')
          or ($3 = 'kirkelig_makt' and type_group_key = 'kirkelig_makt')
          or ($3 = 'dronning' and type_group_key = 'dronning')
        )
      order by start_year nulls last, coalesce(end_year, $2), label_no;
    `, [year_from, year_to, row1_group]);

    const row1Nodes: TimelineNode[] = row1DbNodes.map((n: any) => ({
      node_key: n.node_key,
      label_no: n.label_no,
      from_year: n.start_year,
      to_year: n.end_year,
      year_label: getYearLabel(n.start_year, n.end_year),
      group_key: "ruler_issuer",
      group_label_no: "Konge / regent + utgiver",
      node_type: n.type_group_label_no || n.type_group_key || "Statsoverhode",
      description_no: n.short_summary_no || "Ingen Neon-tekst registrert for dette feltet.",
      relation_href: n.relation_href,
      source_note_no: n.source,
    }));

    // 2. Fetch Row 2 Nodes (Nasjonale, Finans, Konflikt, Krise)
    const opt2 = ROW2_SWITCH_OPTIONS.find((o: Period86SwitchOption) => o.key === row2_group) || { key: row2_group, label_no: row2_group, description_no: "" };
    const row2DbNodes = await period86Query<{
      node_key: string;
      label_no: string;
      start_year: number | null;
      end_year: number | null;
      relation_href: string | null;
      period_type_key: string;
      period_type_label_no: string;
      summary_short_no: string | null;
    }>(`
      select
        period_slug as node_key,
        display_name_no as label_no,
        start_year,
        end_year,
        relation_href,
        period_type_key,
        period_type_label_no,
        display_name_no as summary_short_no
      from ct_v_period_filter_options
      where start_year <= $2
        and coalesce(end_year, $2) >= $1
        and (
          ($3 = 'finans_okonomi' and period_type_key in ('economic_period', 'monetary_period', 'banknote_issue_period'))
          or ($3 = 'nasjonale_perioder' and period_type_key in ('historical_main_period', 'union_period'))
          or ($3 = 'krig_konflikt' and period_type_key in ('war_period', 'conflict_period'))
          or ($3 = 'sykdom_krise' and period_type_key = 'health_period')
        )
      order by start_year nulls last, display_name_no;
    `, [year_from, year_to, row2_group]);

    const row2Nodes: TimelineNode[] = row2DbNodes.map((n: any) => ({
      node_key: n.node_key,
      label_no: n.label_no,
      from_year: n.start_year,
      to_year: n.end_year,
      year_label: getYearLabel(n.start_year, n.end_year),
      group_key: "national_period",
      group_label_no: "Nasjonal periode",
      node_type: n.period_type_label_no || "Periode",
      description_no: n.summary_short_no || "Ingen Neon-tekst registrert for dette feltet.",
      relation_href: n.relation_href,
      source_note_no: "ct_v_period_filter_options",
    }));

    // 3. Fetch Row 3 Nodes (Person, Utgiver, Motiv, Serie)
    const opt3 = ROW3_SWITCH_OPTIONS.find((o: Period86SwitchOption) => o.key === row3_group) || { key: row3_group, label_no: row3_group, description_no: "" };
    let row3DbNodes: any[] = [];
    if (row3_group === "signatur_person") {
      row3DbNodes = await period86Query<{
        node_key: string;
        label_no: string;
        count: string;
        source: string;
      }>(`
        select
          lower(regexp_replace(coalesce(matched_from_value, issue_name_no, 'ukjent'), '[^a-zA-Z0-9æøåÆØÅ]+', '-', 'g')) as node_key,
          coalesce(matched_from_value, issue_name_no, 'Ukjent produsent / utsteder') as label_no,
          null::integer as start_year,
          null::integer as end_year,
          null::text as relation_href,
          count(distinct source_key || ':' || object_group || ':' || object_id::text)::text as count,
          'ct_v_catalog_period_relations'::text as source
        from ct_v_catalog_period_relations
        where matched_from_field ilike '%producer%'
           or matched_from_field ilike '%issuer%'
           or issue_type ilike '%producer%'
           or issue_type ilike '%issuer%'
        group by coalesce(matched_from_value, issue_name_no, 'Ukjent produsent / utsteder')
        order by count(distinct source_key || ':' || object_group || ':' || object_id::text) desc
        limit 50;
      `);
    } else if (row3_group === "objekt_utgiver" || row3_group === "utgave_serie") {
      row3DbNodes = await period86Query<{
        node_key: string;
        label_no: string;
        start_year: number | null;
        end_year: number | null;
        relation_href: string | null;
        period_type_key: string;
      }>(`
        select
          period_slug as node_key,
          display_name_no as label_no,
          start_year,
          end_year,
          relation_href,
          period_type_key
        from ct_v_period_filter_options
        where period_type_key in ('banknote_issue_period', 'monetary_period')
          and start_year <= $2
          and coalesce(end_year, $2) >= $1
        order by start_year nulls last, display_name_no;
      `, [year_from, year_to]);
    } else if (row3_group === "motiv") {
      row3DbNodes = await period86Query<{
        node_key: string;
        label_no: string;
        start_year: number | null;
        end_year: number | null;
        relation_href: string | null;
      }>(`
        select
          period_slug as node_key,
          display_name_no as label_no,
          start_year,
          end_year,
          relation_href
        from ct_v_period_filter_options
        where period_type_key = 'motif'
          and start_year <= $2
          and coalesce(end_year, $2) >= $1
        order by start_year nulls last, display_name_no;
      `, [year_from, year_to]);
    }

    const row3Nodes: TimelineNode[] = row3DbNodes.map((n: any) => ({
      node_key: n.node_key,
      label_no: n.label_no,
      from_year: n.start_year || null,
      to_year: n.end_year || null,
      year_label: getYearLabel(n.start_year, n.end_year),
      group_key: "signature_person",
      group_label_no: "Signatur / person",
      node_type: n.period_type_key || "Produsent / utsteder",
      description_no: "Registrert produsent eller utgaveperiode i databasen.",
      relation_href: n.relation_href || null,
      source_note_no: n.source || "ct_v_period_filter_options",
    }));

    const rows: ComparisonRow[] = [
      {
        row_no: 1,
        row_label_no: "Rad 1 · hovedanker",
        selected_group_key: row1_group,
        selected_group_label_no: opt1.label_no,
        selected_group_description_no: opt1.description_no,
        timeline_nodes: row1Nodes,
      },
      {
        row_no: 2,
        row_label_no: "Rad 2 · sammenligning med",
        selected_group_key: row2_group,
        selected_group_label_no: opt2.label_no,
        selected_group_description_no: opt2.description_no,
        timeline_nodes: row2Nodes,
      },
      {
        row_no: 3,
        row_label_no: "Rad 3 · sammenligning med",
        selected_group_key: row3_group,
        selected_group_label_no: opt3.label_no,
        selected_group_description_no: opt3.description_no,
        timeline_nodes: row3Nodes,
      },
    ];

    // Determine overlap explanations
    const overlaps: string[] = [];
    for (const r1 of row1Nodes) {
      if (r1.from_year === null) continue;
      const r1To = r1.to_year ?? year_to;
      for (const r2 of row2Nodes) {
        if (r2.from_year === null) continue;
        const r2To = r2.to_year ?? year_to;
        const overlapsR1R2 = r1.from_year <= r2To && r2.from_year <= r1To;
        if (overlapsR1R2) {
          overlaps.push(`${r1.label_no} (${r1.year_label}) overlapper ${r2.label_no} (${r2.year_label}) i gruppen ${opt2.label_no}.`);
        }
      }
    }
    const overlapExplanations = overlaps.slice(0, 10);

    // Fetch Details for Selected Node if present
    let selectedNodeDb: any = null;
    if (selected_node_key) {
      if (selected_lane === 1) {
        const dbRows = await period86Query(`
          select * from ct_v_period86_row1_statsoverhode_nodes_v2 where node_key = $1 limit 1;
        `, [selected_node_key]);
        if (dbRows[0]) {
          const r = dbRows[0] as any;
          selectedNodeDb = {
            label_no: r.label_no,
            type_label_no: r.type_group_label_no || r.type_label_no || "Statsoverhode",
            start_year: r.start_year,
            end_year: r.end_year,
            short_summary_no: r.short_summary_no || "Ingen Neon-tekst registrert for dette feltet.",
            collector_relevance_no: r.collector_relevance_no || "Ingen Neon-tekst registrert for dette feltet.",
            object_relevance_no: r.object_relevance_no || "Ingen Neon-tekst registrert for dette feltet.",
            history_summary_no: r.history_summary_no || "Ingen Neon-tekst registrert for dette feltet.",
            relation_href: r.relation_href,
            object_count: r.object_count,
            source_table: "ct_v_period86_row1_statsoverhode_nodes_v2",
          };
        }
      } else {
        const dbRows = await period86Query(`
          select * from ct_v_period86_dynamic_field_resolved where period_slug = $1 limit 1;
        `, [selected_node_key]);
        if (dbRows[0]) {
          const p = dbRows[0] as any;
          selectedNodeDb = {
            label_no: p.periode,
            type_label_no: p.type_label_no || "Periode",
            start_year: p.start_year,
            end_year: p.end_year,
            short_summary_no: p.beskrivelse || "Ingen Neon-tekst registrert for dette feltet.",
            collector_relevance_no: p.collectium_relevans || "Ingen Neon-tekst registrert for dette feltet.",
            object_relevance_no: "Ingen Neon-tekst registrert for dette feltet.",
            history_summary_no: p.beskrivelse || "Ingen Neon-tekst registrert for dette feltet.",
            relation_href: p.relation_href,
            object_count: p.object_count,
            source_table: "ct_v_period86_dynamic_field_resolved",
          };
        }
      }
    }

    const primary_card = selectedNodeDb ? {
      title_no: selectedNodeDb.label_no,
      subtitle_no: selectedNodeDb.type_label_no,
      period_label_no: "Periode",
      year_range_label_no: getYearLabel(selectedNodeDb.start_year, selectedNodeDb.end_year),
      summary_no: selectedNodeDb.short_summary_no || "Ingen Neon-tekst registrert for dette feltet.",
      relation_href: selectedNodeDb.relation_href || null,
      source: selectedNodeDb.source_table,
    } : {
      title_no: opt1.label_no,
      subtitle_no: "Sammenligningsgruppe",
      period_label_no: "Hovedanker",
      year_range_label_no: `${year_from}–${year_to}`,
      summary_no: opt1.description_no || "Velg en farget tidslinjeblokk for å se detaljert innhold.",
      relation_href: null,
      source: "timeline_view_summary",
    };

    const comparison_card = {
      title_no: selected_segment === "samler"
        ? "Samlersammenheng"
        : selected_segment === "finans"
          ? "Finansiell sammenheng"
          : "Historisk sammenheng",
      summary_no: `${opt1.label_no} sammenlignes med ${opt2.label_no} og ${opt3.label_no} på en felles tidsakse fra ${year_from} til ${year_to}.`,
      row1_summary_no: `Rad 1 viser ${opt1.label_no}. ${opt1.description_no}`,
      row2_summary_no: `Rad 2 viser ${opt2.label_no}. ${opt2.description_no}`,
      row3_summary_no: `Rad 3 viser ${opt3.label_no}. ${opt3.description_no}`,
      overlap_summary_no: overlapExplanations.length > 0
        ? `Det er registrert ${overlapExplanations.length} tidsmessige overlapp mellom radene.`
        : "Ingen direkte overlapp er funnet i Neon-data for valgt kombinasjon.",
      relation_href: null,
    };

    const collector_content = {
      title_no: "Samlerrelevans",
      collector_relevance_no: selectedNodeDb
        ? (selectedNodeDb.collector_relevance_no || "Ingen Neon-tekst registrert for dette feltet.")
        : `Denne perioden har samlerrelevans fordi objekter, utgaver, signaturer og regentperiode overlapper i samme tidsrom.`,
      object_relevance_no: selectedNodeDb
        ? (selectedNodeDb.object_relevance_no || "Ingen Neon-tekst registrert for dette feltet.")
        : "Katalogobjekter er knyttet til denne perioden.",
      rarity_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      collection_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      related_object_count: selectedNodeDb ? Number(selectedNodeDb.object_count || 0) : 0,
      related_catalog_count: 0,
      relation_href: selectedNodeDb?.relation_href || null,
    };

    const history_content = {
      title_no: "Historisk sammenheng",
      history_summary_no: selectedNodeDb
        ? (selectedNodeDb.history_summary_no || "Ingen Neon-tekst registrert for dette feltet.")
        : `Dette viser hvilke maktstrukturer, personer og hendelser som overlapper med objektperioden.`,
      historical_context_no: selectedNodeDb
        ? (selectedNodeDb.short_summary_no || "Ingen Neon-tekst registrert for dette feltet.")
        : "Historiske rammer og hendelser danner bakgrunnen for utgivelsen.",
      ruler_context_no: `Regent- og maktstrukturer under ${opt1.label_no} i tidsrommet.`,
      event_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      period_context_no: `Nasjonal periode: ${opt2.label_no}.`,
      relation_href: selectedNodeDb?.relation_href || null,
    };

    const finance_content = {
      title_no: "Finansiell sammenheng",
      finance_relevance_no: "Ingen Neon-tekst registrert for dette feltet.",
      economy_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      market_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      inflation_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      value_context_no: "Ingen Neon-tekst registrert for dette feltet.",
      relation_href: selectedNodeDb?.relation_href || null,
    };

    const timeline_explanation = {
      title_no: "Tidslinjeforklaring",
      comparison_no: `${opt1.label_no} sammenlignes med ${opt2.label_no} og ${opt3.label_no}.`,
      overlap_no: "Overlappende perioder viser samtidighet på samme årsskala.",
      rule_no: "Radene skal ikke låse hverandre som trestruktur. De viser samtidige perioder på samme årsskala.",
      db_note_no: "Hentet live fra views med relation_type, start_year, end_year, lane og relation_href.",
    };

    const debug = {
      source_api: "/api/period86/comparison",
      source_view: selectedNodeDb?.source_table || "ct_v_period86_timeline_nodes",
      selected_from_year: year_from,
      selected_to_year: year_to,
      node_count: row1Nodes.length + row2Nodes.length + row3Nodes.length,
    };

    const dynamic_content = {
      selected_segment,
      row1_selection: {
        key: opt1.key,
        label_no: opt1.label_no,
        description_no: opt1.description_no || undefined,
        selected_node_key: selected_lane === 1 ? selected_node_key : null,
        selected_node_label_no: selected_lane === 1 ? selectedNodeDb?.label_no : null,
      },
      row2_selection: {
        key: opt2.key,
        label_no: opt2.label_no,
        description_no: opt2.description_no || undefined,
        selected_node_key: selected_lane === 2 ? selected_node_key : null,
        selected_node_label_no: selected_lane === 2 ? selectedNodeDb?.label_no : null,
      },
      row3_selection: {
        key: opt3.key,
        label_no: opt3.label_no,
        description_no: opt3.description_no || undefined,
        selected_node_key: selected_lane === 3 ? selected_node_key : null,
        selected_node_label_no: selected_lane === 3 ? selectedNodeDb?.label_no : null,
      },
      primary_card,
      comparison_card,
      collector_content,
      history_content,
      finance_content,
      timeline_explanation,
      debug,
    };

    return NextResponse.json({
      ok: true,
      demo: false,
      version: "v21-comparison-groups-resolved",
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
        selected_segment,
        selected_node_key,
        selected_lane,
      },
      rows,
      dynamic_content,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "Kunne ikke hente live sammenligning fra Neon DB.",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
