"use client";

import React from "react";
import { useCollectiumLayout, CollectiumScreenMode } from "./CollectiumLayoutModeProvider";
import styles from "./CollectiumLayoutControlPanel.module.css";

const modes: Array<{ key: CollectiumScreenMode | "auto"; label: string }> = [
  { key: "auto", label: "Auto (nettleser)" },
  { key: "mobile", label: "Mobil" },
  { key: "tablet", label: "Tablet" },
  { key: "desktop", label: "Desktop" },
  { key: "wide", label: "Bredskjerm" },
  { key: "tv", label: "TV / presentasjon" },
];

export function CollectiumLayoutControlPanel() {
  const { selectedScreenMode, setSelectedScreenMode } = useCollectiumLayout();

  return (
    <section className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div className={styles.iconIndicator}>⚙️</div>
        <div>
          <h3 className={styles.panelTitle}>Collectium layout-control</h3>
          <p className={styles.panelDesc}>
            Overstyr aktiv layout-modus globalt i denne nettlesersesjonen.
          </p>
        </div>
      </div>

      <div className={styles.buttonGrid}>
        {modes.map((mode) => {
          const isActive = selectedScreenMode === mode.key;
          return (
            <button
              key={mode.key}
              type="button"
              className={`${styles.ctrlBtn} ${isActive ? styles.isActive : ""}`}
              onClick={() => setSelectedScreenMode(mode.key)}
              aria-pressed={isActive}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
