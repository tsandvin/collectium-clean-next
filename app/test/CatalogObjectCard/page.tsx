"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Testside for CatalogObjectCard
 *
 * Definering / formål:
 * Isolert testside for visningskortkomponenten CollectiumCatalogObjectCard.
 * Brukes for å teste segment, visning, megafilter, auksjon, samlerstatus og objektfilter.
 *
 * Bruksområde:
 * Åpnes på /test/CatalogObjectCard.
 *
 * Berørte sider / routes:
 * - /test/CatalogObjectCard
 *
 * Berørte komponenter:
 * - components/catalog/CollectiumCatalogObjectCard.tsx
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search
 * - GET /api/catalog/results
 *
 * Dataretning:
 * API/backend -> testside -> CatalogObjectCard
 */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CollectiumCatalogObjectCard } from "@/components/catalog/CollectiumCatalogObjectCard";
import type {
  CatalogApiPayload,
  CatalogObject,
  CatalogSegment,
  CatalogView,
} from "@/components/catalog/collectium-catalog86-types";
import styles from "./page.module.css";

type TestFilters = {
  q: string;
  sourceKey: string;
  objectGroup: string;
  country: string;
  auction: boolean;
  shop: boolean;
  objectId: string;
  denomination: string;
  year: string;
  ruler: string;
};

const SEGMENTS: { value: CatalogSegment; label: string }[] = [
  { value: "samler", label: "Samler" },
  { value: "historie", label: "Historie" },
  { value: "finans", label: "Finans" },
];

const VIEWS: { value: CatalogView; label: string }[] = [
  { value: "horizontal", label: "Horisontal" },
  { value: "standing", label: "Stående" },
  { value: "list", label: "Liste" },
  { value: "museum", label: "Museum" },
];

const INITIAL_FILTERS: TestFilters = {
  q: "",
  sourceKey: "norske_sedler",
  objectGroup: "banknote",
  country: "Norge",
  auction: false,
  shop: false,
  objectId: "",
  denomination: "",
  year: "",
  ruler: "",
};

function normalizeObjects(payload: CatalogApiPayload | null): CatalogObject[] {
  if (!payload) return [];
  if (Array.isArray(payload.objects)) return payload.objects;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.data)) return payload.data;

  if (payload.data && !Array.isArray(payload.data)) {
    if (Array.isArray(payload.data.objects)) return payload.data.objects;
    if (Array.isArray(payload.data.rows)) return payload.data.rows;
  }

  return [];
}

function buildQuery(filters: TestFilters, segment: CatalogSegment, view: CatalogView): string {
  const params = new URLSearchParams();

  params.set("source_key", filters.sourceKey);
  params.set("object_group", filters.objectGroup);
  params.set("country", filters.country);
  params.set("segment", segment);
  params.set("view", view);
  params.set("limit", "24");

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.objectId.trim()) params.set("object_id", filters.objectId.trim());
  if (filters.denomination.trim()) params.set("denomination", filters.denomination.trim());
  if (filters.year.trim()) params.set("year", filters.year.trim());
  if (filters.ruler.trim()) params.set("ruler", filters.ruler.trim());
  if (filters.auction) params.set("auction", "1");
  if (filters.shop) params.set("shop", "1");

  return params.toString();
}

async function fetchCatalog(query: string, signal?: AbortSignal): Promise<CatalogObject[]> {
  const urls = [`/api/catalog/search?${query}`, `/api/catalog/results?${query}`];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) continue;

      const payload = (await response.json()) as CatalogApiPayload;
      const objects = normalizeObjects(payload);

      if (objects.length > 0) return objects;
    } catch (error) {
      if ((error as Error).name === "AbortError") return [];
    }
  }

  return [];
}

