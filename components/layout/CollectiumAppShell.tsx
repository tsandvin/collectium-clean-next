/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumAppShell
 *
 * Definering / formÃ¥l:
 * Globalt visuelt skall for Collectium: sidemeny, toppbar og innholdsramme.
 * Skal hindre at enkeltsider lager egen shell/topbar/sidebar.
 *
 * BruksomrÃ¥de:
 * Importeres i app/layout.tsx og pakker alle sider.
 *
 * BerÃ¸rte sider / routes:
 * - Alle sider
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - navigation.view
 * - layout.view
 *
 * Dataretning:
 * UI-shell. Ingen direkte DB-skriving.
 */
import Link from "next/link";
import styles from "./CollectiumAppShell.module.css";

const navItems = [
  { href: "/", label: "Index", icon: "âŒ‚" },
  { href: "/katalog", label: "Katalog", icon: "â–¦" },
  { href: "/test/periodefilter", label: "Periodefilter test", icon: "âŒ" },
  { href: "/objekt/norske_sedler/banknote/1459", label: "Objekt", icon: "â—ˆ" },
  { href: "/relasjon/regent/oscar-ii", label: "Relasjoner", icon: "â—‡" },
  { href: "/samling", label: "Min samling", icon: "â™¡" },
  { href: "/auksjon", label: "Auksjon", icon: "âš‘" },
  { href: "/forhandler", label: "Forhandler", icon: "â–£" },
  { href: "/admin", label: "Admin", icon: "âš™" },
];

export default function CollectiumAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Collectium meny">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span>
            <strong>Collectium</strong>
            <small>UI/UX 8.6</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <span className={styles.statusDot} />
          Global layout aktiv
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="SÃ¸k i Collectium katalogen / bruker..." />
          </div>
          <div className={styles.topActions}>
            <select className={styles.segmentSelect} defaultValue="samler" aria-label="Segment">
              <option value="samler">Samler</option>
              <option value="historie">Historie</option>
              <option value="finans">Finans</option>
            </select>
            <Link href="/login" className={styles.loginButton}>Login</Link>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}