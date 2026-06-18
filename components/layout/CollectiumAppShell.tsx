"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  CalendarDays,
  Box,
  Network,
  Archive,
  Gavel,
  Store,
  ShieldCheck,
  Menu,
  X,
  UserRound
} from "lucide-react";
import styles from "./CollectiumAppShell.module.css";
import { CollectiumLayoutModeProvider, useCollectiumLayout } from "./CollectiumLayoutModeProvider";

type CollectiumSkin = "collectium" | "samler" | "museum" | "finans";

type CollectiumAppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Index", icon: Home },
  { href: "/katalog", label: "Katalog", icon: Search },
  { href: "/test/periodefilter", label: "Periodefilter test", icon: CalendarDays },
  { href: "/objekt/norske_sedler/banknote/1459", label: "Objekt", icon: Box },
  { href: "/relasjon/regent/oscar-ii", label: "Relasjoner", icon: Network, disabled: true },
  { href: "/min-side", label: "Min samling", icon: Archive },
  { href: "/auksjon", label: "Auksjon", icon: Gavel, disabled: true },
  { href: "/forhandler", label: "Forhandler", icon: Store, disabled: true },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

const mobileBottomItems = [
  { href: "/min-side", label: "Min side", icon: UserRound, key: "minside" },
  { href: "/", label: "Index", icon: Home, key: "index" },
  { href: "/katalog", label: "Katalog søk", icon: Search, key: "katalog" },
  { href: "/min-side", label: "Min samling", icon: Archive, key: "samling" }, // TODO: change to /samling when collection page is active.
];

const skins: { value: CollectiumSkin; label: string }[] = [
  { value: "collectium", label: "Collectium" },
  { value: "samler", label: "Enkel" },
  { value: "museum", label: "Museum" },
  { value: "finans", label: "Finans" },
];

function CollectiumAppShellInner({ children }: CollectiumAppShellProps) {
  const [skin, setSkin] = useState<CollectiumSkin>("collectium");
  const pathname = usePathname() || "/";
  const {
    activeScreenMode,
    sidebarMode,
    laneMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useCollectiumLayout();

  useEffect(() => {
    const stored = window.localStorage.getItem("collectium-active-skin") as CollectiumSkin | null;
    const nextSkin = stored && skins.some((item) => item.value === stored) ? stored : "collectium";
    setSkin(nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.dataset.theme = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
    document.documentElement.dataset.template = "collectium";
    document.documentElement.dataset.vp = "pc";
  }, []);

  function changeSkin(value: string) {
    const nextSkin = skins.some((item) => item.value === value) ? (value as CollectiumSkin) : "collectium";
    setSkin(nextSkin);
    window.localStorage.setItem("collectium-active-skin", nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.dataset.theme = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
  }

  function checkActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/test/periodefilter" || href === "/periodefilter") {
      return pathname === "/test/periodefilter" || pathname === "/periodefilter";
    }
    if (href.startsWith("/katalog")) {
      return pathname.startsWith("/katalog");
    }
    if (href.startsWith("/objekt")) {
      return pathname.startsWith("/objekt");
    }
    if (href.startsWith("/relasjon")) {
      return pathname.startsWith("/relasjon");
    }
    if (href.startsWith("/samling") || href.startsWith("/min-side")) {
      return pathname.startsWith("/samling") || pathname.startsWith("/min-side");
    }
    if (href.startsWith("/auksjon")) {
      return pathname.startsWith("/auksjon");
    }
    if (href.startsWith("/forhandler")) {
      return pathname.startsWith("/forhandler");
    }
    if (href.startsWith("/admin")) {
      return pathname.startsWith("/admin");
    }
    return pathname.startsWith(href);
  }

  function checkMobileBottomActive(item: typeof mobileBottomItems[number]) {
    if (item.key === "index") return pathname === "/";
    if (item.key === "katalog") return pathname.startsWith("/katalog");
    if (item.key === "samling") return pathname.startsWith("/samling");
    if (item.key === "minside") return pathname.startsWith("/min-side");
    return pathname === item.href;
  }

  const isDarkSkin = skin === "museum" || skin === "finans";

  return (
    <div
      className={styles.shell}
      data-screen-mode={activeScreenMode}
      data-sidebar-mode={sidebarMode}
      data-lane-mode={laneMode}
      data-mobile-menu-open={isMobileMenuOpen}
    >
      {/* Mobile drawer backdrop */}
      {isMobileMenuOpen && (sidebarMode === "hidden" || sidebarMode === "compact") && (
        <div className={styles.backdrop} onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      )}

      <aside className={styles.sidebar} aria-label="Collectium navigasjon">
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.brand} onClick={() => setIsMobileMenuOpen(false)} aria-label="Collectium startside">
            <img
              src={isDarkSkin ? "/collectium-logo-white.png" : "/collectium-logo-black.png"}
              alt="Collectium"
              className={styles.brandLogo}
            />
            <span className={styles.brandBeta}>Beta 8.5</span>
          </Link>
          
          {(sidebarMode === "hidden" || sidebarMode === "compact") && (
            <button
              className={styles.closeMenuButton}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Lukk meny"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = checkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`${styles.navItem} ${isActive && !item.disabled ? styles.isActive : ""} ${item.disabled ? styles.disabled : ""}`}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  } else {
                    setIsMobileMenuOpen(false);
                  }
                }}
                aria-current={isActive && !item.disabled ? "page" : undefined}
              >
                <span className={styles.navIcon}>
                  <IconComponent size={22} />
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            {(sidebarMode === "hidden" || sidebarMode === "compact") && (
              <button
                className={styles.menuButton}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Apne meny"
              >
                <Menu size={22} />
              </button>
            )}
            <div className={styles.searchWrap}>
              <input className={styles.search} placeholder="Søk i Collectium / bruker..." aria-label="Søk" />
            </div>
          </div>
          <div className={styles.topActions}>
            <label className={styles.skinLabel}>
              <span>Skin</span>
              <select className={styles.skinSelect} value={skin} onChange={(event) => changeSkin(event.target.value)} aria-label="Velg skin">
                {skins.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <Link className={styles.loginButton} href="/login">Login</Link>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      <nav className={styles.mobileBottomNav} aria-label="Mobil hovednavigasjon">
        {mobileBottomItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = checkMobileBottomActive(item);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`${styles.mobileBottomItem} ${isActive ? styles.mobileBottomItemActive : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <IconComponent size={20} strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function CollectiumAppShell({ children }: CollectiumAppShellProps) {
  return (
    <CollectiumLayoutModeProvider>
      <CollectiumAppShellInner>{children}</CollectiumAppShellInner>
    </CollectiumLayoutModeProvider>
  );
}

