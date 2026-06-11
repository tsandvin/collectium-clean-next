/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * RootLayout for Collectium UI 8.5 v36
 *
 * Definering / formål:
 * Next.js App Router layout som importerer samlet theme-tokenfil og v36 komponent-CSS.
 * Pakker hele appen i ThemeProvider.
 *
 * Bruksområde:
 * app/layout.tsx
 *
 * Berørte sider / routes:
 * - Alle routes i app/
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen direkte. Layout er global UI/template.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI.
 *
 * Versjon:
 * CT-UI85-ROOT-LAYOUT-0001 / CHANGE-UI85-V36-0001
 */

import type { Metadata } from "next";
import { ThemeProvider } from "./providers/theme-provider";
import "./styles/themes.css";
import "./styles/collectium-ui85-v36.css";

export const metadata: Metadata = {
  title: "Collectium UI 8.5 v36",
  description: "Collectium React/Next.js standard med global theme-tokenfil.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" data-theme="collectium" data-skin="collectium">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
