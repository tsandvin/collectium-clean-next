import Link from "next/link";
import { collectiumSidebarItems } from "./collectiumSidebarItems";

type IconName = "home" | "catalog" | "collection" | "market";

const keyToIconMap: Record<string, IconName> = {
  index: "home",
  catalog: "catalog",
  "period-filter": "catalog",
  object: "catalog",
  relations: "catalog",
  account: "collection",
  collection: "collection",
  auction: "market",
  shop: "market",
  dealer: "market",
  admin: "market",
  "admin-neon": "market",
  support: "market",
};

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

  if (name === "collection") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5 19.5 9 12 13.5 4.5 9 12 4.5Z" />
        <path d="M4.5 13 12 17.5 19.5 13" />
        <path d="M4.5 17 12 21.5 19.5 17" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 18.5h15" />
      <path d="M6.5 16v-4" />
      <path d="M11.5 16V8" />
      <path d="M16.5 16v-6" />
      <path d="M4.5 5.5h15" />
    </svg>
  );
}

export function CollectiumSidebar() {
  return (
    <aside className="ct-sidebar" aria-label="Global sidemeny">
      <Link className="ct-brand" href="/" aria-label="Collectium startside">
        <span className="ct-brand-mark">C</span>
        <span className="ct-brand-text">
          <strong>Collectium</strong>
          <small>Katalog · Samling · Marked</small>
        </span>
      </Link>

      <nav className="ct-sidebar-nav" aria-label="Hovedmeny" style={{ display: "grid", gap: "12px" }}>
        {(["Hoved", "Bruker", "Marked", "System"] as const).map((groupName) => {
          const items = collectiumSidebarItems.filter((item) => item.group === groupName);
          return (
            <div key={groupName} className="ct-sidebar-group" style={{ display: "grid", gap: "4px" }}>
              <div className="ct-sidebar-group-title" style={{ fontSize: "10px", fontWeight: 700, padding: "4px 12px 2px", textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.05em" }}>
                {groupName}
              </div>
              {items.map((item) => (
                <Link key={item.key} href={item.href} className="ct-sidebar-link">
                  <span className="ct-sidebar-icon">
                    <MenuIcon name={keyToIconMap[item.key] || "market"} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="ct-sidebar-footer">
        <span>Collectium</span>
        <strong>Anno 2022</strong>
      </div>
    </aside>
  );
}
