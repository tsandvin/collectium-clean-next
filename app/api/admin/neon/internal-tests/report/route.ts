import { NextRequest, NextResponse } from "next/server";
import { runAllTests } from "../runner";

import { protectAdminApi } from "@/lib/auth/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await protectAdminApi();
  if (guard) return guard;

  try {
    const origin = new URL(request.url).origin;
    const results = await runAllTests(origin);
    
    const format = request.nextUrl.searchParams.get("format") || "";
    const acceptHeader = request.headers.get("accept") || "";
    
    // Map statuses to Norwegian formatting
    const getStatusText = (key: string) => {
      const status = results.groups.find(g => g.group_key === key)?.status || "OK";
      if (status === "WARNING") return "VARSEL";
      if (status === "ERROR") return "FEIL";
      return "OK";
    };

    const nextjsStatus = getStatusText("nextjs");
    const reactStatus = getStatusText("react");
    const vercelStatus = getStatusText("vercel");
    const neonStatus = getStatusText("neon");
    const apiStatus = getStatusText("api");
    const urlStatus = getStatusText("url");
    const designStatus = getStatusText("design");
    const loggingStatus = getStatusText("logging");
    const browserStatus = getStatusText("browser");

    const deployGateText = results.deploy_gate.status === "BLOCKED" 
      ? "BLOKKERT" 
      : results.deploy_gate.status === "OPEN" 
        ? "ÅPEN" 
        : "IKKE TESTET";

    // Build the list of blockers
    const blockersText = results.deploy_gate.blockers.length > 0
      ? results.deploy_gate.blockers.map((b, i) => `${i + 1}. ${b}`).join("\n")
      : "Ingen deploy-blokkerende feil.";

    // Build next steps from failed tests
    const failedTests = results.tests.filter(t => t.status === "FEIL" || t.status === "KRITISK" || t.status === "MANGLER" || t.status === "VARSEL");
    const nextSteps = failedTests.length > 0
      ? failedTests.slice(0, 3).map((t, i) => `${i + 1}. ${t.suggested_fix || `Korriger ${t.name}`}`).join("\n")
      : "1. Kontroller og kjør tester på nytt ved behov.\n2. Ingen ytterligere tiltak kreves.";

    const textReport = [
      "INTERN TEST — ADMIN NEON",
      "",
      `Next.js: ${nextjsStatus}`,
      `React: ${reactStatus}`,
      `Vercel: ${vercelStatus}`,
      `Neon DB: ${neonStatus}`,
      `API-ruter: ${apiStatus}`,
      `URL/baner: ${urlStatus}`,
      `Designstandard: ${designStatus}`,
      `Logging: ${loggingStatus}`,
      `Browser-varsler: ${browserStatus}`,
      `Deploy gate: ${deployGateText}`,
      "",
      `Tester totalt: ${results.summary.total}`,
      `OK: ${results.summary.ok}`,
      `Varsler: ${results.summary.warnings}`,
      `Feil: ${results.summary.errors + results.summary.critical}`,
      `Mangler: ${results.summary.missing}`,
      "",
      "Blokkeringer:",
      blockersText,
      "",
      "Neste tiltak:",
      nextSteps
    ].join("\n");

    if (format === "text" || acceptHeader.includes("text/plain")) {
      return new NextResponse(textReport, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        }
      });
    }

    return NextResponse.json({
      report: textReport,
      data: results
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Kunne ikke hente rapport",
      },
      { status: 500 }
    );
  }
}
