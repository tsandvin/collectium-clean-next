/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Filter Options API
 * Definering / formål: Returnerer små filtervalg med counts for kilde, object_group, periodetype og periode.
 * Bruksområde: Bredt filterpanel uten å hente hele katalogen.
 * Berørte sider / routes: /katalog, /test/periodefilter, /index
 * Berørte DB-brytere / feature_keys: period86.filter_options.view, catalog.filters
 * Berørte API-ruter: GET /api/period86/filter-options
 * Berørte tabeller / views: ct_v_catalog_period_relations, ct_v_period_filter_options
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: filter_options.view
 * Versjon: CT-PERIOD86-API-0009 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type OptionRow = {
  filter_field: string;
  filter_value: string;
  label_no: string;
  count: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sourceKey = url.searchParams.get("source_key");
  const objectGroup = url.searchParams.get("object_group");
  const periodTypeKey = url.searchParams.get("period_type_key");
  const limit = toPositiveInt(url.searchParams.get("limit"), 50, 200);

  try {
    const rows = await period86Query<OptionRow>(`
      with base as (
        select *
        from ct_v_catalog_period_relations
        where ($1::text is null or source_key = $1)
          and ($2::text is null or object_group = $2)
          and ($3::text is null or period_type_key = $3)
      ),
      source_options as (
        select 'source_key'::text as filter_field, source_key as filter_value, source_key as label_no,
          count(distinct source_key || ':' || object_group || ':' || object_id::text)::bigint as count
        from base group by source_key
      ),
      object_group_options as (
        select 'object_group'::text as filter_field, object_group as filter_value, object_group as label_no,
          count(distinct source_key || ':' || object_group || ':' || object_id::text)::bigint as count
        from base group by object_group
      ),
      period_type_options as (
        select 'period_type_key'::text as filter_field, period_type_key as filter_value, period_type_key as label_no,
          count(distinct period_slug)::bigint as count
        from base group by period_type_key
      ),
      period_options as (
        select 'period_slug'::text as filter_field, period_slug as filter_value, period_label_no as label_no,
          count(distinct source_key || ':' || object_group || ':' || object_id::text)::bigint as count
        from base
        where period_slug is not null
        group by period_slug, period_label_no
        order by count(distinct source_key || ':' || object_group || ':' || object_id::text) desc
        limit $4
      )
      select filter_field, filter_value, label_no, count::text from source_options
      union all select filter_field, filter_value, label_no, count::text from object_group_options
      union all select filter_field, filter_value, label_no, count::text from period_type_options
      union all select filter_field, filter_value, label_no, count::text from period_options
      order by filter_field, count desc, label_no;
    `, [sourceKey, objectGroup, periodTypeKey, limit]);

    return jsonOk({ ok: true, filters: rows });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 filtervalg.", 500, error);
  }
}
