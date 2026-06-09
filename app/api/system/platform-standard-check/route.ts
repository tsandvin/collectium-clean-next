/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Platform Standard Check Route
 *
 * Definering / formål:
 * Kontrollert API-rute som sjekker om Collectium-prosjektet følger valgt standard
 * for Next.js, React, Vercel, Neon, Node.js, API-runtime og miljøvariabler.
 *
 * Bruksområde:
 * Brukes av M-N Control for å vise om teknisk plattformstandard er OK, utdatert,
 * mangler eller må kontrolleres før videre migrering.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.platform.standard_check
 * - system.nextjs.standard
 * - system.react.standard
 * - system.vercel.standard
 * - system.neon.standard
 *
 * Berørte API-ruter:
 * - GET /api/system/platform-standard-check
 *
 * Berørte tabeller / views:
 * - Ingen. Leser package.json og process.env.
 *
 * Dataretning:
 * package.json + process.env -> API/backend -> JSON
 *
 * Logging:
 * log_category: system
 * log_action: platform.standard_check
 *
 * Versjon:
 * CT-FILE-PLATFORM-STANDARD-CHECK-0001
 *
 * Endringsregel:
 * Dette er en read-only kontrollrute. Den skal ikke skrive data.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CheckStatus = "OK" | "VARSEL" | "FEIL" | "INFO";

type StandardCheck = {
  line_no: number;
  status: CheckStatus;
  area: string;
  standard_key: string;
  current_value: string;
  expected_value: string;
  detail_no: string;
  suggestion_no: string;
};

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
};

function getDependency(pkg: PackageJson, name: string) {
  return (
    pkg.dependencies?.[name] ??
    pkg.devDependencies?.[name] ??
    ""
  );
}

function hasDependency(pkg: PackageJson, name: string) {
  return Boolean(getDependency(pkg, name));
}

