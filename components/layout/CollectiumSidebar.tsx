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
        <span className="ct-brand-text">
          <strong>Collectium</strong>
          <small>Katalog Â· Samling Â· Marked</small>
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
