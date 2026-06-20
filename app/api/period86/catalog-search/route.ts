/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Katalogsøk API
 * Definering / formål: Lite katalogsøk basert på Periode 8.6-filter og katalog-perioderelasjoner.
 * Bruksområde: Første raske objektresultat etter filtervalg.
 * Berørte sider / routes: /katalog, /test/periodefilter, /index
 * Berørte DB-brytere / feature_keys: period86.catalog_search.view, catalog.search
 * Berørte API-ruter: GET /api/period86/catalog-search
 * Berørte tabeller / views: ct_v_catalog_period_relations
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: catalog_search.view
 * Versjon: CT-PERIOD86-API-0008 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query, toPositiveInt } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type CatalogRow = {
  source_key: string;
  object_group: string;
  object_id: string;
  object_external_id: string | null;
  period_slug: string | null;
  period_label_no: string | null;
  period_type_key: string | null;
  issue_period_slug: string | null;
  issue_name_no: string | null;
  relation_role_no: string | null;
  matched_from_field: string | null;
  matched_from_value: string | null;
  period_relation_href: string | null;
  issue_period_relation_href: string | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sourceKey = url.searchParams.get("source_key");
  const objectGroup = url.searchParams.get("object_group");
  const periodSlug = url.searchParams.get("period_slug");
  const issuePeriodSlug = url.searchParams.get("issue_period_slug");
  const q = url.searchParams.get("q");
  const limit = toPositiveInt(url.searchParams.get("limit"), 20, 100);
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0);

  try {
    const rows = await period86Query<CatalogRow>(`
      select
        source_key,
        object_group,
        object_id::text,
        object_external_id,
        period_slug,
        period_label_no,
        period_type_key,
        issue_period_slug,
        issue_name_no,
        relation_role_no,
        matched_from_field,
        matched_from_value,
        period_relation_href,
        issue_period_relation_href
      from ct_v_catalog_period_relations
      where ($1::text is null or source_key = $1)
        and ($2::text is null or object_group = $2)
        and ($3::text is null or period_slug = $3)
        and ($4::text is null or issue_period_slug = $4)
        and (
          $5::text is null
          or period_label_no ilike '%' || $5 || '%'
          or issue_name_no ilike '%' || $5 || '%'
          or matched_from_value ilike '%' || $5 || '%'
          or object_external_id ilike '%' || $5 || '%'
        )
      order by
        source_key,
        object_group,
        object_id
      limit $6 offset $7;
    `, [sourceKey, objectGroup, periodSlug, issuePeriodSlug, q, limit, offset]);

    const countRows = await period86Query<{ total: string }>(`
      select count(distinct source_key || ':' || object_group || ':' || object_id::text)::text as total
      from ct_v_catalog_period_relations
      where ($1::text is null or source_key = $1)
        and ($2::text is null or object_group = $2)
        and ($3::text is null or period_slug = $3)
        and ($4::text is null or issue_period_slug = $4)
        and (
          $5::text is null
          or period_label_no ilike '%' || $5 || '%'
          or issue_name_no ilike '%' || $5 || '%'
          or matched_from_value ilike '%' || $5 || '%'
          or object_external_id ilike '%' || $5 || '%'
        );
    `, [sourceKey, objectGroup, periodSlug, issuePeriodSlug, q]);

    return jsonOk({ ok: true, total: Number(countRows[0]?.total || 0), limit, offset, results: rows });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 katalogsøk.", 500, error);
  }
}