function checkMajor(versionValue: string, allowedMajors: number[]) {
  const match = versionValue.match(/(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  return allowedMajors.includes(major);
}

function envExists(...names: string[]) {
  return names.some((name) => Boolean(process.env[name]));
}

export async function GET() {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const raw = await readFile(packagePath, "utf8");
    const pkg = JSON.parse(raw) as PackageJson;

    const nextVersion = getDependency(pkg, "next");
    const reactVersion = getDependency(pkg, "react");
    const reactDomVersion = getDependency(pkg, "react-dom");
    const neonVersion = getDependency(pkg, "@neondatabase/serverless");
    const nodeEngine = pkg.engines?.node ?? "";
    const hasBuildScript = Boolean(pkg.scripts?.build);
    const hasDevScript = Boolean(pkg.scripts?.dev);

    const checks: StandardCheck[] = [
      {
        line_no: 1,
        status: checkMajor(nextVersion, [16]) ? "OK" : "VARSEL",
        area: "Next.js",
        standard_key: "system.nextjs.version",
        current_value: nextVersion || "missing",
        expected_value: "Next.js 16.x",
        detail_no: "Collectium bør ligge på Next.js 16-linje for nåværende Vercel/React-standard.",
        suggestion_no: checkMajor(nextVersion, [16])
          ? "OK"
          : "Oppgrader eller lås Next.js-versjon etter kontrollert test.",
      },
      {
        line_no: 2,
        status: checkMajor(reactVersion, [19]) ? "OK" : "VARSEL",
        area: "React",
        standard_key: "system.react.version",
        current_value: reactVersion || "missing",
        expected_value: "React 19.x",
        detail_no: "React 19 er riktig moderne linje for Next.js 16 og RSC.",
        suggestion_no: checkMajor(reactVersion, [19])
          ? "OK"
          : "Kontroller React/React DOM-versjon før videre komponentarbeid.",
      },
      {
        line_no: 3,
        status:
          reactVersion && reactDomVersion && reactVersion === reactDomVersion
            ? "OK"
            : "VARSEL",
        area: "React",
        standard_key: "system.react.react_dom_match",
        current_value: `react=${reactVersion || "missing"} / react-dom=${reactDomVersion || "missing"}`,
        expected_value: "react og react-dom samme versjon",
        detail_no: "React og React DOM bør ligge på samme versjonslinje.",
        suggestion_no:
          reactVersion === reactDomVersion
            ? "OK"
            : "Synkroniser react og react-dom.",
      },
      {
        line_no: 4,
        status: hasDependency(pkg, "@neondatabase/serverless") ? "OK" : "FEIL",
        area: "Neon",
        standard_key: "system.neon.driver",
        current_value: neonVersion || "missing",
        expected_value: "@neondatabase/serverless installert",
        detail_no: "Vercel/serverless Neon-kobling skal bruke Neon serverless-driver.",
        suggestion_no: neonVersion
          ? "OK"
          : "Installer @neondatabase/serverless.",
      },
      {
        line_no: 5,
        status: envExists("DATABASE_URL", "neon_DATABASE_URL", "neon_POSTGRES_URL", "POSTGRES_URL")
          ? "OK"
          : "FEIL",
        area: "Neon",
        standard_key: "system.neon.env",
        current_value: envExists("DATABASE_URL", "neon_DATABASE_URL", "neon_POSTGRES_URL", "POSTGRES_URL")
          ? "database url found"
          : "missing",
        expected_value: "DATABASE_URL eller neon_DATABASE_URL",
        detail_no: "Neon må ha gyldig database-URL i Vercel/local env.",
        suggestion_no: "Kontroller Vercel Environment Variables.",
      },
      {
        line_no: 6,
        status: envExists("CT_DB_HOST", "CT_DB_NAME", "CT_DB_USER", "CT_DB_PASSWORD")
          ? "OK"
          : "VARSEL",
        area: "MariaDB",
        standard_key: "system.mariadb.env",
        current_value: envExists("CT_DB_HOST", "CT_DB_NAME", "CT_DB_USER", "CT_DB_PASSWORD")
          ? "CT_DB_* found"
          : "missing",
        expected_value: "CT_DB_* finnes under overgangsperioden",
        detail_no: "MariaDB må være tilgjengelig som read-only kontrollarkiv.",
        suggestion_no: "Kontroller CT_DB_* i local/Vercel env.",
      },
      {
        line_no: 7,
        status: nodeEngine && checkMajor(nodeEngine, [20, 22, 24]) ? "OK" : "VARSEL",
        area: "Vercel",
        standard_key: "system.node.engine",
        current_value: nodeEngine || "not set",
        expected_value: "engines.node 20.x, 22.x eller 24.x",
        detail_no: "Node-versjon bør være eksplisitt og støttet av Vercel.",
        suggestion_no: nodeEngine
          ? "OK hvis Vercel bruker samme major."
          : "Vurder å sette engines.node i package.json.",
      },
      {
        line_no: 8,
        status: hasBuildScript ? "OK" : "FEIL",
        area: "Next.js",
        standard_key: "system.nextjs.build_script",
        current_value: pkg.scripts?.build ?? "missing",
        expected_value: "next build",
        detail_no: "Vercel trenger riktig build-script.",
        suggestion_no: hasBuildScript ? "OK" : "Legg inn build-script.",
      },
      {
        line_no: 9,
        status: hasDevScript ? "OK" : "VARSEL",
        area: "Next.js",
        standard_key: "system.nextjs.dev_script",
        current_value: pkg.scripts?.dev ?? "missing",
        expected_value: "next dev",
        detail_no: "Lokal utvikling bør ha dev-script.",
        suggestion_no: hasDevScript ? "OK" : "Legg inn dev-script.",
      },
      {
        line_no: 10,
        status: "INFO",
        area: "Architecture",
        standard_key: "system.nextjs.app_router",
        current_value: "app directory",
        expected_value: "App Router",
        detail_no: "Prosjektet bruker app/.../page.tsx og app/api/.../route.ts.",
        suggestion_no: "Fortsett med App Router-standard.",
      },
      {
        line_no: 11,
        status: "INFO",
        area: "Runtime",
        standard_key: "system.api.node_runtime",
        current_value: "runtime=nodejs on DB routes",
        expected_value: "DB-ruter bør bruke nodejs runtime",
        detail_no: "DB-ruter med mysql2/neon skal ikke tvinges til edge runtime.",
        suggestion_no: "Kontroller runtime på nye DB/API-ruter.",
      },
      {
        line_no: 12,
        status: "VARSEL",
        area: "Project standard",
        standard_key: "system.platform.manual_review",
        current_value: "manual review required",
        expected_value: "Kildekode sjekkes mot Next.js/React/Vercel/Neon standard",
        detail_no: "Automatisk sjekk kan ikke alene avgjøre om alle komponentmønstre er overholdt.",
        suggestion_no: "Neste steg: kodeanalyse for server/client boundary, async params, cache/no-store, env-bruk og API-runtime.",
      },
    ];

    const summary = {
      ok: checks.filter((item) => item.status === "OK").length,
      varsel: checks.filter((item) => item.status === "VARSEL").length,
      feil: checks.filter((item) => item.status === "FEIL").length,
      info: checks.filter((item) => item.status === "INFO").length,
    };

    return NextResponse.json({
      ok: summary.feil === 0,
      source: "platform-standard-check",
      checked_at: new Date().toISOString(),
      summary,
      platform: {
        next: nextVersion,
        react: reactVersion,
        react_dom: reactDomVersion,
        neon_driver: neonVersion,
        node_engine: nodeEngine || null,
        vercel_runtime_target: "nodejs for DB routes",
      },
      checks,
      collectium_rule: {
        migration_allowed: false,
        reason:
          "Plattformstandard må være kontrollert før videre migrering. Denne ruten skriver ikke data.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "platform-standard-check",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
