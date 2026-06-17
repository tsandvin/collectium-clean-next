import Link from "next/link";
import styles from "./CollectiumAppShell.module.css";

type CollectiumAppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Index", icon: "⌁" },
  { href: "/katalog", label: "Katalog", icon: "▦" },
  { href: "/test/periodefilter", label: "Periodefilter test", icon: "⌘" },
  { href: "/objekt/norske_sedler/banknote/1459", label: "Objekt", icon: "◫" },
  { href: "/relasjon/regent/oscar-ii", label: "Relasjoner", icon: "◇" },
  { href: "/min-side", label: "Min samling", icon: "♡" },
  { href: "/auksjon", label: "Auksjon", icon: "⚑" },
  { href: "/forhandler", label: "Forhandler", icon: "□" },
  { href: "/admin", label: "Admin", icon: "⚙" },
];

export function CollectiumAppShell({ children }: CollectiumAppShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Collectium navigasjon">
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandText}>
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

        <div className={styles.statusPill}>
          <span className={styles.statusDot} />
          Global layout aktiv
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="Søk i Collectium / bruker..." aria-label="Søk" />
          </div>
          <div className={styles.topActions}>
            <select className={styles.segmentSelect} defaultValue="samler" aria-label="Segment">
              <option value="samler">Samler</option>
              <option value="historie">Historie</option>
              <option value="finans">Finans</option>
            </select>
            <Link className={styles.loginButton} href="/login">Login</Link>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
