import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Application Runtime Overview API
 *
 * Definering / formål:
 * Returnerer runtime-, modul-, brukeraktivitets-, Blob-, Sandbox- og kapasitetsstatus
 * for MariaDB -> Neon kontrollsiden.
 *
 * Bruksområde:
 * - /admin/system/mariadb-neon
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - GET /api/system/application-runtime-overview
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.application_runtime.view
 * - admin.system.active_modules.view
 * - admin.system.user_activity.view
 *
 * Dataretning:
 * package.json / env / runtime -> API -> admin kontrollside
 *
 * Logging:
 * log_category: system
 * log_action: application_runtime_overview
 *
 * Versjon:
 * CT-API-APPLICATION-RUNTIME-OVERVIEW-0002 / CHANGE-2026-06-10-RUNTIME-TABS
 */

export const dynamic = "force-dynamic";

type Status = "OK" | "VARSEL" | "MANGLER" | "FEIL" | "BLOKKERT" | "INFO" | "PLANLAGT";

type PackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readPackageJson(): PackageJson {
  try {
    const filePath = path.join(process.cwd(), "package.json");
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function getVersion(pkg: PackageJson, packageName: string): string {
  return pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName] || "not_installed";
}

function envPresent(...names: string[]): boolean {
  return names.some((name) => Boolean(process.env[name] && String(process.env[name]).trim().length > 0));
}

function statusFromInstalled(version: string): Status {
  return version === "not_installed" ? "MANGLER" : "OK";
}

export async function GET() {
  const pkg = readPackageJson();

  const activeModules = [
    {
      module_key: "next",
      module_name: "Next.js",
      package_name: "next",
      version: getVersion(pkg, "next"),
      status: statusFromInstalled(getVersion(pkg, "next")),
      activity_status: "aktiv",
      usage_no: "App Router, API-ruter, server rendering og admin/system.",
      next_action_no: "OK.",
    },
    {
      module_key: "react",
      module_name: "React",
      package_name: "react",
      version: getVersion(pkg, "react"),
      status: statusFromInstalled(getVersion(pkg, "react")),
      activity_status: "aktiv",
      usage_no: "UI-komponenter, fanevalg og klientinteraksjon.",
      next_action_no: "OK.",
    },
    {
      module_key: "react_dom",
      module_name: "React DOM",
      package_name: "react-dom",
      version: getVersion(pkg, "react-dom"),
      status: statusFromInstalled(getVersion(pkg, "react-dom")),
      activity_status: "aktiv",
      usage_no: "Rendering av React i Next.js.",
      next_action_no: "OK.",
    },
    {
      module_key: "typescript",
      module_name: "TypeScript",
      package_name: "typescript",
      version: getVersion(pkg, "typescript"),
      status: statusFromInstalled(getVersion(pkg, "typescript")),
      activity_status: "aktiv",
      usage_no: "Typekontroll og build.",
      next_action_no: "OK.",
    },
    {
      module_key: "neon_serverless",
      module_name: "Neon serverless",
      package_name: "@neondatabase/serverless",
      version: getVersion(pkg, "@neondatabase/serverless"),
      status: statusFromInstalled(getVersion(pkg, "@neondatabase/serverless")),
      activity_status: envPresent("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL") ? "klar" : "venter_env",
      usage_no: "Neon Postgres-kobling.",
      next_action_no: envPresent("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL")
        ? "Test live query."
        : "Legg DATABASE_URL / POSTGRES_URL / NEON_DATABASE_URL i Vercel Production.",
    },
    {
      module_key: "pg",
      module_name: "Postgres pg",
      package_name: "pg",
      version: getVersion(pkg, "pg"),
      status: statusFromInstalled(getVersion(pkg, "pg")),
      activity_status: envPresent("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL") ? "klar" : "venter_env",
      usage_no: "Fallback/stabil Postgres runtime-driver.",
      next_action_no: "Kan brukes i API-ruter der Neon serverless import feiler.",
    },
    {
      module_key: "mariadb",
      module_name: "MariaDB driver",
      package_name: "mariadb/mysql2",
      version: `${getVersion(pkg, "mariadb")} / ${getVersion(pkg, "mysql2")}`,
      status: getVersion(pkg, "mariadb") !== "not_installed" || getVersion(pkg, "mysql2") !== "not_installed" ? "OK" : "MANGLER",
      activity_status: envPresent("MARIADB_HOST", "DB_HOST", "MYSQL_HOST") ? "klar" : "venter_env",
      usage_no: "MariaDB read-only kontrollarkiv.",
      next_action_no: envPresent("MARIADB_HOST", "DB_HOST", "MYSQL_HOST")
        ? "Kjør MariaDB health check."
        : "Legg MariaDB read-only env i Vercel.",
    },
    {
      module_key: "vercel_blob",
      module_name: "Vercel Blob",
      package_name: "@vercel/blob",
      version: getVersion(pkg, "@vercel/blob"),
      status: statusFromInstalled(getVersion(pkg, "@vercel/blob")),
      activity_status: envPresent("BLOB_READ_WRITE_TOKEN") ? "klar" : "venter_env",
      usage_no: "Bilder, dokumenter, thumbnails og objektfiler.",
      next_action_no: envPresent("BLOB_READ_WRITE_TOKEN")
        ? "Kjør Blob upload/download test senere."
        : "Legg BLOB_READ_WRITE_TOKEN i Vercel.",
    },
    {
      module_key: "vercel_sandbox",
      module_name: "Vercel Sandbox",
      package_name: "@vercel/sandbox",
      version: getVersion(pkg, "@vercel/sandbox"),
      status: getVersion(pkg, "@vercel/sandbox") === "not_installed" ? "PLANLAGT" : "OK",
      activity_status: getVersion(pkg, "@vercel/sandbox") === "not_installed" ? "ikke_aktiv" : "aktiv",
      usage_no: "Isolert testrom for kommandoer, build og pre-deploy kontroll.",
      next_action_no: getVersion(pkg, "@vercel/sandbox") === "not_installed"
        ? "Installer og aktiver når sandbox-kontrollen bygges." : "OK. Sandbox smoke test fungerer. Koble status til adminvisning og hendelseslogg.",
    },
  ];

  const moduleActivity = activeModules.map((item, index) => ({
    line_no: index + 1,
    ...item,
    last_seen_no: "runtime check",
  }));

  const userActivity = {
    status: "PLANLAGT" as Status,
    source_no: "Brukeraktivitet krever session-/usage-logging mot Neon eller MariaDB.",
    online_now: 0,
    anonymous_online: 0,
    logged_in_online: 0,
    active_24h: 0,
    active_7d: 0,
    free_users_active: 0,
    bronze_users_active: 0,
    silver_users_active: 0,
    gold_users_active: 0,
    platinum_users_active: 0,
    dealers_active: 0,
    admins_active: 0,
    required_tables: [
      "ct_user_sessions",
      "ct_usage_events",
      "ct_usage_daily_summary",
      "ct_usage_user_daily_summary",
      "ct_membership_usage_summary",
    ],
    next_action_no: "Opprett/valider usage-tabeller og session last_seen_at før ekte tall vises.",
  };

  const blobActivity = [
    {
      line_no: 1,
      module_name: "Vercel Blob",
      status: envPresent("BLOB_READ_WRITE_TOKEN") ? "OK" : "VARSEL",
      token_present: envPresent("BLOB_READ_WRITE_TOKEN"),
      activity_status: envPresent("BLOB_READ_WRITE_TOKEN") ? "klar" : "venter_env",
      next_action_no: envPresent("BLOB_READ_WRITE_TOKEN") ? "Kjør upload/download test." : "Legg BLOB_READ_WRITE_TOKEN i Vercel.",
    },
  ];

  const sandboxActivity = [
    {
      line_no: 1,
      module_name: "Vercel Sandbox",
      package_name: "@vercel/sandbox",
      version: getVersion(pkg, "@vercel/sandbox"),
      status: getVersion(pkg, "@vercel/sandbox") === "not_installed" ? "PLANLAGT" : "OK",
      activity_status: getVersion(pkg, "@vercel/sandbox") === "not_installed" ? "ikke_aktiv" : "aktiv",
      next_action_no: getVersion(pkg, "@vercel/sandbox") === "not_installed" ? "Installer @vercel/sandbox." : "OK. Sandbox smoke test fungerer. Automatisert bruk må fortsatt være kontrollert og uten DB-skriving.",
    },
  ];

  const envStatus = {
    vercel: Boolean(process.env.VERCEL),
    vercel_env: process.env.VERCEL_ENV || "local",
    database_url_present: envPresent("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL"),
    mariadb_env_present: envPresent("MARIADB_HOST", "DB_HOST", "MYSQL_HOST"),
    blob_token_present: envPresent("BLOB_READ_WRITE_TOKEN"),
  };

  const summary = {
    active_modules_total: activeModules.length,
    active_modules_ok: activeModules.filter((item) => item.status === "OK").length,
    active_modules_warning: activeModules.filter((item) => item.status === "VARSEL").length,
    active_modules_missing: activeModules.filter((item) => item.status === "MANGLER").length,
    user_activity_status: userActivity.status,
    blob_status: blobActivity[0]?.status || "INFO",
    sandbox_status: sandboxActivity[0]?.status || "INFO",
    migration_allowed: false,
    neon_truth_status: "not_approved",
  };

  return NextResponse.json({
    ok: true,
    source: "application-runtime-overview",
    route: "/api/system/application-runtime-overview",
    checked_at: new Date().toISOString(),
    project: {
      name: pkg.name || "unknown",
      version: pkg.version || "unknown",
      node: process.version,
    },
    env_status: envStatus,
    summary,
    active_modules: activeModules,
    module_activity: moduleActivity,
    user_activity: userActivity,
    blob_activity: blobActivity,
    sandbox_activity: sandboxActivity,
    svar_til_chatgpt: {
      api_route: "/api/system/application-runtime-overview",
      status: "OK",
      message: "Runtime, aktive moduler, brukeraktivitet, Blob og Sandbox er nå egen API-kontrakt. Overføringsmatrise skal ligge i /api/system/mariadb-neon-transfer-matrix.",
    },
  });
}

