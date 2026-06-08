/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Root layout
 *
 * Definering / formål:
 * Global Next.js layout for ren Collectium-start. Eier html/body og pakker alle sider i CollectiumAppShell.
 *
 * Bruksområde:
 * Brukes av alle routes i app/.
 *
 * Berørte sider / routes:
 * - /
 * - /startside
 * - /katalog
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - template.view
 * - navigation.view
 *
 * Berørte API-ruter:
 * - Ingen i v1 clean template
 *
 * Berørte tabeller / views:
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
import { CollectiumAppShell } from '@/components/layout/CollectiumAppShell';

export const metadata: Metadata = {
  title: 'Collectium',
  description: 'Samlerplattform for katalog, historie og marked.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="no" data-template="collectium" data-skin="signature-light">
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
