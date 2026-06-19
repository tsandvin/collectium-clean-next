/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:      app/start/StartChrome.tsx
 * Definering:   Liten klienthjelper som markerer at /start skal vises uten
 *               sidemeny (kun toppmeny).
 * Formaal:      Setter data-ct-chrome="topbar-only" paa <html> mens startsiden
 *               er aktiv, og rydder opp naar man navigerer bort. CollectiumAppShell
 *               (eller globals.css) leser dette og skjuler sidemenyen. Se README.
 * Designkobling: app/start/layout.tsx, CollectiumAppShell.
 * DB-kobling:   Ingen.
 * Tags:         collectium, start, layout, toppmeny, ingen-sidemeny
 */
"use client";

import { useEffect } from "react";

export default function StartChrome() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.getAttribute("data-ct-chrome");
    el.setAttribute("data-ct-chrome", "topbar-only");
    return () => {
      if (prev === null) el.removeAttribute("data-ct-chrome");
      else el.setAttribute("data-ct-chrome", prev);
    };
  }, []);
  return null;
}