export default function CatalogObjectCardTestPage() {
  const [segment, setSegment] = useState<CatalogSegment>("samler");
  const [view, setView] = useState<CatalogView>("horizontal");
  const [filters, setFilters] = useState<TestFilters>(INITIAL_FILTERS);
  const [submittedFilters, setSubmittedFilters] = useState<TestFilters>(INITIAL_FILTERS);
  const [objects, setObjects] = useState<CatalogObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState("Henter katalogobjekter fra API");

  const query = useMemo(
    () => buildQuery(submittedFilters, segment, view),
    [submittedFilters, segment, view],
  );

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setStatusText("Henter katalogobjekter fra API");

    fetchCatalog(query, controller.signal).then((nextObjects) => {
      setObjects(nextObjects);
      setIsLoading(false);
      setStatusText(
        nextObjects.length > 0
          ? `${nextObjects.length} objekter returnert`
          : "Ingen objekter returnert fra API",
      );
    });

    return () => controller.abort();
  }, [query]);

  function updateFilter<K extends keyof TestFilters>(key: K, value: TestFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedFilters(filters);
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
    setSubmittedFilters(INITIAL_FILTERS);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Collectium test</p>
          <h1>CatalogObjectCard</h1>
          <p>
            Isolert testside for visningskort. Siden tester filter-megameny,
            auksjon, samlersegment, objektfilter og visningsmodus.
          </p>
        </div>

        <div className={styles.statusBox}>
          <span>Status</span>
          <strong>{statusText}</strong>
          <small>{submittedFilters.sourceKey} · {submittedFilters.objectGroup}</small>
        </div>
      </header>

      <section className={styles.controlPanel} aria-label="Testkontroller">
        <form className={styles.filterMegaMenu} onSubmit={submitFilters}>
          <fieldset>
            <legend>Filter megameny</legend>

            <label>
              <span>Søk</span>
              <input
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                placeholder="Søk i objekt, katalognummer eller relasjon"
              />
            </label>

            <label>
              <span>Kilde</span>
              <input
                value={filters.sourceKey}
                onChange={(event) => updateFilter("sourceKey", event.target.value)}
              />
            </label>

            <label>
              <span>Objekttype</span>
              <input
                value={filters.objectGroup}
                onChange={(event) => updateFilter("objectGroup", event.target.value)}
              />
            </label>

            <label>
              <span>Land / område</span>
              <input
                value={filters.country}
                onChange={(event) => updateFilter("country", event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Objektfilter</legend>

            <label>
              <span>Object ID</span>
              <input
                value={filters.objectId}
                onChange={(event) => updateFilter("objectId", event.target.value)}
                placeholder="Valgfritt"
              />
            </label>

            <label>
              <span>Valør</span>
              <input
                value={filters.denomination}
                onChange={(event) => updateFilter("denomination", event.target.value)}
                placeholder="1 krone, 100 kroner ..."
              />
            </label>

            <label>
              <span>År</span>
              <input
                value={filters.year}
                onChange={(event) => updateFilter("year", event.target.value)}
                placeholder="1917"
              />
            </label>

            <label>
              <span>Regent / konge</span>
              <input
                value={filters.ruler}
                onChange={(event) => updateFilter("ruler", event.target.value)}
                placeholder="Haakon VII"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Auksjon / samler</legend>

            <label className={styles.checkLine}>
              <input
                type="checkbox"
                checked={filters.auction}
                onChange={(event) => updateFilter("auction", event.target.checked)}
              />
              <span>Kun auksjonsobjekter</span>
            </label>

            <label className={styles.checkLine}>
              <input
                type="checkbox"
                checked={filters.shop}
                onChange={(event) => updateFilter("shop", event.target.checked)}
              />
              <span>Kun nettbutikkobjekter</span>
            </label>

            <div className={styles.buttonRow}>
              <button type="submit">Oppdater test</button>
              <button type="button" onClick={resetFilters}>
                Nullstill
              </button>
            </div>
          </fieldset>
        </form>

        <div className={styles.switchPanel}>
          <div>
            <span>Segment</span>
            <div className={styles.buttonRow}>
              {SEGMENTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-active={segment === option.value}
                  onClick={() => setSegment(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span>Visningskort</span>
            <div className={styles.buttonRow}>
              {VIEWS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-active={view === option.value}
                  onClick={() => setView(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.queryBox}>
            <span>API query</span>
            <code>{query}</code>
          </div>
        </div>
      </section>

      <section className={styles.resultsHeader}>
        <div>
          <p className={styles.kicker}>Resultat</p>
          <h2>Test av CatalogObjectCard</h2>
        </div>

        <strong>{isLoading ? "Henter" : `${objects.length} treff`}</strong>
      </section>

      {isLoading ? (
        <section className={styles.emptyState}>Henter innhold fra katalog-API ...</section>
      ) : objects.length === 0 ? (
        <section className={styles.emptyState}>
          <strong>Ingen objekter returnert.</strong>
          <span>
            Testen bruker API. Det vises ikke hardkodet demo-data hvis backend ikke returnerer objekter.
          </span>
        </section>
      ) : (
        <section className={styles.results} data-view={view}>
          {objects.map((object) => (
            <CollectiumCatalogObjectCard
              key={`${object.source_key}-${object.object_group}-${object.object_id}`}
              object={object}
              segment={segment}
              view={view}
            />
          ))}
        </section>
      )}
    </main>
  );
}
