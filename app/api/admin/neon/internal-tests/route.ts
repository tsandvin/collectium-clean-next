import { NextRequest, NextResponse } from "next/server";
import { runAllTests } from "./runner";
import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    const origin = new URL(request.url).origin;
    const results = await runAllTests(origin);

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Kunne ikke kjøre interne tester",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    const origin = new URL(request.url).origin;
    const results = await runAllTests(origin);

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Kunne ikke kjøre interne tester",
      },
      { status: 500 }
    );
  }
}
