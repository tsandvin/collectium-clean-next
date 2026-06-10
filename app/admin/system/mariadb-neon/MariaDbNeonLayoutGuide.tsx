"use client";

import { useState } from "react";
import styles from "./MariaDbNeonLayoutGuide.module.css";

type ScreenMode = "mobile" | "tablet" | "desktop" | "wide" | "tv";

const screenText: Record<ScreenMode, { title: string; range: string; shortText: string; rules: string[] }> = {
  mobile: {
    title: "Mobil",
    range: "0-719px",
    shortText:
      "Mobil bruker toppbar som hovedkontroll. Sidemeny skjules som egen kolonne og erstattes av mobilmeny. Filter, varsler, designvalg og søk åpnes kompakt.",
    rules: [
      "01 Sidemeny: skjules som fast venstremeny og åpnes via menyknapp.",
      "02 Toppmeny: skal inneholde meny, søk, varsler/aktiviteter, design og filter.",
      "03 Faner: vises som chips eller kompakt horisontal tab-rad.",
      "04 Indrefelt: én kolonne. Ingen brede tabeller direkte i body.",
      "05 Tabeller/matriser: skal ha egen scroll inne i felt/panel.",
      "06 Handlinger: store trykkflater og korte tekster."
    ]
  },
  tablet: {
    title: "Tablet",
    range: "720-1100px",
    shortText:
      "Tablet er mellommodus. Filter og sidevalg løftes over innholdet, og indrefelt kan gå fra én til to kolonner.",
    rules: [
      "01 Sidemeny: kompakt eller skjult bak menyknapp.",
      "02 Toppmeny: behold søk, brukerstatus og viktigste handlinger synlig.",
      "03 Faner: kan ligge i to linjer hvis det er mange faner.",
      "04 Indrefelt: 1-2 kolonner. Statuskort kan ligge side om side.",
      "05 Tabeller: intern scroll, ikke presse hele siden bred.",
      "06 Filter: åpnes over resultatfelt eller som overlay."
    ]
  },
  desktop: {
    title: "Desktop",
    range: "1101-1899px",
    shortText:
      "Desktop er normal Collectium-visning. Global AppShell har venstre sidemeny, toppmeny, hero/overskrift, faner og ett hovedinnholdsområde.",
    rules: [
      "01 Sidemeny: fast venstre meny, ca. 220-260px.",
      "02 Toppmeny: søk, bruker, snarveier og status ligger globalt.",
      "03 Overskriftsfelt: sideforklaring, status og Layout / DB URL-knapp.",
      "04 Faner: normal tab-rad under statuskort/hero.",
      "05 Indrefelt: dashboardkort, kontrollpanel og matriser ligger i PageContent.",
      "06 DB-felt: source_key, object_group, source_role og API-ruter vises i egne felt."
    ]
  },
  wide: {
    title: "Bredskjerm",
    range: "1900px+",
    shortText:
      "Bredskjerm er workspace-modus. Siden kan deles i sideveis arbeidsbaner slik at kontroll, matrise, relasjoner og detaljer kan vises samtidig.",
    rules: [
      "01 Sidemeny: kan være smalere, men fortsatt fast.",
      "02 Toppmeny: global, men må ikke bruke unødig høyde.",
      "03 Workspace lanes: bruk baner på ca. 900-1100px per arbeidsområde.",
      "04 Eksempel lanes: filter/kontroll, overføringsmatrise, relasjoner, logg.",
      "05 Faner: kan styre hvilke lanes som vises eller låses.",
      "06 Scroll: horisontal scroll skal ligge i workspace, ikke på hele siden."
    ]
  },
  tv: {
    title: "TV / presentasjon",
    range: "2900px+",
    shortText:
      "TV er presentasjonsmodus, ikke vanlig workspace. Den skal vise færre aktive felt, større typografi og tydelig status på avstand.",
    rules: [
      "01 Sidemeny: minimal eller skjult.",
      "02 Toppmeny: forenklet, bare status og hovedvalg.",
      "03 Faner: færre valg, større knapper og mer avstand.",
      "04 Indrefelt: store statusfelt og færre detaljer samtidig.",
      "05 Tabeller: bør oppsummeres, ikke vise alle små kolonner.",
      "06 Grense: 2900px+ betyr presentasjon, ikke mer detaljstøy."
    ]
  }
};

