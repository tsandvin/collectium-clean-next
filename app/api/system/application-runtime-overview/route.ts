/*
 * Overskrift:
 * Collectium Application Runtime Overview API
 *
 * Definering / formål:
 * Returnerer aktiv applikasjons-, deploy-, GitHub-, Vercel-, Next.js-, React- og Neon-status.
 *
 * Bruksområde:
 * Brukes av MariaDB - Neon Postgres Control for å vise hvilken kode, deploy og databasekobling som faktisk kjører.
 *
 * Berørte DB-brytere / feature_keys:
 * system.application_runtime_overview
 * system.mariadb_neon.control
 * system.active_integrations.control
 *
 * Berørte sider/routes:
 * /admin/system/mariadb-neon
 * /api/system/application-runtime-overview
 */

import { NextResponse } from "next/server";
import { createRequire } from "module";

export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

type PackageJson = {
  version?: string;
};

function readPackageVersion(packageName: string): string {
  try {
    const pkg = require(`${packageName}/package.json`) as PackageJson;
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function safeEnv(name: string): string | null {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    return null;
  }
  return value;
}

function redact(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= 10) {
    return "***";
  }

  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function parseDatabaseUrl(rawUrl: string | null) {
  if (!rawUrl) {
    return {
      exists: false,
      protocol: null,
      user: null,
      host: null,
      database: null,
      endpoint: null,
      projectHint: null,
      redactedUrl: null,
    };
  }

  try {
    const url = new URL(rawUrl);
    const host = url.hostname || null;
    const user = url.username || null;
    const database = url.pathname ? url.pathname.replace("/", "") : null;
    const endpoint = host ? host.split(".")[0] : null;

    return {
      exists: true,
      protocol: url.protocol.replace(":", ""),
      user,
      host,
      database,
      endpoint,
      projectHint: endpoint,
      redactedUrl: `${url.protocol}//${user ? `${user}:***@` : ""}${host}${url.pathname || ""}`,
    };
  } catch {
    return {
      exists: true,
      protocol: null,
      user: null,
      host: null,
      database: null,
      endpoint: null,
      projectHint: null,
      redactedUrl: redact(rawUrl),
    };
  }
}

function buildGithubUrl(owner: string | null, repo: string | null, sha: string | null) {
  if (!owner || !repo) {
    return null;
  }

  if (sha) {
    return `https://github.com/${owner}/${repo}/commit/${sha}`;
  }

  return `https://github.com/${owner}/${repo}`;
}

function buildProjectUrl() {
  const production = safeEnv("VERCEL_PROJECT_PRODUCTION_URL");
  const deployment = safeEnv("VERCEL_URL");

  if (production) {
    return `https://${production}`;
  }

  if (deployment) {
    return `https://${deployment}`;
  }

  return null;
}

export async function GET() {
  const repoOwner = safeEnv("VERCEL_GIT_REPO_OWNER");
  const repoSlug = safeEnv("VERCEL_GIT_REPO_SLUG");
  const commitSha = safeEnv("VERCEL_GIT_COMMIT_SHA");
  const commitRef = safeEnv("VERCEL_GIT_COMMIT_REF");
  const commitMessage = safeEnv("VERCEL_GIT_COMMIT_MESSAGE");
  const commitAuthorName = safeEnv("VERCEL_GIT_COMMIT_AUTHOR_NAME");
  const commitAuthorLogin = safeEnv("VERCEL_GIT_COMMIT_AUTHOR_LOGIN");

  const databaseUrl = parseDatabaseUrl(safeEnv("DATABASE_URL"));
  const directUrl = parseDatabaseUrl(safeEnv("DIRECT_URL"));
  const neonDatabaseUrl = parseDatabaseUrl(safeEnv("NEON_DATABASE_URL"));

  const nowIso = new Date().toISOString();

  const runtime = {
    ok: true,
    generated_at: nowIso,
    source: "application-runtime-overview",
    collectium: {
      application_name: "Collectium",
      application_domain: "app.collectium.no",
      control_page: "/admin/system/mariadb-neon",
      control_page_name: "MariaDB - Neon Postgres Control",
      current_runtime_route: "/api/system/application-runtime-overview",
    },
    vercel: {
      environment: safeEnv("VERCEL_ENV"),
      region: safeEnv("VERCEL_REGION"),
      deployment_id: safeEnv("VERCEL_DEPLOYMENT_ID"),
      deployment_url: safeEnv("VERCEL_URL") ? `https://${safeEnv("VERCEL_URL")}` : null,
      production_url: safeEnv("VERCEL_PROJECT_PRODUCTION_URL") ? `https://${safeEnv("VERCEL_PROJECT_PRODUCTION_URL")}` : null,
      project_url: buildProjectUrl(),
      git_provider: safeEnv("VERCEL_GIT_PROVIDER"),
      git_previous_sha: safeEnv("VERCEL_GIT_PREVIOUS_SHA"),
    },
    github: {
      owner: repoOwner,
      repository: repoSlug,
      branch: commitRef,
      commit_sha: commitSha,
      commit_short_sha: commitSha ? commitSha.slice(0, 7) : null,
      commit_message: commitMessage,
      commit_author_name: commitAuthorName,
      commit_author_login: commitAuthorLogin,
      commit_url: buildGithubUrl(repoOwner, repoSlug, commitSha),
      repository_url: repoOwner && repoSlug ? `https://github.com/${repoOwner}/${repoSlug}` : null,
    },
    framework: {
      node_version: process.version,
      next_version: readPackageVersion("next"),
      react_version: readPackageVersion("react"),
      react_dom_version: readPackageVersion("react-dom"),
      runtime: "Next.js App Router",
    },
    neon: {
      database_url: databaseUrl,
      direct_url: directUrl,
      neon_database_url: neonDatabaseUrl,
      active_connection_hint:
        databaseUrl.exists ? "DATABASE_URL" : directUrl.exists ? "DIRECT_URL" : neonDatabaseUrl.exists ? "NEON_DATABASE_URL" : null,
    },
    integrations: [
      {
        name: "Vercel",
        status: safeEnv("VERCEL") === "1" || safeEnv("VERCEL_ENV") ? "OK" : "UNKNOWN",
        detail: "Deployment/runtime environment",
      },
      {
        name: "GitHub",
        status: repoOwner && repoSlug && commitSha ? "OK" : "MISSING_ENV",
        detail: repoOwner && repoSlug ? `${repoOwner}/${repoSlug}` : "Mangler Vercel GitHub metadata",
      },
      {
        name: "Next.js",
        status: readPackageVersion("next") !== "unknown" ? "OK" : "UNKNOWN",
        detail: readPackageVersion("next"),
      },
      {
        name: "React",
        status: readPackageVersion("react") !== "unknown" ? "OK" : "UNKNOWN",
        detail: readPackageVersion("react"),
      },
      {
        name: "Neon",
        status: databaseUrl.exists || directUrl.exists || neonDatabaseUrl.exists ? "OK" : "MISSING_ENV",
        detail: databaseUrl.host || directUrl.host || neonDatabaseUrl.host || "Ingen Neon connection string funnet",
      },
    ],
    last_human_process: {
      status: "CONTROL_PLACEHOLDER",
      source: "manual_process_log_not_connected_yet",
      text:
        "Sist registrert menneskelig prosess må kobles til egen prosess-/loggtabell. Inntil dette er koblet, viser denne ruten deploy og commit som siste tekniske prosess.",
      fallback_process: {
        type: "git_deploy",
        by: commitAuthorName || commitAuthorLogin || repoOwner || "unknown",
        commit_sha: commitSha,
        commit_short_sha: commitSha ? commitSha.slice(0, 7) : null,
        commit_message: commitMessage,
        branch: commitRef,
        time: nowIso,
      },
    },
  };

  return NextResponse.json(runtime, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
