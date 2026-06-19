"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumTvMenuBridge
 *
 * Definering / formål:
 * Gir TV / Presentasjon-modus egen hamburgerknapp uten å omskrive AppShell.
 * Komponenten finner eksisterende Collectium-sidemeny i DOM, markerer den som
 * TV-styrt sidebar, og lar den åpnes/lukkes som overlay.
 *
 * Bruksområde:
 * Monteres globalt i app/layout.tsx.
 *
 * Berørte sider / routes:
 * - Alle sider under app.collectium.no
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Dette er lokal template/design-kontroll.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * Browser UI-state -> html data-attributt -> global CSS.
 *
 * Logging:
 * Ingen serverlogging. Lokal navigasjonsvisning.
 *
 * Collectium-regel:
 * - TV / Presentasjon bruker hamburger / overlay-nav.
 * - Bredskjerm bruker fast venstremeny.
 */

import { useEffect, useState } from "react";

function findCollectiumSidebar(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      [
        ".ct-sidebar",
        ".collectium-sidebar",
        ".CollectiumSidebar",
        "[class*='sidebar']",
        "[class*='Sidebar']",
        "aside",
        "nav",
      ].join(","),
    ),
  );

  for (const candidate of candidates) {
    const text = (candidate.textContent || "").toLowerCase();

    const looksLikeCollectiumSidebar =
      text.includes("collectium") &&
      text.includes("katalog") &&
      text.includes("index");

    if (looksLikeCollectiumSidebar) {
      return candidate;
    }
  }

  return null;
}

function relabelWideButtons(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLElement>("button, [role='button']"));

  for (const button of buttons) {
    const text = (button.textContent || "").trim().toLowerCase();

    if (text === "wide") {
      button.textContent = "Bredskjerm";
    }

    if (text === "widescreen") {
      button.textContent = "Bredskjerm";
    }
  }
}

function syncSidebarMarker(): void {
  const previous = document.querySelectorAll<HTMLElement>(".ct-tv-managed-sidebar");
  previous.forEach((node) => node.classList.remove("ct-tv-managed-sidebar"));

  const sidebar = findCollectiumSidebar();

  if (sidebar) {
    sidebar.classList.add("ct-tv-managed-sidebar");
  }
}

function isTvMode(): boolean {
  const root = document.documentElement;

  return (
    root.dataset.vp === "tv" ||
    root.dataset.resolvedVp === "tv" ||
    root.dataset.screenMode === "tv"
  );
}

export default function CollectiumTvMenuBridge() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      syncSidebarMarker();
      relabelWideButtons();

      root.dataset.tvMenuOpen = open && isTvMode() ? "on" : "off";
      root.dataset.tvMenuBridge = "active";
    }

    sync();

    const observer = new MutationObserver(sync);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-vp",
        "data-resolved-vp",
        "data-screen-mode",
        "data-skin",
        "data-theme",
      ],
    });

    const bodyObserver = new MutationObserver(sync);

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", sync);

    return () => {
      observer.disconnect();
      bodyObserver.disconnect();
      window.removeEventListener("resize", sync);
      root.dataset.tvMenuOpen = "off";
    };
  }, [open]);

  function toggleMenu() {
    setOpen((current) => !current);
  }

  return (
    <>
      <button
        type="button"
        className="ct-tv-hamburger-bridge"
        aria-label={open ? "Lukk TV-meny" : "Åpne TV-meny"}
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <button
        type="button"
        className="ct-tv-menu-backdrop"
        aria-label="Lukk TV-meny"
        onClick={() => setOpen(false)}
      />
    </>
  );
}