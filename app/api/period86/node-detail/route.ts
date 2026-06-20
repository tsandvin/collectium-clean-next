/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift: Periode 8.6 Node Detail API
 * Definering / formål: Returnerer detaljert, relasjonsdrevet innhold for valgt tidslinjenode.
 * Bruksområde: Tredje API-rute for det dynamiske feltet i Periode 8.6.
 * Berørte sider / routes: /test/period-timeline
 * Berørte API-ruter: GET /api/period86/node-detail
 * Dataretning: Neon -> Backend -> Frontend UI
 * Versjon: CT-PERIOD86-NODE-DETAIL-API-0001
 */

import { NextResponse } from "next/server";
import { period86Query } from "@/lib/period86/period86Db";

export const dynamic = "force-dynamic";

type RelatedObject = {
  object_id: string | number;
  source_key: string;
  object_group: string;
  title_no: string;
  source_catalog_number: string | null;
  object_year_label: string | null;
};

type RelatedPeriod = {
  node_key: string;
  label_no: string;
  year_label: string;
  type_label_no: string;
  relation_href: string | null;
};

type MediaItem = {
  blob_url: string;
  thumbnail_url: string;
  caption_no: string | null;
  description_no: string | null;
  media_type: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const node_key = url.searchParams.get("node_key");
  const node_type = url.searchParams.get("node_type") || "period";

  if (!node_key) {
    return NextResponse.json({ ok: false, error: "Mangler node_key." }, { status: 400 });
  }

  try {
    let title_no = "";
    let type_label_no = "";
    let year_label = "";
    let summary_no = "";
    let collectium_relevance_no = "";
    let relation_href = "";
    let from_year: number | null = null;
    let to_year: number | null = null;
    let country_scope_raw = "";

    let related_objects: RelatedObject[] = [];
    let related_periods: RelatedPeriod[] = [];
    let related_people: any[] = [];
    let related_motifs: any[] = [];
    let media: MediaItem[] = [];

    if (node_type === "ruler") {
      // 1. Fetch Ruler Details
      const rulerRows = await period86Query<{
        identity_key: string;
        display_name_no: string;
        title_no: string | null;
        rule_start_year: number | null;
        rule_end_year: number | null;
        reference_href: string | null;
        country_scope: string | null;
        biography_no: string | null;
        period_summary_no: string | null;
        banknote_relation_note_no: string | null;
        coin_relation_note_no: string | null;
      }>(
        `
        select 
          r.identity_key,
          r.display_name_no,
          r.title_no,
          r.rule_start_year,
          r.rule_end_year,
          r.reference_href,
          r.country_scope,
          raw.biography_no,
          raw.period_summary_no,
          raw.banknote_relation_note_no,
          raw.coin_relation_note_no
        from ct_sn_historical_identity_registry r
        left join ct_import_raw_historical_rulers_no raw
          on ct_slugify_no(raw.historical_ruler_raw_no) = r.identity_key 
          or raw.historical_ruler_raw_no ilike '%' || r.display_name_no || '%'
        where r.identity_key = $1
        limit 1;
        `,
        [node_key]
      );

      const ruler = rulerRows[0];
      if (!ruler) {
        return NextResponse.json({ ok: false, error: "Finner ikke hersker." }, { status: 404 });
      }

      from_year = ruler.rule_start_year;
      to_year = ruler.rule_end_year;
      title_no = ruler.display_name_no;
      type_label_no = ruler.title_no || "Konge / regent / statsoverhode";
      relation_href = ruler.reference_href || `/relasjon/regent/${node_key}`;
      country_scope_raw = ruler.country_scope || "no";

      if (from_year === null) year_label = "Udatert";
      else if (to_year === null) year_label = `${from_year}–`;
      else if (from_year === to_year) year_label = `${from_year}`;
      else year_label = `${from_year}–${to_year}`;

      summary_no = ruler.biography_no || ruler.period_summary_no || `Historisk regent ${title_no} registrert i Collectium.`;
      collectium_relevance_no = ruler.banknote_relation_note_no || ruler.coin_relation_note_no || "Relevans for numismatikk og katalogobjekter.";

      // 2. Fetch Related Objects for Ruler
      const objRows = await period86Query<RelatedObject>(
        `
        select distinct
          o.object_id,
          o.source_key,
          o.object_group,
          o.title_no,
          o.source_catalog_number,
          coalesce(o.object_year_label, o.publication_year_label) as object_year_label
        from ct_v_object_presentation_resolved o
        join ct_v_ruler_identity_resolved_v2 r
          on r.source_key = o.source_key and r.object_group = o.object_group and r.object_id = o.object_id
        where r.identity_key = $1
        order by o.source_key, o.object_group, o.object_id
        limit 6;
        `,
        [node_key]
      );
      related_objects = objRows;

      // 3. Fetch Overlapping Periods for Ruler
      if (from_year !== null) {
        const effTo = to_year || 2024;
        const perRows = await period86Query<{
          node_key: string;
          label_no: string;
          start_year: number | null;
          end_year: number | null;
          type_label_no: string;
          relation_href: string | null;
        }>(
          `
          select 
            period_slug as node_key,
            display_name_no as label_no,
            start_year,
            end_year,
            period_type_label_no as type_label_no,
            relation_href
          from ct_v_period_filter_options
          where start_year <= $1 and (end_year is null or end_year >= $2)
            and start_year >= 700 and (end_year is null or end_year <= 2100)
          order by start_year nulls last
          limit 5;
          `,
          [effTo, from_year]
        );

        related_periods = perRows.map((p) => {
          const s = p.start_year;
          const e = p.end_year;
          let label = "";
          if (s === null) label = "Udatert";
          else if (e === null) label = `${s}–`;
          else if (s === e) label = `${s}`;
          else label = `${s}–${e}`;

          return {
            node_key: p.node_key,
            label_no: p.label_no,
            year_label: label,
            type_label_no: p.type_label_no,
            relation_href: p.relation_href,
          };
        });
      }
    } else {
      // 1. Fetch Period Details
      const periodRows = await period86Query<{
        period_slug: string;
        periode: string;
        year_label: string | null;
        type_label_no: string | null;
        relation_href: string | null;
        beskrivelse: string | null;
        collectium_relevans: string | null;
        country_scope: string | null;
        start_year: number | null;
        end_year: number | null;
      }>(
        `
        select 
          period_slug,
          periode,
          year_label,
          type_label_no,
          relation_href,
          beskrivelse,
          collectium_relevans,
          country_scope,
          start_year,
          end_year
        from ct_v_period86_dynamic_field_resolved
        where period_slug = $1
        limit 1;
        `,
        [node_key]
      );

      const period = periodRows[0];
      if (!period) {
        return NextResponse.json({ ok: false, error: "Finner ikke perioden." }, { status: 404 });
      }

      title_no = period.periode;
      type_label_no = period.type_label_no || "Historisk periode";
      year_label = period.year_label || "Udatert";
      summary_no = period.beskrivelse || "Ingen beskrivelse registrert.";
      collectium_relevance_no = period.collectium_relevans || "Ingen spesiell samlerrelevans registrert.";
      relation_href = period.relation_href || `/relasjon/periode/${node_key}`;
      country_scope_raw = period.country_scope || "no";
      from_year = period.start_year;
      to_year = period.end_year;

      // 2. Fetch Related Objects for Period
      const objRows = await period86Query<RelatedObject>(
        `
        select distinct
          o.object_id,
          o.source_key,
          o.object_group,
          o.title_no,
          o.source_catalog_number,
          coalesce(o.object_year_label, o.publication_year_label) as object_year_label
        from ct_v_object_presentation_resolved o
        join ct_v_catalog_period_relations r
          on r.source_key = o.source_key and r.object_group = o.object_group and r.object_id = o.object_id
        where r.period_slug = $1
        order by o.source_key, o.object_group, o.object_id
        limit 6;
        `,
        [node_key]
      );
      related_objects = objRows;

      // 3. Fetch Related Periods from links table
      const linkRows = await period86Query<{
        target_relation_slug: string;
        target_label_no: string;
        start_year: number | null;
        end_year: number | null;
        target_relation_type: string;
      }>(
        `
        select 
          target_relation_slug,
          target_label_no,
          start_year,
          end_year,
          target_relation_type
        from ct_sn_period_relation_links
        where period_slug = $1 
          and coalesce(review_status, '') <> 'duplicate'
        limit 5;
        `,
        [node_key]
      );

      related_periods = linkRows.map((l) => {
        const s = l.start_year;
        const e = l.end_year;
        let label = "";
        if (s === null) label = "Udatert";
        else if (e === null) label = `${s}–`;
        else if (s === e) label = `${s}`;
        else label = `${s}–${e}`;

        return {
          node_key: l.target_relation_slug,
          label_no: l.target_label_no,
          year_label: label,
          type_label_no: l.target_relation_type,
          relation_href: `/relasjon/${l.target_relation_type}/${l.target_relation_slug}`,
        };
      });

      // 4. Fetch related motifs and people from links table
      const motifRows = await period86Query<{
        target_relation_slug: string;
        target_label_no: string;
      }>(
        `
        select target_relation_slug, target_label_no
        from ct_sn_period_relation_links
        where period_slug = $1 and target_relation_type = 'motif'
        limit 5;
        `,
        [node_key]
      );
      related_motifs = motifRows.map((m) => ({
        slug: m.target_relation_slug,
        label: m.target_label_no,
        href: `/relasjon/motiv/${m.target_relation_slug}`,
      }));

      const peopleRows = await period86Query<{
        target_relation_slug: string;
        target_label_no: string;
      }>(
        `
        select target_relation_slug, target_label_no
        from ct_sn_period_relation_links
        where period_slug = $1 and target_relation_type = 'person'
        limit 5;
        `,
        [node_key]
      );
      related_people = peopleRows.map((p) => ({
        slug: p.target_relation_slug,
        label: p.target_label_no,
        href: `/relasjon/person/${p.target_relation_slug}`,
      }));
    }

    // Common: Fetch Media from ct_period86_media
    const mediaRows = await period86Query<MediaItem>(
      `
      select blob_url, thumbnail_url, caption_no, description_no, media_type
      from ct_period86_media
      where period_slug = $1 and is_active = true
      order by sort_order asc, period_media_id asc;
      `,
      [node_key]
    );
    media = mediaRows;

    let land_omrade = "Norge";
    if (country_scope_raw.toLowerCase().includes("se")) land_omrade = "Sverige";
    else if (country_scope_raw.toLowerCase().includes("dk")) land_omrade = "Danmark";
    if (country_scope_raw.toLowerCase().includes("no") && country_scope_raw.toLowerCase().includes("se")) {
      land_omrade = "Sverige-Norge / union";
    }

    return NextResponse.json(
      {
        node_key,
        title_no,
        type_label_no,
        year_label,
        summary_no,
        collectium_relevance_no,
        relation_href,
        land_omrade,
        related_objects,
        related_periods,
        related_people,
        related_motifs,
        media,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Kunne ikke hente nodedetaljer.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
