"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Theme Menu
 *
 * Definering / formÃ¥l:
 * Aktiv Tema-bryter for global topbar. Setter kun data-skin pÃ¥ html/body.
 *
 * BruksomrÃ¥de:
 * Global AppShell / Topbar.
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * template.theme.select
 *
 * BerÃ¸rte API-ruter:
 * Ingen.
 *
 * BerÃ¸rte tabeller/views:
 * Ingen.
 *
 * Versjon:
 * CT-THEME-SWITCH-0002 / CHANGE-2026-06-11-THEME-ACTIVE-V2
 */

import { useEffect, useRef, useState } from "react";
import styles from "./CollectiumThemeMenu.module.css";

type SkinKey = "collectium" | "samler" | "museum" | "finans";

const SKINS: Array<{ key: SkinKey; label: string }> = [
  { key: "collectium", label: "Collectium" },
  { key: "samler", label: "Samler" },
  { key: "museum", label: "Museum" },
  { key: "finans", label: "Finans" },
];

const STORAGE_KEY = "collectium-active-skin";
const LEGACY_STORAGE_KEY = "ct-ui85-preview-skin";

function normalizeSkin(value: string | null | undefined): SkinKey {
  if (value === "collectium" || value === "samler" || value === "museum" || value === "finans") {
    return value;
  }

  if (value === "enkel" || value === "samler-enkel") {
    return "samler";
  }

  return "collectium";
}

function applySkin(skin: SkinKey) {
  document.documentElement.dataset.skin = skin;
  document.body.dataset.skin = skin;
  document.documentElement.setAttribute("data-ct-skin", skin);
  document.body.setAttribute("data-ct-skin", skin);

  try {
    window.localStorage.setItem(STORAGE_KEY, skin);
    window.localStorage.setItem(LEGACY_STORAGE_KEY, skin);
  } catch {
    // data-skin still applies for this page.
  }

  window.dispatchEvent(new CustomEvent("collectium:skin-change", { detail: { skin } }));
}

export function CollectiumThemeMenu() {
  const [open, setOpen] = useState(false);
  const [activeSkin, setActiveSkin] = useState<SkinKey>("collectium");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let storedSkin = "";

    try {
      storedSkin =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY) ??
        "";
    } catch {
      storedSkin = "";
    }

    const selectedSkin = normalizeSkin(
      storedSkin ||
        document.documentElement.dataset.skin ||
        document.body.dataset.skin ||
        document.documentElement.getAttribute("data-ct-skin") ||
        document.body.getAttribute("data-ct-skin") ||
        "collectium"
    );

    setActiveSkin(selectedSkin);
    applySkin(selectedSkin);
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function chooseSkin(skin: SkinKey) {
    setActiveSkin(skin);
    applySkin(skin);
    setOpen(false);
  }

  return (
    <div className={styles.themeMenu} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Tema
      </button>

      {open ? (
        <div className={styles.menu} role="menu" aria-label="Velg tema">
          {SKINS.map((skin) => (
            <button
              key={skin.key}
              type="button"
              role="menuitemradio"
              aria-checked={activeSkin === skin.key}
              className={styles.skinButton}
              data-active={activeSkin === skin.key ? "true" : "false"}
              onClick={() => chooseSkin(skin.key)}
            >
              <span className={styles.dot} data-skin-dot={skin.key} />
              {skin.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
