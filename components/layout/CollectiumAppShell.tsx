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
  { href: "/katalog", label: "Katalog sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¸k", icon: Search, key: "katalog" },
  { href: "/min-side", label: "Min samling", icon: Archive, key: "samling" }, // TODO: change to /samling when collection page is active.
];

const skins: { value: CollectiumSkin; label: string }[] = [
  { value: "collectium", label: "Collectium" },
  { value: "samler", label: "Samler" },
  { value: "museum", label: "Museum" },
  { value: "finans", label: "Finans" },
];

function CollectiumAppShellInner({ children }: CollectiumAppShellProps) {
  const [skin, setSkin] = useState<CollectiumSkin>("collectium");
  const [bodyScale, setBodyScale] = useState<number>(0);
  const [headingScale, setHeadingScale] = useState<number>(0);
  const [headlineScale, setHeadlineScale] = useState<number>(0);

  const [bodyWeightLevel, setBodyWeightLevel] = useState<number>(0);
  const [headingWeightLevel, setHeadingWeightLevel] = useState<number>(0);
  const [headlineWeightLevel, setHeadlineWeightLevel] = useState<number>(0);

  const [isDesignMenuOpen, setIsDesignMenuOpen] = useState<boolean>(false);
  const pathname = usePathname() || "/";
  const {
    selectedScreenMode,
    setSelectedScreenMode,
    activeScreenMode,
    actualScreenWidth,
    sidebarMode,
    laneMode,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useCollectiumLayout();

  // Helper function to map bold and light levels to weight values
  function getFontWeight(base: number, boldLevel: number, lightLevel: number): number {
    if (boldLevel > 0) {
      if (boldLevel === 1) return 500;
      if (boldLevel === 2) return 600;
  const weightLevels = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

  function getFontWeight(base: number, level: number): number {
    switch (level) {
      case -6:
        return 200;
      case -5:
        return 250;
      case -4:
        return 300;
      case -3:
        return 350;
      case -2:
        return 375;
      case -1:
        return 400;
      case 1:
        return 500;
      case 2:
        return 550;
      case 3:
        return 600;
      case 4:
        return 650;
      case 5:
        return 700;
      case 6:
        return 800;
      default:
        return base;
    }
  }

  function getWeightLabel(level: number): string {
    if (level <= -6) return `${level} Sv\u00e6rt slank`;
    if (level < 0) return `${level} Slank`;
    if (level === 0) return "0 Normal";
    if (level >= 6) return `+${level} Sv\u00e6rt fet`;
    return `+${level} Fet`;
  }
    setSkin(nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.dataset.theme = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
    document.documentElement.dataset.template = "collectium";
    document.documentElement.dataset.vp = "pc";

    // Hovedskrift
    const storedBodyScale = window.localStorage.getItem("collectium-body-text-scale");
    const nextBodyScale = storedBodyScale ? parseInt(storedBodyScale, 10) : 0;
    setBodyScale(nextBodyScale);
    document.documentElement.style.setProperty("--ct-user-body-scale", `${nextBodyScale}px`);

    const storedBodyWeight = window.localStorage.getItem("collectium-body-weight-level");
    const nextBodyWeight = storedBodyWeight ? parseInt(storedBodyWeight, 10) : 0;
    setBodyWeightLevel(nextBodyWeight);
    document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, nextBodyWeight).toString());

    // Overskrift
    const storedHeadingScale = window.localStorage.getItem("collectium-heading-text-scale");
    const nextHeadingScale = storedHeadingScale ? parseInt(storedHeadingScale, 10) : 0;
    setHeadingScale(nextHeadingScale);
    document.documentElement.style.setProperty("--ct-user-heading-scale", `${nextHeadingScale}px`);

    const storedHeadingWeight = window.localStorage.getItem("collectium-heading-weight-level");
    const nextHeadingWeight = storedHeadingWeight ? parseInt(storedHeadingWeight, 10) : 0;
    setHeadingWeightLevel(nextHeadingWeight);
    document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, nextHeadingWeight).toString());

    // Headline
    const storedHeadlineScale = window.localStorage.getItem("collectium-headline-scale");
    const nextHeadlineScale = storedHeadlineScale ? parseInt(storedHeadlineScale, 10) : 0;
    setHeadlineScale(nextHeadlineScale);
    document.documentElement.style.setProperty("--ct-user-headline-scale", `${nextHeadlineScale}px`);

    const storedHeadlineWeight = window.localStorage.getItem("collectium-headline-weight-level");
    const nextHeadlineWeight = storedHeadlineWeight ? parseInt(storedHeadlineWeight, 10) : 0;
    setHeadlineWeightLevel(nextHeadlineWeight);
    document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, nextHeadlineWeight).toString());
  }, []);

  function changeSkin(value: string) {
    const nextSkin = skins.some((item) => item.value === value) ? (value as CollectiumSkin) : "collectium";
    setSkin(nextSkin);
    window.localStorage.setItem("collectium-active-skin", nextSkin);
    document.documentElement.dataset.skin = nextSkin;
    document.documentElement.dataset.theme = nextSkin;
    document.documentElement.setAttribute("data-ct-skin", nextSkin);
  }

  function updateBodyScale(val: number) {
    setBodyScale(val);
    window.localStorage.setItem("collectium-body-text-scale", val.toString());
    document.documentElement.style.setProperty("--ct-user-body-scale", `${val}px`);
  }
  function updateBodyWeightLevel(val: number) {
    setBodyWeightLevel(val);
    window.localStorage.setItem("collectium-body-weight-level", val.toString());
    document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, val).toString());
  }

  function updateHeadingScale(val: number) {
    setHeadingScale(val);
    window.localStorage.setItem("collectium-heading-text-scale", val.toString());
    document.documentElement.style.setProperty("--ct-user-heading-scale", `${val}px`);
  }

  function updateHeadingWeightLevel(val: number) {
    setHeadingWeightLevel(val);
    window.localStorage.setItem("collectium-heading-weight-level", val.toString());
    document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, val).toString());
  }

  function updateHeadlineScale(val: number) {
    setHeadlineScale(val);
    window.localStorage.setItem("collectium-headline-scale", val.toString());
    document.documentElement.style.setProperty("--ct-user-headline-scale", `${val}px`);
  }

  function updateHeadlineWeightLevel(val: number) {
    setHeadlineWeightLevel(val);
    window.localStorage.setItem("collectium-headline-weight-level", val.toString());
    document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, val).toString());
  }

  function resetDesign() {
    setSelectedScreenMode("auto");
    changeSkin("collectium");
    
    updateBodyScale(0);
    setBodyWeightLevel(0);
    window.localStorage.setItem("collectium-body-weight-level", "0");
    document.documentElement.style.setProperty("--ct-user-body-weight", "400");

    updateHeadingScale(0);
    setHeadingWeightLevel(0);
    window.localStorage.setItem("collectium-heading-weight-level", "0");
    document.documentElement.style.setProperty("--ct-user-heading-weight", "500");

    updateHeadlineScale(0);
    setHeadlineWeightLevel(0);
    window.localStorage.setItem("collectium-headline-weight-level", "0");
    document.documentElement.style.setProperty("--ct-user-headline-weight", "600");
  }

  // Close design menu on Escape
  useEffect(() => {
    if (!isDesignMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDesignMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDesignMenuOpen]);

  // Close design menu on click outside
  useEffect(() => {
    if (!isDesignMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#collectium-design-menu") && !target.closest("#design-menu-toggle-btn")) {
        setIsDesignMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDesignMenuOpen]);

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

  const isPeriodFilterTest = pathname === "/test/periodefilter" || pathname === "/periodefilter";

  return (
    <div
      className={styles.shell}
      data-screen-mode={activeScreenMode}
      data-sidebar-mode={sidebarMode}
      data-lane-mode={laneMode}
      data-mobile-menu-open={isMobileMenuOpen}
      data-page-periodfilter={isPeriodFilterTest}
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
              <input className={styles.search} placeholder="SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¸k i Collectium / bruker..." aria-label="SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¸k" />
            </div>
          </div>
          <div className={styles.topActions}>
            <div style={{ position: "relative" }}>
              <button
                id="design-menu-toggle-btn"
                type="button"
                className={`${styles.designMenuButton} ${isDesignMenuOpen ? styles.designMenuButtonActive : ""}`}
                onClick={() => setIsDesignMenuOpen(!isDesignMenuOpen)}
                aria-expanded={isDesignMenuOpen}
                aria-controls="collectium-design-menu"
              >
                Skjerm / Design
              </button>

              {isDesignMenuOpen && (
                <section
                  id="collectium-design-menu"
                  className={styles.designMegaMenu}
                  aria-label="Design og layout meny"
                >
                  <header className={styles.designMenuHeader}>
                    <h3>Skjerm &amp; Design</h3>
                    <button
                      type="button"
                      className={styles.closeMenuButton}
                      onClick={() => setIsDesignMenuOpen(false)}
                      aria-label="Lukk designmeny"
                    >
                      <X size={18} />
                    </button>
                  </header>

                  <div className={styles.designMenuGrid}>
                    {/* SECTION A: Screen Selection */}
                    <div className={styles.designMenuSection}>
                      <h4>Skjermvalg</h4>
                      <div className={styles.designMenuOptionGrid}>
                        {[
                          { key: "auto", label: "Auto" },
                          { key: "mobile", label: "Mobil" },
                          { key: "tablet", label: "Tablet" },
                          { key: "desktop", label: "Desktop" },
                          { key: "wide", label: "Bredskjerm" },
                          { key: "tv", label: "TV / Presentasjon" },
                        ].map((mode) => (
                          <button
                            key={mode.key}
                            type="button"
                            className={`${styles.designMenuOption} ${
                              selectedScreenMode === mode.key ? styles.designMenuOptionActive : ""
                            }`}
                            onClick={() => setSelectedScreenMode(mode.key as any)}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                      <div className={styles.designMenuStatus}>
                        <span>Faktisk bredde: <strong>{actualScreenWidth}px</strong></span>
                        <span>Aktiv modus: <strong>{activeScreenMode === "tv" ? "TV / Presentasjon" : activeScreenMode}</strong></span>
                        <span>Lane mode: <strong>{laneMode}</strong></span>
                      </div>
                    </div>

                    {/* SECTION B: Skin Selection */}
                    <div className={styles.designMenuSection}>
                      <h4>Skin-valg</h4>
                      <div className={styles.designMenuOptionGrid}>
                        {skins.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            className={`${styles.designMenuOption} ${
                              skin === item.value ? styles.designMenuOptionActive : ""
                            }`}
                            onClick={() => changeSkin(item.value)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION C: Typography Scales and Weights */}
                    <div className={styles.designMenuSection} style={{ gridColumn: "span 2" }}>
                      <h4>Typografi</h4>

                      <div className={styles.designSliderGroup}>
                        {[
                          {
                            key: "body",
                            title: "Hovedskrift",
                            sizeValue: bodyScale,
                            sizeChange: updateBodyScale,
                            weightValue: bodyWeightLevel,
                            weightChange: updateBodyWeightLevel,
                            sizeMin: -2,
                            sizeMax: 4
                          },
                          {
                            key: "heading",
                            title: "Overskrift",
                            sizeValue: headingScale,
                            sizeChange: updateHeadingScale,
                            weightValue: headingWeightLevel,
                            weightChange: updateHeadingWeightLevel,
                            sizeMin: -2,
                            sizeMax: 4
                          },
                          {
                            key: "headline",
                            title: "Headline",
                            sizeValue: headlineScale,
                            sizeChange: updateHeadlineScale,
                            weightValue: headlineWeightLevel,
                            weightChange: updateHeadlineWeightLevel,
                            sizeMin: -2,
                            sizeMax: 6
                          }
                        ].map((item) => (
                          <div className={styles.designSliderSubSection} key={item.key}>
                            <h5>{item.title}</h5>

                            <div className={styles.designSliderRow}>
                              <div className={styles.designSliderLabel}>
                                <span>{"St\u00f8rrelse"}</span>
                                <strong>{item.sizeValue > 0 ? `+${item.sizeValue}` : item.sizeValue}</strong>
                              </div>
                              <input
                                type="range"
                                min={item.sizeMin}
                                max={item.sizeMax}
                                step="1"
                                value={item.sizeValue}
                                onChange={(event) => item.sizeChange(parseInt(event.target.value, 10))}
                                aria-label={`Juster ${item.title.toLowerCase()} st\u00f8rrelse`}
                              />
                            </div>

                            <div className={styles.designWeightControl}>
                              <div className={styles.designSliderLabel}>
                                <span>Skriftvekt</span>
                                <strong>{getWeightLabel(item.weightValue)}</strong>
                              </div>

                              <div className={styles.designWeightSteps} role="group" aria-label={`${item.title} skriftvekt`}>
                                {weightLevels.map((level) => (
                                  <button
                                    type="button"
                                    key={`${item.key}-${level}`}
                                    className={`${styles.designWeightStep} ${item.weightValue === level ? styles.designWeightStepActive : ""}`}
                                    onClick={() => item.weightChange(level)}
                                    aria-pressed={item.weightValue === level}
                                  >
                                    {level > 0 ? `+${level}` : level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  <footer className={styles.designMenuFooter}>
                    <button
                      type="button"
                      className={styles.designResetButton}
                      onClick={resetDesign}
                    >
                      Tilbakestill designvalg
                    </button>
                  </footer>
                </section>
              )}
            </div>
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
