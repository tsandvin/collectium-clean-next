"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumSkinProvider
 *
 * Definering / formål:
 * Lokal UI-kontroll for å forhåndsvise fire globale Collectium skins uten å endre data, API eller DB-logikk.
 *
 * Bruksområde:
 * Legges i global layout/topbar eller på designsiden. Kan fjernes/låses før produksjon.
 *
 * Berørte sider / routes:
 * - Alle sider som bruker global layout
 *
 * Berørte DB-brytere / feature_keys:
 * - Ren lokal template-kontroll
 *
 * Berørte API-ruter:
 * - Ingen
 *
 * Berørte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * UI-tokenvalg i documentElement. Ingen DB-skriving.
 *
 * Logging:
 * log_category: design
 * log_action: skin.preview_local
 *
 * Versjon:
 * CT-SKIN-PROVIDER-0001 / CHANGE-2026-06-11-0001
 */

import { useEffect, useMemo, useState } from "react";

export type CollectiumSkin = "collectium" | "samler" | "museum" | "finans";

const STORAGE_KEY = "collectium-ui85-skin-preview";

const SKINS: Array<{ key: CollectiumSkin; label: string; description: string }> = [
  { key: "collectium", label: "Collectium", description: "Blå/hvit standard og plattformdesign." },
  { key: "samler", label: "Samler", description: "Varm arkiv-/samlerflate for Min side og samling." },
  { key: "museum", label: "Museum", description: "Mørk historisk presentasjon med gull og arkivpreg." },
  { key: "finans", label: "Finans", description: "Egen mørk finansretning med datakontrast." },
];

function isSkin(value: string | null): value is CollectiumSkin {
  return value === "collectium" || value === "samler" || value === "museum" || value === "finans";
}

export function CollectiumSkinProvider({ children }: { children: React.ReactNode }) {
  const [skin, setSkin] = useState<CollectiumSkin>("collectium");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSkin(stored)) {
      setSkin(stored);
      document.documentElement.dataset.ctSkin = stored;
      return;
    }
    document.documentElement.dataset.ctSkin = "collectium";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.ctSkin = skin;
    window.localStorage.setItem(STORAGE_KEY, skin);
  }, [skin]);

  const activeDescription = useMemo(
    () => SKINS.find((item) => item.key === skin)?.description ?? "",
    [skin],
  );

  return (
    <>
      {children}
      <aside className="ct-panel" aria-label="Collectium skinvalg" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50, maxWidth: 420 }}>
        <h2 className="ct-title">Skin</h2>
        <p className="ct-body ct-muted" style={{ margin: "6px 0 12px" }}>{activeDescription}</p>
        <div className="ct-skin-switcher">
          {SKINS.map((item) => (
            <button
              key={item.key}
              type="button"
              className="ct-skin-chip"
              aria-pressed={skin === item.key}
              onClick={() => setSkin(item.key)}
              title={item.description}
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
