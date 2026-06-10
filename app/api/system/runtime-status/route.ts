import { NextResponse } from "next/server";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Runtime status alias route
 *
 * Definering / formål:
 * Alias for aktiv drift/runtime-status. Ruten videresender til eksisterende
 * /api/system/application-runtime-overview slik at sider som spør etter
 * /api/system/runtime-status ikke feiler.
 *
 * Bruksområde:
 * Brukes av admin/system/mariadb-neon og eventuelle nye driftspaneler.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte API-ruter:
 * - GET /api/system/runtime-status
 * - GET /api/system/application-runtime-overview
 *
 * Dataretning:
 * application-runtime-overview -> runtime-status alias -> UI
 *
 * Versjon:
 * CT-FILE-RUNTIME-STATUS-ALIAS-0001
 */

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const response = await fetch(`${baseUrl}/api/system/application-runtime-overview`, {
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: "FEIL",
          message: "Kunne ikke lese /api/system/application-runtime-overview",
          upstreamStatus: response.status,
        },
        { status: 502 }
      );
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const text = await response.text();

    return NextResponse.json({
      ok: true,
      status: "OK",
      source: "/api/system/application-runtime-overview",
      raw: text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "FEIL",
        message: "Runtime status alias feilet",
        error: error instanceof Error ? error.message : "Ukjent feil",
      },
      { status: 500 }
    );
  }
}
