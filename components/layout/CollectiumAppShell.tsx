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
  UserRound,
  Bell,
  ShoppingCart,
  Database,
  HelpCircle
} from "lucide-react";
import styles from "./CollectiumAppShell.module.css";
import { collectiumSidebarItems } from "./collectiumSidebarItems";
import { CollectiumLayoutModeProvider, useCollectiumLayout } from "./CollectiumLayoutModeProvider";

type CollectiumSkin = "collectium" | "samler" | "museum" | "finans";

type CollectiumAppShellProps = {
  children: React.ReactNode;
};

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  index: Home,
  catalog: Search,
  "period-filter": CalendarDays,
  "period-search": CalendarDays,
  object: Box,
  relations: Network,
  account: UserRound,
  collection: Archive,
  auction: Gavel,
  shop: ShoppingCart,
  dealer: Store,
  admin: ShieldCheck,
  "admin-neon": Database,
  support: HelpCircle,
};

const mobileBottomItems = [
  {
    key: "min-side",
    label: "Min side",
    href: "/min-side",
    icon: iconMap["account"],
    requiresAuth: false,
  },
  {
    key: "min-samling",
    label: "Min samling",
    href: "/samling",
    icon: iconMap["account"],
    requiresAuth: false,
  },
  {
    key: "menu",
    label: "Meny",
    href: undefined,
    icon: Menu,
    elevated: true,
    requiresAuth: false,
  },
  {
    key: "katalog",
    label: "Katalog",
    href: "/katalog",
    icon: iconMap["catalog"],
    requiresAuth: false,
  },
  {
    key: "auksjon",
    label: "Auksjon",
    href: "/auksjon",
    icon: iconMap["auction"],
    requiresAuth: false,
  },
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

  const [bodyBoldLevel, setBodyBoldLevel] = useState<number>(0);
  const [bodyLightLevel, setBodyLightLevel] = useState<number>(0);

  const [headingBoldLevel, setHeadingBoldLevel] = useState<number>(0);
  const [headingLightLevel, setHeadingLightLevel] = useState<number>(0);

  const [headlineBoldLevel, setHeadlineBoldLevel] = useState<number>(0);
  const [headlineLightLevel, setHeadlineLightLevel] = useState<number>(0);

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

  const [session, setSession] = useState<{
    authenticated: boolean;
    user: {
      id: string;
      displayName: string;
      email: string;
      role: string;
      isAdmin: boolean;
      membershipLevel: string | null;
    } | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok && active) {
          const data = await res.json();
          setSession(data);
        } else if (active) {
          setSession({ authenticated: false, user: null });
        }
      } catch {
        if (active) {
          setSession({ authenticated: false, user: null });
        }
      }
    }
    void fetchSession();
  const ctSession = session as unknown as {
    user?: {
      role?: string;
      roles?: string[];
      isAdmin?: boolean;
      isDealer?: boolean;
      membership?: string;
      membershipLevel?: string;
    };
    role?: string;
    roles?: string[];
    isAdmin?: boolean;
    isDealer?: boolean;
      membership?: string;
      membershipLevel?: string;
    };

  const ctUser = ctSession?.user ?? ctSession;

  const isAdminUser = Boolean(
    ctUser?.isAdmin ||
      ctUser?.role === "admin" ||
      ctUser?.role === "collectiumbro" ||
      ctUser?.membership === "CollectiumBro" ||
      ctUser?.membershipLevel === "CollectiumBro" ||
      ctUser?.roles?.includes("admin") ||
      ctUser?.roles?.includes("collectiumbro")
  );

  const isDealerUser = Boolean(
    ctUser?.isDealer ||
      ctUser?.role === "dealer" ||
      ctUser?.role === "forhandler" ||
      ctUser?.roles?.includes("dealer") ||
      ctUser?.roles?.includes("forhandler")
  );

  const mobileMegaGroups = [
    {
      title: "Hoved",
      items: [
        { label: "Index", href: "/" },
        { label: "Katalog", href: "/katalog" },
        { label: "Periodefilter", href: "/test/periodefilter" },
        { label: "Periode søk", href: "/test/period-timeline" },
        { label: "Objekt", href: "/objekt" },
        { label: "Relasjoner", href: "/relasjoner" },
      ],
    },
    {
      title: "Bruker",
      items: [
        { label: "Min side", href: "/min-side" },
        { label: "Min samling", href: "/min-side?panel=samling" },
        { label: "Meldinger", href: "/min-side?panel=meldinger" },
        { label: "Varsler", href: "/min-side?panel=varsler" },
        { label: "Prosesser", href: "/min-side?panel=prosesser" },
      ],
    },
    {
      title: "Marked",
      items: [
        { label: "Auksjon", href: "/auksjon" },
        { label: "Nettbutikk", href: "/nettbutikk" },
      ],
    },
    {
      title: "Forhandler",
      requiresDealer: true,
      items: [
        { label: "Forhandlerpanel", href: "/forhandler" },
      ],
    },
    {
      title: "System / admin",
      requiresAdmin: true,
      items: [
        { label: "CollectiumBro", href: "/admin" },
        { label: "Neon kontroll", href: "/admin/neon" },
        { label: "MariaDB / Neon", href: "/admin/system/mariadb-neon" },
      ],
    },
  ];

    return () => {
      active = false;
    };
  }, [pathname]);

  function canShowMenuItem(item: { requiresAuth?: boolean; requiresAdmin?: boolean }, sessionVal: typeof session) {
    if (item.requiresAdmin && !sessionVal?.user?.isAdmin) return false;
    if (item.requiresAuth && !sessionVal?.authenticated) return false;
    return true;
  }

  // Helper function to map bold and light levels to weight values
  function getFontWeight(base: number, boldLevel: number, lightLevel: number): number {
    if (boldLevel > 0) {
      if (boldLevel === 1) return 500;
      if (boldLevel === 2) return 600;
      if (boldLevel === 3) return 700;
      return 800; // level 4
    }
    if (lightLevel > 0) {
      if (lightLevel === 1) return 350;
      if (lightLevel === 2) return 300;
      if (lightLevel === 3) return 250;
      return 200; // level 4
    }
    return base;
  }

  useEffect(() => {
    // Skin
    const storedSkin = window.localStorage.getItem("collectium-active-skin") as CollectiumSkin | null;
    const nextSkin = storedSkin && skins.some((item) => item.value === storedSkin) ? storedSkin : "collectium";
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

    const storedBodyBold = window.localStorage.getItem("collectium-body-bold-level");
    const nextBodyBold = storedBodyBold ? parseInt(storedBodyBold, 10) : 0;
    const storedBodyLight = window.localStorage.getItem("collectium-body-light-level");
    const nextBodyLight = storedBodyLight ? parseInt(storedBodyLight, 10) : 0;
    setBodyBoldLevel(nextBodyBold);
    setBodyLightLevel(nextBodyLight);
    document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, nextBodyBold, nextBodyLight).toString());

    // Overskrift
    const storedHeadingScale = window.localStorage.getItem("collectium-heading-text-scale");
    const nextHeadingScale = storedHeadingScale ? parseInt(storedHeadingScale, 10) : 0;
    setHeadingScale(nextHeadingScale);
    document.documentElement.style.setProperty("--ct-user-heading-scale", `${nextHeadingScale}px`);

    const storedHeadingBold = window.localStorage.getItem("collectium-heading-bold-level");
    const nextHeadingBold = storedHeadingBold ? parseInt(storedHeadingBold, 10) : 0;
    const storedHeadingLight = window.localStorage.getItem("collectium-heading-light-level");
    const nextHeadingLight = storedHeadingLight ? parseInt(storedHeadingLight, 10) : 0;
    setHeadingBoldLevel(nextHeadingBold);
    setHeadingLightLevel(nextHeadingLight);
    document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, nextHeadingBold, nextHeadingLight).toString());

    // Headline
    const storedHeadlineScale = window.localStorage.getItem("collectium-headline-scale");
    const nextHeadlineScale = storedHeadlineScale ? parseInt(storedHeadlineScale, 10) : 0;
    setHeadlineScale(nextHeadlineScale);
    document.documentElement.style.setProperty("--ct-user-headline-scale", `${nextHeadlineScale}px`);

    const storedHeadlineBold = window.localStorage.getItem("collectium-headline-bold-level");
    const nextHeadlineBold = storedHeadlineBold ? parseInt(storedHeadlineBold, 10) : 0;
    const storedHeadlineLight = window.localStorage.getItem("collectium-headline-light-level");
    const nextHeadlineLight = storedHeadlineLight ? parseInt(storedHeadlineLight, 10) : 0;
    setHeadlineBoldLevel(nextHeadlineBold);
    setHeadlineLightLevel(nextHeadlineLight);
    document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, nextHeadlineBold, nextHeadlineLight).toString());
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

  function updateBodyBoldLevel(val: number) {
    setBodyBoldLevel(val);
    window.localStorage.setItem("collectium-body-bold-level", val.toString());
    if (val > 0) {
      setBodyLightLevel(0);
      window.localStorage.setItem("collectium-body-light-level", "0");
      document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, val, 0).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, 0, bodyLightLevel).toString());
    }
  }

  function updateBodyLightLevel(val: number) {
    setBodyLightLevel(val);
    window.localStorage.setItem("collectium-body-light-level", val.toString());
    if (val > 0) {
      setBodyBoldLevel(0);
      window.localStorage.setItem("collectium-body-bold-level", "0");
      document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, 0, val).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-body-weight", getFontWeight(400, bodyBoldLevel, 0).toString());
    }
  }

  function updateHeadingScale(val: number) {
    setHeadingScale(val);
    window.localStorage.setItem("collectium-heading-text-scale", val.toString());
    document.documentElement.style.setProperty("--ct-user-heading-scale", `${val}px`);
  }

  function updateHeadingBoldLevel(val: number) {
    setHeadingBoldLevel(val);
    window.localStorage.setItem("collectium-heading-bold-level", val.toString());
    if (val > 0) {
      setHeadingLightLevel(0);
      window.localStorage.setItem("collectium-heading-light-level", "0");
      document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, val, 0).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, 0, headingLightLevel).toString());
    }
  }

  function updateHeadingLightLevel(val: number) {
    setHeadingLightLevel(val);
    window.localStorage.setItem("collectium-heading-light-level", val.toString());
    if (val > 0) {
      setHeadingBoldLevel(0);
      window.localStorage.setItem("collectium-heading-bold-level", "0");
      document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, 0, val).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-heading-weight", getFontWeight(500, headingBoldLevel, 0).toString());
    }
  }

  function updateHeadlineScale(val: number) {
    setHeadlineScale(val);
    window.localStorage.setItem("collectium-headline-scale", val.toString());
    document.documentElement.style.setProperty("--ct-user-headline-scale", `${val}px`);
  }

  function updateHeadlineBoldLevel(val: number) {
    setHeadlineBoldLevel(val);
    window.localStorage.setItem("collectium-headline-bold-level", val.toString());
    if (val > 0) {
      setHeadlineLightLevel(0);
      window.localStorage.setItem("collectium-headline-light-level", "0");
      document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, val, 0).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, 0, headlineLightLevel).toString());
    }
  }

  function updateHeadlineLightLevel(val: number) {
    setHeadlineLightLevel(val);
    window.localStorage.setItem("collectium-headline-light-level", val.toString());
    if (val > 0) {
      setHeadlineBoldLevel(0);
      window.localStorage.setItem("collectium-headline-bold-level", "0");
      document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, 0, val).toString());
    } else {
      document.documentElement.style.setProperty("--ct-user-headline-weight", getFontWeight(600, headlineBoldLevel, 0).toString());
    }
  }

  function resetDesign() {
    setSelectedScreenMode("auto");
    changeSkin("collectium");
    
    updateBodyScale(0);
    setBodyBoldLevel(0);
    setBodyLightLevel(0);
    window.localStorage.setItem("collectium-body-bold-level", "0");
    window.localStorage.setItem("collectium-body-light-level", "0");
    document.documentElement.style.setProperty("--ct-user-body-weight", "400");

    updateHeadingScale(0);
    setHeadingBoldLevel(0);
    setHeadingLightLevel(0);
    window.localStorage.setItem("collectium-heading-bold-level", "0");
    window.localStorage.setItem("collectium-heading-light-level", "0");
    document.documentElement.style.setProperty("--ct-user-heading-weight", "500");

    updateHeadlineScale(0);
    setHeadlineBoldLevel(0);
    setHeadlineLightLevel(0);
    window.localStorage.setItem("collectium-headline-bold-level", "0");
    window.localStorage.setItem("collectium-headline-light-level", "0");
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

  function isActiveItem(pathname: string, href: string, key: string) {
    if (key === "index") return pathname === "/";
    if (key === "admin-neon") return pathname.startsWith("/admin/neon");
    if (key === "admin") return pathname === "/admin" || (pathname.startsWith("/admin") && !pathname.startsWith("/admin/neon"));
    if (key === "period-search") return pathname.startsWith("/test/period-timeline");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function checkMobileBottomActive(item: { key: string; href?: string }) {
    if (!item.href) return false;
    if (item.key === "menu") return isMobileMenuOpen;
    if (item.key === "index") return pathname === "/";
    if (item.key === "catalog" || item.key === "katalog") return pathname.startsWith("/katalog");
    if (item.key === "period-filter") return pathname === "/test/periodefilter" || pathname === "/periodefilter";
    if (item.key === "period-search") return pathname.startsWith("/test/period-timeline");
    if (item.key === "account" || item.key === "min-side") return pathname.startsWith("/min-side");
    if (item.key === "admin-neon") return pathname.startsWith("/admin/neon");
    if (item.key === "admin") return pathname === "/admin" || (pathname.startsWith("/admin") && !pathname.startsWith("/admin/neon"));
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const isDarkSkin = skin === "museum" || skin === "finans";

  const isPeriodFilterTest = pathname === "/test/periodefilter" || pathname === "/periodefilter";
  const isTopbarOnlyChrome = pathname === "/start" || pathname.startsWith("/start/");

  return (
    <div
      className={styles.shell}
      data-chrome={isTopbarOnlyChrome ? "topbar-only" : "default"}
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

      {(!isTopbarOnlyChrome || sidebarMode !== "normal") && (
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
          {(["Hoved", "Bruker", "Marked", "System"] as const).map((groupName) => {
            const items = collectiumSidebarItems
              .filter((item) => item.group === groupName)
              .filter((item) => canShowMenuItem(item as { requiresAuth?: boolean; requiresAdmin?: boolean }, session));
            return (
              <div key={groupName} className={styles.navGroup}>
                <div className={styles.navGroupHeader}>{groupName}</div>
                <div className={styles.navGroupItems}>
                  {items.map((item) => {
                    const IconComponent = iconMap[item.key] || Box;
                    const isActive = isActiveItem(pathname, item.href, item.key);
                    return (
                      <Link
                        key={item.key}
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
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
      )}

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
              <input className={styles.search} placeholder="SÃ¸k i Collectium / bruker..." aria-label="SÃ¸k" />
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
                        {/* HOVEDSKRIFT */}
                        <div className={styles.designSliderSubSection}>
                          <h5>Hovedskrift</h5>
                          
                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>stÃ¸rrelse</span>
                              <strong>{bodyScale > 0 ? `+${bodyScale}` : bodyScale}</strong>
                            </div>
                            <input
                              type="range"
                              min="-2"
                              max="4"
                              step="1"
                              value={bodyScale}
                              onChange={(e) => updateBodyScale(parseInt(e.target.value, 10))}
                              aria-label="Juster hovedskrift stÃ¸rrelse"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Fet skrift</span>
                              <strong>NivÃ¥ {bodyBoldLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={bodyBoldLevel}
                              onChange={(e) => updateBodyBoldLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster hovedskrift fet nivÃ¥"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Slank skrift</span>
                              <strong>NivÃ¥ {bodyLightLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={bodyLightLevel}
                              onChange={(e) => updateBodyLightLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster hovedskrift slank nivÃ¥"
                            />
                          </div>
                        </div>

                        {/* OVERSKRIFT */}
                        <div className={styles.designSliderSubSection}>
                          <h5>Overskrift</h5>
                          
                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>stÃ¸rrelse</span>
                              <strong>{headingScale > 0 ? `+${headingScale}` : headingScale}</strong>
                            </div>
                            <input
                              type="range"
                              min="-2"
                              max="4"
                              step="1"
                              value={headingScale}
                              onChange={(e) => updateHeadingScale(parseInt(e.target.value, 10))}
                              aria-label="Juster overskrift stÃ¸rrelse"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Fet skrift</span>
                              <strong>NivÃ¥ {headingBoldLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={headingBoldLevel}
                              onChange={(e) => updateHeadingBoldLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster overskrift fet nivÃ¥"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Slank skrift</span>
                              <strong>NivÃ¥ {headingLightLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={headingLightLevel}
                              onChange={(e) => updateHeadingLightLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster overskrift slank nivÃ¥"
                            />
                          </div>
                        </div>

                        {/* HEADLINE */}
                        <div className={styles.designSliderSubSection}>
                          <h5>Headline</h5>
                          
                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>stÃ¸rrelse</span>
                              <strong>{headlineScale > 0 ? `+${headlineScale}` : headlineScale}</strong>
                            </div>
                            <input
                              type="range"
                              min="-2"
                              max="6"
                              step="1"
                              value={headlineScale}
                              onChange={(e) => updateHeadlineScale(parseInt(e.target.value, 10))}
                              aria-label="Juster headline stÃ¸rrelse"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Fet skrift</span>
                              <strong>NivÃ¥ {headlineBoldLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={headlineBoldLevel}
                              onChange={(e) => updateHeadlineBoldLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster headline fet nivÃ¥"
                            />
                          </div>

                          <div className={styles.designSliderRow}>
                            <div className={styles.designSliderLabel}>
                              <span>Slank skrift</span>
                              <strong>NivÃ¥ {headlineLightLevel}</strong>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="4"
                              step="1"
                              value={headlineLightLevel}
                              onChange={(e) => updateHeadlineLightLevel(parseInt(e.target.value, 10))}
                              aria-label="Juster headline slank nivÃ¥"
                            />
                          </div>
                        </div>
                      </div>
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
            {session === null ? (
              <span className={styles.loginButton} style={{ opacity: 0.7 }}>Laster...</span>
            ) : !session.authenticated ? (
              <Link className={styles.loginButton} href="/login">Logg inn</Link>
            ) : session.user?.isAdmin ? (
              <Link className={styles.loginButton} href="/admin/neon">CollectiumBro</Link>
            ) : (
              <Link className={styles.loginButton} href="/min-side">
                Min {session.user?.membershipLevel || "Free"} side
              </Link>
            )}
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

            {isMobileMenuOpen ? (
        <div
          className={styles.mobileMegaMenuOverlay}
          role="presentation"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <section
            className={styles.mobileMegaMenuSheet}
            role="dialog"
            aria-modal="true"
            aria-label="Mobil megameny"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.mobileMegaMenuHeader}>
              <div>
                <p className={styles.mobileMegaMenuKicker}>Collectium</p>
                <h2 className={styles.mobileMegaMenuTitle}>Meny</h2>
              </div>
              <button
                type="button"
                className={styles.mobileMegaMenuClose}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Lukk meny"
              >
                ×
              </button>
            </header>

            <div className={styles.mobileMegaMenuGrid}>
              {mobileMegaGroups
                .filter((group) => {
                  if (group.requiresAdmin && !isAdminUser) return false;
                  if (group.requiresDealer && !isDealerUser && !isAdminUser) return false;
                  return true;
                })
                .map((group) => (
                  <section className={styles.mobileMegaMenuGroup} key={group.title}>
                    <h3 className={styles.mobileMegaMenuGroupTitle}>{group.title}</h3>
                    <div className={styles.mobileMegaMenuLinks}>
                      {group.items.map((menuItem) => (
                        <a
                          key={`${group.title}-${menuItem.href}`}
                          href={menuItem.href}
                          className={styles.mobileMegaMenuLink}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span>{menuItem.label}</span>
                          <span aria-hidden="true">›</span>
                        </a>
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </section>
        </div>
      ) : null}
<nav className={styles.mobileBottomNav} aria-label="Mobil hovednavigasjon">
        {mobileBottomItems
          .filter((item) => canShowMenuItem(item as { requiresAuth?: boolean; requiresAdmin?: boolean }, session))
          .map((item) => {
            const IconComponent = item.icon;
            const isActive = item.key === "menu" ? isMobileMenuOpen : checkMobileBottomActive(item);
            
            if (item.key === "menu") {
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.mobileBottomItem} ${isActive ? styles.mobileBottomItemActive : ""}`}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-expanded={isMobileMenuOpen}
                  aria-label="Ã…pne eller lukk hovedmeny"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <IconComponent size={20} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href || "#"}
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











