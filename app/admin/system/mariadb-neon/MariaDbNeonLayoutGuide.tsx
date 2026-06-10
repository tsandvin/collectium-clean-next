"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * MariaDB - Neon Postgres layout guide overlay
 *
 * Definering / formål:
 * - Viser et forklaringslag for hvilken API/DB-url og datakontrakt som hører til
 *   sidemeny, toppmeny, indrefelt, spesifiserte felt, faner og skjermmoduser.
 *
 * Bruksområde:
 * - Bryter/overlay på MariaDB - Neon Postgres Control.
 *
 * Berørte sider / routes:
 * - /admin/system/mariadb-neon
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.mariadb_neon.layout_guide.view
 * - admin.system.mariadb_neon.control.view
 *
 * Berørte API-ruter:
 * - GET /api/system/db-overview
 * - GET /api/system/schema-inventory
 * - GET /api/system/mariadb-neon-bootstrap
 * - GET /api/system/mariadb-neon-transfer-matrix
 * - GET /api/system/neon-relation-db-tree
 * - GET /api/system/source-relation-overview
 *
 * Berørte tabeller / views:
 * - ct_migration_table_map
 * - ct_migration_field_map
 * - ct_namespace_registry
 * - ct_v_namespace_naming_check
 * - ct_entity_geography_registry
 * - ct_relation_type_registry
 * - ct_relation_path_registry
 *
 * Dataretning:
 * MariaDB read-only + Neon Postgres → API/backend → Next.js → React → UI
 *
 * Viktig:
 * - Komponenten viser forklaring.
 * - Komponenten skriver ikke data.
 * - Komponenten viser ikke hemmelige environment values.
 */

import { useState } from "react";
import styles from "./MariaDbNeonLayoutGuide.module.css";

type GuideItem = {
  number: string;
  title: string;
  area: string;
  dbUrlRule: string;
  apiRule: string;
  layoutRule: string;
  status: "INFO" | "OK" | "VARSEL";
};

const guideItems: GuideItem[] = [
  {
    number: "01",
    title: "Sidemeny",
    area: "Global navigasjon / AppShell",
    dbUrlRule: "Skal ikke lese katalogdata direkte. Meny skal senere komme fra DB/menu- eller sidekontroll.",
    apiRule: "Aktuell kontroll: /api/system/db-overview og side-/feature-kontroll.",
    layoutRule: "Desktop: venstre sidemeny. Mobil: sidemeny erstattes av mobilmeny/topplinje.",
    status: "INFO"
  },
  {
    number: "02",
    title: "Toppmeny",
    area: "Søk, brukerinngang, start/katalog/min side",
    dbUrlRule: "Søk og brukerstatus skal gå via API. Ikke direkte database fra React.",
    apiRule: "Aktuelle API: /api/auth/session, /api/filter/master, /api/catalog/* senere.",
    layoutRule: "Skal være global topbar. På mobil skal søk, meny, varsler/aktiviteter og filter være kompakt.",
    status: "INFO"
  },
  {
    number: "03",
    title: "Indrefelt",
    area: "Dashboardkort, statuskort og kontrollpanel",
    dbUrlRule: "MariaDB brukes som read-only kontrollarkiv. Neon Postgres brukes som staging/ny kontrollbase.",
    apiRule: "/api/system/db-overview, /api/system/schema-inventory, /api/system/mariadb-neon-bootstrap.",
    layoutRule: "Indrefelt skal ligge i PageFrame og ikke lage eget skall, sidebar eller topbar.",
    status: "OK"
  },
  {
    number: "04",
    title: "Spesifiserte felt",
    area: "Tabeller, radstatus, source_role, source_key og object_group",
    dbUrlRule: "Katalogdata skal identifiseres med source_key + object_group + object_id. Filter med source_key + object_group + filter_field + filter_value.",
    apiRule: "/api/system/mariadb-neon-transfer-matrix og /api/system/neon-relation-db-tree.",
    layoutRule: "Felt skal ha tydelig statusmarkering: OK, VARSEL, MANGLER, INFO.",
    status: "OK"
  },
  {
    number: "05",
    title: "Faner / tabs",
    area: "Dashboard, oversikt, struktur, kilder, relasjoner, API, JSON",
    dbUrlRule: "Hver fane skal vise hvilken API/DB-kontrakt den bruker.",
    apiRule: "Faneinnhold skal ha eksplisitt route/API, ikke skjult lokal logikk.",
    layoutRule: "Tabs skal være arkiv-/kontrollfaner. På bredskjerm kan faner og resultater ligge sideveis.",
    status: "VARSEL"
  },
  {
    number: "06",
    title: "Bredskjerm / workspace",
    area: "Sideveis arbeidsflate",
    dbUrlRule: "Samme API-kontrakt brukes. Bare visningslayout endres.",
    apiRule: "Ingen egen bredskjerm-API. Data skal komme fra samme kontrollruter.",
    layoutRule: "1900px+: workspace-lanes. Ca. 1000px per innholdsbane. 2900px+: TV/presentasjon er egen modus.",
    status: "INFO"
  }
];

