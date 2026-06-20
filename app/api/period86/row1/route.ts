/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Rad 1 API
 * Definering / formål: Returnerer Statsoverhode / maktstruktur-typene for valgt master.
 * Bruksområde: Rad 1 i Periode 8.6.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index
 * Berørte DB-brytere / feature_keys: period86.row1.view
 * Berørte API-ruter: GET /api/period86/row1
 * Berørte tabeller / views: ct_v_ruler_identity_resolved_v2, ct_v_period_filter_options
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: row1.view
 * Versjon: CT-PERIOD86-API-0003 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type Row1Type = {
  type_key: string;
  label_no: string;
  count: string;
  source: string;
};

const ROW1_TYPES = [
  { type_key: "king", label_no: "Konge" },
  { type_key: "regent", label_no: "Regent" },
  { type_key: "dynasty", label_no: "Dynasti / kongehus" },
  { type_key: "union", label_no: "Union" },
  { type_key: "republic_government_form", label_no: "Republikk / styreform" },
  { type_key: "occupying_power", label_no: "Okkupasjonsmakt" },
  { type_key: "local_ruler", label_no: "Lokal hersker / småkonge" },
  { type_key: "christian_ruler", label_no: "Kristen hersker" },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const master = url.searchParams.get("master") || "no";

  try {
    const counts = await period86Query<{ type_key: string; count: string }>(`
      with ruler_counts as (
        select
          case
            when authority_role_no in ('king', 'konge') or title_no ilike '%konge%' then 'king'
            when authority_role_no ilike '%regent%' or title_no ilike '%regent%' then 'regent'
            when authority_role_no ilike '%local%' or title_no ilike '%småkonge%' or title_no ilike '%lokal%' then 'local_ruler'
            when title_no ilike '%krist%' then 'christian_ruler'
            else coalesce(authority_role_no, 'king')
          end as type_key,
          count(distinct identity_key)::bigint as count
        from ct_v_ruler_identity_resolved_v2
        where
          ($1 = 'global')
          or ($1 = 'no' and country_scope ilike '%no%')
          or ($1 = 'sn' and (region_scope ilike '%ct_sn%' or region_scope ilike '%sn%'))
          or ($1 not in ('no','sn','global') and country_scope ilike '%' || $1 || '%')
        group by 1
      ),
      union_counts as (
        select 'union'::text as type_key, count(*)::bigint as count
        from ct_v_period_filter_options
        where period_type_key = 'union_period'
      )
      select type_key, sum(count)::text as count
      from (
        select * from ruler_counts
        union all
        select * from union_counts
      ) s
      group by type_key;
    `, [master]);

    const countMap = new Map(counts.map((row) => [row.type_key, Number(row.count || 0)]));
    const row1: Row1Type[] = ROW1_TYPES.map((item) => ({
      ...item,
      count: String(countMap.get(item.type_key) || 0),
      source: item.type_key === "union" ? "ct_v_period_filter_options" : "ct_v_ruler_identity_resolved_v2",
    }));

    return jsonOk({ ok: true, master, group_key: "head_of_state_power", label_no: "Statsoverhode / maktstruktur", row1 });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 Rad 1.", 500, error);
  }
}
