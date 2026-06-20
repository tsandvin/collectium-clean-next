/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Tidslinje API
 * Definering / formål: Returnerer samlet tidslinje for rad 1, rad 2 og rad 3.
 * Bruksområde: Periode 8.6 tidslinjevisning.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.timeline.view
 * Berørte API-ruter: GET /api/period86/timeline
 * Berørte tabeller / views: ct_v_period86_timeline_nodes
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: timeline.view
 * Versjon: CT-PERIOD86-API-TIMELINE-0001 / CHANGE-2026-06-20-0002
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type TimelineNodeRow = {
  row_key: string;
  type_key: string;
  node_key: string;
  label_no: string;
  start_year: number | null;
  end_year: number | null;
  relation_href: string | null;
  summary_short_no: string | null;
  collectium_relevance_no: string | null;
};

function toYear(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fromYear = toYear(url.searchParams.get("from"), 1507);
  const toYearParam = toYear(url.searchParams.get("to"), new Date().getFullYear());
  const minYear = Math.min(fromYear, toYearParam);
  const maxYear = Math.max(fromYear, toYearParam);
  const limit = toPositiveInt(url.searchParams.get("limit"), 500, 1000);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    const rows = await period86Query<TimelineNodeRow>(`
      select
        row_key,
        type_key,
        slug as node_key,
        label_no,
        start_year,
        coalesce(end_year, $2::integer) as end_year,
        relation_href,
        summary_short_no,
        collectium_relevance_no
      from ct_v_period86_timeline_nodes
      where start_year <= $2
        and coalesce(end_year, $2) >= $1
      order by row_key, start_year nulls last, coalesce(end_year, $2), label_no
      limit $3 offset $4;
    `, [minYear, maxYear, limit, offset]);

    const grouped = {
      row1: rows.filter((row) => row.row_key === "row1"),
      row2: rows.filter((row) => row.row_key === "row2"),
      row3: rows.filter((row) => row.row_key === "row3"),
    };

    return jsonOk({
      ok: true,
      from: minYear,
      to: maxYear,
      nodes: rows,
      rows: grouped,
      limit,
      offset,
    });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 tidslinje.", 500, error);
  }
}
