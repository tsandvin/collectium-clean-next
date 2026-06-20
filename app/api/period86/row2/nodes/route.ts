/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 2 Noder API
 * Definering / formål: Returnerer konkrete noder for valgt konteksttype.
 * Bruksområde: Rad 2 nodevalg i Periode 8.6.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.row2.nodes.view
 * Berørte API-ruter: GET /api/period86/row2/nodes
 * Berørte tabeller / views: ct_v_period_filter_options, ct_v_catalog_period_relations
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row2.nodes.view
 * Versjon: CT-PERIOD86-API-0006 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type NodeRow = {
  node_key: string;
  label_no: string;
  start_year: number | null;
  end_year: number | null;
  relation_href: string | null;
  count: string;
  source: string;
};

const periodTypeMap: Record<string, string[]> = {
  power_structure: ["historical_main_period", "union_period"],
  war_conflict: ["war_period", "conflict_period"],
  disease_crisis: ["health_period"],
  economy_finance: ["economic_period"],
  money_period: ["monetary_period", "banknote_issue_period"],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const context = url.searchParams.get("context") || "war_conflict";
  const limit = toPositiveInt(url.searchParams.get("limit"), 50, 200);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    if (context === "collector_object") {
      const rows = await period86Query<NodeRow>(`
        select
          source_key || ':' || object_group as node_key,
          source_key || ' · ' || object_group as label_no,
          null::integer as start_year,
          null::integer as end_year,
          null::text as relation_href,
          count(distinct object_id)::text as count,
          'ct_v_catalog_period_relations'::text as source
        from ct_v_catalog_period_relations
        group by source_key, object_group
        order by source_key, object_group
        limit $1 offset $2;
      `, [limit, offset]);
      return jsonOk({ ok: true, context, nodes: rows, limit, offset });
    }

    if (context === "producer_issuer") {
      const rows = await period86Query<NodeRow>(`
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
        limit $1 offset $2;
      `, [limit, offset]);
      return jsonOk({ ok: true, context, nodes: rows, limit, offset });
    }

    if (context === "historical_event") {
      const rows = await period86Query<NodeRow>(`
        select
          target_relation_slug as node_key,
          target_label_no as label_no,
          min(start_year) as start_year,
          max(end_year) as end_year,
          '/relasjon/' || target_relation_type || '/' || target_relation_slug as relation_href,
          count(*)::text as count,
          'ct_sn_period_relation_links'::text as source
        from ct_sn_period_relation_links
        where coalesce(review_status, '') <> 'duplicate'
        group by target_relation_type, target_relation_slug, target_label_no
        order by min(start_year) nulls last, target_label_no
        limit $1 offset $2;
      `, [limit, offset]);
      return jsonOk({ ok: true, context, nodes: rows, limit, offset });
    }

    const keys = periodTypeMap[context] || [context];
    const rows = await period86Query<NodeRow>(`
      select
        period_slug as node_key,
        display_name_no as label_no,
        start_year,
        end_year,
        relation_href,
        0::text as count,
        'ct_v_period_filter_options'::text as source
      from ct_v_period_filter_options
      where period_type_key = any($1::text[])
      order by start_year nulls last, display_name_no
      limit $2 offset $3;
    `, [keys, limit, offset]);

    return jsonOk({ ok: true, context, nodes: rows, limit, offset });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 2-noder.", 500, error);
  }
}
