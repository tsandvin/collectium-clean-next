"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Sidebar UI 8.5
 *
 * Definering / formål:
 * Global sidemeny med SVG-ikoner, temaavhengig visuell stil, aktivt menypanel, statuskort og Collectium-identitet.
 *
 * Bruksområde:
 * Brukes av global app/layout eller AppShell.
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Ren global navigasjon/visning.
 *
 * Dataretning:
 * DB/API -> Next.js -> React -> UI
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { collectiumSidebarItems } from "./layout/collectiumSidebarItems";

type IconType = "activity" | "catalog" | "collection" | "auction" | "relations" | "rules";

const keyToIconMap: Record<string, IconType> = {
  index: "activity",
  catalog: "catalog",
  "period-filter": "catalog",
  object: "catalog",
  relations: "relations",
  account: "collection",
  collection: "collection",
  auction: "auction",
  shop: "auction",
  dealer: "auction",
  admin: "rules",
  "admin-neon": "rules",
  support: "rules",
};

const keyToCountMap: Record<string, string> = {
  index: "01",
  catalog: "24",
  "period-filter": "05",
  object: "09",
  relations: "17",
  account: "08",
  collection: "12",
  auction: "10",
  shop: "03",
  dealer: "02",
  admin: "04",
  "admin-neon": "06",
  support: "07",
};

function Icon({ type }: { type: IconType }) {
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
  const pathname = usePathname() || "/";

  function isActiveItem(pathname: string, href: string, key: string) {
    if (key === "index") return pathname === "/";
    if (key === "admin-neon") return pathname.startsWith("/admin/neon");
    if (key === "admin") return pathname === "/admin" || (pathname.startsWith("/admin") && !pathname.startsWith("/admin/neon"));
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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

      <nav className="ct-sidebar-nav" aria-label="Hovednavigasjon" style={{ display: "grid", gap: "14px" }}>
        {(["Hoved", "Bruker", "Marked", "System"] as const).map((groupName) => {
          const items = collectiumSidebarItems.filter((item) => item.group === groupName);
          return (
            <div key={groupName} className="ct-sidebar-group" style={{ display: "grid", gap: "6px" }}>
              <div className="ct-sidebar-group-title" style={{ fontSize: "10px", fontWeight: 700, padding: "4px 14px 2px", textTransform: "uppercase", opacity: 0.5, letterSpacing: "0.05em", color: "var(--ct-sidebar-muted, var(--ct-muted))" }}>
                {groupName}
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {items.map((item) => {
                  const icon = keyToIconMap[item.key] || "rules";
                  const count = keyToCountMap[item.key] || "00";
                  const isActive = isActiveItem(pathname, item.href, item.key);
                  return (
                    <Link
                      key={item.key}
                      className={`ct-sidebar-link ${isActive ? "is-active" : ""}`}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="ct-sidebar-icon">
                        <Icon type={icon} />
                      </span>
                      <span className="ct-sidebar-label">{item.label}</span>
                      <span className="ct-sidebar-count">{count}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
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
        <span>Profil fullført</span>
        <strong>82%</strong>
        <div className="ct-sidebar-meter">
          <span style={{ width: "82%" }} />
        </div>
        <p>
          01 Sidemeny · Global layout. Aktiv knapp, SVG-ikon og statusfelt følger valgt tema.
        </p>
      </div>
    </aside>
  );
}