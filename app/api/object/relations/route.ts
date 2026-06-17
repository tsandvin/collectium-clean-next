/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Generisk objektrelasjoner API
 *
 * Definering / formål:
 * Leser klikkbare relasjoner for ett katalogobjekt fra Neon resolved view.
 *
 * Bruksområde:
 * Brukes av objektpresentasjon, visningskort og senere relasjonspresentasjon.
 *
 * Berørte sider / routes:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 * - /relasjon/[relationType]/[slug]
 *
 * Berørte DB-brytere / feature_keys:
 * - object.relations.view
 *
 * Berørte API-ruter:
 * - GET /api/object/relations
 *
 * Berørte tabeller / views:
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 */

import { NextResponse } from "next/server";
import { neonQuery } from "@/lib/db/neon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredParam(url: URL, key: string) {
  const value = url.searchParams.get(key)?.trim();
  if (!value) {
    return null;
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const sourceKey = getRequiredParam(url, "source_key");
    const objectGroup = getRequiredParam(url, "object_group");
    const objectId = getRequiredParam(url, "object_id");

    if (!sourceKey || !objectGroup || !objectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required params: source_key, object_group, object_id",
          required_params: ["source_key", "object_group", "object_id"],
        },
        { status: 400 }
      );
    }

    const rows = await neonQuery(
      `
        select
          source_key,
          object_group,
          object_id,
          title_no,
          relation_type,
          relation_label_no,
          relation_slug,
          relation_href,
          relation_source,
          relation_payload_json,
          resolved_at
        from public.ct_v_object_relations_resolved
        where source_key = $1
          and object_group = $2
          and object_id = $3::bigint
        order by relation_type, relation_label_no
      `,
      [sourceKey, objectGroup, objectId]
    );

    return NextResponse.json({
      ok: true,
      source: "ct_v_object_relations_resolved",
      object_key: {
        source_key: sourceKey,
        object_group: objectGroup,
        object_id: objectId,
      },
      count: rows.length,
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown object relations API error",
      },
      { status: 500 }
    );
  }
}