/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumSidebar
 *
 * Definering / formÃ¥l:
 * Eneste globale sidemeny i clean rebuild. NÃ¸ytral versjon uten skin, dekor,
 * ANNO, watermark eller stempler.
 *
 * BruksomrÃ¥de:
 * Brukes kun av CollectiumAppShell.
 *
 * BerÃ¸rte sider / routes:
 * - alle routes
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - navigation.view
 *
 * BerÃ¸rte API-ruter:
 * - Ingen
 *
 * BerÃ¸rte tabeller / views:
 * - ct_v_app_menu senere
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: navigation
 * log_action: render_sidebar
 *
 * Versjon:
 * CT-SIDEBAR-NEUTRAL-0001 / CHANGE-2026-06-12-REMOVE-DECOR
 */

import Link from "next/link";

const menu = [
  { href: "/startside", label: "Startside", sub: "Oversikt", icon: "âŒ‚" },
  { href: "/katalog", label: "Katalog", sub: "Objekter", icon: "â–¡" },
  { href: "/min-side", label: "Min side", sub: "Samling", icon: "â—‡" },
];

export function CollectiumSidebar() {
  return (
    <aside className="ct-sidebar" aria-label="Global sidemeny">
      <Link className="ct-brand" href="/startside" aria-label="Collectium startside">
        <span className="ct-brand-mark">C</span>
        <span>
          <strong>Collectium</strong>
          <small>Samler Â· Historie Â· Finans</small>
        </span>
      </Link>

      <nav className="ct-sidebar-nav" aria-label="Hovedmeny">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className="ct-sidebar-link">
            <span className="ct-sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.sub}</small>
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
