/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Vercel Sandbox Smoke Test API
 *
 * Definering / formål:
 * Kjører en trygg, isolert Vercel Sandbox smoke-test uten database-skriving.
 *
 * Bruksområde:
 * Brukes av admin/system/mariadb-neon for å kontrollere at Vercel Sandbox kan starte,
 * kjøre en ufarlig kommando og stoppe korrekt.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 * - GET /api/system/vercel-sandbox-smoke-test
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.vercel_sandbox.view
 * - admin.system.vercel_sandbox.smoke_test
 *
 * Berørte API-ruter:
 * - GET /api/system/vercel-sandbox-smoke-test
 *
 * Berørte tabeller / views:
 * - Ingen direkte DB-skriving.
 *
 * Dataretning:
 * Vercel Sandbox -> Next.js API -> Admin UI
 *
 * Logging:
 * log_category: system.vercel_sandbox
 * log_action: sandbox_smoke_test
 *
 * Versjon:
 * CT-API-0004 / CHANGE-2026-06-10-0004
 *
 * Endringsregel:
 * Denne route-filen er ny. Den kjører kun ufarlige kommandoer i sandbox.
 */

import { Sandbox } from "@vercel/sandbox";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE = "/api/system/vercel-sandbox-smoke-test";

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function GET() {
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  try {
    sandbox = await Sandbox.create({
      timeout: 5 * 60 * 1000,
    });

    const command = await sandbox.runCommand("echo", [
      "Collectium Vercel Sandbox OK",
    ]);

    const stdout = await command.stdout();
    const stderr = await command.stderr();

    return jsonResponse({
      ok: true,
      route: ROUTE,
      mode: "vercel_sandbox_smoke_test",
      sandbox_status: "OK",
      command: "echo",
      stdout,
      stderr,
      write_allowed: false,
      database_write_allowed: false,
      migration_allowed: false,
      truth_status: "not_approved",
      next_step:
        "Koble sandbox-status inn i application-runtime-overview og admin/system/mariadb-neon.",
      svar_til_chatgpt: [
        "VERCEL SANDBOX SMOKE TEST:",
        "Sandbox create: OK",
        "Command: echo",
        `Stdout: ${stdout.trim()}`,
        "Database write allowed: false",
        "Migration allowed: false",
      ].join("\n"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return jsonResponse(
      {
        ok: false,
        route: ROUTE,
        mode: "vercel_sandbox_smoke_test",
        sandbox_status: "FEIL",
        error: message,
        write_allowed: false,
        database_write_allowed: false,
        migration_allowed: false,
        truth_status: "not_approved",
        next_step:
          "Kontroller @vercel/sandbox installasjon, Vercel plan/tilgang og runtime-støtte.",
        svar_til_chatgpt: [
          "VERCEL SANDBOX SMOKE TEST:",
          "Sandbox create/run: FEIL",
          `Error: ${message}`,
          "Database write allowed: false",
          "Migration allowed: false",
        ].join("\n"),
      },
      500
    );
  } finally {
    if (sandbox) {
      await sandbox.stop();
    }
  }
}
