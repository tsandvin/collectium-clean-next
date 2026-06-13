"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Mobile Navigation UI 8.5
 *
 * Definering / formÃ¥l:
 * Samler mobil/tablet toppmeny, hamburgerpanel, sÃ¸k og app-lignende bunnbar.
 *
 * BruksomrÃ¥de:
 * Renderes globalt i app/layout.tsx.
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - Ingen. Ren global navigasjon/UI.
 *
 * Dataretning:
 * Browser/UI -> navigasjonslenker
 *
 * Endringsregel:
 * Komponenten skal ikke hente data, skrive data eller eie tilgangslogikk.
 */

import { useEffect, useMemo, useState } from "react";

type NavItem = {
  key: string;
  label: string;
  shortLabel: string;
  href: string;
  icon: "search" | "index" | "catalog" | "profile" | "collection" | "auction" | "relations" | "settings" | "login";
  bottom: boolean;
};

const navItems: NavItem[] = [
  { key: "search", label: "SÃ¸k", shortLabel: "SÃ¸k", href: "/sok", icon: "search", bottom: true },
  { key: "index", label: "Index", shortLabel: "Index", href: "/", icon: "index", bottom: true },
  { key: "catalog", label: "Katalog", shortLabel: "Katalog", href: "/katalog", icon: "catalog", bottom: true },
  { key: "profile", label: "Min side", shortLabel: "Min side", href: "/min-side", icon: "profile", bottom: true },

  { key: "collection", label: "Min samling", shortLabel: "Samling", href: "/min-side/samling", icon: "collection", bottom: false },
  { key: "auction", label: "Auksjon", shortLabel: "Auksjon", href: "/auksjon", icon: "auction", bottom: false },
  { key: "relations", label: "Relasjoner", shortLabel: "Relasjon", href: "/relasjon", icon: "relations", bottom: false },
  { key: "settings", label: "Innstillinger / tema", shortLabel: "Tema", href: "/innstillinger", icon: "settings", bottom: false },
  { key: "login", label: "Login", shortLabel: "Login", href: "/login", icon: "login", bottom: false },
];

function Icon({ type }: { type: NavItem["icon"] }) {
  if (type === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10" cy="10" r="4" />
        <path d="m13.4 13.4 5.1 5.1" />
      </svg>
    );
  }

  if (type === "index") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-5h4v5" />
      </svg>
    );
  }

  if (type === "catalog") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z" />
      </svg>
    );
  }

  if (type === "profile") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.3-4 12.7-4 14 0" />
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

  if (type === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="M19 12h2M3 12h2M12 3v2M12 19v2M17 5.8l-1.4 1.4M8.4 16.8 7 18.2M7 5.8l1.4 1.4M15.6 16.8l1.4 1.4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17H5V7h5" />
      <path d="M13 7l5 5-5 5" />
      <path d="M8 12h10" />
    </svg>
  );
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export default function CollectiumMobileNavigation() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("/");
  const bottomItems = useMemo(() => navItems.filter((item) => item.bottom), []);
  const menuItems = useMemo(() => navItems.filter((item) => !item.bottom), []);

  useEffect(() => {
    const update = () => setPath(normalizePath(window.location.pathname));
    update();

    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);

    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.ctMobileMenu = open ? "open" : "closed";
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.documentElement.dataset.ctMobileMenu = "closed";
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => {
    const normalized = normalizePath(href);
    if (normalized === "/") return path === "/";
    return path === normalized || path.startsWith(`${normalized}/`);
  };

  return (
    <>
      <div className="ct-mobile-topbar" aria-label="Collectium mobil toppmeny">
        <button
          className="ct-mobile-menu-button"
          type="button"
          aria-label={open ? "Lukk meny" : "Ã…pne meny"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <a className="ct-mobile-brand" href="/">
          <span className="ct-mobile-brand-mark">C</span>
          <span className="ct-mobile-brand-text">
            <strong>Collectium</strong>
            <small>Beta UI/UX 8.5</small>
          </span>
        </a>

        <a className="ct-mobile-top-action" href="/min-side">
          Min side
        </a>
      </div>

      <div className={`ct-mobile-menu-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />

      <aside className={`ct-mobile-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="ct-mobile-drawer-header">
          <div>
            <span>Collectium</span>
            <strong>Meny</strong>
          </div>
          <button type="button" aria-label="Lukk meny" onClick={() => setOpen(false)}>
            Ã—
          </button>
        </div>

        <form className="ct-mobile-search" action="/sok">
          <label htmlFor="ct-mobile-search-input">SÃ¸k i Collectium</label>
          <div>
            <Icon type="search" />
            <input
              id="ct-mobile-search-input"
              name="q"
              type="search"
              placeholder="SÃ¸k objekt, bruker, relasjon..."
              autoComplete="off"
            />
          </div>
        </form>

        <nav className="ct-mobile-drawer-nav" aria-label="Mobilmeny">
          {menuItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={isActive(item.href) ? "is-active" : ""}
              onClick={() => setOpen(false)}
            >
              <Icon type={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <nav className="ct-mobile-bottom-bar" aria-label="Collectium mobil bunnnavigasjon">
        {bottomItems.map((item) => (
          <a key={item.key} href={item.href} className={isActive(item.href) ? "is-active" : ""}>
            <Icon type={item.icon} />
            <span>{item.shortLabel}</span>
          </a>
        ))}
      </nav>
    </>
  );
}