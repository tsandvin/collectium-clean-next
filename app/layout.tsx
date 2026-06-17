/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Global Collectium Root Layout
 *
 * Definering / formÃ¥l:
 * Global Next.js layout for app.collectium.no. Eier html/body, global shell,
 * toppbar, sidemeny, responsiv ramme og designvariabler.
 *
 * BruksomrÃ¥de:
 * Brukes av alle sider i app-router. Vanlige sider skal ikke lage egen shell,
 * egen toppbar eller egen sidemeny.
 *
 * BerÃ¸rte sider / routes:
 * - Alle routes under app/
 * - /test/periodefilter
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - layout.view
 * - navigation.view
 * - design.global.view
 *
 * Dataretning:
 * DB/API -> Next.js -> React -> UI
 *
 * Endringsregel:
 * Denne filen er global standard. Installer v4 tar backup fÃ¸r overskriving.
 */
import type { Metadata } from "next";
import "./globals.css";
import CollectiumAppShell from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Collectium relasjonskatalog, samling, historie og finans",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" data-template="collectium" data-skin="signature-light" data-vp="pc">
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}