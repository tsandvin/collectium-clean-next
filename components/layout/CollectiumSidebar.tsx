/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumSidebar
 *
 * Definering / formål:
 * Eneste globale sidemeny i clean rebuild. Ingen side skal importere eller lage egen sidebar.
 *
 * Bruksområde:
 * Brukes kun av CollectiumAppShell.
 *
 * Berørte sider / routes:
 * - alle routes
 *
 * Berørte DB-brytere / feature_keys:
 * - navigation.view
 *
 * Berørte API-ruter:
 * - Ingen i v1 clean template
 *
 * Berørte tabeller / views:
 * - ct_v_app_menu senere
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: navigation
 * log_action: render_sidebar
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import Link from 'next/link';

const menu = [
  { href: '/startside', label: 'Startside', sub: 'Oversikt', icon: '⌂' },
  { href: '/katalog', label: 'Katalog', sub: 'Objekter', icon: '□' },
  { href: '/min-side', label: 'Min side', sub: 'Samling', icon: '◇' }
];

export function CollectiumSidebar() {
  return (
    <aside className="ct-sidebar" aria-label="Global sidemeny">
      <div className="ct-sidebar-decor" aria-hidden="true">
        <div className="ct-sidebar-anno"><span>ANNO</span><strong>2022</strong></div>
        <div className="ct-sidebar-stamp ct-sidebar-stamp--one"><span>COLLECTIUM · ANNO 2022</span><b>C</b></div>
        <div className="ct-sidebar-stamp ct-sidebar-stamp--two"><span>COLLECTIUM · ANNO 2022</span><b>C</b></div>
      </div>

      <Link className="ct-brand" href="/startside" aria-label="Collectium startside">
        <span className="ct-brand-mark">C</span>
        <span><strong>Collectium</strong><small>Samler · Historie · Finans</small></span>
      </Link>

      <nav className="ct-sidebar-nav" aria-label="Hovedmeny">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className="ct-sidebar-link">
            <span className="ct-sidebar-icon" aria-hidden="true">{item.icon}</span>
            <span><strong>{item.label}</strong><small>{item.sub}</small></span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
