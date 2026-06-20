/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 3 Noder API
 * Definering / formål: Returnerer kontekstnoder for krig/konflikt, krise og finans/økonomi.
 * Bruksområde: Rad 3 nodevalg i Periode 8.6 tidslinje.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.row3.nodes.view
 * Berørte API-ruter: GET /api/period86/row3/nodes
 * Berørte tabeller / views: ct_v_period86_row3_context_nodes
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row3.nodes.view
 * Versjon: CT-PERIOD86-API-ROW3-0001 / CHANGE-2026-06-20-0002
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

const typeAlias: Record<string, string> = {
  war_conflict: "krig_konflikt",
  krig: "krig_konflikt",
  konflikt: "krig_konflikt",
  krig_konflikt: "krig_konflikt",
  disease_crisis: "sykdom_krise",
  sykdom: "sykdom_krise",
  krise: "sykdom_krise",
  sykdom_krise: "sykdom_krise",
  economy_finance: "finans_okonomi",
  finans: "finans_okonomi",
  okonomi: "finans_okonomi",
  økonomi: "finans_okonomi",
  finans_okonomi: "finans_okonomi",
};

function normalizeType(value: string | null): string {
  const raw = (value || "krig_konflikt")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  return typeAlias[raw] || raw;
}

function toYear(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = normalizeType(url.searchParams.get("type") || url.searchParams.get("context"));
  const fromYear = toYear(url.searchParams.get("from"), 1507);
  const toYearParam = toYear(url.searchParams.get("to"), new Date().getFullYear());
  const minYear = Math.min(fromYear, toYearParam);
  const maxYear = Math.max(fromYear, toYearParam);
  const limit = toPositiveInt(url.searchParams.get("limit"), 100, 300);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    const rows = await period86Query<NodeRow>(`
      select
        slug as node_key,
        label_no,
        start_year,
        coalesce(end_year, $2::integer) as end_year,
        relation_href,
        0::text as count,
        'ct_v_period86_row3_context_nodes'::text as source
      from ct_v_period86_row3_context_nodes
      where start_year <= $2
        and coalesce(end_year, $2) >= $1
        and (
          type_key = $5
          or $5 = 'alle'
        )
      order by start_year nulls last, coalesce(end_year, $2), label_no
      limit $3 offset $4;
    `, [minYear, maxYear, limit, offset, type]);

    return jsonOk({ ok: true, row: "row3", type, nodes: rows, limit, offset, from: minYear, to: maxYear });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 3-noder.", 500, error);
  }
}
