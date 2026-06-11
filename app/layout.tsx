import { CollectiumSkinProvider } from "./components/layout/CollectiumSkinProvider";
/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout for ren Collectium-start. Eier html/body og pakker alle sider i CollectiumAppShell.
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
 *
 * BerÃ¸rte API-ruter:
 * - Ingen i v1 clean template
 *
 * BerÃ¸rte tabeller / views:
 * - Ingen i v1 clean template
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: template
 * log_action: render
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import type { Metadata } from 'next';
import './globals.css';
import "./styles/collectium-skins.css";
import { CollectiumAppShell } from '@/components/layout/CollectiumAppShell';

export const metadata: Metadata = {
  title: 'Collectium',
  description: 'Samlerplattform for katalog, historie og marked.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no" data-template="collectium" data-skin="signature-light">
      <body>
        <CollectiumAppShell><CollectiumSkinProvider>{children}</CollectiumSkinProvider></CollectiumAppShell>
      </body>
    </html>
  );
}

