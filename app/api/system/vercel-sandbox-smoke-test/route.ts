/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Vercel Sandbox Smoke Test Route
 *
 * Definering / formål:
 * Kjører kontrollert Vercel Sandbox smoke test og logger resultatet som systemhendelse.
 *
 * Bruksområde:
 * Brukes av admin/system/runtime-kontroll for å verifisere at Vercel Sandbox fungerer live.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - system.vercel_sandbox.smoke_test
 * - system.control_event_log.write
 *
 * Berørte API-ruter:
 * - GET /api/system/vercel-sandbox-smoke-test
 * - POST /api/system/control-event-log
 *
 * Berørte tabeller / views:
 * - Neon: ct_control_event_logs
 *
 * Dataretning:
 * Vercel Sandbox -> API/backend -> Neon control event log -> Admin UI
 *
 * Logging:
 * log_category: system
 * log_action: vercel_sandbox.smoke_test
 *
 * Sikkerhetsregel:
 * Ingen katalogskriving. Ingen databaseskriving bortsett fra kontrollhendelseslogg.
 * migration_allowed skal alltid være false.
 */

import { Sandbox } from "@vercel/sandbox";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SandboxSmokeResult = {
  ok: boolean;
  route: string;
  mode: "vercel_sandbox_smoke_test";
  sandbox_status: "OK" | "FEIL";
  command: "echo";
  stdout: string;
  stderr: string;
  error_message?: string;
  write_allowed: false;
  database_write_allowed: false;
  migration_allowed: false;
  truth_status: "not_approved";
  next_step: string;
  svar_til_chatgpt: string;
};

type LogResult = {
  log_status: "OK" | "FEIL";
  log_event_id: string | null;
  log_error: string | null;
};

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function writeControlEvent(
  request: Request,
  result: SandboxSmokeResult,
): Promise<LogResult> {
  try {
    const eventUrl = new URL("/api/system/control-event-log", request.url);

    const response = await fetch(eventUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        event_source: "vercel_sandbox",
        event_type: "sandbox_smoke_test",
        route_path: "/api/system/vercel-sandbox-smoke-test",
        action_route: "/api/system/vercel-sandbox-smoke-test",
        http_method: "GET",
        status: result.ok ? "OK" : "FEIL",
        severity: result.ok ? "info" : "warning",
        message_no: result.ok
          ? "Vercel Sandbox smoke test OK. Kommando echo kjørte uten feil."
          : "Vercel Sandbox smoke test FEIL. Se payload_json for detaljer.",
        suggested_fix_no: result.ok
          ? "Ingen tiltak. Automatisert bruk må fortsatt være kontrollert og uten DB-skriving."
          : "Kontroller Vercel Sandbox runtime, package, tilgang og deployment-logg.",
        payload_json: {
          sandbox_status: result.sandbox_status,
          command: result.command,
          stdout: result.stdout,
          stderr: result.stderr,
          error_message: result.error_message ?? null,
          write_allowed: result.write_allowed,
          database_write_allowed: result.database_write_allowed,
          migration_allowed: result.migration_allowed,
          truth_status: result.truth_status,
        },
      }),
    });

    const json = (await response.json().catch(() => null)) as
      | { ok?: boolean; event?: { id?: string | number } }
      | null;

    if (!response.ok || !json?.ok) {
      return {
        log_status: "FEIL",
        log_event_id: null,
        log_error: `control-event-log svarte ${response.status}`,
      };
    }

    return {
      log_status: "OK",
      log_event_id: json.event?.id ? String(json.event.id) : null,
      log_error: null,
    };
  } catch (error) {
    return {
      log_status: "FEIL",
      log_event_id: null,
      log_error: errorToMessage(error),
    };
  }
}

export async function GET(request: Request) {
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  let result: SandboxSmokeResult;

  try {
    sandbox = await Sandbox.create();

    const command = await sandbox.runCommand("echo", [
      "Collectium Vercel Sandbox OK",
    ]);

    const stdout = await command.stdout();
    const stderr = await command.stderr();

    result = {
      ok: true,
      route: "/api/system/vercel-sandbox-smoke-test",
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
        "Sandbox smoke test er aktiv og logger nå til kontrollhendelseslogg. Neste steg er å vise siste sandbox-hendelse tydelig i adminpanelet.",
      svar_til_chatgpt:
        "VERCEL SANDBOX SMOKE TEST:\nSandbox create: OK\nCommand: echo\nStdout: Collectium Vercel Sandbox OK\nDatabase write allowed: false\nMigration allowed: false",
    };
  } catch (error) {
    result = {
      ok: false,
      route: "/api/system/vercel-sandbox-smoke-test",
      mode: "vercel_sandbox_smoke_test",
      sandbox_status: "FEIL",
      command: "echo",
      stdout: "",
      stderr: "",
      error_message: errorToMessage(error),
      write_allowed: false,
      database_write_allowed: false,
      migration_allowed: false,
      truth_status: "not_approved",
      next_step:
        "Kontroller Vercel Sandbox runtime, package, tilgang og deployment-logg.",
      svar_til_chatgpt:
        "VERCEL SANDBOX SMOKE TEST:\nSandbox create/run: FEIL\nDatabase write allowed: false\nMigration allowed: false",
    };
  } finally {
    if (sandbox) {
      await sandbox.stop().catch(() => undefined);
    }
  }

  const logResult = await writeControlEvent(request, result);

  return NextResponse.json({
    ...result,
    ...logResult,
  });
}
