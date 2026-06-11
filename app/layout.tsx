/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout med ThemeProvider og delt tema-CSS.
 * globals.css eier layoutstruktur. app/styles/themes.css eier farger/design.
 *
 * BruksomrÃ¥de:
 * Alle routes i app/.
 *
 * BerÃ¸rte sider / routes:
 * - alle
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 * - local.template.theme_provider
 *
 * BerÃ¸rte API-ruter:
 * - senere /api/user/preferences/theme
 *
 * BerÃ¸rte tabeller / views:
 * - senere ct_ui_skins
 * - senere ct_user_preferences.preferred_skin
 *
 * Versjon:
 * CT-LAYOUT-THEMEPROVIDER-0001 / CHANGE-2026-06-12-THEME-STANDARD
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

