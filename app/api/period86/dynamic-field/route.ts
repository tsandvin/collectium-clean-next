/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Dynamisk Felt API
 * Definering / formål: Returnerer ett samlet, lett dynamisk periodefelt.
 * Bruksområde: Dynamisk panel i periodefilter, katalog, objekt og relasjon.
 * Berørte sider / routes: /test/periodefilter, /katalog, /objekt, /relasjon
 * Berørte DB-brytere / feature_keys: period86.dynamic_field.view
 * Berørte API-ruter: GET /api/period86/dynamic-field
 * Berørte tabeller / views: ct_v_period86_dynamic_field_resolved
 * Dataretning: Neon -> API -> UI
 * Logging: log_category: period86, log_action: dynamic_field.view
 * Versjon: CT-PERIOD86-API-0007 / CHANGE-2026-06-20-0001
 */

import { jsonError, jsonOk, period86Query } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const periodSlug = url.searchParams.get("period_slug");

  if (!periodSlug) {
    return jsonError("Mangler period_slug.", 400);
  }

  try {
    const rows = await period86Query(`
      select
        period_slug,
        periode,
        year_label,
        period_type_key,
        type_label_no,
        niva,
        forelder,
        relation_href,
        beskrivelse,
        collectium_relevans,
        object_count,
        object_relation_count,
        relation_count,
        relations_json,
        image_url,
        image_fallback_type
      from ct_v_period86_dynamic_field_resolved
      where period_slug = $1
      limit 1;
    `, [periodSlug]);

    return jsonOk({ ok: true, period_slug: periodSlug, field: rows[0] || null });
  } catch (error) {
    return jsonError("Kunne ikke hente Periode 8.6 dynamisk felt.", 500, error);
  }
}
