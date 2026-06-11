import Link from "next/link";

type IconName = "home" | "catalog" | "collection";

const menu: Array<{
  href: string;
  label: string;
  sub: string;
  icon: IconName;
}> = [
  { href: "/startside", label: "Startside", sub: "Oversikt", icon: "home" },
  { href: "/katalog", label: "Katalog", sub: "Objekter", icon: "catalog" },
  { href: "/min-side", label: "Min side", sub: "Samling", icon: "collection" },
];

function MenuIcon({ name }: { name: IconName }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-5h4v5" />
      </svg>
    );
  }

  if (name === "catalog") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5h14v13H5z" />
        <path d="M8 9h8" />
        <path d="M8 12h8" />
        <path d="M8 15h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4.5 19.5 9 12 13.5 4.5 9 12 4.5Z" />
      <path d="M4.5 13 12 17.5 19.5 13" />
      <path d="M4.5 17 12 21.5 19.5 17" />
    </svg>
  );
}

export function CollectiumSidebar() {
  return (
    <aside className="ct-sidebar" aria-label="Global sidemeny">
      <Link className="ct-brand" href="/startside" aria-label="Collectium startside">
        <span className="ct-brand-mark">C</span>
        <span className="ct-brand-text">
          <strong>Collectium</strong>
          <small>Museum Â· Historie Â· Samling</small>
        </span>
      </Link>

      <nav className="ct-sidebar-nav" aria-label="Hovedmeny">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className="ct-sidebar-link">
            <span className="ct-sidebar-icon">
              <MenuIcon name={item.icon} />
            </span>
            <span>
              <strong>{item.label}</strong>
              <small>{item.sub}</small>
            </span>
          </Link>
        ))}
      </nav>

      <div className="ct-sidebar-note">
        <span>Collectium</span>
        <strong>Anno 2022</strong>
      </div>
    </aside>
  );
}
