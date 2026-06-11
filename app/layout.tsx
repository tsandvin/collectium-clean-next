/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout med ThemeProvider og direkte tema-CSS-importer.
 * Direkte import brukes fordi Next.js/Turbopack kan feile pÃ¥ @import i CSS.
 *
 * Versjon:
 * CT-LAYOUT-THEMEPROVIDER-0002 / CHANGE-2026-06-12-DIRECT-CSS-IMPORTS
 */

import type { Metadata } from "next";
import "./globals.css";
import "./styles/themes.css";
import "./styles/collectium.css";
import "./styles/samler.css";
import "./styles/museum.css";
import "./styles/finans.css";
import { ThemeProvider } from "./providers/theme-provider";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Samlerplattform for katalog, historie og marked.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" data-theme="collectium">
      <body>
        <ThemeProvider>
          <CollectiumAppShell>
            {children}
          </CollectiumAppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
