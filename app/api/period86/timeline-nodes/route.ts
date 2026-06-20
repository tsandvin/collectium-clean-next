/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Timeline Nodes API
 * Definering / formål: Returnerer verdier/noder under valgt gruppe i et tidsrom og land.
 * Bruksområde: Andre API-rute for tidslinjen i Periode 8.6.
 * Berørte sider / routes: /test/period-timeline
 * Berørte API-ruter: GET /api/period86/timeline-nodes
 * Dataretning: Backend/Neon -> JSON
 * Versjon: ...
 */

import { NextResponse } from "next/server";
import { period86Query } from "@/lib/period86/period86Db";

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
  relation_href: string | null;
  description_no?: string;
  object_count?: number;
  relation_count?: number;
};

const GROUP_LABELS: Record<string, string> = {
  ruler_head_of_state: "Herskere / statsoverhoder",
  national_period: "Nasjonale perioder",
  war_conflict: "Krig / konflikt",
  disease_crisis: "Sykdom / krise",
  finance_economy: "Finans / økonomi",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country") || "Norge";
  const group_key = url.searchParams.get("group_key") || "ruler_head_of_state";
  const year_from = Number(url.searchParams.get("year_from") || "1707");
  const year_to = Number(url.searchParams.get("year_to") || "2024");

  const countryParam = country.toLowerCase() === "norge" ? "no" : country.toLowerCase() === "sverige" ? "se" : country.toLowerCase() === "danmark" ? "dk" : country.toLowerCase() === "skandinavia" ? "sn" : country;

  try {
    let nodes: TimelineNode[] = [];

    if (group_key === "ruler_head_of_state") {
      const rows = await period86Query<{
        node_key: string;
        label_no: string;
        from_year: number | null;
        to_year: number | null;
        node_type: string;
        relation_href: string | null;
        description_no: string | null;
      }>(
        `
        select 
          identity_key as node_key,
          display_name_no as label_no,
          rule_start_year as from_year,
          rule_end_year as to_year,
          'ruler' as node_type,
          reference_href as relation_href,
          title_no as description_no
        from ct_sn_historical_identity_registry
        where status = 'active'
          and (rule_start_year is null or rule_start_year >= 700)
          and (rule_end_year is null or rule_end_year <= 2100)
          and (
            ($1 = 'global')
            or ($1 = 'no' and country_scope ilike '%no%')
            or ($1 = 'se' and country_scope ilike '%se%')
            or ($1 = 'dk' and country_scope ilike '%dk%')
            or ($1 = 'sn' and (region_scope ilike '%sn%' or region_scope ilike '%ct_sn%' or country_scope ilike '%no%' or country_scope ilike '%se%' or country_scope ilike '%dk%'))
            or ($1 not in ('no','se','dk','sn','global') and country_scope ilike '%' || $1 || '%')
          )
          and rule_start_year <= $2
          and (rule_end_year is null or rule_end_year >= $3)
        order by rule_start_year nulls last, display_name_no;
        `,
        [countryParam, year_to, year_from]
      );

      nodes = rows.map((r) => {
        const from = r.from_year;
        const to = r.to_year;
        let year_label = "";
        if (from === null) year_label = "Udatert";
        else if (to === null) year_label = `${from}–`;
        else if (from === to) year_label = `${from}`;
        else year_label = `${from}–${to}`;

        return {
          node_key: r.node_key,
          label_no: r.label_no,
          from_year: from,
          to_year: to,
          year_label,
          group_key,
          group_label_no: GROUP_LABELS[group_key] || group_key,
          node_type: r.node_type,
          relation_href: r.relation_href || `/relasjon/regent/${r.node_key}`,
          description_no: r.description_no || undefined,
        };
      });
    } else {
      let types: string[] = [];
      if (group_key === "national_period") {
        types = ["historical_main_period", "union_period"];
      } else if (group_key === "war_conflict") {
        types = ["war_period", "conflict_period"];
      } else if (group_key === "disease_crisis") {
        types = ["health_period"];
      } else if (group_key === "finance_economy") {
        types = ["economic_period", "monetary_period", "banknote_issue_period"];
      }

      const rows = await period86Query<{
        node_key: string;
        label_no: string;
        from_year: number | null;
        to_year: number | null;
        node_type: string;
        relation_href: string | null;
        description_no: string | null;
      }>(
        `
        select 
          period_slug as node_key,
          display_name_no as label_no,
          start_year as from_year,
          end_year as to_year,
          'period' as node_type,
          relation_href,
          summary_short_no as description_no
        from ct_v_period_filter_options
        where period_type_key = any($1::text[])
          and (start_year is null or start_year >= 700)
          and (end_year is null or end_year <= 2100)
          and (
            ($2 = 'global')
            or ($2 = 'no' and country_scope ilike '%no%')
            or ($2 = 'se' and country_scope ilike '%se%')
            or ($2 = 'dk' and country_scope ilike '%dk%')
            or ($2 = 'sn' and (region_scope ilike '%sn%' or region_scope ilike '%ct_sn%' or country_scope ilike '%no%' or country_scope ilike '%se%' or country_scope ilike '%dk%'))
            or ($2 not in ('no','se','dk','sn','global') and country_scope ilike '%' || $2 || '%')
          )
          and start_year <= $3
          and (end_year is null or end_year >= $4)
        order by start_year nulls last, display_name_no;
        `,
        [types, countryParam, year_to, year_from]
      );

      nodes = rows.map((r) => {
        const from = r.from_year;
        const to = r.to_year;
        let year_label = "";
        if (from === null) year_label = "Udatert";
        else if (to === null) year_label = `${from}–`;
        else if (from === to) year_label = `${from}`;
        else year_label = `${from}–${to}`;

        return {
          node_key: r.node_key,
          label_no: r.label_no,
          from_year: from,
          to_year: to,
          year_label,
          group_key,
          group_label_no: GROUP_LABELS[group_key] || group_key,
          node_type: r.node_type,
          relation_href: r.relation_href || `/relasjon/periode/${r.node_key}`,
          description_no: r.description_no || undefined,
        };
      });
    }

    return NextResponse.json(
      {
        group_key,
        group_label_no: GROUP_LABELS[group_key] || group_key,
        nodes,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Kunne ikke hente tidslinjenoder.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
