"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI 8.5 v36 React preview page
 *
 * Definering / formål:
 * Referanseimplementasjon av kompakt v36-visningskort i Next.js/React.
 * Viser riktig komponentstruktur, theme-switch og dynamisk Samler/Historie/Finans-felt.
 *
 * Bruksområde:
 * app/page.tsx som lokal/preview-side før komponentene løftes ut i /components/object.
 *
 * Berørte sider / routes:
 * - /
 * - fremtidig /katalog
 * - fremtidig /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.object.open
 * - object.relations.view
 * - collection.item.add
 * - collection.wishlist.toggle
 * - collection.favorite.toggle
 *
 * Berørte API-ruter:
 * - Fremtidig GET /api/catalog/object
 * - Fremtidig POST /api/collection/wishlist/toggle
 * - Fremtidig POST /api/collection/favorite/toggle
 * - Fremtidig POST /api/collection/item/add
 *
 * Berørte tabeller / views:
 * - Fremtidig ct_v_catalog_objects_resolved
 * - Fremtidig ct_user_object_states
 * - Fremtidig ct_collection_items
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI.
 * Denne filen bruker eksempeldata bare for UI-kontrakt. Produksjon skal hente data fra API.
 *
 * Logging:
 * log_category: catalog/object/collection når systemhandlinger kobles.
 *
 * Versjon:
 * CT-UI85-V36-PAGE-0001 / CHANGE-UI85-V36-0001
 */

import { useMemo, useState } from "react";
import { CollectiumTheme, useTheme } from "./providers/theme-provider";

type ObjectSegment = "samler" | "historie" | "finans";

const themes: { key: CollectiumTheme; label: string }[] = [
  { key: "collectium", label: "Collectium" },
  { key: "samler", label: "Samler" },
  { key: "museum", label: "Museum" },
  { key: "finans", label: "Finans" },
];

const segments: { key: ObjectSegment; label: string }[] = [
  { key: "samler", label: "Samler" },
  { key: "historie", label: "Historie" },
  { key: "finans", label: "Finans" },
];

const objectKey = {
  sourceKey: "norske_sedler",
  objectGroup: "banknote",
  objectId: "1459",
};

function objectHref(segment: ObjectSegment) {
  return `/objekt/${objectKey.sourceKey}/${objectKey.objectGroup}/${objectKey.objectId}?segment=${segment}&from=katalog&view=horizontal`;
}