function getStatusClass(status: GuideItem["status"]) {
  if (status === "OK") return styles.ok;
  if (status === "VARSEL") return styles.warning;
  return styles.info;
}

export default function MariaDbNeonLayoutGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [screenMode, setScreenMode] = useState<"mobile" | "tablet" | "desktop" | "wide" | "tv">("desktop");

  return (
    <>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen(true)}
        aria-label="Åpne layout og DB URL forklaring"
      >
        Layout / DB URL
      </button>

      {isOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Layout og DB URL forklaring">
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />

          <section className={styles.modal}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>MariaDB - Neon Postgres Control</p>
                <h2>Layoutforklaring / DB URL-regler</h2>
                <p>
                  Dette laget forklarer hvor data/API brukes i sidemeny, toppmeny,
                  indrefelt, spesifiserte felt, faner og skjermmoduser. Det viser ikke
                  hemmelige environment values.
                </p>
              </div>

              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>
                Lukk ×
              </button>
            </header>

            <div className={styles.diagram}>
              <aside className={styles.sideMenu}>
                <span>Sidemeny</span>
                <small>Global AppShell</small>
                <strong>01</strong>
              </aside>

              <main className={styles.screen}>
                <div className={styles.topbar}>
                  <span>Toppmeny / søk / bruker</span>
                  <strong>02</strong>
                </div>

                <div className={styles.tabs}>
                  <span>Faner / tabs / arkivlag</span>
                  <strong>05</strong>
                </div>

                <div className={styles.innerGrid}>
                  <div className={styles.innerPanel}>
                    <strong>03</strong>
                    <span>Indrefelt</span>
                    <small>Dashboardkort / kontrollpanel</small>
                  </div>

                  <div className={styles.innerPanel}>
                    <strong>04</strong>
                    <span>Spesifiserte felt</span>
                    <small>source_key / object_group / source_role</small>
                  </div>

                  <div className={styles.widePanel}>
                    <strong>06</strong>
                    <span>Bredskjerm / workspace lanes</span>
                    <small>1900px+ sideveis arbeidsflate · 2900px+ TV/presentasjon</small>
                  </div>
                </div>
              </main>
            </div>

                        <section className={styles.screenModeSwitches}>
              <div>
                <h3>Skjermvisning</h3>
                <p>Bytt forklaringsvisning for å se hvordan innholdsfelt, faner og arbeidsflate skal oppføre seg.</p>
              </div>

              <div className={styles.screenButtons}>
                <button type="button" className={screenMode === "mobile" ? styles.activeScreen : ""} onClick={() => setScreenMode("mobile")}>Mobil</button>
                <button type="button" className={screenMode === "tablet" ? styles.activeScreen : ""} onClick={() => setScreenMode("tablet")}>Tablet</button>
                <button type="button" className={screenMode === "desktop" ? styles.activeScreen : ""} onClick={() => setScreenMode("desktop")}>Desktop</button>
                <button type="button" className={screenMode === "wide" ? styles.activeScreen : ""} onClick={() => setScreenMode("wide")}>Bredskjerm</button>
                <button type="button" className={screenMode === "tv" ? styles.activeScreen : ""} onClick={() => setScreenMode("tv")}>TV</button>
              </div>

              <article className={styles.screenExplanation}>
                {screenMode === "mobile" ? (
                  <p><strong>Mobil:</strong> toppbar er hovedmeny, filter åpnes som overlay, innholdsfelt går i én kolonne, faner vises som chips.</p>
                ) : null}

                {screenMode === "tablet" ? (
                  <p><strong>Tablet:</strong> filter og sidevalg løftes over innhold. Indrefelt bruker 1–2 kolonner uten horisontal body-scroll.</p>
                ) : null}

                {screenMode === "desktop" ? (
                  <p><strong>Desktop:</strong> sidemeny ca. 240px, toppmeny fast over innhold, én hovedarbeidsflate og tydelige panelrammer.</p>
                ) : null}

                {screenMode === "wide" ? (
                  <p><strong>Bredskjerm:</strong> innhold deles i sideveis arbeidsbaner. Faner, filter, tabeller, relasjoner og detaljpaneler kan ligge ved siden av hverandre.</p>
                ) : null}

                {screenMode === "tv" ? (
                  <p><strong>TV/presentasjon:</strong> større typografi, færre aktive arbeidsbaner og mer presentasjonsrettet visning. Dette er ikke det samme som bredskjerm-workspace.</p>
                ) : null}
              </article>
            </section>
            <section className={styles.viewportRules}>
              <h3>Skjermstørrelse-brytere og layoutregler</h3>

              <div className={styles.viewportGrid}>
                <article>
                  <strong>Mobil</strong>
                  <span>0–719px</span>
                  <p>Sticky toppbar, overlay-filter, én kolonne, mobilmeny.</p>
                </article>
                <article>
                  <strong>Tablet</strong>
                  <span>720–1100px</span>
                  <p>Filter og sidevalg løftes over innhold. 1–2 kolonner.</p>
                </article>
                <article>
                  <strong>Desktop</strong>
                  <span>1101–1899px</span>
                  <p>Normal Collectium: sidemeny ca. 240px + hovedinnhold.</p>
                </article>
                <article>
                  <strong>Bredskjerm</strong>
                  <span>1900px+</span>
                  <p>Sideveis arbeidsflate med ca. 1000px innholdsbaner.</p>
                </article>
                <article>
                  <strong>TV / presentasjon</strong>
                  <span>2900px+</span>
                  <p>Større typografi og færre aktive baner. Ikke samme som workspace.</p>
                </article>
              </div>
            </section>

            <section className={styles.guideList}>
              {guideItems.map((item) => (
                <article className={styles.guideCard} key={item.number}>
                  <div className={styles.guideCardTop}>
                    <span className={styles.number}>{item.number}</span>
                    <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3>{item.title}</h3>
                  <p className={styles.area}>{item.area}</p>

                  <dl>
                    <dt>DB / URL-regel</dt>
                    <dd>{item.dbUrlRule}</dd>

                    <dt>API-regel</dt>
                    <dd>{item.apiRule}</dd>

                    <dt>Layoutregel</dt>
                    <dd>{item.layoutRule}</dd>
                  </dl>
                </article>
              ))}
            </section>

            <footer className={styles.footer}>
              <strong>Låst prinsipp:</strong>
              <span>
                Synlig layout kan endres av responsivitet og workspace, men API/DB-kontraktene
                skal være stabile og kontrollert av MariaDB - Neon Postgres Control.
              </span>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}


