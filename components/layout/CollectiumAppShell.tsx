"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CollectiumAppShell.module.css";

type CollectiumSkin = "signature-light" | "signature-dark" | "museum" | "finance";

type CollectiumAppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Index", icon: "I" },
  { href: "/katalog", label: "Katalog", icon: "K" },
  { href: "/test/periodefilter", label: "Periodefilter test", icon: "P" },
  { href: "/objekt/norske_sedler/banknote/1459", label: "Objekt", icon: "O" },
  { href: "/relasjon/regent/oscar-ii", label: "Relasjoner", icon: "R" },
  { href: "/min-side", label: "Min samling", icon: "M" },
  { href: "/auksjon", label: "Auksjon", icon: "A" },
  { href: "/forhandler", label: "Forhandler", icon: "F" },
  { href: "/admin", label: "Admin", icon: "S" },
];

const skins: { value: CollectiumSkin; label: string }[] = [
  { value: "signature-light", label: "Collectium" },
  { value: "signature-dark", label: "Dark" },
  { value: "museum", label: "Museum" },
  { value: "finance", label: "Finans" },
];

export function CollectiumAppShell({ children }: CollectiumAppShellProps) {
  const [skin, setSkin] = useState<CollectiumSkin>("signature-light");

  useEffect(() => {
    const stored = window.localStorage.getItem("collectium-active-skin") as CollectiumSkin | null;
    const nextSkin = stored && skins.some((item) => item.value === stored) ? stored : "signature-light";
    setSkin(nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.dataset.template = "collectium";
    document.documentElement.dataset.vp = "pc";
  }, []);

  function changeSkin(value: string) {
    const nextSkin = skins.some((item) => item.value === value) ? (value as CollectiumSkin) : "signature-light";
    setSkin(nextSkin);
    window.localStorage.setItem("collectium-active-skin", nextSkin);
    document.documentElement.dataset.skin = nextSkin;
  }

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
