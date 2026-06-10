"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./MariaDbNeonLayoutGuide.module.css";

type ScreenMode = "mobile" | "tablet" | "desktop" | "wide" | "tv";

type LayoutField = {
  nr: string;
  name: string;
  react: string;
  field: string;
  role: string;
  laneMobile: string;
  laneTablet: string;
  laneDesktop: string;
  laneWide: string;
  laneTv: string;
};

const screenModes: Array<{ key: ScreenMode; label: string }> = [
  { key: "mobile", label: "Mobil" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
  { key: "wide", label: "Bredskjerm" },
  { key: "tv", label: "TV / presentasjon" },
];

const screenText: Record<
  ScreenMode,
  {
    title: string;
    range: string;
    lanes: string;
    contentCap: string;
    selectedRule: string;
    diagramRule: string;
    laneRule: string;
    fieldSort: string;
  }
> = {
  mobile: {
    title: "Mobil",
    range: "0-719px",
    lanes: "1 lane",
    contentCap: "Ingen desktop-cap. Alt brytes til mobil.",
    selectedRule: "Mobil bruker toppbar som hovedkontroll. Sidemeny skjules, filter åpnes som overlay, og alle felt går i én kolonne.",
    diagramRule: "01-10 sorteres vertikalt. Alle underfelt 05A-09B vises som én kolonne.",
    laneRule: "Workspace lanes er av.",
    fieldSort: "Én kolonne"
  },
  tablet: {
    title: "Tablet",
    range: "720-1100px",
    lanes: "1-2 lanes",
    contentCap: "Mellomvisning før desktop-standard.",
    selectedRule: "Tablet løfter filter og sidevalg over innholdet. Felt kan bruke 1-2 kolonner.",
    diagramRule: "05 fire felt blir 2 + 2. 06 tre felt kan bli 2 + 1. 07-09 kan være 1 eller 2 kolonner.",
    laneRule: "Workspace lanes er av, men siden kan dele felt i to kolonner.",
    fieldSort: "1-2 kolonner"
  },
  desktop: {
    title: "Desktop standard",
    range: "1101-1899px",
    lanes: "1 hovedlane",
    contentCap: "Dette er normal feltbredde. Innholdet skal ikke strekkes større bare fordi skjermen er større.",
    selectedRule: "Desktop viser normal Collectium-side innen desktop cap. Selv om faktisk skjerm er 2422px, skal desktop-innhold ikke strekkes bredere enn 1101-1899px.",
    diagramRule: "05 vises som 4 felt, 06 som 3 felt, 07 som 2 felt, 08/09 som asymmetriske splitfelt.",
    laneRule: "Ingen workspace lanes. Horisontal scroll skal ligge i tabeller/paneler, ikke i hele siden.",
    fieldSort: "Normal side"
  },
  wide: {
    title: "Bredskjerm / workspace",
    range: "1900px+",
    lanes: "2 lanes ved ca. 2400px",
    contentCap: "Desktop cap beholdes som lesbar modul. Ekstra bredde brukes til flere arbeidsflater.",
    selectedRule: "Bredskjerm betyr at ekstra bredde brukes til flere lanes. Ett felt skal ikke strekkes uendelig; skjermen deles i sidemeny ca. 200-300px + lane 1 ca. 1000px + lane 2 ca. 1000px.",
    diagramRule: "Faner/tabs kan vises som egne sider/lanes. Katalogresultat, objektpresentasjon og relasjon kan ligge ved siden av kontrollfelt.",
    laneRule: "Eksempel 2400px / 27 tommer: lane 1 = sidemeny + toppmeny + kontroll/filter. lane 2 = tabside, søkeresultat, objektpresentasjon eller relasjon.",
    fieldSort: "2 workspace lanes"
  },
  tv: {
    title: "TV / presentasjon",
    range: "2900px+",
    lanes: "2-3 presentasjonslanes",
    contentCap: "Presentasjonsmodus overstyrer vanlig workspace.",
    selectedRule: "TV skal vise færre felt, større tekst og tydelig status. Ikke vis alle små kontrollfelt samtidig.",
    diagramRule: "01-04 forenkles. 05-09 bør oppsummeres. 10 brukes som presentasjonsflate, ikke detaljflate.",
    laneRule: "Færre aktive lanes. Større typografi. Mer luft.",
    fieldSort: "Presentasjon"
  }
};

const fieldRegister: LayoutField[] = [
  {
    nr: "01",
    name: "Sidemeny",
    react: "AppShell / Sidebar",
    field: "global_navigation",
    role: "Global navigasjon",
    laneMobile: "Mobilmeny",
    laneTablet: "Kompakt meny",
    laneDesktop: "Lane 1: global side",
    laneWide: "Lane 1: global kontroll",
    laneTv: "Skjult/minimal"
  },
  {
    nr: "02",
    name: "Toppmeny / søk / bruker",
    react: "Topbar / Search / UserMenu",
    field: "topbar_search_user",
    role: "Global toppkontroll",
    laneMobile: "Lane 1: topp",
    laneTablet: "Lane 1: topp",
    laneDesktop: "Lane 1: global side",
    laneWide: "Lane 1: global kontroll",
    laneTv: "Lane 1: status/topp"
  },
  {
    nr: "03",
    name: "Overskriftsfelt",
    react: "PageHeader / HeroPanel",
    field: "page_title_status",
    role: "Sideidentitet og status",
    laneMobile: "Lane 1: topp",
    laneTablet: "Lane 1: topp",
    laneDesktop: "Lane 1: global side",
    laneWide: "Lane 1: global kontroll",
    laneTv: "Lane 1: hovedstatus"
  },
  {
    nr: "04",
    name: "Faner / tabs / arkivlag",
    react: "Tabs / TabPanel",
    field: "active_tab",
    role: "Arkivlag / seksjonsvalg",
    laneMobile: "Lane 1: chips",
    laneTablet: "Lane 1: tabs",
    laneDesktop: "Lane 1: tabs",
    laneWide: "Lane 1 eller lane 2: egne tab-sider",
    laneTv: "Forenklet valg"
  },
  {
    nr: "05A",
    name: "MariaDB",
    react: "StatCard",
    field: "mariadb_status",
    role: "Read-only kontrollarkiv",
    laneMobile: "Lane 1: status",
    laneTablet: "Lane 1: status",
    laneDesktop: "Lane 1: firefelt",
    laneWide: "Lane 1: kontrollkort",
    laneTv: "Oppsummering"
  },
  {
    nr: "05B",
    name: "Neon",
    react: "StatCard",
    field: "neon_status",
    role: "Ny staging/kontrollbase",
    laneMobile: "Lane 1: status",
    laneTablet: "Lane 1: status",
    laneDesktop: "Lane 1: firefelt",
    laneWide: "Lane 1: kontrollkort",
    laneTv: "Oppsummering"
  },
  {
    nr: "05C",
    name: "Plattform",
    react: "StatCard",
    field: "platform_status",
    role: "DB 8.4 / API / brytere",
    laneMobile: "Lane 1: status",
    laneTablet: "Lane 1: status",
    laneDesktop: "Lane 1: firefelt",
    laneWide: "Lane 1: kontrollkort",
    laneTv: "Oppsummering"
  },
  {
    nr: "05D",
    name: "Template",
    react: "StatCard",
    field: "template_token_status",
    role: "Template/skin/layout-status",
    laneMobile: "Lane 1: status",
    laneTablet: "Lane 1: status",
    laneDesktop: "Lane 1: firefelt",
    laneWide: "Lane 1: kontrollkort",
    laneTv: "Oppsummering"
  },
  {
    nr: "06A",
    name: "Status",
    react: "ControlCard",
    field: "control_status",
    role: "Viser OK/varsel/blokkert",
    laneMobile: "Lane 1: kontroll",
    laneTablet: "Lane 1: kontroll",
    laneDesktop: "Lane 1: trefelt",
    laneWide: "Lane 1: kontroll",
    laneTv: "Lane 1: hovedstatus"
  },
  {
    nr: "06B",
    name: "Neste kontroll",
    react: "ControlCard",
    field: "next_control",
    role: "Neste kontrollsteg",
    laneMobile: "Lane 1: kontroll",
    laneTablet: "Lane 1: kontroll",
    laneDesktop: "Lane 1: trefelt",
    laneWide: "Lane 1: kontroll",
    laneTv: "Skjult eller kort"
  },
  {
    nr: "06C",
    name: "Regel",
    react: "ControlCard",
    field: "control_rule",
    role: "Forklarer regel/tiltak",
    laneMobile: "Lane 1: kontroll",
    laneTablet: "Lane 1: kontroll",
    laneDesktop: "Lane 1: trefelt",
    laneWide: "Lane 1: kontroll",
    laneTv: "Skjult eller kort"
  },
  {
    nr: "07A",
    name: "Venstre panel",
    react: "SplitPanelLeft",
    field: "left_panel",
    role: "Sammenligning/filter/kontroll",
    laneMobile: "Lane 1",
    laneTablet: "Lane 1",
    laneDesktop: "Lane 1: split",
    laneWide: "Lane 1: kontroll/filter",
    laneTv: "Skjult"
  },
  {
    nr: "07B",
    name: "Høyre panel",
    react: "SplitPanelRight",
    field: "right_panel",
    role: "Sammenligning/resultat",
    laneMobile: "Lane 1",
    laneTablet: "Lane 1 eller 2",
    laneDesktop: "Lane 1: split",
    laneWide: "Lane 2: resultat",
    laneTv: "Lane 2: hovedvisning"
  },
  {
    nr: "08A",
    name: "Hovedmatrise / rapport",
    react: "WideMain",
    field: "main_wide_panel",
    role: "Primært stort innhold",
    laneMobile: "Lane 1",
    laneTablet: "Lane 1",
    laneDesktop: "Lane 1: lang venstre",
    laneWide: "Lane 2: hovedmatrise/rapport",
    laneTv: "Lane 2: hovedrapport"
  },
  {
    nr: "08B",
    name: "Status",
    react: "AsideSmall",
    field: "aside_status",
    role: "Kort status/tiltak",
    laneMobile: "Lane 1",
    laneTablet: "Lane 1",
    laneDesktop: "Lane 1: liten høyre",
    laneWide: "Lane 1 eller 3: status",
    laneTv: "Lane 1: status"
  },
  {
    nr: "09A",
    name: "Filter",
    react: "AsideSmall",
    field: "aside_filter",
    role: "Valg/filter/kontroll",
    laneMobile: "Overlay",
    laneTablet: "Over innhold",
    laneDesktop: "Lane 1: liten venstre",
    laneWide: "Lane 1: filter/kontroll",
    laneTv: "Skjult"
  },
  {
    nr: "09B",
    name: "Resultat / detaljer",
    react: "WideResult",
    field: "main_result_panel",
    role: "Stort resultatfelt",
    laneMobile: "Lane 1",
    laneTablet: "Lane 1",
    laneDesktop: "Lane 1: lang høyre",
    laneWide: "Lane 2: resultat/objekt/relasjon",
    laneTv: "Lane 2: hovedvisning"
  },
  {
    nr: "10",
    name: "Bredskjerm / workspace lanes",
    react: "WorkspaceLanes",
    field: "wide_workspace_lanes",
    role: "Sideveis arbeidsflate",
    laneMobile: "Av",
    laneTablet: "Av",
    laneDesktop: "Av",
    laneWide: "2 lanes: global kontroll + innhold",
    laneTv: "2-3 presentasjonslanes"
  }
];

function getLaneValue(field: LayoutField, mode: ScreenMode) {
  if (mode === "mobile") return field.laneMobile;
  if (mode === "tablet") return field.laneTablet;
  if (mode === "wide") return field.laneWide;
  if (mode === "tv") return field.laneTv;
  return field.laneDesktop;
}

function getLaneGroups(mode: ScreenMode) {
  if (mode === "wide") {
    return [
      {
        title: "Lane 1 · global kontroll",
        text: "Sidemeny, toppmeny, overskrift, faner, filter og kontrollstatus.",
        fields: ["01", "02", "03", "04", "05A", "05B", "05C", "05D", "06A", "06B", "06C", "07A", "08B", "09A"]
      },
      {
        title: "Lane 2 · innhold / resultat",
        text: "Tabside, søkeresultat, overføringsmatrise, objektpresentasjon eller relasjonspresentasjon.",
        fields: ["07B", "08A", "09B", "10"]
      }
    ];
  }

  if (mode === "tv") {
    return [
      {
        title: "Lane 1 · presentasjonsstatus",
        text: "Topp, hovedstatus og forenklede valg.",
        fields: ["02", "03", "06A", "08B"]
      },
      {
        title: "Lane 2 · hovedvisning",
        text: "Rapport, objektpresentasjon, relasjon eller hovedresultat.",
        fields: ["07B", "08A", "09B", "10"]
      },
      {
        title: "Lane 3 · valgfri støtte",
        text: "Ekstra relasjoner/logg hvis skjermen er svært bred.",
        fields: ["04", "05A", "05B", "05C", "05D"]
      }
    ];
  }

  if (mode === "tablet") {
    return [
      {
        title: "Lane 1 · tablet topp/kontroll",
        text: "Toppmeny, overskrift, faner og status.",
        fields: ["01", "02", "03", "04", "05A", "05B", "05C", "05D", "06A", "06B", "06C"]
      },
      {
        title: "Lane 2 · tablet innhold",
        text: "Resultatfelt, splitpanel og større innhold.",
        fields: ["07A", "07B", "08A", "08B", "09A", "09B"]
      }
    ];
  }

  return [
    {
      title: mode === "mobile" ? "Lane 1 · mobilflyt" : "Lane 1 · desktop standard",
      text: mode === "mobile"
        ? "Alt sorteres vertikalt i én mobilflyt."
        : "Alt ligger i én normal desktop-side innen 1101-1899px.",
      fields: fieldRegister.map((field) => field.nr)
    }
  ];
}

export default function MariaDbNeonLayoutGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [screenMode, setScreenMode] = useState<ScreenMode>("desktop");
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [laneOnePercent, setLaneOnePercent] = useState<number>(50);

  useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  const actualViewportLabel = useMemo(() => {
    if (viewportWidth < 720) return "Mobil";
    if (viewportWidth < 1101) return "Tablet";
    if (viewportWidth < 1900) return "Desktop standard";
    if (viewportWidth < 2900) return "Bredskjerm mulig";
    return "TV / presentasjon mulig";
  }, [viewportWidth]);

  
  const laneSizing = useMemo(() => {
    const sideMenuWidth = 260;
    const desktopMaxWidth = 1899;
    const desktopMinWidth = 1101;
    const availableWorkspace = Math.max(0, viewportWidth - sideMenuWidth);
    const canUseTwoLanes = viewportWidth >= 2200;
    const laneAreaWidth = canUseTwoLanes ? availableWorkspace : Math.min(viewportWidth, desktopMaxWidth);
    const laneOneWidth = canUseTwoLanes ? Math.round(laneAreaWidth * (laneOnePercent / 100)) : Math.min(laneAreaWidth, desktopMaxWidth);
    const laneTwoWidth = canUseTwoLanes ? Math.max(0, laneAreaWidth - laneOneWidth) : 0;

    return {
      sideMenuWidth,
      desktopMinWidth,
      desktopMaxWidth,
      availableWorkspace,
      canUseTwoLanes,
      laneAreaWidth,
      laneOneWidth,
      laneTwoWidth,
    };
  }, [viewportWidth, laneOnePercent]);

  const modeClass = useMemo(() => {
    if (screenMode === "mobile") return styles.modeMobile;
    if (screenMode === "tablet") return styles.modeTablet;
    if (screenMode === "wide") return styles.modeWide;
    if (screenMode === "tv") return styles.modeTv;
    return styles.modeDesktop;
  }, [screenMode]);

  const laneGroups = useMemo(() => getLaneGroups(screenMode), [screenMode]);

  return (
    <>
      <button type="button" className={styles.toggleButton} onClick={() => setIsOpen(true)}>
        Vis Layout / DB URL
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
                  Velg skjermmodus. Feltlisten, lane-fordelingen og diagrammet endrer seg etter aktiv organisering.
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
                  <h3>Systemlayout med lane-justerte felt</h3>
                  <p>01-10 og 05A-09B flyttes mellom lanes etter valgt skjermmodus.</p>
                </div>
              </div>

              <div className={styles.modeSwitchPanel}>
                <div>
                  <strong>Velg skjermfunksjon</strong>
                  <span>Dette endrer både kalkulator, lane-fordeling og feltregister.</span>
                </div>

                <div className={styles.screenButtons}>
                  {screenModes.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      className={screenMode === mode.key ? styles.activeScreen : ""}
                      onClick={() => setScreenMode(mode.key)}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actualScreenSizeBox}>
                <div className={styles.actualScreenHeader}>
                  <div>
                    <strong>Aktuell skjermstørrelse</strong>
                    <span>Faktisk nettleserbredde og valgt skjermfunksjon.</span>
                  </div>
                  <em>{viewportWidth > 0 ? `${viewportWidth}px` : "Måles ..."}</em>
                </div>

                <div className={styles.screenRuleGrid}>
                  <article>
                    <span>Faktisk skjerm</span>
                    <strong>{actualViewportLabel}</strong>
                    <small>Basert på nettleserbredde.</small>
                  </article>

                  <article>
                    <span>Valgt modus</span>
                    <strong>{screenText[screenMode].title}</strong>
                    <small>{screenText[screenMode].range}</small>
                  </article>

                  <article>
                    <span>Antall lanes</span>
                    <strong>{screenText[screenMode].lanes}</strong>
                    <small>{screenText[screenMode].fieldSort}</small>
                  </article>

                  <article>
                    <span>Desktop cap</span>
                    <strong>1101-1899px</strong>
                    <small>Innhold strekkes ikke uendelig.</small>
                  </article>
                </div>

                <div className={styles.modeExplanation}>
                  <strong>{screenText[screenMode].selectedRule}</strong>
                  <p>{screenText[screenMode].diagramRule}</p>
                  <p>{screenText[screenMode].laneRule}</p>
                
                <div className={styles.resizableLaneCalculator}>
                  <div className={styles.laneCalcHeader}>
                    <div>
                      <strong>Lane-kalkulator</strong>
                      <span>Desktop cap beholdes. Bredskjerm bruker ekstra bredde til flere arbeidsflater.</span>
                    </div>
                    <em>{laneSizing.canUseTwoLanes ? "2 lanes mulig" : "1 desktopflate"}</em>
                  </div>

                  <div className={styles.laneCalcGrid}>
                    <article>
                      <span>Sidemeny</span>
                      <strong>{laneSizing.sideMenuWidth}px</strong>
                      <small>Normal bredde ca. 200-300px.</small>
                    </article>

                    <article>
                      <span>Desktop cap</span>
                      <strong>{laneSizing.desktopMinWidth}-{laneSizing.desktopMaxWidth}px</strong>
                      <small>Desktop-innhold strekkes ikke over dette.</small>
                    </article>

                    <article>
                      <span>Lane 1</span>
                      <strong>{laneSizing.laneOneWidth}px</strong>
                      <small>Kontroll, filter, faner eller global side.</small>
                    </article>

                    <article>
                      <span>Lane 2</span>
                      <strong>{laneSizing.laneTwoWidth > 0 ? `${laneSizing.laneTwoWidth}px` : "Ikke aktiv"}</strong>
                      <small>Resultat, objektpresentasjon, relasjon eller tabside.</small>
                    </article>
                  </div>

                  <div className={styles.laneResizeControl}>
                    <label htmlFor="laneSplitRange">
                      Juster skjermkant mellom Lane 1 og Lane 2
                      <span>{laneOnePercent}% / {100 - laneOnePercent}%</span>
                    </label>
                    <input
                      id="laneSplitRange"
                      type="range"
                      min="35"
                      max="65"
                      step="5"
                      value={laneOnePercent}
                      onChange={(event) => setLaneOnePercent(Number(event.target.value))}
                      disabled={!laneSizing.canUseTwoLanes}
                    />
                    <small>
                      Aktiv når faktisk skjermbredde gir plass til sidemeny + to arbeidsflater. På ca. 2500px kan dette gi ca.
                      260px sidemeny + to felt rundt 1000px.
                    </small>
                  </div>

                  <div className={styles.resizableLanePreview}>
                    <div className={styles.previewSide} style={{ width: `${Math.min(18, Math.max(10, (laneSizing.sideMenuWidth / Math.max(viewportWidth, 1)) * 100))}%` }}>
                      <strong>Sidemeny</strong>
                      <span>200-300px</span>
                    </div>
                    <div className={styles.previewLaneOne} style={{ flex: laneSizing.canUseTwoLanes ? laneOnePercent : 100 }}>
                      <strong>Lane 1</strong>
                      <span>{laneSizing.canUseTwoLanes ? "Kontroll / filter / faner" : "Desktop cap 1101-1899px"}</span>
                    </div>
                    <div className={styles.previewDivider} />
                    <div className={styles.previewLaneTwo} style={{ flex: laneSizing.canUseTwoLanes ? 100 - laneOnePercent : 0 }}>
                      <strong>Lane 2</strong>
                      <span>{laneSizing.canUseTwoLanes ? "Resultat / objekt / relasjon" : "Ikke aktiv"}</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className={`${styles.layoutDiagram} ${modeClass}`}>
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

              <section className={styles.laneMap}>
                <h3>Lane-fordeling for valgt modus</h3>
                <div className={styles.laneGrid}>
                  {laneGroups.map((lane) => (
                    <article key={lane.title}>
                      <h4>{lane.title}</h4>
                      <p>{lane.text}</p>
                      <div>
                        {lane.fields.map((nr) => (
                          <span key={nr}>{nr}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <section className={styles.fieldRegister}>
              <h3>Feltregister: nummer, navn, funksjon og aktiv lane</h3>
              <div className={styles.fieldTable}>
                <div className={styles.fieldTableHead}>
                  <span>Nr.</span>
                  <span>Navn</span>
                  <span>React / Next.js</span>
                  <span>Felt / rolle</span>
                  <span>Aktiv lane</span>
                </div>

                {fieldRegister.map((item) => (
                  <div className={styles.fieldTableRow} key={item.nr}>
                    <span>{item.nr}</span>
                    <span>{item.name}</span>
                    <span>{item.react}</span>
                    <span><b>{item.field}</b><small>{item.role}</small></span>
                    <span>{getLaneValue(item, screenMode)}</span>
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

