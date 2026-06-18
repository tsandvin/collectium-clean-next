"use client";

import React from "react";
import { useCollectiumLayout } from "./CollectiumLayoutModeProvider";
import styles from "./CollectiumResponsiveDebugPanel.module.css";

const modeDescriptions: Record<string, string> = {
  mobile: "Mobil (0-719px): Fast venstremeny skjules. Bruker sticky topbar med hamburger-overlay. Alt legges i én kolonne.",
  tablet: "Tablet (720-1100px): Stacked layout eller kompakt sidebar (720-980px fold). 1-2 kolonner for innhold.",
  desktop: "Desktop (1101-1899px): Normal sidebar på 260px og innhold med standard desktop-cap.",
  wide: "Bredskjerm (1900px+): Ekstra bredde deles i flere parallelle lanes på ca. 1000px. Horisontal rulling skjer i lanes, ikke body.",
  tv: "TV / presentasjon (2900px+): Presentasjonsmodus med forenklet visning, større skrift og mer luft.",
};

export function CollectiumResponsiveDebugPanel() {
  const {
    actualScreenWidth,
    viewportMode,
    selectedScreenMode,
    activeScreenMode,
    sidebarMode,
    laneMode,
  } = useCollectiumLayout();

  return (
    <section className={styles.debugCard}>
      <div className={styles.header}>
        <span className={styles.hudBadge}>HUD</span>
        <h4 className={styles.title}>Responsiv statusindikator</h4>
      </div>

      <div className={styles.grid}>
        <article className={styles.cell}>
          <span>Faktisk skjermbredde</span>
          <strong>{actualScreenWidth}px</strong>
          <small>Målt fra nettleservindu</small>
        </article>

        <article className={styles.cell}>
          <span>Nettleser-deteksjon</span>
          <strong>{viewportMode}</strong>
          <small>Automatisk modus</small>
        </article>

        <article className={styles.cell}>
          <span>Valgt overstyring</span>
          <strong className={selectedScreenMode !== "auto" ? styles.overrideActive : ""}>
            {selectedScreenMode}
          </strong>
          <small>localStorage status</small>
        </article>

        <article className={styles.cell}>
          <span>Aktiv modus</span>
          <strong>{activeScreenMode}</strong>
          <small>Resulterende modus</small>
        </article>

        <article className={styles.cell}>
          <span>Sidemeny-status</span>
          <strong>{sidebarMode}</strong>
          <small>Valgt visningsstil</small>
        </article>

        <article className={styles.cell}>
          <span>Lane-kalkulator</span>
          <strong>{laneMode}</strong>
          <small>Workspace lanes</small>
        </article>
      </div>

      <div className={styles.explanationBox}>
        <strong>Aktiv regel:</strong>
        <p>{modeDescriptions[activeScreenMode] || "Ingen beskrivelse tilgjengelig."}</p>
      </div>
    </section>
  );
}