export default function Page() {
  const { theme, setTheme } = useTheme();
  const [segment, setSegment] = useState<ObjectSegment>("historie");
  const href = useMemo(() => objectHref(segment), [segment]);

  return (
    <main className="ct-page">
      <nav className="ct-toolbar" aria-label="Tema">
        <span className="ct-toolbar-label">Tema</span>
        {themes.map((item) => (
          <button
            className="ct-theme-button"
            data-active={theme === item.key}
            key={item.key}
            type="button"
            onClick={() => setTheme(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="ct-hero collectium-card">
        <div className="ct-kicker">Collectium · UI 8.5 · v36</div>
        <h1 className="ct-title">React / Next.js-standard med én samlet tokenfil.</h1>
        <p className="ct-copy">
          Denne siden viser v36 som Next.js/React-struktur. Alle fire temaer bruker samme
          komponentstruktur og samme tokennavn via <code>html[data-theme]</code>. Produksjonsdata skal
          komme fra API/backend, ikke hardkodes i React.
        </p>
      </section>

      <section className="ct-object-card-wrap" aria-label="Collectium v36 visningskort">
        <div className="ct-segment-tabs" aria-label="Aktive visningsfelt">
          {segments.map((item) => (
            <button
              className="ct-segment-tab"
              data-active={segment === item.key}
              key={item.key}
              type="button"
              onClick={() => setSegment(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <article className="ct-object-card collectium-card">
          <div className="ct-main-stack">
            <section className="ct-object-top">
              <div className="ct-note-image" aria-label="Objektbilde">
                <div className="ct-note-fallback">
                  <div className="ct-note-value">100</div>
                  <div className="ct-note-seal" />
                  <div className="ct-note-line" />
                  <div className="ct-note-serial">
                    <span>NORGES BANK · OSCAR II</span>
                    <span>A 045 921</span>
                  </div>
                </div>
              </div>

              <div className="ct-object-info">
                <div className="ct-object-badge">Norge · Seddel · Norske sedler · Standardutgave</div>
                <h2 className="ct-object-title">100 kroner · 1877</h2>

                <div className="ct-meta-grid">
                  <div className="ct-meta-item">
                    <div className="ct-meta-icon">◇</div>
                    <div>
                      <div className="ct-meta-label">Valørutgave</div>
                      <div className="ct-meta-value">100 kroner</div>
                    </div>
                  </div>

                  <div className="ct-meta-item">
                    <div className="ct-meta-icon">▣</div>
                    <div>
                      <div className="ct-meta-label">Utgave</div>
                      <div className="ct-meta-value">1. utgave</div>
                    </div>
                  </div>

                  <div className="ct-meta-item">
                    <div className="ct-meta-icon">▱</div>
                    <div>
                      <div className="ct-meta-label">Variant</div>
                      <div className="ct-meta-value">Standardutgave</div>
                    </div>
                  </div>

                  <div className="ct-meta-item">
                    <div className="ct-meta-icon">♢</div>
                    <div>
                      <div className="ct-meta-label">Sjeldenhet</div>
                      <div className="ct-meta-value">Sjelden</div>
                    </div>
                  </div>
                </div>

                <div className="ct-relation-line">Seddel · Norske sedler · Oscar II · NS 1459</div>
              </div>
            </section>

            <section className="ct-dynamic-panel collectium-card" aria-label="Dynamisk segmentfelt">
              <SegmentPanel active={segment === "samler"} href={href} segment="samler" />
              <SegmentPanel active={segment === "historie"} href={href} segment="historie" />
              <SegmentPanel active={segment === "finans"} href={href} segment="finans" />
            </section>
          </div>

          <aside className="ct-status-col" aria-label="Objektstatus">
            <StatusCard icon="♡" title="Hjerte" subtitle="Ønskeliste" value="0" />
            <StatusCard icon="★" title="Stjerne" subtitle="Favoritt" value="0" />
            <StatusCard icon="⚖" title="Auksjon" subtitle="Aktive treff" value="3" />
            <StatusCard icon="⌂" title="Nettbutikk" subtitle="Aktive salg" value="1" />
            <div className="ct-price-card">
              <div>
                <div className="ct-price-label">Estimert pris</div>
                <div className="ct-price-value">15 000 kr</div>
                <div className="ct-price-foot">✓ Vurdert</div>
              </div>
            </div>
          </aside>
        </article>
      </section>

      <section className="ct-contract-note collectium-card">
        <h2>Oppdatert konklusjon</h2>
        <p>
          Bruk én samlet tokenfil: <code>app/styles/themes.css</code>. Bruk én komponent-CSS-fil:
          <code> app/styles/collectium-ui85-v36.css</code>. Ikke splitt temaene i separate CSS-filer nå.
          ThemeProvider styrer <code>data-theme</code> og <code>data-skin</code>, mens React-komponentene
          beholder samme markup i alle temaer.
        </p>
      </section>
    </main>
  );
}

function SegmentPanel({
  active,
  href,
  segment,
}: {
  active: boolean;
  href: string;
  segment: ObjectSegment;
}) {
  const config = {
    samler: {
      icon: "♡",
      title: "Samler",
      rows: [
        ["Min status", "Ikke i samling"],
        ["Ønskeliste", "Kan legges til"],
        ["Kvalitet", "45 XF"],
        ["Sjeldenhet", "Sjelden"],
        ["Deling", "Tidslenke tilgjengelig"],
        ["Notat", "Brukerens egne handlinger og status."],
      ],
      actions: ["⊕ Legg i samling", "♡ Ønskeliste", "↗ Del objekt"],
    },
    historie: {
      icon: "▥",
      title: "Historie",
      rows: [
        ["Regent / konge", "Oscar II"],
        ["Motiv / person", "Riksvåpen"],
        ["Periode", "1872–1905"],
        ["Historisk kontekst", "Unionstid, norsk seddelhistorie"],
        ["Signatur", "Winge / Getz"],
        ["Kort forklaring", "Objektet kobles til regent, signatur og motiv/person som relasjoner."],
      ],
      actions: ["↗ Åpne objekt", "⤳ Se relasjon", "⊕ Legg i samling"],
    },
    finans: {
      icon: "↗",
      title: "Finans",
      rows: [
        ["Estimert verdi", "15 000 kr"],
        ["Trend 12 mnd", "+ 4,2 %"],
        ["Likviditet", "Moderat"],
        ["Auksjoner i år", "3"],
        ["Sist solgt", "19 200 kr · sept 2025"],
        ["Kontekst", "Kobles mot historisk økonomi og markedsindeks."],
      ],
      actions: ["↗ Se trend", "⚖ Sammenlign", "⊕ Legg i samling"],
    },
  }[segment];

  return (
    <div className="ct-segment-panel" data-active={active} aria-hidden={!active}>
      <div className="ct-panel-head">
        <div className="ct-panel-icon">{config.icon}</div>
        <h3 className="ct-panel-title">
          {config.title} <span>· dynamisk felt</span>
        </h3>
      </div>

      <div className="ct-dynamic-grid">
        {config.rows.map(([label, value]) => (
          <div className="ct-info-line" key={label}>
            <div className="ct-info-label">{label}</div>
            <div className="ct-info-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="ct-actions">
        <a className="ct-action-btn" data-variant="view" href={href}>
          Visning
        </a>
        {config.actions.map((action) => (
          <button className="ct-action-btn" key={action} type="button">
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  subtitle,
  value,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <button className="ct-status-card" type="button">
      <span className="ct-status-icon">{icon}</span>
      <span className="ct-status-name">
        {title}
        <small>{subtitle}</small>
      </span>
      <span className="ct-status-count">{value}</span>
    </button>
  );
}
