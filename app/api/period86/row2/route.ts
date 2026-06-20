/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 2 API
 * Definering / formål: Returnerer kontekstfilter for valgt master og eventuell Rad 1-node.
 * Bruksområde: Rad 2 i Periode 8.6.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.row2.view
 * Berørte API-ruter: GET /api/period86/row2
 * Berørte tabeller / views: ct_v_period_filter_options, ct_v_catalog_period_relations
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row2.view
 * Versjon: CT-PERIOD86-API-0005 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

const CONTEXTS = [
  { context_key: "dynasty", label_no: "Dynasti / kongehus", source_hint: "ruler mapping" },
  { context_key: "power_structure", label_no: "Maktstruktur", source_hint: "historical_main_period, union_period" },
  { context_key: "reign_period", label_no: "Regentperiode", source_hint: "ruler views" },
  { context_key: "war_conflict", label_no: "Krig / konflikt", source_hint: "war_period, conflict_period" },
  { context_key: "disease_crisis", label_no: "Sykdom / samfunnskrise", source_hint: "health_period" },
  { context_key: "economy_finance", label_no: "Finans / økonomi", source_hint: "economic_period" },
  { context_key: "money_period", label_no: "Pengeperiode", source_hint: "monetary_period, banknote_issue_period" },
  { context_key: "producer_issuer", label_no: "Produsent / utsteder", source_hint: "catalog producer fields" },
  { context_key: "collector_object", label_no: "Samlerobjekt", source_hint: "source_key, object_group" },
  { context_key: "historical_event", label_no: "Historiske hendelser", source_hint: "period relation links" },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const master = url.searchParams.get("master") || "no";

  try {
    const counts = await period86Query<{ context_key: string; count: string }>(`
      with mapped as (
        select
          case
            when period_type_key in ('historical_main_period', 'union_period') then 'power_structure'
            when period_type_key in ('war_period', 'conflict_period') then 'war_conflict'
            when period_type_key = 'health_period' then 'disease_crisis'
            when period_type_key = 'economic_period' then 'economy_finance'
            when period_type_key in ('monetary_period', 'banknote_issue_period') then 'money_period'
            else period_type_key
          end as context_key,
          period_slug
        from ct_v_period_filter_options
      ),
      object_groups as (
        select 'collector_object'::text as context_key, count(distinct source_key || ':' || object_group)::bigint as count
        from ct_v_catalog_period_relations
      )
      select context_key, count(distinct period_slug)::text as count
      from mapped
      group by context_key
      union all
      select context_key, count::text from object_groups;
    `);

    const countMap = new Map(counts.map((row) => [row.context_key, Number(row.count || 0)]));
    const contexts = CONTEXTS.map((context) => ({
      ...context,
      count: String(countMap.get(context.context_key) || 0),
    }));

    return jsonOk({ ok: true, master, row2: contexts });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 2.", 500, error);
  }
}
