/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Sidebar UI 8.5
 *
 * Definering / formÃ¥l:
 * Global sidemeny med SVG-ikoner, temaavhengig visuell stil, aktivt menypanel, statuskort og Collectium-identitet.
 *
 * BruksomrÃ¥de:
 * Brukes av global app/layout eller AppShell.
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - Ingen. Ren global navigasjon/visning.
 *
 * Dataretning:
 * DB/API -> Next.js -> React -> UI
 */

type NavItem = {
  href: string;
  label: string;
  count: string;
  icon: "activity" | "catalog" | "collection" | "auction" | "relations" | "rules";
};

const navItems: NavItem[] = [
  { href: "/", label: "Aktivitet", count: "01", icon: "activity" },
  { href: "/katalog", label: "Katalog", count: "24", icon: "catalog" },
  { href: "/min-side", label: "Min samling", count: "08", icon: "collection" },
  { href: "/auksjon", label: "Auksjon", count: "12", icon: "auction" },
  { href: "/relasjon", label: "Relasjoner", count: "17", icon: "relations" },
  { href: "/admin/system/mariadb-neon", label: "Regler", count: "06", icon: "rules" },
];

function Icon({ type }: { type: NavItem["icon"] }) {
  if (type === "activity") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5h6v13H4v-13Zm10 0h6v13h-6v-13Z" />
        <path d="M7 8.5v7M17 8.5v7" />
      </svg>
    );
  }

  if (type === "catalog") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="10" r="4" />
        <path d="m13.4 13.4 5.1 5.1" />
        <path d="M6.8 10h6.4" />
      </svg>
    );
  }

  if (type === "collection") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4.1 4.1 0 0 1 7-2.9A4.1 4.1 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
    );
  }

  if (type === "auction") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 18 18 6M11 6h7v7" />
        <path d="M6 18h6" />
      </svg>
    );
  }

  if (type === "relations") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9c4 0 4 6 8 6h6" />
        <path d="M5 15c4 0 4-6 8-6h6" />
        <path d="m17 6 3 3-3 3M17 12l3 3-3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h10l2 2v12l-6-2-6 2V4Z" />
      <path d="M9 8h6M9 11h5" />
    </svg>
  );
}

export default function Sidebar() {
  return (
    <aside className="ct-sidebar-enhanced" aria-label="Collectium hovedmeny">
      <div className="ct-sidebar-logo-card">
        <img 
          src="/collectium-logo.svg" 
          alt="Collectium" 
          className="ct-logo-image"
          style={{ height: "60px", width: "auto" }}
        />
      </div>

      <nav className="ct-sidebar-nav" aria-label="Hovednavigasjon">
        {navItems.map((item, index) => (
          <a
            key={item.href}
            className={`ct-sidebar-link ${index === 0 ? "is-active" : ""}`}
            href={item.href}
            aria-current={index === 0 ? "page" : undefined}
          >
            <span className="ct-sidebar-icon">
              <Icon type={item.icon} />
            </span>
            <span className="ct-sidebar-label">{item.label}</span>
            <span className="ct-sidebar-count">{item.count}</span>
          </a>
        ))}
      </nav>

      <div className="ct-sidebar-status">
        <div className="ct-sidebar-status-title">Aktiv kontroll</div>
        <div className="ct-sidebar-meter-row">
          <span>Sidefelter kontrollert</span>
          <strong>10/10</strong>
        </div>
        <div className="ct-sidebar-meter">
          <span style={{ width: "82%" }} />
        </div>
        <div className="ct-sidebar-meter-row">
          <span>Tema / skjermtype</span>
          <strong>Collectium</strong>
        </div>
      </div>

      <div className="ct-sidebar-progress">
        <span>Profil fullfÃ¸rt</span>
        <strong>82%</strong>
        <div className="ct-sidebar-meter">
          <span style={{ width: "82%" }} />
        </div>
        <p>
          01 Sidemeny Â· Global layout. Aktiv knapp, SVG-ikon og statusfelt fÃ¸lger valgt tema.
        </p>
      </div>
    </aside>
  );
}