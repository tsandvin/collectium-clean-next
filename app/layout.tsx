/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout for ren Collectium UI85-standard. Layout eier kun html/body
 * og pakker alle sider i CollectiumAppShell. Designverdier kommer fra
 * app/styles/collectium-skins.css via data-theme/data-skin/data-ct-skin.
 *
 * BruksomrÃ¥de:
 * Brukes av alle routes i app/.
 *
 * BerÃ¸rte sider / routes:
 * - /
 * - /startside
 * - /katalog
 * - /min-side
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 * - local.template.theme_ui85
 *
 * BerÃ¸rte API-ruter:
 * - Ingen
 *
 * BerÃ¸rte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * collectium-skins.css -> globals.css shell -> React -> UI
 *
 * Logging:
 * log_category: template
 * log_action: render
 *
 * Versjon:
 * CT-CLEAN-LAYOUT-UI85-0002 / CHANGE-2026-06-12-SINGLE-DESIGN-STANDARD
 */

import type { Metadata } from "next";
import "./globals.css";
import "./styles/collectium-skins.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Samlerplattform for katalog, historie og marked.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="no"
      data-template="collectium"
      data-theme="collectium"
      data-skin="collectium"
      data-ct-skin="collectium"
    >
      <body data-theme="collectium" data-skin="collectium" data-ct-skin="collectium">
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
