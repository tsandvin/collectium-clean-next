"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home,
  Search,
  CalendarDays,
  Box,
  Network,
  Archive,
  Gavel,
  Store,
  ShieldCheck
} from "lucide-react";
import styles from "./CollectiumAppShell.module.css";

type CollectiumSkin = "collectium" | "samler" | "museum" | "finans";

type CollectiumAppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Index", icon: Home },
  { href: "/katalog", label: "Katalog", icon: Search },
  { href: "/test/periodefilter", label: "Periodefilter test", icon: CalendarDays },
  { href: "/objekt/norske_sedler/banknote/1459", label: "Objekt", icon: Box },
  { href: "/relasjon/regent/oscar-ii", label: "Relasjoner", icon: Network },
  { href: "/min-side", label: "Min samling", icon: Archive },
  { href: "/auksjon", label: "Auksjon", icon: Gavel },
  { href: "/forhandler", label: "Forhandler", icon: Store },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

const skins: { value: CollectiumSkin; label: string }[] = [
  { value: "collectium", label: "Collectium" },
  { value: "samler", label: "Enkel" },
  { value: "museum", label: "Museum" },
  { value: "finans", label: "Finans" },
];

export function CollectiumAppShell({ children }: CollectiumAppShellProps) {
  const [skin, setSkin] = useState<CollectiumSkin>("collectium");

  useEffect(() => {
    const stored = window.localStorage.getItem("collectium-active-skin") as CollectiumSkin | null;
    const nextSkin = stored && skins.some((item) => item.value === stored) ? stored : "collectium";
    setSkin(nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
    document.documentElement.dataset.template = "collectium";
    document.documentElement.dataset.vp = "pc";
  }, []);

  function changeSkin(value: string) {
    const nextSkin = skins.some((item) => item.value === value) ? (value as CollectiumSkin) : "collectium";
    setSkin(nextSkin);
    window.localStorage.setItem("collectium-active-skin", nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Collectium navigasjon">
        <Link href="/" className={styles.brand} style={{ paddingLeft: "4px" }}>
          <img
            src={
              skin === "museum" || skin === "finans"
                ? "/collectium-logo-white.png"
                : "/collectium-logo-black.png"
            }
            alt="Collectium"
            style={{
              height: "38px",
              width: "auto",
              display: "block",
              mixBlendMode: skin === "museum" || skin === "finans" ? "screen" : "multiply",
            }}
          />
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.href} href={item.href} className={styles.navItem}>
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
          <div className={styles.searchWrap}>
            <input className={styles.search} placeholder="Sok i Collectium / bruker..." aria-label="Sok" />
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
    </div>
  );
}
