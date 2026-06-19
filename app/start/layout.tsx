/**
 * COLLECTIUM FILE HEADER
 *
 * Filnavn: app/start/layout.tsx
 * Definering / formål:
 * Lokal layout for /start. Setter chrome-modus til toppmeny uten sidemeny.
 *
 * Bruksområde:
 * Gjelder kun /start.
 *
 * Berørte sider / routes:
 * - /start
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Dette er lokal layout/chrome-kontroll.
 *
 * DB-kobling:
 * Ingen.
 */

import type { ReactNode } from "react";
import StartChrome from "./StartChrome";

export default function StartLayout({ children }: { children: ReactNode }) {
  return <StartChrome>{children}</StartChrome>;
}