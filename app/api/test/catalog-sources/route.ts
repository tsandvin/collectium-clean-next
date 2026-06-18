/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Catalog Sources Test API
 *
 * Formål:
 * Tester katalogkilder og katalogrelaterte API-ruter uten å skrive til DB.
 * Denne ruten er en kontrollrute for katalogkobling, ikke en produksjonskatalog.
 *
 * Route:
 * - /api/test/catalog-sources
 *
 * Berørte kilder:
 * - norske_sedler / banknote
 * - norske_mynter / coin
 * - verdibrev / security
 *
 * Skriving:
 * - Ingen DB-skriving
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Probe = {
  key: string;
  label: string;
  source_key: string;
  object_group: string;
  role: string;
  endpoint: string;
  expected_status: string;
};

const PROBES: Probe[] = [
  {
    key: "no-banknotes-list",
    label: "Norske sedler · katalogliste",
    source_key: "norske_sedler",
    object_group: "banknote",
    role: "Primær seddelkatalog",
    endpoint: "/api/catalog/no-banknotes?limit=5",
    expected_status: "Skal returnere norske sedler dersom katalog-API er koblet.",
  },
  {
    key: "no-banknotes-filters",
    label: "Norske sedler · filter",
    source_key: "norske_sedler",
    object_group: "banknote",
    role: "Seddelfilter",
    endpoint: "/api/catalog/no-banknotes/filters",
    expected_status: "Skal returnere filterverdier for norske sedler.",
  },
  {
    key: "no-banknotes-relations",
    label: "Norske sedler · relasjoner",
    source_key: "norske_sedler",
    object_group: "banknote",
    role: "Seddelrelasjoner",
    endpoint: "/api/catalog/no-banknotes/relations?limit=5",
    expected_status: "Skal returnere relasjoner for norske sedler.",
  },
  {
    key: "period-catalog-banknotes",
    label: "Periodefilter mot norske sedler",
    source_key: "norske_sedler",
    object_group: "banknote",
    role: "Periode/katalog-kobling",
    endpoint: "/api/test/period-catalog?source_key=norske_sedler&object_group=banknote&segment=historie&view=horisontal&limit=5&country_scope=NO&year_from=1814&year_to=2024",
    expected_status: "Skal returnere sedler filtrert på periode dersom period-catalog er koblet.",
  },
  {
    key: "period-catalog-coins",
    label: "Periodefilter mot norske mynter",
    source_key: "norske_mynter",
    object_group: "coin",
    role: "Periode/katalog-kobling",
    endpoint: "/api/test/period-catalog?source_key=norske_mynter&object_group=coin&segment=historie&view=horisontal&limit=5&country_scope=NO&year_from=1814&year_to=2024",
    expected_status: "Skal returnere mynter når myntkatalog/API er koblet.",
  },
  {
    key: "period-catalog-security",
    label: "Periodefilter mot verdibrev",
    source_key: "verdibrev",
    object_group: "security",
    role: "Neon-first katalog",
    endpoint: "/api/test/period-catalog?source_key=verdibrev&object_group=security&segment=historie&view=horisontal&limit=5&country_scope=NO&year_from=1814&year_to=2024",
    expected_status: "Skal returnere verdibrev når Neon-first struktur er bygget.",
  },
  {
    key: "sample-objects",
    label: "Sample objects",
    source_key: "sample",
    object_group: "mixed",
    role: "Generell katalogtest",
    endpoint: "/api/catalog/sample-objects",
    expected_status: "Skal returnere generell prøve/diagnose hvis ruten finnes.",
  },
  {
    key: "filter-master",
    label: "Filter Master",
    source_key: "filter_master",
    object_group: "filter",
    role: "Global filterkontroll",
    endpoint: "/api/filter/master",
    expected_status: "Skal returnere globale filtermasterverdier.",
  },
  {
    key: "period-options",
    label: "Periodevalg",
    source_key: "period",
    object_group: "period",
    role: "Periodefilter",
    endpoint: "/api/filter/period/options",
    expected_status: "Skal returnere periodevalg/tidslinje.",
  },
];

function countRows(data: any): number | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data.rows)) return data.rows.length;
  if (Array.isArray(data.objects)) return data.objects.length;
  if (Array.isArray(data.options)) return data.options.length;
  if (Array.isArray(data.filters)) return data.filters.length;
  if (typeof data.count === "number") return data.count;
  if (typeof data.total === "number") return data.total;

  return null;
}

function sourceStatus(sourceKey: string, objectGroup: string): string {
  if (sourceKey === "norske_sedler" && objectGroup === "banknote") {
    return "MariaDB-kilde finnes. Neon/catalog-kobling må kontrolleres.";
  }

  if (sourceKey === "norske_mynter" && objectGroup === "coin") {
    return "Delvis overført/koblet. Må radtelles og mappes.";
  }

  if (sourceKey === "verdibrev" && objectGroup === "security") {
    return "Neon-first kilde. Struktur må bygges før produksjonsdata.";
  }

  return "Kontrollpunkt.";
}

async function probeEndpoint(origin: string, probe: Probe) {
  const url = `${origin}${probe.endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    const text = await response.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 500) };
    }

    const rows = countRows(data);

    return {
      ...probe,
      ok: response.ok && data?.ok !== false,
      http_status: response.status,
      row_count: rows,
      endpoint_status:
        response.ok && data?.ok !== false
          ? "OK"
          : response.status === 404
            ? "MANGLER"
            : "FEIL",
      source_status: sourceStatus(probe.source_key, probe.object_group),
      error: response.ok ? data?.error || data?.message || null : data?.error || data?.message || text.slice(0, 300),
      sample: Array.isArray(data?.rows)
        ? data.rows.slice(0, 2)
        : Array.isArray(data?.objects)
          ? data.objects.slice(0, 2)
          : Array.isArray(data?.options)
            ? data.options.slice(0, 2)
            : null,
    };
  } catch (error) {
    return {
      ...probe,
      ok: false,
      http_status: 0,
      row_count: null,
      endpoint_status: "FEIL",
      source_status: sourceStatus(probe.source_key, probe.object_group),
      error: error instanceof Error ? error.message : String(error),
      sample: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const startedAt = new Date().toISOString();
  const origin = new URL(request.url).origin;

  const checks = await Promise.all(PROBES.map((probe) => probeEndpoint(origin, probe)));

  const summary = {
    total: checks.length,
    ok: checks.filter((check) => check.endpoint_status === "OK").length,
    missing: checks.filter((check) => check.endpoint_status === "MANGLER").length,
    error: checks.filter((check) => check.endpoint_status === "FEIL").length,
  };

  return NextResponse.json({
    ok: true,
    source: "catalog-sources-test",
    checked_at: startedAt,
    collectium_rule: {
      write_allowed: false,
      migration_allowed: false,
      note: "Denne ruten tester katalog-API og skriver ikke til Neon eller MariaDB.",
    },
    summary,
    checks,
    next_steps: [
      "Lag én katalogtestside som viser alle katalogkilder og ruter.",
      "Koble norske_sedler til kanonisk ct_no_banknote_catalog eller resolved API.",
      "Koble norske_mynter til kanonisk ct_no_coin_catalog når radtelling/mapping er klar.",
      "Bygg verdibrev/security som Neon-first kilde før produksjonsvisning.",
      "La periodefilter bruke katalogtest-resultatene i stedet for fallback-kort.",
    ],
  });
}
