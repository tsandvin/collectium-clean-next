/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Objektpresentasjonsside
 *
 * Definering / formål:
 * Viser full presentasjon av ett hovedobjekt fra hovedkatalogen.
 *
 * Bruksområde:
 * Åpnes via Objekt info fra katalog, visningskort, samling, ønskeliste,
 * favoritter, auksjon, nettbutikk, forhandlerobjekt eller relaterte objektlister.
 *
 * Berørte sider / routes:
 * - /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 *
 * Berørte API-ruter:
 * - GET /api/object/presentation
 * - GET /api/object/relations
 * - GET /api/object/market
 * - GET /api/object/user-state
 *
 * Berørte tabeller / views:
 * - ct_v_object_presentation_resolved
 * - ct_v_object_relations_resolved
 * - ct_v_object_market_resolved
 * - ct_v_object_user_state_resolved
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 */

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageParams = {
  sourceKey: string;
  objectGroup: string;
  objectId: string;
};

type ApiObject = Record<string, unknown>;

type PresentationResponse = {
  ok: boolean;
  found?: boolean;
  row?: ApiObject | null;
  error?: string;
};

type RelationsResponse = {
  ok: boolean;
  count?: number;
  rows?: ApiObject[];
  error?: string;
};

type MarketResponse = {
  ok: boolean;
  found?: boolean;
  row?: ApiObject | null;
  fallback_status_no?: string | null;
  error?: string;
};

type UserStateResponse = {
  ok: boolean;
  requires_user_id?: boolean;
  found?: boolean;
  row?: ApiObject | null;
  fallback_status_no?: string | null;
  error?: string;
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "https://app.collectium.no";
}

function text(value: unknown, fallback = "Ikke registrert") {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function href(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function getObjectData(params: PageParams) {
  const baseUrl = await getBaseUrl();

  const query = new URLSearchParams({
    source_key: params.sourceKey,
    object_group: params.objectGroup,
    object_id: params.objectId,
  });

  const [presentation, relations, market, userState] = await Promise.all([
    fetchJson<PresentationResponse>(`${baseUrl}/api/object/presentation?${query.toString()}`),
    fetchJson<RelationsResponse>(`${baseUrl}/api/object/relations?${query.toString()}`),
    fetchJson<MarketResponse>(`${baseUrl}/api/object/market?${query.toString()}`),
    fetchJson<UserStateResponse>(`${baseUrl}/api/object/user-state?${query.toString()}`),
  ]);

  return {
    presentation,
    relations,
    market,
    userState,
  };
}

function Field({
  label,
  value,
  relationHref,
}: {
  label: string;
  value: unknown;
  relationHref?: unknown;
}) {
  const relation = href(relationHref);

  return (
    <div className="ct-object-field">
      <span className="ct-object-field-label">{label}</span>
      {relation ? (
        <Link className="ct-object-field-link" href={relation}>
          {text(value)}
        </Link>
      ) : (
        <strong>{text(value)}</strong>
      )}
    </div>
  );
}

function RelationList({ rows }: { rows: ApiObject[] }) {
  if (!rows.length) {
    return <p>Ingen relasjoner registrert.</p>;
  }

  return (
    <div className="ct-object-relation-list">
      {rows.map((row, index) => {
        const relationHref = href(row.relation_href);
        const label = text(row.relation_label_no);
        const type = text(row.relation_type, "relasjon");

        return (
          <div className="ct-object-relation-item" key={`${type}-${label}-${index}`}>
            <span>{type}</span>
            {relationHref ? (
              <Link href={relationHref}>{label}</Link>
            ) : (
              <strong>{label}</strong>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function ObjectPresentationPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const { presentation, relations, market, userState } = await getObjectData(resolvedParams);

  if (!presentation?.ok || !presentation.row) {
    notFound();
  }

  const object = presentation.row;
  const relationRows = relations?.ok ? relations.rows ?? [] : [];
  const marketRow = market?.ok ? market.row ?? null : null;

  const title = text(object.title_no, "Objekt uten tittel");
  const marketStatus =
    text(marketRow?.market_value_status_no, text(market?.fallback_status_no, "Mangler markedsverdi"));

  const userStatus =
    userState?.fallback_status_no ||
    (userState?.found ? "Brukerstatus funnet." : "Logg inn for å legge objektet i samling, ønskeliste eller favoritter.");

  return (
    <main className="ct-object-page">
      <section className="ct-object-hero">
        <div className="ct-object-hero-image">
          <div className="ct-object-image-placeholder">
            {text(object.presentation_image_path || object.image_path, "Bilde ikke registrert")}
          </div>
        </div>

        <div className="ct-object-hero-content">
          <p className="ct-object-kicker">Objekt info</p>
          <h1>{title}</h1>
          <p>
            {text(object.source_catalog_number, "Uten katalognummer")} ·{" "}
            {text(object.source_key)} / {text(object.object_group)} / {text(object.object_id)}
          </p>

          <div className="ct-object-actions">
            <Link href="/katalog">Til katalog</Link>
            <Link href={`/relasjon/kilde/${resolvedParams.sourceKey.replaceAll("_", "-")}`}>
              Se kilde
            </Link>
          </div>
        </div>
      </section>

      <section className="ct-object-segments" aria-label="Objektsegmenter">
        <span>Samler</span>
        <span>Historie</span>
        <span>Finans</span>
        <span>Relasjoner</span>
      </section>

      <section className="ct-object-layout">
        <article className="ct-object-panel">
          <h2>Identitet</h2>

          <div className="ct-object-grid">
            <Field label="Valør / objektbetegnelse" value={object.denomination_raw_no} />
            <Field label="Årstall" value={object.object_year_label} />
            <Field label="Publiseringsår" value={object.publication_year_label} />
            <Field label="Valørutgave / serie" value={object.denomination_issue_raw_no} />
            <Field label="Variant / type" value={object.variant_type_raw_no} />
            <Field label="Signatur / personer" value={object.signature_raw_no} />
            <Field label="Konge / regent" value={object.ruler_name_raw_no || object.alias_ruler_name_raw_no} />
            <Field label="Historisk periode" value={object.historical_period_label_no} />
            <Field label="Materiale" value={object.material_raw_no} />
            <Field label="Sjeldenhet" value={object.rarity_raw_no} />
          </div>
        </article>

        <aside className="ct-object-panel">
          <h2>Marked og brukerstatus</h2>
          <div className="ct-object-grid">
            <Field label="Markedsstatus" value={marketStatus} />
            <Field label="Markedsverdi" value={marketRow?.market_value_raw_no || object.market_value_raw_no || "Mangler markedsverdi"} />
            <Field label="Trend" value={marketRow?.trend_raw_no || object.trend_raw_no} />
            <Field label="Auksjon" value={marketRow?.auction_status_raw_no || object.auction_status_raw_no} />
            <Field label="Nettbutikk" value={marketRow?.shop_status_raw_no || object.shop_status_raw_no} />
            <Field label="Samlerstatus" value={userStatus} />
          </div>
        </aside>
      </section>

      <section className="ct-object-panel">
        <h2>Relasjoner</h2>
        <RelationList rows={relationRows} />
      </section>
    </main>
  );
}