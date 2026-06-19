/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn:      app/start/page.tsx
 * Definering:   Next.js App Router-side for ruten /start (app.collectium/start).
 * Formaal:      Tynn server-wrapper. Setter metadata og rendrer StartClient.
 *               Siden er full bredde under den globale toppmenyen og har
 *               INGEN sidemeny (se README for hvordan layouten droppes).
 * Designkobling: app/start/start.module.css, app/globals.css (skin/tema).
 * DB-kobling:   Ingen direkte. Innhold er statisk presentasjon; lenker peker til
 *               ekte ruter (/katalog, /objekt/..., /relasjon/..., /medlemskap).
 * Tags:         collectium, start, route, app-router, ingen-sidemeny
 */

import type { Metadata } from "next";
import StartClient from "./StartClient";

export const metadata: Metadata = {
  title: "Collectium — søk samlingen gjennom tiden",
  description:
    "Collectium er en relasjonsplattform for samlere. Søk sedler, mynter, konger og signaturer på en felles tidslinje. Start gratis.",
};

export default function StartPage() {
  return <StartClient />;
}
