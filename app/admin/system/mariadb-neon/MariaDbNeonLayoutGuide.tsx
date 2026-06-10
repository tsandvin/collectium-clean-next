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
      "02 Toppmeny: inneholder meny, søk, varsler/aktiviteter, design og filter.",
      "03 Overskriftsfelt: komprimeres til tittel, status og viktigste handling.",
      "04 Faner: vises som chips eller kompakt horisontal tab-rad.",
      "05-09 Feltgrupper: én kolonne, ingen brede tabeller direkte i body.",
      "10 Workspace: deaktivert som sideveis arbeidsflate på mobil."
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
      "03 Overskriftsfelt: vises over faner og felt.",
      "04 Faner: kan ligge i to linjer hvis det er mange faner.",
      "05 Fire felt: blir 2 + 2.",
      "06-09 Splitfelt: går til 1 eller 2 kolonner etter bredde."
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
      "05-09 Feltgrupper: følger valgte gridmønstre.",
      "10 Workspace: ikke aktiv som sideveis lane-modus før 1900px+."
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
      "03-04 Header og faner: styrer hvilke lanes som vises.",
      "05-09 Feltgrupper: kan plasseres i egne arbeidsbaner.",
      "10 Workspace lanes: bruk baner på ca. 900-1100px.",
      "Scroll: horisontal scroll skal ligge i workspace, ikke på hele body."
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
      "03 Overskriftsfelt: større tittel og status.",
      "04 Faner: færre valg, større knapper og mer avstand.",
      "05-09 Feltgrupper: vis bare de viktigste.",
      "10 TV-modus: presentasjon, ikke detaljstøy."
    ]
  }
};


const screenCalculator: Record<ScreenMode, {
  activeLabel: string;
  widthRange: string;
  standardRule: string;
  fieldRule: string;
  workspaceRule: string;
  visualMode: string;
}> = {
  mobile: {
    activeLabel: "Mobilvisning",
    widthRange: "0-719px",
    standardRule: "Desktop-standarden er ikke aktiv. Siden bruker mobil toppbar og én kolonne.",
    fieldRule: "Alle felt brytes til én kolonne. Tabeller og matriser må scrolle inne i eget panel.",
    workspaceRule: "Workspace lanes er deaktivert.",
    visualMode: "Kompakt kontrollflate"
  },
  tablet: {
    activeLabel: "Tabletvisning",
    widthRange: "720-1100px",
    standardRule: "Desktop-standarden er ikke aktiv. Tablet bruker mellomlayout.",
    fieldRule: "Fire felt blir normalt 2 + 2. Tre felt kan bli 1 + 1 + 1 eller 2 + 1.",
    workspaceRule: "Workspace lanes er deaktivert.",
    visualMode: "Mellomflate"
  },
  desktop: {
    activeLabel: "Desktop standard",
    widthRange: "1101-1899px",
    standardRule: "Dette er standard desktop-visning. Sidebredden stopper bredskjerm-funksjon her.",
    fieldRule: "Felt vises etter standard: 4 felt, 3 felt, 2 felt, lang/liten og liten/lang inne i én normal arbeidsflate.",
    workspaceRule: "Ingen sideveis workspace lanes. Horisontal scroll skal bare finnes i tabeller/paneler.",
    visualMode: "Normal Collectium-side"
  },
  wide: {
    activeLabel: "Bredskjerm / workspace",
    widthRange: "1900px+",
    standardRule: "Desktop-standarden overstyres. Bredskjerm-funksjon aktiveres.",
    fieldRule: "Felt kan fordeles i arbeidsbaner: kontroll/filter, matrise, detaljer, relasjoner og logg.",
    workspaceRule: "Workspace lanes brukes. Hver lane bør være ca. 900-1100px.",
    visualMode: "Sideveis arbeidsflate"
  },
  tv: {
    activeLabel: "TV / presentasjon",
    widthRange: "2900px+",
    standardRule: "Bredskjerm workspace overstyres av presentasjonsmodus.",
    fieldRule: "Færre felt vises samtidig. Viktigste status og hovedtall prioriteres.",
    workspaceRule: "Ikke vis alle lanes. TV skal være lesbar på avstand med større typografi.",
    visualMode: "Presentasjonsflate"
  }
};

