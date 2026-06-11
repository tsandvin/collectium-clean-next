"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium UI85 Theme Client
 *
 * Definering / formål:
 * Local preview-only theme controller for the four approved UI85 skins. This is
 * not a production-wide runtime design engine. It only switches the skin inside
 * the /design/ui85 preview module.
 *
 * Bruksområde:
 * - /design/ui85
 * - components/templates/ui85
 *
 * Berørte DB-brytere / feature_keys:
 * - template.ui85.skin.switch.preview
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Local React state → UI preview only.
 *
 * Logging:
 * Ingen runtime logging i preview.
 *
 * Versjon:
 * UI85-REACT-TEMPLATE-V19 / CHANGE-UI85-2026-06-11-0019
 */

import { useMemo, useState } from "react";
import { CollectiumUi85ObjectPreview } from "./CollectiumUi85ObjectPreview";
import { CollectiumUi85Template } from "./CollectiumUi85Template";
import type { CollectiumUi85Skin } from "./collectium-ui85-types";
import styles from "./CollectiumUi85ThemeClient.module.css";

const skinOptions: { key: CollectiumUi85Skin; label: string; description: string }[] = [
  { key: "collectium", label: "Collectium", description: "Signature lys" },
  { key: "samler", label: "Samler", description: "Ren enkel" },
  { key: "museum", label: "Museum", description: "Mørk arkiv" },
  { key: "finans", label: "Finans", description: "Marked / analyse" },
];

export function CollectiumUi85ThemeClient() {
  const [skin, setSkin] = useState<CollectiumUi85Skin>("finans");

  const activeLabel = useMemo(() => {
    return skinOptions.find((option) => option.key === skin)?.label ?? "Finans";
  }, [skin]);

  return (
    <CollectiumUi85Template skin={skin}>
      <section className={styles.themeBar} aria-label="UI85 tema">
        <div>
          <span>Tema</span>
          <b>{activeLabel}</b>
        </div>

        <div className={styles.themeButtons} role="group" aria-label="Velg UI85 skin">
          {skinOptions.map((option) => (
            <button
              aria-pressed={skin === option.key}
              className={skin === option.key ? `${styles.themeButton} ${styles.active}` : styles.themeButton}
              key={option.key}
              onClick={() => setSkin(option.key)}
              type="button"
            >
              <b>{option.label}</b>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </section>

      <CollectiumUi85ObjectPreview activeSkin={skin} />
    </CollectiumUi85Template>
  );
}
