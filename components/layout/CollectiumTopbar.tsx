/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumTopbar
 *
 * Definering / formål:
 * Eneste globale topbar i clean rebuild. Sider skal ikke lage egen topbar.
 *
 * Bruksområde:
 * Brukes kun av CollectiumAppShell.
 *
 * Berørte sider / routes:
 * - alle routes
 *
 * Berørte DB-brytere / feature_keys:
 * - navigation.search
 * - auth.login
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
 * log_category: navigation
 * log_action: render_topbar
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import Link from 'next/link';

export function CollectiumTopbar() {
  return (
    <header className="ct-topbar">
      <div className="ct-search" aria-label="Søk placeholder">Søk i Collectium Katalogen</div>
      <nav className="ct-topbar-actions" aria-label="Toppmeny">
        <Link href="/katalog">Katalog</Link>
        <Link href="/min-side">Min side</Link>
        <Link className="ct-topbar-cta" href="/startside">Start</Link>
      </nav>
    </header>
  );
}
