"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Responsive Runtime UI 8.5
 *
 * Definering / formÃ¥l:
 * Leser faktisk nettleserbredde og setter globale data-attributter/CSS-variabler
 * for mobil, tablet, desktop, bredskjerm og TV/presentasjon.
 *
 * BruksomrÃ¥de:
 * Renderes Ã©n gang i app/layout.tsx.
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - Ingen. Ren klientbasert UI/runtime.
 *
 * Dataretning:
 * Browser viewport -> CSS variables -> React/UI
 *
 * Endringsregel:
 * Komponenten skal ikke hente data, skrive data eller eie sideinnhold.
 */

import { useEffect } from "react";

type ScreenMode = "mobile" | "tablet" | "desktop" | "widescreen" | "tv";

function getMode(width: number): ScreenMode {
  if (width < 750) return "mobile";
  if (width <= 1100) return "tablet";
  if (width <= 1899) return "desktop";
  if (width <= 2899) return "widescreen";
  return "tv";
}

function getLaneCount(mode: ScreenMode): number {
  if (mode === "mobile") return 1;
  if (mode === "tablet") return 1;
  if (mode === "desktop") return 1;
  if (mode === "widescreen") return 2;
  return 3;
}

function getSidebarWidth(mode: ScreenMode): number {
  if (mode === "mobile") return 0;
  if (mode === "tablet") return 0;
  if (mode === "desktop") return 260;
  if (mode === "widescreen") return 260;
  return 280;
}

export default function CollectiumResponsiveRuntime() {
  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const width = Math.round(window.innerWidth || document.documentElement.clientWidth || 0);
      const height = Math.round(window.innerHeight || document.documentElement.clientHeight || 0);
      const mode = getMode(width);
      const lanes = getLaneCount(mode);
      const sidebar = getSidebarWidth(mode);
      const workWidth = Math.max(0, width - sidebar);

      const root = document.documentElement;
      root.dataset.ctScreen = mode;
      root.dataset.ctLanes = String(lanes);
      root.dataset.ctViewport = String(width);
      root.style.setProperty("--ct-viewport-width", `${width}px`);
      root.style.setProperty("--ct-viewport-height", `${height}px`);
      root.style.setProperty("--ct-active-sidebar-width", `${sidebar}px`);
      root.style.setProperty("--ct-active-work-width", `${workWidth}px`);
      root.style.setProperty("--ct-active-lanes", String(lanes));

      window.dispatchEvent(
        new CustomEvent("collectium:screen-change", {
          detail: { width, height, mode, lanes, sidebar, workWidth },
        }),
      );
    };

    const schedule = () => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, []);

  return null;
}