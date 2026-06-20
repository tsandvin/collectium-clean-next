/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:      app/start/layout.tsx
 * Definering:   Rute-layout for /start. Beholder den globale toppmenyen, men
 *               signaliserer at sidemenyen skal vaere av (topbar-only).
 * Formaal:      Startsiden skal vises i full bredde uten venstre sidemeny.
 *               Layouten rendrer StartChrome (setter data-ct-chrome) + children.
 *               Toppmenyen arves fra rot-layouten (CollectiumAppShell).
 *               Se README for hvordan AppShell gater sidemenyen.
 * Designkobling: app/start/StartChrome.tsx, CollectiumAppShell, globals.css.
 * DB-kobling:   Ingen.
 * Tags:         collectium, start, layout, toppmeny, ingen-sidemeny
 */

import type { ReactNode } from "react";
import StartChrome from "./StartChrome";

export default function StartLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StartChrome />
      {children}
    </>
  );
}
