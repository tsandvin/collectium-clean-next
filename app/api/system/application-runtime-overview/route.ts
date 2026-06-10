/*
 * Collectium Application Runtime Overview API
 *
 * Formål:
 * Viser aktiv Vercel/GitHub/Next.js/React/Neon-runtime for admin-kontroll.
 *
 * Route:
 * /api/system/application-runtime-overview
 */

import { NextResponse } from "next/server";
import { createRequire } from "module";

export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);

function env(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : null;
}

function readVersion(pkgName: string): string {
  try {
    const pkg = require(`${pkgName}/package.json`) as { version?: string };
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function parseDbUrl(raw: string | null) {
  if (!raw) {
    return {
      exists: false,
      user: null,
      host: null,
      database: null,
      endpoint: null,
      redacted_url: null,
    };
  }

  try {
    const url = new URL(raw);
    return {
      exists: true,
      user: url.username || null,
      host: url.hostname || null,
      database: url.pathname ? url.pathname.replace("/", "") : null,
      endpoint: url.hostname ? url.hostname.split(".")[0] : null,
      redacted_url: `${url.protocol}//${url.username ? `${url.username}:***@` : ""}${url.hostname}${url.pathname}`,
    };
  } catch {
    return {
      exists: true,
      user: null,
      host: null,
      database: null,
      endpoint: null,
      redacted_url: "Kunne ikke parse connection string",
    };
  }
}

export async function GET() {
  const owner = env("VERCEL_GIT_REPO_OWNER");
  const repo = env("VERCEL_GIT_REPO_SLUG");
  const sha = env("VERCEL_GIT_COMMIT_SHA");
  const branch = env("VERCEL_GIT_COMMIT_REF");

  const databaseUrl = parseDbUrl(env("DATABASE_URL"));
  const directUrl = parseDbUrl(env("DIRECT_URL"));
  const neonUrl = parseDbUrl(env("NEON_DATABASE_URL"));

  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    collectium: {
      application_name: "Collectium",
      active_domain: "app.collectium.no",
      active_page: "/admin/system/mariadb-neon",
      active_page_name: "MariaDB - Neon Postgres Control",
    },
    vercel: {
      environment: env("VERCEL_ENV"),
      region: env("VERCEL_REGION"),
      deployment_id: env("VERCEL_DEPLOYMENT_ID"),
      deployment_url: env("VERCEL_URL") ? `https://${env("VERCEL_URL")}` : null,
      production_url: env("VERCEL_PROJECT_PRODUCTION_URL") ? `https://${env("VERCEL_PROJECT_PRODUCTION_URL")}` : null,
      git_provider: env("VERCEL_GIT_PROVIDER"),
    },
    github: {
      owner,
      repository: repo,
      branch,
      commit_sha: sha,
      commit_short_sha: sha ? sha.slice(0, 7) : null,
      commit_message: env("VERCEL_GIT_COMMIT_MESSAGE"),
      commit_author_name: env("VERCEL_GIT_COMMIT_AUTHOR_NAME"),
      commit_author_login: env("VERCEL_GIT_COMMIT_AUTHOR_LOGIN"),
      repository_url: owner && repo ? `https://github.com/${owner}/${repo}` : null,
      commit_url: owner && repo && sha ? `https://github.com/${owner}/${repo}/commit/${sha}` : null,
    },
    framework: {
      node_version: process.version,
      next_version: readVersion("next"),
      react_version: readVersion("react"),
      react_dom_version: readVersion("react-dom"),
      runtime: "Next.js App Router",
    },
    neon: {
      database_url: databaseUrl,
      direct_url: directUrl,
      neon_database_url: neonUrl,
      active_connection:
        databaseUrl.exists ? "DATABASE_URL" :
        directUrl.exists ? "DIRECT_URL" :
        neonUrl.exists ? "NEON_DATABASE_URL" :
        "Mangler",
    },
    integrations: [
      {
        name: "Vercel",
        status: env("VERCEL_ENV") ? "OK" : "Mangler miljødata",
        detail: env("VERCEL_ENV") || "Ikke Vercel runtime",
      },
      {
        name: "GitHub",
        status: owner && repo && sha ? "OK" : "Mangler metadata",
        detail: owner && repo ? `${owner}/${repo}` : "Mangler repo",
      },
      {
        name: "Next.js",
        status: readVersion("next") !== "unknown" ? "OK" : "Ukjent",
        detail: readVersion("next"),
      },
      {
        name: "React",
        status: readVersion("react") !== "unknown" ? "OK" : "Ukjent",
        detail: readVersion("react"),
      },
      {
        name: "Neon",
        status: databaseUrl.exists || directUrl.exists || neonUrl.exists ? "OK" : "Mangler connection string",
        detail: databaseUrl.host || directUrl.host || neonUrl.host || "Ingen host funnet",
      },
    ],
    last_human_process: {
      status: "Ikke koblet til menneskelig prosesslogg ennå",
      explanation:
        "Denne fanen viser teknisk runtime nå. Neste steg er å koble dette til Collectium prosesslogg slik at siste menneskelige handling/godkjenning vises.",
      fallback: {
        type: "git_deploy",
        by: env("VERCEL_GIT_COMMIT_AUTHOR_NAME") || env("VERCEL_GIT_COMMIT_AUTHOR_LOGIN") || owner,
        branch,
        commit_short_sha: sha ? sha.slice(0, 7) : null,
        commit_message: env("VERCEL_GIT_COMMIT_MESSAGE"),
      },
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
