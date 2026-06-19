"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumDesignPersistence
 *
 * Definering / formål:
 * Leser og lagrer brukerens valgte skin og skjermmodus i browser localStorage.
 * Setter data-skin, data-theme og data-vp på html-elementet slik at global layout
 * kan bruke samme visuelle valg etter reload og nytt besøk.
 *
 * Bruksområde:
 * Monteres globalt i app/layout.tsx.
 *
 * Berørte sider / routes:
 * - Alle sider under app.collectium.no
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Dette er lokal template/design-kontroll, ikke systemhandling.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Browser localStorage -> html data-attributter -> global CSS/layout.
 *
 * Logging:
 * Ingen serverlogging. Lokal designpreferanse.
 *
 * Collectium-regel:
 * TV / Presentasjon aktiveres ikke automatisk ved 2126px.
 * Ved automatisk skjermvalg skal ca. 2126px regnes som desktop.
 */

import { useEffect } from "react";

type CollectiumSkin = "collectium" | "samler" | "museum" | "finans";
type CollectiumScreenMode = "auto" | "mobile" | "tablet" | "desktop" | "wide" | "tv";

const STORAGE_SKIN_KEY = "collectium.skin";
const STORAGE_SCREEN_KEY = "collectium.screenMode";

const LEGACY_SKIN_KEYS = [
  "collectium-skin",
  "ct-skin",
  "collectiumSkin",
  "ctSkin",
];

const LEGACY_SCREEN_KEYS = [
  "collectium-screen",
  "collectium-vp",
  "collectium-viewport",
  "ct-screen",
  "ct-vp",
  "ct-viewport",
  "collectiumScreenMode",
  "ctScreenMode",
];

const VALID_SKINS: CollectiumSkin[] = ["collectium", "samler", "museum", "finans"];
const VALID_SCREEN_MODES: CollectiumScreenMode[] = [
  "auto",
  "mobile",
  "tablet",
  "desktop",
  "wide",
  "tv",
];

function normalizeSkin(value: string | null | undefined): CollectiumSkin {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "collector") return "samler";
  if (normalized === "simple") return "samler";
  if (normalized === "minimal") return "samler";
  if (normalized === "history") return "museum";
  if (normalized === "finance") return "finans";

  if (VALID_SKINS.includes(normalized as CollectiumSkin)) {
    return normalized as CollectiumSkin;
  }

  return "collectium";
}

function normalizeScreenMode(value: string | null | undefined): CollectiumScreenMode {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "mobil") return "mobile";
  if (normalized === "mobile") return "mobile";
  if (normalized === "tablet") return "tablet";
  if (normalized === "pc") return "desktop";
  if (normalized === "desktop") return "desktop";
  if (normalized === "bredskjerm") return "wide";
  if (normalized === "wide") return "wide";
  if (normalized === "tv") return "tv";
  if (normalized === "presentation") return "tv";
  if (normalized === "presentasjon") return "tv";
  if (normalized === "tv-presentasjon") return "tv";
  if (normalized === "auto") return "auto";

  return "auto";
}

function getStoredValue(primaryKey: string, legacyKeys: string[]): string | null {
  try {
    const primary = window.localStorage.getItem(primaryKey);
    if (primary) return primary;

    for (const legacyKey of legacyKeys) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue) return legacyValue;
    }
  } catch {
    return null;
  }

  return null;
}

function saveValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage kan være blokkert. I så fall lar vi bare runtime-attributtene stå.
  }
}

function getAutoScreenMode(width: number): Exclude<CollectiumScreenMode, "auto" | "tv"> {
  if (width < 720) return "mobile";
  if (width <= 1100) return "tablet";

  /**
   * Collectium-beslutning:
   * Ved ca. 2126px skal automatisk valg fortsatt være Desktop.
   * TV / Presentasjon skal aldri velges automatisk her.
   *
   * Wide kan velges manuelt, men auto holder desktop til svært brede flater.
   * Juster bare denne grensen senere hvis Collectium låser ny bredskjermregel.
   */
  if (width >= 2900) return "wide";

  return "desktop";
}

function applySkin(skin: CollectiumSkin): void {
  const root = document.documentElement;

  root.dataset.skin = skin;
  root.dataset.theme = skin;
}

function applyScreenMode(screenMode: CollectiumScreenMode): void {
  const root = document.documentElement;
  const actualWidth = window.innerWidth || document.documentElement.clientWidth || 0;

  root.dataset.screenMode = screenMode;
  root.dataset.actualWidth = String(actualWidth);

  if (screenMode === "auto") {
    const resolvedMode = getAutoScreenMode(actualWidth);
    root.dataset.vp = resolvedMode;
    root.dataset.resolvedVp = resolvedMode;
    root.dataset.screenOverride = "off";
    root.dataset.navMode = "sidebar";
    return;
  }

  root.dataset.vp = screenMode;
  root.dataset.resolvedVp = screenMode;
  root.dataset.screenOverride = "on";
  root.dataset.navMode = screenMode === "tv" ? "hamburger" : "sidebar";
}

