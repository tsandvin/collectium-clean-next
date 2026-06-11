"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Theme Client
 *
 * Definering / formal:
 * Aktiv React-kontroll for UI85 designstandard. Komponenten bytter kun skin-
 * tokens og holder staende objektkort som laast struktur for alle fire skins.
 *
 * Bruksomrade:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berorte DB-brytere / feature_keys:
 * - template.ui85.skin.switch.preview
 *
 * Berorte API-ruter:
 * - Ingen.
 *
 * Dataretning:
 * Local React state -> data-skin paa html/body -> CSS tokens.
 *
 * Logging:
 * Ingen runtime logging i preview.
 *
 * Versjon:
 * UI85-DESIGN-STANDARD-V20
 */

import { useMemo, useState } from "react";
import { CollectiumUi85ObjectPreview } from "./CollectiumUi85ObjectPreview";
import { CollectiumUi85Template } from "./CollectiumUi85Template";
import type { CollectiumUi85Skin } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ThemeClient.module.css";

const skinOptions: { key: CollectiumUi85Skin; label: string; description: string }[] = [
  { key: "collectium", label: "Collectium", description: "Varm signatur" },
  { key: "samler", label: "Enkel", description: "Ren samlerflate" },
  { key: "museum", label: "Museum", description: "Mork arkiv" },
  { key: "finans", label: "Finans", description: "Marked og analyse" },
];

const layoutOptions = ["Alle", "Horisontal", "Staende", "Liste", "Museum"];

function SkinDot({ skin }: { skin: CollectiumUi85Skin }) {
  return <span className={styles.skinDot} data-skin-dot={skin} aria-hidden="true" />;
}

function applyGlobalSkin(skin: CollectiumUi85Skin) {
  document.documentElement.dataset.skin = skin;
  document.body.dataset.skin = skin;
  document.documentElement.setAttribute("data-ct-skin", skin);
  document.body.setAttribute("data-ct-skin", skin);

  try {
    window.localStorage.setItem("collectium-active-skin", skin);
    window.localStorage.setItem("ct-ui85-preview-skin", skin);
  } catch {
    // Skin still applies for the current page.
  }
}

export function CollectiumUi85ThemeClient() {
  const [skin, setSkin] = useState<CollectiumUi85Skin>("collectium");

  const activeLabel = useMemo(() => {
    return skinOptions.find((option) => option.key === skin)?.label ?? "Collectium";
  }, [skin]);

  function selectSkin(nextSkin: CollectiumUi85Skin) {
    setSkin(nextSkin);

    if (typeof document !== "undefined") {
      applyGlobalSkin(nextSkin);
    }
  }

  return (
    <CollectiumUi85Template skin={skin}>
      <section className={styles.toolbar} aria-label="UI85 skin og layout">
        <div className={styles.groupLabel}>Skinn</div>

        <div className={styles.skinButtons} role="group" aria-label="Velg UI85 skin">
          {skinOptions.map((option) => (
            <button
              aria-pressed={skin === option.key}
              className={skin === option.key ? `${styles.skinButton} ${styles.active}` : styles.skinButton}
              key={option.key}
              onClick={() => selectSkin(option.key)}
              title={option.description}
              type="button"
            >
              <SkinDot skin={option.key} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.groupLabel}>Layout</div>

        <div className={styles.layoutButtons} role="group" aria-label="Velg layout">
          {layoutOptions.map((option) => (
            <button
              aria-pressed={option === "Staende"}
              className={option === "Staende" ? `${styles.layoutButton} ${styles.active}` : styles.layoutButton}
              key={option}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <CollectiumUi85ObjectPreview activeSkin={skin} activeLabel={activeLabel} />
    </CollectiumUi85Template>
  );
}

