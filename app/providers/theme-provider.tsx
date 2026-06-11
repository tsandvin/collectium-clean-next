"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * ThemeProvider for Collectium UI 8.5
 *
 * Definering / formål:
 * Global klient-provider som setter aktiv Collectium skin/theme på <html>.
 * Bruker én samlet token-kontrakt via html[data-theme="collectium|samler|museum|finans"].
 *
 * Bruksområde:
 * Brukes i app/layout.tsx rundt hele applikasjonen.
 *
 * Berørte sider / routes:
 * - app/layout.tsx
 * - app/page.tsx
 * - fremtidig /katalog
 * - fremtidig /objekt/[sourceKey]/[objectGroup]/[objectId]
 *
 * Berørte DB-brytere / feature_keys:
 * - Ren lokal UI/template-kontroll. Ingen DB-bryter.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI. ThemeProvider eier kun visuell token-state.
 *
 * Logging:
 * - Ingen systemlogging i denne klientkomponenten.
 *
 * Versjon:
 * CT-UI85-THEME-PROVIDER-0001 / CHANGE-UI85-V36-0001
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type CollectiumTheme =
  | "collectium"
  | "samler"
  | "museum"
  | "finans";

interface ThemeContextType {
  theme: CollectiumTheme;
  setTheme: (theme: CollectiumTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "ct-active-skin-v2";

function isCollectiumTheme(value: string | null): value is CollectiumTheme {
  return (
    value === "collectium" ||
    value === "samler" ||
    value === "museum" ||
    value === "finans"
  );
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<CollectiumTheme>("collectium");

  function setTheme(nextTheme: CollectiumTheme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.dataset.skin = nextTheme;
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setTheme(isCollectiumTheme(saved) ? saved : "collectium");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be inside ThemeProvider");
  }

  return ctx;
}
