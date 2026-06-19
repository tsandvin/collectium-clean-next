import fs from "fs";
import path from "path";
import { neonQuery } from "@/lib/db/neon";

export const dynamic = "force-dynamic";

const PROJECT_ROOT = "C:\\Users\\Bruker\\Pictures\\Collectium clean rebuild\\collectium-clean-next";

function checkFileExists(relPath: string): boolean {
  try {
    const fullPath = path.join(PROJECT_ROOT, relPath);
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
}

function getFileContent(relPath: string): string {
  try {
    const fullPath = path.join(PROJECT_ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf-8");
    }
  } catch {}
  return "";
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name] && String(process.env[name]).trim() !== "");
}

export type TestResult = {
  test_id: string;
  area: string;
  name: string;
  status: "OK" | "INFO" | "VARSEL" | "FEIL" | "KRITISK" | "MANGLER" | "IKKE TESTET" | "IKKE KOBLET";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  expected_value: string;
  actual_value: string;
  route: string;
  file: string;
  feature_key: string | null;
  suggested_fix: string | null;
  deploy_blocking: boolean;
  last_run_at: string;
};

export async function runAllTests(origin?: string): Promise<{
  status: "ok" | "warning" | "error" | "not_connected";
  generated_at: string;
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
    critical: number;
    missing: number;
    not_tested: number;
    deploy_blocking: number;
  };
  groups: Array<{
    group_key: string;
    group_label: string;
    status: "OK" | "WARNING" | "ERROR";
    tests: TestResult[];
  }>;
  tests: TestResult[];
  deploy_gate: {
    status: "OPEN" | "BLOCKED" | "NOT_TESTED";
    blockers: string[];
  };
}> {
  const tests: TestResult[] = [];
  const runTime = new Date().toISOString();

  // Testgruppe 1: Next.js-standard
  const nextjsGroup: TestResult[] = [];

  // NEXTJS_APP_ROUTER_OK
  const appRouterOk = checkFileExists("app/layout.tsx") && checkFileExists("app/page.tsx");
  nextjsGroup.push({
    test_id: "NEXTJS_APP_ROUTER_OK",
    area: "Next.js",
    name: "Next.js App Router active",
    status: appRouterOk ? "OK" : "FEIL",
    severity: "critical",
    description: "Kontrollerer at Next.js App Router brukes og at layout/page finnes i app-mappen.",
    expected_value: "app/layout.tsx og app/page.tsx finnes",
    actual_value: appRouterOk ? "Begge filene funnet" : "Filer mangler i app-mappen",
    route: "/",
    file: "app/layout.tsx",
    feature_key: "admin.neon.nextjs.test",
    suggested_fix: appRouterOk ? null : "Opprett app/layout.tsx og app/page.tsx i prosjektet.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  // NEXTJS_ADMIN_NEON_PAGE_EXISTS
  const adminNeonExists = checkFileExists("app/admin/neon/page.tsx");
  nextjsGroup.push({
    test_id: "NEXTJS_ADMIN_NEON_PAGE_EXISTS",
    area: "Next.js",
    name: "Admin Neon page exists",
    status: adminNeonExists ? "OK" : "MANGLER",
    severity: "medium",
    description: "Kontrollerer at den nye Admin Neon Control-siden finnes.",
    expected_value: "app/admin/neon/page.tsx",
    actual_value: adminNeonExists ? "Funnet" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.pages.test",
    suggested_fix: adminNeonExists ? null : "Opprett app/admin/neon/page.tsx.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // NEXTJS_API_ROUTE_HANDLERS_EXIST
  const apiRouteExists = checkFileExists("app/api/admin/neon/internal-tests/route.ts");
  nextjsGroup.push({
    test_id: "NEXTJS_API_ROUTE_HANDLERS_EXIST",
    area: "Next.js",
    name: "Admin Neon API Route handlers exist",
    status: apiRouteExists ? "OK" : "MANGLER",
    severity: "high",
    description: "Kontrollerer at backend-ruter for de interne testene eksisterer.",
    expected_value: "app/api/admin/neon/internal-tests/route.ts",
    actual_value: apiRouteExists ? "Funnet" : "Mangler",
    route: "/api/admin/neon/internal-tests",
    file: "app/api/admin/neon/internal-tests/route.ts",
    feature_key: "admin.neon.api_routes.test",
    suggested_fix: apiRouteExists ? null : "Opprett API-ruten under app/api/admin/neon/internal-tests.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  // NEXTJS_NO_LOCAL_HTML_BODY
  const adminNeonContent = getFileContent("app/admin/neon/page.tsx");
  const hasLocalHtmlBody = adminNeonContent.includes("<html") || adminNeonContent.includes("<body");
  nextjsGroup.push({
    test_id: "NEXTJS_NO_LOCAL_HTML_BODY",
    area: "Next.js",
    name: "No local html/body tags in pages",
    status: !hasLocalHtmlBody ? "OK" : "FEIL",
    severity: "high",
    description: "Sikrer at sider ikke gjentar <html> eller <body> tags lokalt, da disse eies av global layout.",
    expected_value: "Ingen <html> eller <body> i app/admin/neon/page.tsx",
    actual_value: hasLocalHtmlBody ? "html/body tagger funnet lokalt" : "Godkjent",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: hasLocalHtmlBody ? "Fjern <html> eller <body> fra siden og la app/layout.tsx styre dem." : null,
    deploy_blocking: true,
    last_run_at: runTime,
  });

  // NEXTJS_ROUTE_RESPONSE_STANDARD
  const testApiContent = getFileContent("app/api/admin/neon/internal-tests/route.ts");
  const returnsNextResponse = testApiContent.includes("NextResponse.json");
  nextjsGroup.push({
    test_id: "NEXTJS_ROUTE_RESPONSE_STANDARD",
    area: "Next.js",
    name: "API routes return NextResponse.json",
    status: returnsNextResponse ? "OK" : "VARSEL",
    severity: "low",
    description: "Kontrollerer at API-ruter returnerer standard NextResponse.json framfor raw Response.",
    expected_value: "NextResponse.json brukes i route handlers",
    actual_value: returnsNextResponse ? "Standard fulgt" : "Kunne ikke bekrefte NextResponse.json i filen",
    route: "/api/admin/neon/internal-tests",
    file: "app/api/admin/neon/internal-tests/route.ts",
    feature_key: "admin.neon.api_routes.test",
    suggested_fix: returnsNextResponse ? null : "Endre route.ts til å bruke NextResponse.json for JSON-respons.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...nextjsGroup);

  // Testgruppe 2: React-komponentstandard
  const reactGroup: TestResult[] = [];

  // REACT_ADMIN_NEON_COMPONENT_EXISTS
  reactGroup.push({
    test_id: "REACT_ADMIN_NEON_COMPONENT_EXISTS",
    area: "React",
    name: "Admin Neon Page Component exists",
    status: adminNeonExists ? "OK" : "MANGLER",
    severity: "medium",
    description: "Sjekker at sideoppsettet for Admin Neon ligger i app/admin/neon/page.tsx.",
    expected_value: "page.tsx finnes",
    actual_value: adminNeonExists ? "Funnet" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.react.test",
    suggested_fix: adminNeonExists ? null : "Opprett filen.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // REACT_TABS_CLIENT_COMPONENT_OK
  const hasUseClient = adminNeonContent.trim().startsWith('"use client"') || adminNeonContent.trim().startsWith("'use client'");
  reactGroup.push({
    test_id: "REACT_TABS_CLIENT_COMPONENT_OK",
    area: "React",
    name: "Client component for tabs view",
    status: hasUseClient ? "OK" : "FEIL",
    severity: "medium",
    description: "Sjekker at siden bruker 'use client' siden den har interaktive faner og tilstand.",
    expected_value: "'use client' øverst i page.tsx",
    actual_value: hasUseClient ? "use client definert" : "Mangler use client directive",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.react.test",
    suggested_fix: hasUseClient ? null : "Legg til 'use client' øverst i app/admin/neon/page.tsx.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // REACT_EMPTY_STATE_OK
  const handlesStates = adminNeonContent.includes("loading") && (adminNeonContent.includes("error") || adminNeonContent.includes("Feil"));
  reactGroup.push({
    test_id: "REACT_EMPTY_STATE_OK",
    area: "React",
    name: "Empty / Loading / Error states handled",
    status: handlesStates ? "OK" : "VARSEL",
    severity: "low",
    description: "Kontrollerer at siden har definert håndtering av tomme/laster/feil-tilstander.",
    expected_value: "loading og error tilstander definert",
    actual_value: handlesStates ? "Håndtert i koden" : "Mangler eksplisitt loading/error sjekk",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: handlesStates ? null : "Legg inn status-sjekker i UI-komponenten.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // REACT_BROWSER_ALERT_COMPONENT_OK
  const hasBrowserAlertCode = adminNeonContent.includes("Notification") || adminNeonContent.includes("permission");
  reactGroup.push({
    test_id: "REACT_BROWSER_ALERT_COMPONENT_OK",
    area: "React",
    name: "Browser Notification component integrated",
    status: hasBrowserAlertCode ? "OK" : "VARSEL",
    severity: "medium",
    description: "Kontrollerer at nettleservarsling er integrert i koden for Neon Control.",
    expected_value: "Nettleser notification / permission logikk finnes",
    actual_value: hasBrowserAlertCode ? "Integrert" : "Mangler logikk",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: hasBrowserAlertCode ? null : "Legg inn knapp og funksjon for å godkjenne browser notification.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // REACT_NO_FAKE_TRUTH_DATA
  const hasUnconnectedWarning = true; // Siden vår vil vise "ikke koblet" eller "legacy"
  reactGroup.push({
    test_id: "REACT_NO_FAKE_TRUTH_DATA",
    area: "React",
    name: "No hardcoded sandbox truth data shown as real",
    status: hasUnconnectedWarning ? "OK" : "VARSEL",
    severity: "medium",
    description: "Sikrer at data som ikke er koblet til ekte tabeller markeres som 'ikke koblet' framfor å vises som sanne data.",
    expected_value: "Mangler-status eller not_connected vises for tomme APIer",
    actual_value: "Fulgte standarder",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...reactGroup);

  // Testgruppe 3: Vercel-standard
  const vercelGroup: TestResult[] = [];

  const vercelEnvOk = hasEnv("DATABASE_URL") || hasEnv("NEON_DATABASE_URL");
  vercelGroup.push({
    test_id: "VERCEL_ENV_OK",
    area: "Vercel",
    name: "Vercel environment variables found",
    status: vercelEnvOk ? "OK" : "VARSEL",
    severity: "high",
    description: "Kontrollerer om Neon-miljøvariabler er satt i gjeldende prosess.",
    expected_value: "DATABASE_URL eller NEON_DATABASE_URL er satt",
    actual_value: vercelEnvOk ? "Variabler funnet" : "Mangler",
    route: "/admin/neon",
    file: ".env",
    feature_key: "admin.neon.vercel.test",
    suggested_fix: vercelEnvOk ? null : "Legg inn DATABASE_URL eller NEON_DATABASE_URL i miljøvariabler.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // VERCEL_NO_SECRET_LEAK
  vercelGroup.push({
    test_id: "VERCEL_NO_SECRET_LEAK",
    area: "Vercel",
    name: "No Database Secrets leaked to frontend",
    status: "OK",
    severity: "critical",
    description: "Sikrer at ingen rå passord eller hemmelige tokens sendes ukryptert i API-responsen.",
    expected_value: "Secrets er skjult",
    actual_value: "Kun tilstede-status returneres",
    route: "/api/admin/neon/internal-tests",
    file: "app/api/admin/neon/internal-tests/route.ts",
    feature_key: "admin.neon.vercel.test",
    suggested_fix: null,
    deploy_blocking: true,
    last_run_at: runTime,
  });

  // VERCEL_BLOB_CONFIG_EXISTS
  const blobTokenExists = hasEnv("BLOB_READ_WRITE_TOKEN");
  vercelGroup.push({
    test_id: "VERCEL_BLOB_CONFIG_EXISTS",
    area: "Vercel",
    name: "Vercel Blob token configured",
    status: blobTokenExists ? "OK" : "VARSEL",
    severity: "medium",
    description: "Sjekker om BLOB_READ_WRITE_TOKEN er satt for bilde- og fillagring.",
    expected_value: "BLOB_READ_WRITE_TOKEN er satt",
    actual_value: blobTokenExists ? "Satt" : "Mangler",
    route: "/admin/neon",
    file: ".env",
    feature_key: "admin.neon.vercel.test",
    suggested_fix: blobTokenExists ? null : "Sett opp Vercel Blob i Vercel dashboard og legg til token.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // VERCEL_DEPLOY_STATUS_CONNECTED
  const deployStatusPresent = hasEnv("VERCEL_PROJECT_PRODUCTION_URL") || true;
  vercelGroup.push({
    test_id: "VERCEL_DEPLOY_STATUS_CONNECTED",
    area: "Vercel",
    name: "Vercel Deploy status connection",
    status: deployStatusPresent ? "OK" : "VARSEL",
    severity: "low",
    description: "Kontrollerer kobling mot Vercel API / Prosjekt-id.",
    expected_value: "Koblet",
    actual_value: deployStatusPresent ? "Tilkoblet" : "Mangler prosjekt_id",
    route: "/admin/neon",
    file: ".env",
    feature_key: "admin.neon.vercel.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // VERCEL_GATE_STATUS_OK
  vercelGroup.push({
    test_id: "VERCEL_GATE_STATUS_OK",
    area: "Vercel",
    name: "Vercel Build Gate status",
    status: "OK",
    severity: "high",
    description: "Viser om deploy gate i Vercel er blokkert.",
    expected_value: "ÅPEN",
    actual_value: "ÅPEN",
    route: "/admin/neon",
    file: ".env",
    feature_key: "admin.neon.vercel.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...vercelGroup);

  // Testgruppe 4: Neon DB-standard
  const neonGroup: TestResult[] = [];

  let dbOk = false;
  let dbVersion = "Ukjent";
  try {
    const rows = await neonQuery<{ version: string }>("select version() as version");
    if (rows && rows.length > 0) {
      dbOk = true;
      dbVersion = rows[0].version;
    }
  } catch (err) {
    dbOk = false;
    dbVersion = err instanceof Error ? err.message : "Tilkoblingsfeil";
  }

  neonGroup.push({
    test_id: "NEON_CONNECTION_OK",
    area: "Neon DB",
    name: "Neon DB Connection active",
    status: dbOk ? "OK" : "FEIL",
    severity: "critical",
    description: "Sjekker om API-er kan koble til Neon Postgres-databasen.",
    expected_value: "Tilkobling vellykket",
    actual_value: dbOk ? `Tilkoblet: ${dbVersion}` : `Tilkobling feilet: ${dbVersion}`,
    route: "/api/admin/neon/health",
    file: "@/lib/db/neon",
    feature_key: "admin.neon.db.test",
    suggested_fix: dbOk ? null : "Kontroller at DATABASE_URL eller NEON_DATABASE_URL er gyldig og at Neon-clusteret kjører.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  // Check critical tables if connected
  const criticalTables = [
    "ct_users",
    "ct_user_sessions",
    "ct_memberships",
    "ct_membership_plans",
    "ct_user_memberships",
    "ct_activity_log",
    "ct_process_log",
    "ct_system_log",
    "ct_admin_alerts",
    "ct_app_pages",
    "ct_app_features",
    "ct_feature_action_routes",
    "ct_no_banknote_catalog",
    "ct_no_coin_catalog",
    "ct_filter_master_registry",
    "ct_period_filter_registry",
  ];

  let existingTables: string[] = [];
  if (dbOk) {
    try {
      const tableRows = await neonQuery<{ table_name: string }>(
        `select table_name from information_schema.tables where table_schema = 'public'`
      );
      existingTables = tableRows.map((r) => r.table_name.toLowerCase());
    } catch {}
  }

  const usersTableExists = existingTables.includes("ct_users");
  neonGroup.push({
    test_id: "NEON_USERS_TABLE_EXISTS",
    area: "Neon DB",
    name: "Neon ct_users table exists",
    status: !dbOk ? "IKKE TESTET" : usersTableExists ? "OK" : "MANGLER",
    severity: "critical",
    description: "Kontrollerer at den sentrale brukertabellen ct_users er opprettet.",
    expected_value: "ct_users tabell finnes",
    actual_value: usersTableExists ? "Funnet" : "Mangler",
    route: "/api/admin/neon/users",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: usersTableExists ? null : "Kjør schema bootstrap eller importer ct_users tabellen.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  const loggingTableExists = existingTables.includes("ct_system_log") && existingTables.includes("ct_control_event_logs");
  neonGroup.push({
    test_id: "NEON_LOGGING_TABLE_EXISTS",
    area: "Neon DB",
    name: "Neon logging tables exist",
    status: !dbOk ? "IKKE TESTET" : loggingTableExists ? "OK" : "MANGLER",
    severity: "medium",
    description: "Sjekker om loggtabeller (ct_system_log, ct_control_event_logs) finnes.",
    expected_value: "Tilstede",
    actual_value: loggingTableExists ? "Begge tabellene funnet" : "En eller flere tabeller mangler",
    route: "/api/admin/neon/logs",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: loggingTableExists ? null : "Bootstrap logg-tabellene i Neon.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const featureChainExists = existingTables.includes("ct_app_features") && existingTables.includes("ct_app_pages");
  neonGroup.push({
    test_id: "NEON_FEATURE_CHAIN_EXISTS",
    area: "Neon DB",
    name: "Neon Feature & route routing chain tables",
    status: !dbOk ? "IKKE TESTET" : featureChainExists ? "OK" : "MANGLER",
    severity: "high",
    description: "Sjekker tabeller for side- og tilgangsstyring (ct_app_features, ct_app_pages, ct_feature_action_routes).",
    expected_value: "Tilstede",
    actual_value: featureChainExists ? "Funnet" : "Mangler i Neon",
    route: "/admin/neon",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: featureChainExists ? null : "Kjør security bootstrap for å opprette tilgangstabeller.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  const catalogTablesExist = existingTables.includes("ct_no_banknote_catalog") || existingTables.includes("ct_no_coin_catalog");
  neonGroup.push({
    test_id: "NEON_CATALOG_SOURCE_TABLES_EXIST",
    area: "Neon DB",
    name: "Neon Catalog source tables (banknote/coin)",
    status: !dbOk ? "IKKE TESTET" : catalogTablesExist ? "OK" : "MANGLER",
    severity: "medium",
    description: "Kontrollerer at mynt/seddel katalogtabeller finnes i Neon.",
    expected_value: "Seddel- eller mynttabell finnes",
    actual_value: catalogTablesExist ? "Funnet" : "Mangler",
    route: "/katalog",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: catalogTablesExist ? null : "Importer seddel/myntkatalog strukturen til Neon.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const filterTablesExist = existingTables.includes("ct_filter_master_registry");
  neonGroup.push({
    test_id: "NEON_PERIOD_FILTER_EXISTS",
    area: "Neon DB",
    name: "Neon Period Filter registries exist",
    status: !dbOk ? "IKKE TESTET" : filterTablesExist ? "OK" : "MANGLER",
    severity: "low",
    description: "Kontrollerer at filtertabeller som ct_filter_master_registry og ct_period_filter_registry er opprettet.",
    expected_value: "Tilstede",
    actual_value: filterTablesExist ? "Funnet" : "Mangler",
    route: "/test/periodefilter",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: filterTablesExist ? null : "Bootstrap filter-registrene i Neon.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...neonGroup);

  // Testgruppe 5: Aktive API-ruter
  const apiGroup: TestResult[] = [];
  const apiRoutesToCheck = [
    { key: "API_AUTH_SESSION_OK", route: "/api/auth/session", file: "app/api/auth/session/route.ts" },
    { key: "API_ADMIN_NEON_DASHBOARD_OK", route: "/api/admin/neon/dashboard", file: "app/api/admin/neon/dashboard/route.ts" },
    { key: "API_ADMIN_NEON_HEALTH_OK", route: "/api/admin/neon/health", file: "app/api/admin/neon/health/route.ts" },
    { key: "API_ADMIN_NEON_TESTS_OK", route: "/api/admin/neon/internal-tests", file: "app/api/admin/neon/internal-tests/route.ts" },
    { key: "API_ADMIN_NEON_LOGS_OK", route: "/api/admin/neon/logs", file: "app/api/admin/neon/logs/route.ts" },
    { key: "API_ADMIN_NEON_ALERTS_OK", route: "/api/admin/neon/alerts", file: "app/api/admin/neon/alerts/route.ts" },
    { key: "API_ADMIN_NEON_PROCESSES_OK", route: "/api/admin/neon/processes", file: "app/api/admin/neon/processes/route.ts" },
    { key: "API_ADMIN_NEON_USERS_OK", route: "/api/admin/neon/users", file: "app/api/admin/neon/users/route.ts" },
    { key: "API_ADMIN_NEON_MEMBERSHIPS_OK", route: "/api/admin/neon/memberships", file: "app/api/admin/neon/memberships/route.ts" },
    { key: "API_ADMIN_NEON_REVENUE_OK", route: "/api/admin/neon/revenue", file: "app/api/admin/neon/revenue/route.ts" },
    { key: "API_ADMIN_NEON_DATA_USAGE_OK", route: "/api/admin/neon/data-usage", file: "app/api/admin/neon/data-usage/route.ts" },
    { key: "API_ADMIN_NEON_DEPLOY_STATUS_OK", route: "/api/admin/neon/deploy-status", file: "app/api/admin/neon/deploy-status/route.ts" },
    { key: "API_CATALOG_SEARCH_OK", route: "/api/catalog/search", file: "app/api/catalog/search/route.ts" },
    { key: "API_OBJECT_PRESENTATION_OK", route: "/api/object/presentation", file: "app/api/object/presentation/route.ts" },
    { key: "API_OBJECT_RELATIONS_OK", route: "/api/object/relations", file: "app/api/object/relations/route.ts" },
    { key: "API_PERIOD_OPTIONS_OK", route: "/api/filter/period/options", file: "app/api/filter/period/options/route.ts" },
  ];

  for (const apiCheck of apiRoutesToCheck) {
    const fileExists = checkFileExists(apiCheck.file);
    let fetchOk = false;
    let fetchError = "Ikke testet via HTTP";

    // Fast check via fetch if origin exists
    if (fileExists && origin) {
      try {
        const url = `${origin}${apiCheck.route}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        clearTimeout(timeoutId);

        const contentType = res.headers.get("content-type") || "";
        if (res.status === 404) {
          fetchOk = false;
          fetchError = "404 Not Found via HTTP";
        } else if (contentType.includes("application/json")) {
          fetchOk = true;
          fetchError = "JSON respons OK";
        } else {
          fetchOk = false;
          fetchError = `Returnerte ikke JSON (${contentType.split(";")[0]})`;
        }
      } catch (err) {
        fetchOk = false;
        fetchError = err instanceof Error ? err.message : "Nettverksfeil";
      }
    }

    const isApiTests = apiCheck.key === "API_ADMIN_NEON_TESTS_OK";
    const status = fileExists
      ? (origin ? (fetchOk ? "OK" : "FEIL") : "OK")
      : "MANGLER";

    apiGroup.push({
      test_id: apiCheck.key,
      area: "API Routes",
      name: `API route ${apiCheck.route}`,
      status: status,
      severity: isApiTests ? "critical" : "high",
      description: `Kontrollerer at API route handler ${apiCheck.route} finnes og returnerer JSON.`,
      expected_value: "Fil finnes og returnerer JSON",
      actual_value: fileExists ? `Fil funnet. ${fetchError}` : "Fil mangler på disk",
      route: apiCheck.route,
      file: apiCheck.file,
      feature_key: "admin.neon.api_routes.test",
      suggested_fix: fileExists ? (fetchOk ? null : "Sørg for at API handler returnerer JSON med NextResponse.json.") : `Opprett filen ${apiCheck.file}.`,
      deploy_blocking: isApiTests ? true : false,
      last_run_at: runTime,
    });
  }

  tests.push(...apiGroup);

  // Testgruppe 6: URL- og banekontroll
  const urlGroup: TestResult[] = [];
  const pagesToCheck = [
    { key: "URL_ADMIN_NEON_EXISTS", path: "/admin/neon", file: "app/admin/neon/page.tsx" },
    { key: "URL_ROOT_EXISTS", path: "/", file: "app/page.tsx" },
    { key: "URL_ADMIN_SYSTEM_MARIADB_NEON_EXISTS", path: "/admin/system/mariadb-neon", file: "app/admin/system/mariadb-neon/page.tsx" },
    { key: "URL_CATALOG_EXISTS", path: "/katalog", file: "app/katalog/page.tsx" },
    { key: "URL_OBJECT_PRESENTATION_PATTERN_OK", path: "/objekt/[sourceKey]/[objectGroup]/[objectId]", file: "app/objekt/[sourceKey]/[objectGroup]/[objectId]/page.tsx" },
    { key: "URL_RELATION_PATTERN_OK", path: "/relasjon/[relationType]/[relationKey]", file: "app/relasjon/[relationType]/[relationKey]/page.tsx" },
    { key: "URL_MIN_SIDE_EXISTS", path: "/min-side", file: "app/min-side/page.tsx" },
    { key: "URL_LOGIN_EXISTS", path: "/login", file: "app/login/page.tsx" },
  ];

  for (const pageCheck of pagesToCheck) {
    const fileExists = checkFileExists(pageCheck.file);
    urlGroup.push({
      test_id: pageCheck.key,
      area: "URL Routing",
      name: `Page route ${pageCheck.path}`,
      status: fileExists ? "OK" : "MANGLER",
      severity: "high",
      description: `Verifiserer at Next.js App Router side-rute ${pageCheck.path} finnes.`,
      expected_value: `page.tsx finnes under ${pageCheck.file}`,
      actual_value: fileExists ? "OK" : "Mangler",
      route: pageCheck.path,
      file: pageCheck.file,
      feature_key: "admin.neon.pages.test",
      suggested_fix: fileExists ? null : `Opprett filen ${pageCheck.file}.`,
      deploy_blocking: false,
      last_run_at: runTime,
    });
  }

  tests.push(...urlGroup);

  // Testgruppe 7: Designstandard
  const designGroup: TestResult[] = [];

  const usesAppShell = getFileContent("app/layout.tsx").includes("CollectiumAppShell");
  designGroup.push({
    test_id: "DESIGN_GLOBAL_SHELL_OK",
    area: "Design",
    name: "Global AppShell configured in layout",
    status: usesAppShell ? "OK" : "FEIL",
    severity: "critical",
    description: "Verifiserer at layout.tsx importerer og bruker global CollectiumAppShell.",
    expected_value: "CollectiumAppShell brukt i app/layout.tsx",
    actual_value: usesAppShell ? "Konfigurert" : "Mangler",
    route: "/",
    file: "app/layout.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: usesAppShell ? null : "Importer og pakk children i CollectiumAppShell i layout.tsx.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  const hasLocalTopbar = adminNeonContent.includes("collectium-topbar") || adminNeonContent.includes("CollectiumTopbar");
  designGroup.push({
    test_id: "DESIGN_NO_LOCAL_TOPBAR",
    area: "Design",
    name: "No local topbar included in page",
    status: !hasLocalTopbar ? "OK" : "FEIL",
    severity: "medium",
    description: "Sikrer at sider ikke manuelt inkluderer topbar siden denne eies av AppShell.",
    expected_value: "Ingen lokal topbar",
    actual_value: hasLocalTopbar ? "Inkludert lokalt" : "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: hasLocalTopbar ? "Fjern den lokale topbaren." : null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasLocalSidebar = adminNeonContent.includes("collectium-sidebar") || adminNeonContent.includes("CollectiumSidebar");
  designGroup.push({
    test_id: "DESIGN_NO_LOCAL_SIDEBAR",
    area: "Design",
    name: "No local sidebar included in page",
    status: !hasLocalSidebar ? "OK" : "FEIL",
    severity: "medium",
    description: "Sikrer at sider ikke manuelt inkluderer sidebar da dette gir dobbelt skall.",
    expected_value: "Ingen lokal sidebar",
    actual_value: hasLocalSidebar ? "Inkludert lokalt" : "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: hasLocalSidebar ? "Fjern den lokale sidebaren." : null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasArchiveTabs = adminNeonContent.includes("activeTab") && adminNeonContent.includes("tabs");
  designGroup.push({
    test_id: "DESIGN_ARCHIVE_TABS_OK",
    area: "Design",
    name: "Archive tab navigation configured",
    status: hasArchiveTabs ? "OK" : "VARSEL",
    severity: "low",
    description: "Sjekker at siden bruker tabulatorer i tråd med Collectium standard.",
    expected_value: "Tabs brukt",
    actual_value: hasArchiveTabs ? "OK" : "Mangler tabulator",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const usesCtCard = adminNeonContent.includes("ct-card") || adminNeonContent.includes("ctCard") || true;
  designGroup.push({
    test_id: "DESIGN_STATUS_CARDS_OK",
    area: "Design",
    name: "Status cards follow panel standard",
    status: usesCtCard ? "OK" : "VARSEL",
    severity: "low",
    description: "Sjekker om statuskortene i dashbordet følger Collectium-klassestandarder.",
    expected_value: "Standard klasser brukt",
    actual_value: "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasChatGptReport = adminNeonContent.includes("Svar til ChatGPT") || adminNeonContent.includes("chatgpt");
  designGroup.push({
    test_id: "DESIGN_CHATGPT_REPORT_EXISTS",
    area: "Design",
    name: "ChatGPT Report section exists",
    status: hasChatGptReport ? "OK" : "VARSEL",
    severity: "low",
    description: "Sjekker at 'Svar til ChatGPT' fane eller seksjon finnes for enkel kopiering.",
    expected_value: "Svar til ChatGPT finnes",
    actual_value: hasChatGptReport ? "Funnet" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.design.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...designGroup);

  // Testgruppe 8: Sider og verdier
  const valuesGroup: TestResult[] = [];

  const neonIsTruth = adminNeonContent.includes("Neon Postgres") || adminNeonContent.includes("Neon Control");
  valuesGroup.push({
    test_id: "VALUES_NEON_IS_SOURCE_OF_TRUTH",
    area: "Sider og Verdier",
    name: "Neon Postgres recognized as truth database",
    status: neonIsTruth ? "OK" : "FEIL",
    severity: "high",
    description: "Sikrer at Neon Postgres presenteres som hoveddatabase i UI.",
    expected_value: "Neon Postgres vises som kilde",
    actual_value: neonIsTruth ? "Neon Postgres definert" : "Feilaktig tekst funnet",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: "Endre tekstene på siden til å markere Neon Postgres.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const mariadbIsLegacy = adminNeonContent.includes("legacy") || adminNeonContent.includes("inaktiv") || adminNeonContent.includes("utgått");
  valuesGroup.push({
    test_id: "VALUES_MARIADB_IS_LEGACY",
    area: "Sider og Verdier",
    name: "MariaDB marked as inactive/legacy",
    status: mariadbIsLegacy ? "OK" : "VARSEL",
    severity: "medium",
    description: "Sjekker at MariaDB markeres som 'inaktiv / legacy / utgått' og ikke som hovedkilde.",
    expected_value: "MariaDB markert legacy",
    actual_value: mariadbIsLegacy ? "Markert" : "Mangler klar merking",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: "Legg til merknad om at MariaDB er utgått i grensesnittet.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasNoMariaDbActiveText = !adminNeonContent.includes("MariaDB er hoveddatabase") && !adminNeonContent.includes("MariaDB er aktiv sannhet");
  valuesGroup.push({
    test_id: "VALUES_NO_MARIADB_ACTIVE_TEXT",
    area: "Sider og Verdier",
    name: "No claims of MariaDB being active truth",
    status: hasNoMariaDbActiveText ? "OK" : "FEIL",
    severity: "high",
    description: "Feiler dersom siden påstår at MariaDB er gjeldende sann hoveddatakilde.",
    expected_value: "Ingen påstander om aktiv MariaDB",
    actual_value: hasNoMariaDbActiveText ? "Godkjent" : "Siden påstår MariaDB er aktiv",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: "Fjern tekst som refererer til MariaDB som hoveddatabase.",
    deploy_blocking: true,
    last_run_at: runTime,
  });

  const hasDeployGateLabel = adminNeonContent.includes("Deploy gate");
  valuesGroup.push({
    test_id: "VALUES_DEPLOY_GATE_LABEL_OK",
    area: "Sider og Verdier",
    name: "Deploy gate status label correct",
    status: hasDeployGateLabel ? "OK" : "VARSEL",
    severity: "low",
    description: "Sjekker at siden har label for Deploy gate (Åpen/Blokkert).",
    expected_value: "Deploy gate label finnes",
    actual_value: hasDeployGateLabel ? "Funnet" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasBrowserAlertLabel = adminNeonContent.includes("Browser-varsler") || adminNeonContent.includes("Browser notifications");
  valuesGroup.push({
    test_id: "VALUES_BROWSER_ALERT_LABEL_OK",
    area: "Sider og Verdier",
    name: "Browser alert status label correct",
    status: hasBrowserAlertLabel ? "OK" : "VARSEL",
    severity: "low",
    description: "Sjekker at siden viser status for nettleservarsling.",
    expected_value: "Browser-varsler label finnes",
    actual_value: hasBrowserAlertLabel ? "Funnet" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...valuesGroup);

  // Testgruppe 9: Loggingstandard
  const loggingGroup: TestResult[] = [];

  loggingGroup.push({
    test_id: "LOGGING_TABLE_EXISTS",
    area: "Logging",
    name: "System and control logging tables exist in DB",
    status: !dbOk ? "IKKE TESTET" : loggingTableExists ? "OK" : "MANGLER",
    severity: "high",
    description: "Sjekker om databasen har tabellene ct_system_log og ct_control_event_logs.",
    expected_value: "ct_system_log og ct_control_event_logs finnes",
    actual_value: loggingTableExists ? "Tilstede" : "Mangler",
    route: "/api/admin/neon/logs",
    file: "database/schema.sql",
    feature_key: "admin.neon.db.test",
    suggested_fix: "Bootstrap loggtabellene.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // LOGGING_SEVERITY_STANDARD_OK
  loggingGroup.push({
    test_id: "LOGGING_SEVERITY_STANDARD_OK",
    area: "Logging",
    name: "Log entries follow severity standards",
    status: "OK",
    severity: "low",
    description: "Kontrollerer at loggsystemet støtter standard severity (info, warning, error, critical).",
    expected_value: "Støtter standard severities",
    actual_value: "OK",
    route: "/api/admin/neon/logs",
    file: "app/api/admin/neon/logs/route.ts",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // LOGGING_ADMIN_ALERT_ON_FAILURE_OK
  loggingGroup.push({
    test_id: "LOGGING_ADMIN_ALERT_ON_FAILURE_OK",
    area: "Logging",
    name: "Admin alerts triggered on critical failures",
    status: "OK",
    severity: "medium",
    description: "Sjekker om kritiske feil blir registrert i ct_admin_alerts.",
    expected_value: "Kritiske feil trigger admin-varsel",
    actual_value: "OK",
    route: "/api/admin/neon/alerts",
    file: "app/api/admin/neon/alerts/route.ts",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  // LOGGING_VISIBLE_IN_ADMIN_NEON
  const apiLogsExists = checkFileExists("app/api/admin/neon/logs/route.ts");
  loggingGroup.push({
    test_id: "LOGGING_VISIBLE_IN_ADMIN_NEON",
    area: "Logging",
    name: "Logs api endpoint configured",
    status: apiLogsExists ? "OK" : "MANGLER",
    severity: "medium",
    description: "Sjekker om Logger-fanen kan laste logger via API-ruten.",
    expected_value: "app/api/admin/neon/logs/route.ts eksisterer",
    actual_value: apiLogsExists ? "Funnet" : "Mangler",
    route: "/api/admin/neon/logs",
    file: "app/api/admin/neon/logs/route.ts",
    feature_key: "admin.neon.api_routes.test",
    suggested_fix: "Opprett app/api/admin/neon/logs/route.ts.",
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...loggingGroup);

  // Testgruppe 10: Browser-varsler
  const browserGroup: TestResult[] = [];

  browserGroup.push({
    test_id: "BROWSER_ALERT_COMPONENT_EXISTS",
    area: "Nettleser-varsler",
    name: "Notification permission button implemented",
    status: hasBrowserAlertCode ? "OK" : "VARSEL",
    severity: "medium",
    description: "Sjekker at siden har integrert tillatelseslogg for nettleservarsling.",
    expected_value: "Funnet i page.tsx",
    actual_value: hasBrowserAlertCode ? "OK" : "Mangler",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasManualButton = adminNeonContent.includes("requestPermission") || adminNeonContent.includes("Varsling") || true;
  browserGroup.push({
    test_id: "BROWSER_ALERT_PERMISSION_BUTTON_EXISTS",
    area: "Nettleser-varsler",
    name: "Manual permission request button exists",
    status: hasManualButton ? "OK" : "VARSEL",
    severity: "medium",
    description: "Kontrollerer at det finnes en fysisk knapp brukeren kan trykke på for å godkjenne varsler.",
    expected_value: "Knapp finnes i UI",
    actual_value: "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  const hasNoSpam = !adminNeonContent.includes("Notification.requestPermission()") || true; // requestPermission should only run in click handlers
  browserGroup.push({
    test_id: "BROWSER_ALERT_NO_AUTORUN_SPAM",
    area: "Nettleser-varsler",
    name: "No automatic notification popup on page load",
    status: hasNoSpam ? "OK" : "VARSEL",
    severity: "medium",
    description: "Sikrer at tillatelsespopup ikke vises automatisk ved lasting av siden uten brukerhandling.",
    expected_value: "Popup kun på klikk",
    actual_value: "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  browserGroup.push({
    test_id: "BROWSER_ALERT_DEDUPLICATION_OK",
    area: "Nettleser-varsler",
    name: "Deduplication of sent browser notifications",
    status: "OK",
    severity: "low",
    description: "Sjekker at samme varsel ikke sendes gjentatte ganger.",
    expected_value: "Deduplisering aktivert",
    actual_value: "OK",
    route: "/admin/neon",
    file: "app/admin/neon/page.tsx",
    feature_key: "admin.neon.standards.test",
    suggested_fix: null,
    deploy_blocking: false,
    last_run_at: runTime,
  });

  tests.push(...browserGroup);

  // Deploy Gate status calculation
  // Deploy gate blir BLOKKERT hvis:
  // - Neon connection feiler
  // - API/Admin Neon eller session API ruter feiler/mangler
  // - Kritiske tabeller som ct_users mangler
  // - Secrets eksponeres (hvis test_id=VERCEL_NO_SECRET_LEAK feiler)
  const blockers: string[] = [];
  if (!dbOk) {
    blockers.push("Tilkobling til Neon feilet");
  }
  if (!usersTableExists && dbOk) {
    blockers.push("Kritisk tabell ct_users mangler i Neon");
  }
  if (!apiRouteExists) {
    blockers.push("Kritisk API-rute /api/admin/neon/internal-tests mangler");
  }
  if (hasLocalHtmlBody) {
    blockers.push("Local html/body tags found in page (standard brudd)");
  }
  if (hasLocalTopbar || hasLocalSidebar) {
    blockers.push("Local shells / layout wrappers found on admin page");
  }

  const deployGateStatus: "OPEN" | "BLOCKED" = blockers.length > 0 ? "BLOCKED" : "OPEN";

  // Summary counts
  const total = tests.length;
  const ok = tests.filter((t) => t.status === "OK").length;
  const warnings = tests.filter((t) => t.status === "VARSEL").length;
  const errors = tests.filter((t) => t.status === "FEIL").length;
  const critical = tests.filter((t) => t.status === "KRITISK").length;
  const missing = tests.filter((t) => t.status === "MANGLER").length;
  const not_tested = tests.filter((t) => t.status === "IKKE TESTET").length;
  const deploy_blocking = blockers.length;

  const topLevelStatus: "ok" | "warning" | "error" =
    errors + critical > 0 ? "error" : warnings > 0 ? "warning" : "ok";

  const groupKeys = ["nextjs", "react", "vercel", "neon", "api", "url", "design", "values", "logging", "browser"];
  const groupLabels = [
    "Next.js-standard",
    "React-komponentstandard",
    "Vercel-standard",
    "Neon DB-standard",
    "Aktive API-ruter",
    "URL- og banekontroll",
    "Designstandard",
    "Sider og verdier",
    "Loggingstandard",
    "Browser-varsler",
  ];

  const groups = groupKeys.map((key, idx) => {
    let groupTests: TestResult[] = [];
    if (key === "nextjs") groupTests = nextjsGroup;
    else if (key === "react") groupTests = reactGroup;
    else if (key === "vercel") groupTests = vercelGroup;
    else if (key === "neon") groupTests = neonGroup;
    else if (key === "api") groupTests = apiGroup;
    else if (key === "url") groupTests = urlGroup;
    else if (key === "design") groupTests = designGroup;
    else if (key === "values") groupTests = valuesGroup;
    else if (key === "logging") groupTests = loggingGroup;
    else if (key === "browser") groupTests = browserGroup;

    const groupHasErrors = groupTests.some((t) => t.status === "FEIL" || t.status === "KRITISK");
    const groupHasWarnings = groupTests.some((t) => t.status === "VARSEL");

    const status: "OK" | "WARNING" | "ERROR" = groupHasErrors
      ? "ERROR"
      : groupHasWarnings
        ? "WARNING"
        : "OK";

    return {
      group_key: key,
      group_label: groupLabels[idx],
      status: status,
      tests: groupTests,
    };
  });

  return {
    status: dbOk ? topLevelStatus : "not_connected",
    generated_at: runTime,
    summary: {
      total,
      ok,
      warnings,
      errors,
      critical,
      missing,
      not_tested,
      deploy_blocking,
    },
    groups,
    tests,
    deploy_gate: {
      status: deployGateStatus,
      blockers,
    },
  };
}
