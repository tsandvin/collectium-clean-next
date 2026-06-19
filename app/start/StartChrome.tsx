/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn: app/start/StartChrome.tsx
 * Definering / formål:
 * Setter global chrome-modus for /start slik at startsiden vises med toppmeny,
 * men uten sidemeny.
 *
 * Bruksområde:
 * Brukes av app/start/layout.tsx.
 *
 * Berørte sider / routes:
 * - /start
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Dette er lokal layout/chrome-kontroll.
 *
 * DB-kobling:
 * Ingen.
 */

"use client";

import { useEffect, type ReactNode } from "react";

export default function StartChrome({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.getAttribute("data-ct-chrome");

    root.setAttribute("data-ct-chrome", "topbar-only");

    return () => {
      if (previous) {
        root.setAttribute("data-ct-chrome", previous);
      } else {
        root.removeAttribute("data-ct-chrome");
      }
    };
  }, []);

  return <>{children}</>;
}