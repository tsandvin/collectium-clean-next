"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side raw client
 *
 * Definering / formål:
 * Rå React-klient for Min side. Komponenten bruker global Collectium layout/theme
 * og viser API-status uten lokale mock-verdier, egen topbar, egen sidebar eller
 * eget visuelt skall.
 *
 * Bruksområde:
 * Importeres av app/min-side/page.tsx.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - GET /api/account/overview
 * - GET /api/account/processes
 * - GET /api/account/transactions
 * - GET /api/account/notifications
 * - GET /api/account/messages
 * - GET /api/account/documents
 * - GET /api/account/security
 *
 * Dataretning:
 * API/backend -> React -> UI
 *
 * Versjon:
 * CT-FILE-MINSIDE-RAW-0002 / CHANGE-2026-06-11-0002
 */

import { useEffect, useMemo, useState } from "react";
import type { MinSideEndpointState, MinSideEndpointStatus } from "./min-side-raw-types";

const endpoints = [
  { key: "session", label: "Session", path: "/api/auth/session" },
  { key: "overview", label: "Oversikt", path: "/api/account/overview" },
  { key: "processes", label: "Prosesser", path: "/api/account/processes" },
  { key: "transactions", label: "Transaksjoner", path: "/api/account/transactions" },
  { key: "notifications", label: "Varsler", path: "/api/account/notifications" },
  { key: "messages", label: "Meldinger", path: "/api/account/messages" },
  { key: "documents", label: "Dokumenter", path: "/api/account/documents" },
  { key: "security", label: "Sikkerhet", path: "/api/account/security" },
];

function getStatusLabel(status: MinSideEndpointStatus) {
  if (status === "ok") return "OK";
  if (status === "missing") return "Mangler API";
  if (status === "error") return "Feil";
  return "Laster";
}

export default function MinSideRawClient() {
  const [items, setItems] = useState<MinSideEndpointState[]>(
    endpoints.map((endpoint) => ({
      ...endpoint,
      status: "loading",
      httpStatus: null,
      detail: "Venter på API-svar",
    })),
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.path, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            });

            if (!alive) return null;

            if (response.status === 404) {
              return {
                ...endpoint,
                status: "missing" as const,
                httpStatus: response.status,
                detail: "Endpoint finnes ikke ennå.",
              };
            }

            if (!response.ok) {
              return {
                ...endpoint,
                status: "error" as const,
                httpStatus: response.status,
                detail: `API svarte med status ${response.status}.`,
              };
            }

            return {
              ...endpoint,
              status: "ok" as const,
              httpStatus: response.status,
              detail: "API svarte.",
            };
          } catch {
            return {
              ...endpoint,
              status: "error" as const,
              httpStatus: null,
              detail: "Kunne ikke hente endpoint.",
            };
          }
        }),
      );

      if (!alive) return;
      setItems(results.filter(Boolean) as MinSideEndpointState[]);
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      ok: items.filter((item) => item.status === "ok").length,
      missing: items.filter((item) => item.status === "missing").length,
      error: items.filter((item) => item.status === "error").length,
      loading: items.filter((item) => item.status === "loading").length,
    };
  }, [items]);

  return (
    <main aria-labelledby="min-side-title">
      <header>
        <p>Collectium konto</p>
        <h1 id="min-side-title">Min side</h1>
        <p>
          Rå API-drevet kontrollside. Denne visningen bruker globalt tema og viser
          bare ekte endpoint-status. Ingen lokale mock-tall eller objektpreview brukes.
        </p>
      </header>

      <section aria-label="Status">
        <h2>API-status</h2>
        <p>
          OK: {summary.ok} · Mangler API: {summary.missing} · Feil: {summary.error} · Laster: {summary.loading}
        </p>
      </section>

      <section aria-label="Min side endepunkter">
        <h2>Datakilder</h2>

        <div>
          {items.map((item) => (
            <article key={item.key}>
              <h3>{item.label}</h3>
              <p>{item.path}</p>
              <p>
                Status: <strong>{getStatusLabel(item.status)}</strong>
                {item.httpStatus ? ` · HTTP ${item.httpStatus}` : ""}
              </p>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
