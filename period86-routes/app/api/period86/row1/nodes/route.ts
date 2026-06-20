/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 1 Noder API
 * Definering / formål: Returnerer statsoverhode-/maktstruktur-noder for Periode 8.6.
 * Bruksområde: Rad 1 nodevalg i Periode 8.6 tidslinje.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.row1.nodes.view
 * Berørte API-ruter: GET /api/period86/row1/nodes
 * Berørte tabeller / views: ct_v_period86_row1_statsoverhode_nodes, ct_v_period_filter_options
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row1.nodes.view
 * Versjon: CT-PERIOD86-API-ROW1-0007 / CHANGE-2026-06-20-0002
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

function toYear(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeType(value: string | null): string {
  return (value || "statsoverhode")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const type = normalizeType(url.searchParams.get("type") || url.searchParams.get("context"));
  const fromYear = toYear(url.searchParams.get("from"), 1507);
  const toYearParam = toYear(url.searchParams.get("to"), new Date().getFullYear());
  const minYear = Math.min(fromYear, toYearParam);
  const maxYear = Math.max(fromYear, toYearParam);
  const limit = toPositiveInt(url.searchParams.get("limit"), 200, 500);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    if (type === "union" || type === "unioner") {
      const rows = await period86Query<NodeRow>(`
        select
          period_slug as node_key,
          display_name_no as label_no,
          start_year,
          coalesce(end_year, $2::integer) as end_year,
          relation_href,
          0::text as count,
          'ct_v_period_filter_options'::text as source
        from ct_v_period_filter_options
        where start_year <= $2
          and coalesce(end_year, $2) >= $1
          and (
            period_type_key ilike '%union%'
            or period_type_label_no ilike '%union%'
            or display_name_no ilike '%union%'
          )
        order by start_year nulls last, coalesce(end_year, $2), display_name_no
        limit $3 offset $4;
      `, [minYear, maxYear, limit, offset]);

      return jsonOk({ ok: true, row: "row1", type, nodes: rows, limit, offset, from: minYear, to: maxYear });
    }

    const broadTypes = new Set([
      "alle",
      "statsoverhode",
      "statsoverhoder",
      "maktstruktur",
      "herskere",
      "hersker",
      "konge",
      "konger",
      "regent",
      "regenter"
    ]);

    const rows = await period86Query<NodeRow>(`
      select
        slug as node_key,
        label_no,
        start_year,
        coalesce(end_year, $2::integer) as end_year,
        relation_href,
        0::text as count,
        'ct_v_period86_row1_statsoverhode_nodes'::text as source
      from ct_v_period86_row1_statsoverhode_nodes
      where start_year <= $2
        and coalesce(end_year, $2) >= $1
        and (
          $5::boolean = true
          or type_key = $6
          or group_key = $6
          or authority_role_no ilike '%' || $6 || '%'
          or label_no ilike '%' || $6 || '%'
        )
      order by start_year nulls last, coalesce(end_year, $2), label_no
      limit $3 offset $4;
    `, [minYear, maxYear, limit, offset, broadTypes.has(type), type]);

    return jsonOk({ ok: true, row: "row1", type, nodes: rows, limit, offset, from: minYear, to: maxYear });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 1-noder.", 500, error);
  }
}