const fieldRegister = [
  { nr: "01", name: "Sidemeny", react: "AppShell / Sidebar", field: "global_navigation", role: "Global navigasjon", db: "Menyregister / sidekontroll senere", responsive: "Desktop fast venstre. Mobil skjult bak meny." },
  { nr: "02", name: "Toppmeny / søk / bruker", react: "Topbar / Search / UserMenu", field: "topbar_search_user", role: "Global toppkontroll", db: "Auth/session + søk via API", responsive: "Alltid øverst. Mobil kompakt." },
  { nr: "03", name: "Overskriftsfelt", react: "PageHeader / HeroPanel", field: "page_title_status", role: "Sideidentitet og status", db: "Sidekrav / kontrollstatus", responsive: "Forkortes på mobil." },
  { nr: "04", name: "Faner / tabs / arkivlag", react: "Tabs / TabPanel", field: "active_tab", role: "Arkivlag / seksjonsvalg", db: "Feature/page-control senere", responsive: "Desktop tab-rad. Mobil chips." },
  { nr: "05A", name: "MariaDB", react: "StatCard", field: "mariadb_status", role: "Read-only kontrollarkiv", db: "MariaDB tables/views/columns", responsive: "Del av firefeltsrad." },
  { nr: "05B", name: "Neon", react: "StatCard", field: "neon_status", role: "Ny staging/kontrollbase", db: "Neon tables/views/columns", responsive: "Del av firefeltsrad." },
  { nr: "05C", name: "Plattform", react: "StatCard", field: "platform_status", role: "DB 8.4 / API / brytere", db: "Platform standard checks", responsive: "Del av firefeltsrad." },
  { nr: "05D", name: "Template", react: "StatCard", field: "template_token_status", role: "Template/skin/layout-status", db: "Template token check", responsive: "Del av firefeltsrad." },
  { nr: "06A", name: "Status", react: "ControlCard", field: "control_status", role: "Viser OK/varsel/blokkert", db: "System check API", responsive: "Del av trefeltsrad." },
  { nr: "06B", name: "Neste kontroll", react: "ControlCard", field: "next_control", role: "Neste kontrollsteg", db: "Route/check registry", responsive: "Del av trefeltsrad." },
  { nr: "06C", name: "Regel", react: "ControlCard", field: "control_rule", role: "Forklarer regel/tiltak", db: "DB 8.4 / sidekrav", responsive: "Del av trefeltsrad." },
  { nr: "07A", name: "Venstre panel", react: "SplitPanelLeft", field: "left_panel", role: "Sammenligning/filter/kontroll", db: "Valgfri kontrollkilde", responsive: "2 felt desktop, 1 kolonne mobil." },
  { nr: "07B", name: "Høyre panel", react: "SplitPanelRight", field: "right_panel", role: "Sammenligning/resultat", db: "Valgfri kontrollkilde", responsive: "2 felt desktop, 1 kolonne mobil." },
  { nr: "08A", name: "Hovedmatrise / rapport", react: "WideMain", field: "main_wide_panel", role: "Primært stort innhold", db: "Transfer matrix / rapport", responsive: "Lang venstre." },
  { nr: "08B", name: "Status", react: "AsideSmall", field: "aside_status", role: "Kort status/tiltak", db: "Status API", responsive: "Liten høyre." },
  { nr: "09A", name: "Filter", react: "AsideSmall", field: "aside_filter", role: "Valg/filter/kontroll", db: "Filter master API", responsive: "Liten venstre." },
  { nr: "09B", name: "Resultat / detaljer", react: "WideResult", field: "main_result_panel", role: "Stort resultatfelt", db: "Catalog/control-data API", responsive: "Lang høyre." },
  { nr: "10", name: "Bredskjerm / workspace lanes", react: "WorkspaceLanes", field: "wide_workspace_lanes", role: "Sideveis arbeidsflate", db: "Kontroll-, filter-, relasjons- og matrise-API", responsive: "1900px+ lanes. 2900px+ TV." }
];

export default function MariaDbNeonLayoutGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("desktop");

  return (
    <>
      <button type="button" className={styles.toggleButton} onClick={() => setIsOpen(true)}>
        Layout / DB URL
      </button>

      {isOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <button className={styles.backdrop} type="button" onClick={() => setIsOpen(false)} aria-label="Lukk" />

          <section className={styles.modal}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Collectium layout-control</p>
                <h2>Vis Layout / DB URL</h2>
                <p>
                  Feltregisteret under gir nummer og navn til alle layoutfelt. Radfargene viser responsiv sortering:
                  global struktur først, deretter firefelt, trefelt, tofelt, asymmetrisk split og workspace.
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
                  <h3>Systemlayout med radfarger, nummer og feltnavn</h3>
                  <p>Hver rad har egen farge for å vise responsiv rekkefølge og sortering.</p>
                </div>
              </div>

                            <div className={styles.screenCalculator}>
                <div className={styles.calculatorHeader}>
                  <div>
                    <strong>Skjermkalkulator</strong>
                    <span>Aktiv regel for valgt skjermfunksjon</span>
                  </div>
                  <em>{screenCalculator[screenMode].widthRange}</em>
                </div>

                <div className={styles.calculatorGrid}>
                  <article>
                    <span>Aktiv visning</span>
                    <strong>{screenCalculator[screenMode].activeLabel}</strong>
                    <small>{screenCalculator[screenMode].visualMode}</small>
                  </article>

                  <article>
                    <span>Standardgrense</span>
                    <strong>Desktop stopper ved 1899px</strong>
                    <small>1101-1899px er normal feltvisning.</small>
                  </article>

                  <article>
                    <span>Feltregel</span>
                    <strong>{screenCalculator[screenMode].fieldRule}</strong>
                  </article>

                  <article>
                    <span>Workspace-regel</span>
                    <strong>{screenCalculator[screenMode].workspaceRule}</strong>
                  </article>
                </div>

                <p className={styles.calculatorNote}>
                  {screenCalculator[screenMode].standardRule}
                </p>
              </div>

              <div className={styles.layoutDiagram}>
                <aside className={styles.diagramSide}>
                  <strong>01</strong>
                  <h4>Sidemeny</h4>
                  <p>Global AppShell</p>
                  <small>React: AppShell / Sidebar</small>
                </aside>

                <div className={styles.diagramRows}>
                  <div className={`${styles.diagramRow} ${styles.rowTopbar}`}>
                    <div className={styles.rowLabel}><strong>02</strong><span>Toppmeny / søk / bruker</span></div>
                    <div className={styles.rowFields}><i><b>02</b><span>Topbar</span></i></div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowHeader}`}>
                    <div className={styles.rowLabel}><strong>03</strong><span>Overskriftsfelt</span></div>
                    <div className={styles.rowFields}><i><b>03</b><span>PageHeader / HeroPanel</span></i></div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowTabs}`}>
                    <div className={styles.rowLabel}><strong>04</strong><span>Faner / tabs / arkivlag</span></div>
                    <div className={styles.rowFields}><i><b>04</b><span>Tabs / TabPanel</span></i></div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowFour}`}>
                    <div className={styles.rowLabel}><strong>05</strong><span>Fire felt</span></div>
                    <div className={styles.rowFieldsFour}>
                      <i><b>05A</b><span>MariaDB</span></i>
                      <i><b>05B</b><span>Neon</span></i>
                      <i><b>05C</b><span>Plattform</span></i>
                      <i><b>05D</b><span>Template</span></i>
                    </div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowThree}`}>
                    <div className={styles.rowLabel}><strong>06</strong><span>Tre felt</span></div>
                    <div className={styles.rowFieldsThree}>
                      <i><b>06A</b><span>Status</span></i>
                      <i><b>06B</b><span>Neste kontroll</span></i>
                      <i><b>06C</b><span>Regel</span></i>
                    </div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowTwo}`}>
                    <div className={styles.rowLabel}><strong>07</strong><span>To felt</span></div>
                    <div className={styles.rowFieldsTwo}>
                      <i><b>07A</b><span>Venstre panel</span></i>
                      <i><b>07B</b><span>Høyre panel</span></i>
                    </div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowLongLeft}`}>
                    <div className={styles.rowLabel}><strong>08</strong><span>Lang venstre + liten høyre</span></div>
                    <div className={styles.rowFieldsLongLeft}>
                      <i><b>08A</b><span>Hovedmatrise / rapport</span></i>
                      <i><b>08B</b><span>Status</span></i>
                    </div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowLongRight}`}>
                    <div className={styles.rowLabel}><strong>09</strong><span>Liten venstre + lang høyre</span></div>
                    <div className={styles.rowFieldsLongRight}>
                      <i><b>09A</b><span>Filter</span></i>
                      <i><b>09B</b><span>Resultat / detaljer</span></i>
                    </div>
                  </div>

                  <div className={`${styles.diagramRow} ${styles.rowWorkspace}`}>
                    <div className={styles.rowLabel}><strong>10</strong><span>Bredskjerm / workspace lanes</span></div>
                    <div className={styles.rowFields}><i><b>10</b><span>1900px+ lanes · 2900px+ TV/presentasjon</span></i></div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.screenSection}>
              <h3>Skjermvisning</h3>
              <p>Bytt forklaringsvisning for å se hvordan radene sorteres og brytes på ulike skjermstørrelser.</p>

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

            <section className={styles.fieldRegister}>
              <h3>Feltregister: nummer, navn og funksjon</h3>
              <div className={styles.fieldTable}>
                <div className={styles.fieldTableHead}>
                  <span>Nr.</span>
                  <span>Navn</span>
                  <span>React / Next.js</span>
                  <span>Felt / DB/API-rolle</span>
                  <span>Responsiv regel</span>
                </div>

                {fieldRegister.map((item) => (
                  <div className={styles.fieldTableRow} key={item.nr}>
                    <span>{item.nr}</span>
                    <span>{item.name}</span>
                    <span>{item.react}</span>
                    <span><b>{item.field}</b><small>{item.role} · {item.db}</small></span>
                    <span>{item.responsive}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      ) : null}
    </>
  );
}


