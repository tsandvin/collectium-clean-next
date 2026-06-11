/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumTopbar
 *
 * Definering / formÃ¥l:
 * Eneste globale topbar i clean rebuild. NÃ¸ytral versjon uten skin-/tema-meny
 * slik at gammel design ikke aktiveres fra klienten.
 *
 * BruksomrÃ¥de:
 * Brukes kun av CollectiumAppShell.
 *
 * BerÃ¸rte sider / routes:
 * - alle routes
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - navigation.search
 * - auth.login
 *
 * BerÃ¸rte API-ruter:
 * - Ingen
 *
 * BerÃ¸rte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: navigation
 * log_action: render_topbar
 *
 * Versjon:
 * CT-TOPBAR-NEUTRAL-0001 / CHANGE-2026-06-12-DISABLE-THEME-MENU
 */

import Link from "next/link";

export function CollectiumTopbar() {
  return (
    <header className="ct-topbar">
      <div className="ct-search" aria-label="SÃ¸k placeholder">SÃ¸k i Collectium Katalogen</div>
      <nav className="ct-topbar-actions" aria-label="Toppmeny">
        <Link href="/katalog">Katalog</Link>
        <Link href="/min-side">Min side</Link>
        <Link className="ct-topbar-cta" href="/startside">Start</Link>
      </nav>
    </header>
  );
}


