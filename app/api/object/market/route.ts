/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Generisk objektmarked API
 *
 * Definering / formÃ¥l:
 * Leser marked, verdi, trend, auksjon og nettbutikkstatus for ett katalogobjekt.
 *
 * BruksomrÃ¥de:
 * Brukes av Finans-segmentet pÃ¥ objektpresentasjon.
 *
 * BerÃ¸rte sider / routes:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - object.market.view
 *
 * BerÃ¸rte API-ruter:
 * - GET /api/object/market
 *
 * BerÃ¸rte tabeller / views:
 * - ct_v_object_market_resolved
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
        select *
        from public.ct_v_object_market_resolved
        where source_key = $1
          and object_group = $2
          and object_id::text = $3::text
        limit 1
      `,
      [sourceKey, objectGroup, objectId]
    );

    const row = rows[0] ?? null;

    return NextResponse.json({
      ok: true,
      source: "ct_v_object_market_resolved",
      object_key: {
        source_key: sourceKey,
        object_group: objectGroup,
        object_id: objectId,
      },
      found: Boolean(row),
      row,
      fallback_status_no: row ? null : "Mangler markedsdata",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown object market API error",
      },
      { status: 500 }
    );
  }
}