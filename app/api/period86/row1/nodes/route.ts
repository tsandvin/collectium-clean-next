/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 1 Noder API
 * Definering / formal: Returnerer konkrete statsoverhoder/maktstruktur-noder for valgt master og type.
 * Bruksomrade: Rad 1 tidslinje i Periode 8.6.
 * Berorte sider / routes: /test/periodefilter, /katalog, /relasjon/[type]/[slug]
 * Berorte DB-brytere / feature_keys: period86.row1.nodes.view
 * Berorte API-ruter: GET /api/period86/row1/nodes
 * Berorte tabeller / views: ct_v_period86_ruler_timeline_resolved, ct_v_period_filter_options
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row1.nodes.view
 * Versjon: CT-PERIOD86-API-0005 / CHANGE-2026-06-20-0002
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type NodeRow = {
  node_key: string;
  label_no: string;
  title_no: string | null;
  start_year: number | null;
  end_year: number | null;
  from_year?: number | null;
  to_year?: number | null;
  year_label?: string | null;
  authority_role_no?: string | null;
  historical_period_label_no?: string | null;
  nickname_raw_no?: string | null;
  relation_href: string | null;
  country_scope: string | null;
  region_scope: string | null;
  object_count: string;
  truth_status?: string | null;
  source_view?: string | null;
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
          start_year as from_year,
          end_year as to_year,
          concat(start_year::text, '-', coalesce(end_year::text, '')) as year_label,
          null::text as authority_role_no,
          null::text as historical_period_label_no,
          null::text as nickname_raw_no,
          relation_href,
          null::text as country_scope,
          null::text as region_scope,
          0::text as object_count,
          'period_filter_options'::text as truth_status,
          'ct_v_period_filter_options'::text as source_view
        from ct_v_period_filter_options
        where period_type_key = 'union_period'
        order by start_year nulls last, display_name_no
        limit $1 offset $2;
      `, [limit, offset]);

      return jsonOk({ ok: true, master, type, nodes: rows, limit, offset });
    }

    const rows = await period86Query<NodeRow>(`
      select
        node_key,
        label_no,
        authority_role_no as title_no,
        from_year as start_year,
        to_year as end_year,
        from_year,
        to_year,
        year_label,
        authority_role_no,
        historical_period_label_no,
        nickname_raw_no,
        relation_href,
        null::text as country_scope,
        'ct_sn'::text as region_scope,
        0::text as object_count,
        truth_status,
        source_view
      from ct_v_period86_ruler_timeline_resolved
      where
        (
          $2 = 'king'
          and (
            lower(coalesce(authority_role_no, '')) like '%konge%'
            or lower(coalesce(authority_role_no, '')) like '%king%'
          )
        )
        or (
          $2 = 'regent'
          and lower(coalesce(authority_role_no, '')) like '%regent%'
        )
        or (
          $2 = 'local_ruler'
          and (
            lower(coalesce(authority_role_no, '')) like '%lokal%'
            or lower(coalesce(authority_role_no, '')) like '%smakonge%'
            or lower(coalesce(authority_role_no, '')) like '%ladejarl%'
            or lower(coalesce(authority_role_no, '')) like '%jarl%'
            or lower(coalesce(authority_role_no, '')) like '%motkonge%'
          )
        )
        or (
          $2 = 'christian_ruler'
          and (
            lower(coalesce(label_no, '')) like '%olav%'
            or lower(coalesce(nickname_raw_no, '')) like '%hellig%'
            or lower(coalesce(nickname_raw_no, '')) like '%krist%'
          )
        )
        or (
          $2 not in ('king','regent','local_ruler','christian_ruler')
          and lower(coalesce(authority_role_no, '')) = lower($2)
        )
      order by
        from_year nulls last,
        to_year nulls last,
        label_no
      limit $3 offset $4;
    `, [master, type, limit, offset]);

    return jsonOk({ ok: true, master, type, nodes: rows, limit, offset });
  } catch (error) {
    return jsonError("Could not load Period 8.6 row 1 nodes.", 500, error);
  }
}

