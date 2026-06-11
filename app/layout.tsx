/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout for nÃ¸ytral Collectium-standard. Layout importerer kun
 * app/globals.css. Alle gamle skin-importer og data-skin/data-theme-attributter
 * er fjernet for Ã¥ rydde designkonflikt.
 *
 * BruksomrÃ¥de:
 * Brukes av alle routes i app/.
 *
 * BerÃ¸rte sider / routes:
 * - alle
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 *
 * BerÃ¸rte API-ruter:
 * - Ingen
 *
 * BerÃ¸rte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * Next.js layout -> CollectiumAppShell -> sideinnhold.
 *
 * Logging:
 * log_category: template
 * log_action: render
 *
 * Versjon:
 * CT-CLEAN-LAYOUT-NEUTRAL-0001 / CHANGE-2026-06-12-DISABLE-SKINS
 */

import type { Metadata } from "next";
import "./globals.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Samlerplattform for katalog, historie og marked.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no">
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