function readCurrentSkinFromDom(): CollectiumSkin {
  const root = document.documentElement;
  return normalizeSkin(root.dataset.skin || root.dataset.theme);
}

function readCurrentScreenFromDom(): CollectiumScreenMode {
  const root = document.documentElement;
  return normalizeScreenMode(root.dataset.screenMode || root.dataset.vp);
}

declare global {
  interface Window {
    collectiumSetSkin?: (skin: CollectiumSkin | string) => void;
    collectiumSetScreenMode?: (screenMode: CollectiumScreenMode | string) => void;
    collectiumGetDesignState?: () => {
      skin: CollectiumSkin;
      screenMode: CollectiumScreenMode;
      vp: string | undefined;
      resolvedVp: string | undefined;
      actualWidth: string | undefined;
      screenOverride: string | undefined;
    };
  }
}

export default function CollectiumDesignPersistence() {
  useEffect(() => {
    const storedSkin = normalizeSkin(getStoredValue(STORAGE_SKIN_KEY, LEGACY_SKIN_KEYS));
    const storedScreenMode = normalizeScreenMode(
      getStoredValue(STORAGE_SCREEN_KEY, LEGACY_SCREEN_KEYS),
    );

    applySkin(storedSkin);
    applyScreenMode(storedScreenMode);

    saveValue(STORAGE_SKIN_KEY, storedSkin);
    saveValue(STORAGE_SCREEN_KEY, storedScreenMode);

    window.collectiumSetSkin = (skinInput: CollectiumSkin | string) => {
      const nextSkin = normalizeSkin(skinInput);
      applySkin(nextSkin);
      saveValue(STORAGE_SKIN_KEY, nextSkin);
    };

    window.collectiumSetScreenMode = (screenInput: CollectiumScreenMode | string) => {
      const nextScreenMode = normalizeScreenMode(screenInput);
      applyScreenMode(nextScreenMode);
      saveValue(STORAGE_SCREEN_KEY, nextScreenMode);
    };

    window.collectiumGetDesignState = () => {
      const root = document.documentElement;

      return {
        skin: readCurrentSkinFromDom(),
        screenMode: readCurrentScreenFromDom(),
        vp: root.dataset.vp,
        resolvedVp: root.dataset.resolvedVp,
        actualWidth: root.dataset.actualWidth,
        screenOverride: root.dataset.screenOverride,
      };
    };

    const handleResize = () => {
      const currentScreenMode = normalizeScreenMode(
        window.localStorage.getItem(STORAGE_SCREEN_KEY) || document.documentElement.dataset.screenMode,
      );

      applyScreenMode(currentScreenMode);
    };

    window.addEventListener("resize", handleResize);

    /**
     * Observer lagrer valg når eksisterende designpanel endrer html data-attributter.
     * Dette gjør at vi slipper å endre AppShell-knappene nå.
     */
    let isApplyingFromObserver = false;

    const observer = new MutationObserver(() => {
      if (isApplyingFromObserver) return;

      const root = document.documentElement;
      const domSkin = normalizeSkin(root.dataset.skin || root.dataset.theme);
      const domScreenMode = normalizeScreenMode(root.dataset.screenMode || root.dataset.vp);

      const storedSkinNow = normalizeSkin(window.localStorage.getItem(STORAGE_SKIN_KEY));
      const storedScreenNow = normalizeScreenMode(window.localStorage.getItem(STORAGE_SCREEN_KEY));

      if (domSkin !== storedSkinNow) {
        saveValue(STORAGE_SKIN_KEY, domSkin);
      }

      /**
       * Viktig:
       * Hvis vp endres til desktop/wide/tv av designpanelet, lagres det som manuelt valg.
       * Hvis screenMode allerede er auto, lagres auto og auto beregner vp.
       */
      if (domScreenMode !== storedScreenNow) {
        saveValue(STORAGE_SCREEN_KEY, domScreenMode);

        isApplyingFromObserver = true;
        applyScreenMode(domScreenMode);
        window.setTimeout(() => {
          isApplyingFromObserver = false;
        }, 0);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-skin", "data-theme", "data-vp", "data-screen-mode"],
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();

      delete window.collectiumSetSkin;
      delete window.collectiumSetScreenMode;
      delete window.collectiumGetDesignState;
    };
  }, []);

  return null;
}