const detailCards = [
  {
    number: "01",
    name: "Sidemeny",
    react: "AppShell / Sidebar",
    field: "global_navigation",
    db: "Meny skal senere styres fra side-/menyregister, ikke hardkodes per side.",
    api: "/api/system/db-overview og senere /api/navigation/menu",
    layout: "Desktop: fast venstre. Mobil: mobilmeny/topplinje."
  },
  {
    number: "02",
    name: "Toppmeny / søk / bruker",
    react: "Topbar / Search / UserMenu",
    field: "topbar_search_user",
    db: "Søk og brukerstatus skal gå via API, ikke direkte database fra React.",
    api: "/api/auth/session, /api/filter/master, /api/catalog/* senere",
    layout: "Global toppbar på alle sider."
  },
  {
    number: "03",
    name: "Overskriftsfelt",
    react: "PageHeader / HeroPanel",
    field: "page_title_status",
    db: "Viser sidekrav, status og kontrollnivå for aktuell side.",
    api: "/api/system/platform-standard-check",
    layout: "Skal ligge øverst i PageFrame."
  },
  {
    number: "04",
    name: "Faner / tabs / arkivlag",
    react: "Tabs / TabList / TabPanel",
    field: "active_tab",
    db: "Faner skal senere kunne styres av side-/feature-kontroll.",
    api: "Sidekontroll + feature/action-route-register",
    layout: "Tab-rad under hero/statusfelt. Mobil: chips."
  },
  {
    number: "05",
    name: "Fire felt",
    react: "GridFour / StatCards",
    field: "four_metric_fields",
    db: "Brukes til MariaDB, Neon, Plattform og Template tokens.",
    api: "/api/system/db-overview, /api/system/schema-inventory",
    layout: "4 bokser desktop, 2+2 tablet, 1 kolonne mobil."
  },
  {
    number: "06",
    name: "Tre felt",
    react: "GridThree / ControlCards",
    field: "three_control_fields",
    db: "Brukes til status, neste kontroller og kontrollregel.",
    api: "/api/system/*-check",
    layout: "3 bokser desktop, 1 kolonne på mindre skjerm."
  },
  {
    number: "07",
    name: "To felt",
    react: "GridTwo / SplitPanel",
    field: "two_panel_split",
    db: "Brukes når to kontrollområder skal sammenlignes.",
    api: "/api/system/mariadb-neon-transfer-matrix",
    layout: "2 bokser desktop/tablet, 1 kolonne mobil."
  },
  {
    number: "08",
    name: "Lang venstre + liten høyre",
    react: "WideMainAside",
    field: "main_wide_aside_small",
    db: "Brukes når matrise eller rapport er hovedfelt og status er sidefelt.",
    api: "/api/system/source-relation-overview",
    layout: "70/30 eller 75/25-fordeling."
  },
  {
    number: "09",
    name: "Liten venstre + lang høyre",
    react: "AsideMainWide",
    field: "aside_small_main_wide",
    db: "Brukes når filter eller kontrollvalg styrer stort resultatfelt.",
    api: "/api/filter/master, /api/catalog/control-data",
    layout: "25/75 eller 30/70-fordeling."
  },
  {
    number: "10",
    name: "Workspace lanes",
    react: "WorkspaceLanes",
    field: "wide_workspace_lanes",
    db: "Brukes for bredskjerm med flere aktive arbeidsbaner.",
    api: "Kontroll-, relasjons-, filter- og matrise-API",
    layout: "1900px+: 900-1100px lanes. 2900px+: TV/presentasjon."
  }
];

export default function MariaDbNeonLayoutGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("desktop");

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
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <button className={styles.backdrop} type="button" onClick={() => setIsOpen(false)} aria-label="Lukk" />

          <section className={styles.modal}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Collectium layout-control</p>
                <h2>Layout / DB URL</h2>
                <p>
                  Dette laget definerer standard feltstruktur for React / Next.js, navn på felt/bokser,
                  DB/API-regler og hvordan sidemeny, toppmeny, faner, kontrollfelt og workspace skal oppføre seg.
                </p>
              </div>

              <button className={styles.closeButton} type="button" onClick={() => setIsOpen(false)}>
                Lukk
              </button>
            </header>

            <section className={styles.blockSection}>
              <div className={styles.sectionHeader}>
                <span>00</span>
                <div>
                  <h3>Systemlayout med nummererte felt</h3>
                  <p>
                    Diagrammet viser sidemeny, toppmeny og standard kombinasjoner: 4 felt, 3 felt,
                    2 felt, lang venstre/liten høyre, liten venstre/lang høyre og bredskjerm/workspace.
                  </p>
                </div>
              </div>

              <div className={styles.layoutDiagram}>
                <aside className={styles.diagramSide}>
                  <strong>01</strong>
                  <h4>Sidemeny</h4>
                  <p>Global AppShell</p>
                  <small>AppShell / Sidebar</small>
                </aside>

                <div className={styles.diagramRows}>
                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>02</strong>
                      <span>Toppmeny / søk / bruker</span>
                    </div>
                    <div className={styles.rowFields}>
                      <i><b>02</b><span>Topbar</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>03</strong>
                      <span>Overskriftsfelt</span>
                    </div>
                    <div className={styles.rowFields}>
                      <i><b>03</b><span>PageHeader / HeroPanel</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>04</strong>
                      <span>Faner / tabs / arkivlag</span>
                    </div>
                    <div className={styles.rowFields}>
                      <i><b>04</b><span>Tabs / TabPanel</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>05</strong>
                      <span>Fire felt</span>
                    </div>
                    <div className={styles.rowFieldsFour}>
                      <i><b>05A</b><span>MariaDB</span></i>
                      <i><b>05B</b><span>Neon</span></i>
                      <i><b>05C</b><span>Plattform</span></i>
                      <i><b>05D</b><span>Template</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>06</strong>
                      <span>Tre felt</span>
                    </div>
                    <div className={styles.rowFieldsThree}>
                      <i><b>06A</b><span>Status</span></i>
                      <i><b>06B</b><span>Neste kontroll</span></i>
                      <i><b>06C</b><span>Regel</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>07</strong>
                      <span>To felt</span>
                    </div>
                    <div className={styles.rowFieldsTwo}>
                      <i><b>07A</b><span>Venstre panel</span></i>
                      <i><b>07B</b><span>Høyre panel</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>08</strong>
                      <span>Lang venstre + liten høyre</span>
                    </div>
                    <div className={styles.rowFieldsLongLeft}>
                      <i><b>08A</b><span>Hovedmatrise / rapport</span></i>
                      <i><b>08B</b><span>Status</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>09</strong>
                      <span>Liten venstre + lang høyre</span>
                    </div>
                    <div className={styles.rowFieldsLongRight}>
                      <i><b>09A</b><span>Filter</span></i>
                      <i><b>09B</b><span>Resultat / detaljer</span></i>
                    </div>
                  </div>

                  <div className={styles.diagramRow}>
                    <div className={styles.rowLabel}>
                      <strong>10</strong>
                      <span>Bredskjerm / workspace lanes</span>
                    </div>
                    <div className={styles.rowFields}>
                      <i><b>10</b><span>1900px+ lanes · 2900px+ TV/presentasjon</span></i>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.screenSection}>
              <h3>Skjermvisning</h3>
              <p>
                Bytt forklaringsvisning for å se hva som skjer med sidemeny, toppmeny, filter,
                faner, indrefelt, tabeller og workspace.
              </p>

              <div className={styles.screenButtons}>
                {(["mobile", "tablet", "desktop", "wide", "tv"] as ScreenMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={screenMode === mode ? styles.activeScreen : ""}
                    onClick={() => setScreenMode(mode)}
                  >
                    {screenText[mode].title}
                  </button>
                ))}
              </div>

              <article className={styles.screenExplanation}>
                <strong>{screenText[screenMode].title}</strong>
                <span>{screenText[screenMode].range}</span>
                <p>{screenText[screenMode].shortText}</p>
                <ul>
                  {screenText[screenMode].rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className={styles.viewportRules}>
              <h3>Skjermstørrelse-brytere og layoutregler</h3>
              <div className={styles.viewportGrid}>
                {Object.entries(screenText).map(([key, item]) => (
                  <article key={key}>
                    <strong>{item.title}</strong>
                    <span>{item.range}</span>
                    <p>{item.shortText}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.guideList}>
              {detailCards.map((card) => (
                <article className={styles.guideCard} key={card.number}>
                  <div className={styles.guideCardTop}>
                    <span className={styles.number}>{card.number}</span>
                    <span className={styles.statusBadge}>INFO</span>
                  </div>

                  <h3>{card.name}</h3>
                  <p className={styles.area}>{card.react}</p>

                  <dl>
                    <dt>Felt / boksnavn</dt>
                    <dd>{card.field}</dd>
                    <dt>DB / URL-regel</dt>
                    <dd>{card.db}</dd>
                    <dt>API-regel</dt>
                    <dd>{card.api}</dd>
                    <dt>Layoutregel</dt>
                    <dd>{card.layout}</dd>
                  </dl>
                </article>
              ))}
            </section>
          </section>
        </div>
      ) : null}
    </>
  );
}
