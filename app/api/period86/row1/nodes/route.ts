/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 1 Noder API
 * Definering / formål: Returnerer konkrete statsoverhoder/maktstruktur-noder for valgt master og type.
 * Bruksområde: Rad 1 tidslinje i Periode 8.6.
 * Berørte sider / routes: /test/periodefilter, /katalog, /relasjon/[type]/[slug]
 * Berørte DB-brytere / feature_keys: period86.row1.nodes.view
 * Berørte API-ruter: GET /api/period86/row1/nodes
 * Berørte tabeller / views: ct_v_ruler_identity_resolved_v2, ct_v_period_filter_options
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row1.nodes.view
 * Versjon: CT-PERIOD86-API-0004 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type NodeRow = {
  node_key: string;
  label_no: string;
  title_no: string | null;
  start_year: number | null;
  end_year: number | null;
  relation_href: string | null;
  country_scope: string | null;
  region_scope: string | null;
  object_count: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const master = url.searchParams.get("master") || "no";
  const type = url.searchParams.get("type") || "king";
  const limit = toPositiveInt(url.searchParams.get("limit"), 50, 200);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    if (type === "union") {
      const rows = await period86Query<NodeRow>(`
        select
          period_slug as node_key,
          display_name_no as label_no,
          period_type_label_no as title_no,
          start_year,
          end_year,
          relation_href,
          null::text as country_scope,
          null::text as region_scope,
          0::text as object_count
        from ct_v_period_filter_options
        where period_type_key = 'union_period'
        order by start_year nulls last, display_name_no
        limit $1 offset $2;
      `, [limit, offset]);
      return jsonOk({ ok: true, master, type, nodes: rows, limit, offset });
    }

    const rows = await period86Query<NodeRow>(`
      with base as (
        select distinct on (identity_key)
          identity_key as node_key,
          display_name_no as label_no,
          title_no,
          null::integer as start_year,
          null::integer as end_year,
          reference_href as relation_href,
          country_scope,
          region_scope,
          count(*) over (partition by identity_key)::bigint as object_count,
          authority_role_no
        from ct_v_ruler_identity_resolved_v2
        where
          (
            $2 = 'king'
            and (authority_role_no in ('king', 'konge') or title_no ilike '%konge%')
          )
          or ($2 = 'regent' and (authority_role_no ilike '%regent%' or title_no ilike '%regent%'))
          or ($2 = 'local_ruler' and (authority_role_no ilike '%local%' or title_no ilike '%lokal%' or title_no ilike '%småkonge%'))
          or ($2 = 'christian_ruler' and title_no ilike '%krist%')
          or ($2 not in ('king','regent','local_ruler','christian_ruler') and coalesce(authority_role_no, '') = $2)
          and (
            ($1 = 'global')
            or ($1 = 'no' and country_scope ilike '%no%')
            or ($1 = 'sn' and (region_scope ilike '%ct_sn%' or region_scope ilike '%sn%'))
            or ($1 not in ('no','sn','global') and country_scope ilike '%' || $1 || '%')
          )
        order by identity_key, search_weight desc nulls last, display_name_no
      )
      select
        node_key,
        label_no,
        title_no,
        start_year,
        end_year,
        relation_href,
        country_scope,
        region_scope,
        object_count::text
      from base
      order by label_no
      limit $3 offset $4;
    `, [master, type, limit, offset]);

    return jsonOk({ ok: true, master, type, nodes: rows, limit, offset });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 1-noder.", 500, error);
  }
}
