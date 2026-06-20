/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Master API
 * Definering / formål: Returnerer land/område-mastervalg med små counts.
 * Bruksområde: Første nivå i Periode 8.6-filteret.
 * Berørte sider / routes: /test/periodefilter, /katalog, /index, /relasjon/[type]/[slug]
 * Berørte DB-brytere / feature_keys: period86.master.view
 * Berørte API-ruter: GET /api/period86/master
 * Berørte tabeller / views: ct_v_period_filter_options, ct_v_ruler_identity_resolved_v2
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: master.view
 * Versjon: CT-PERIOD86-API-0002 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type MasterRow = {
  master_key: string;
  label_no: string;
  scope_type: string;
  period_count: string;
  ruler_count: string;
};

export async function GET() {
  try {
    const rows = await period86Query<MasterRow>(`
      with masters as (
        select 'no'::text as master_key, 'Norge'::text as label_no, 'country'::text as scope_type
        union all select 'sn', 'Skandinavia', 'region'
        union all select 'sv', 'Sverige', 'country'
        union all select 'dm', 'Danmark', 'country'
        union all select 'eu', 'Europa', 'region'
        union all select 'global', 'Global', 'global'
      ),
      period_counts as (
        select
          case
            when country_scope ilike '%no%' then 'no'
            when region_scope ilike '%ct_sn%' or region_scope ilike '%sn%' then 'sn'
            else 'global'
          end as master_key,
          count(*)::bigint as period_count
        from ct_v_period_filter_options
        group by 1
      ),
      ruler_counts as (
        select
          case
            when country_scope ilike '%no%' then 'no'
            when region_scope ilike '%ct_sn%' or region_scope ilike '%sn%' then 'sn'
            else 'global'
          end as master_key,
          count(distinct identity_key)::bigint as ruler_count
        from ct_v_ruler_identity_resolved_v2
        group by 1
      )
      select
        m.master_key,
        m.label_no,
        m.scope_type,
        coalesce(pc.period_count, 0)::text as period_count,
        coalesce(rc.ruler_count, 0)::text as ruler_count
      from masters m
      left join period_counts pc on pc.master_key = m.master_key
      left join ruler_counts rc on rc.master_key = m.master_key
      order by case m.master_key
        when 'no' then 1
        when 'sn' then 2
        when 'sv' then 3
        when 'dm' then 4
        when 'eu' then 5
        else 6
      end;
    `);

    return jsonOk({ ok: true, masters: rows });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 mastervalg.", 500, error);
  }
}
