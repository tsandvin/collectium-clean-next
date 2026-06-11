"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * ThemeProvider
 *
 * Definering / formÃ¥l:
 * Global React Context-provider for fire Collectium-tema:
 * Collectium, Samler, Museum og Finans.
 * Setter html[data-theme] og body[data-theme].
 *
 * BruksomrÃ¥de:
 * Importeres i app/layout.tsx.
 *
 * BerÃ¸rte sider / routes:
 * - alle routes via RootLayout
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - local.template.theme_provider
 * - local.template.theme_ui85
 *
 * BerÃ¸rte API-ruter:
 * - senere /api/user/preferences/theme
 *
 * BerÃ¸rte tabeller / views:
 * - senere ct_ui_skins
 * - senere ct_user_preferences.preferred_skin
 *
 * Dataretning:
 * ThemeProvider -> html[data-theme] -> CSS variables -> UI.
 *
 * Versjon:
 * CT-THEME-PROVIDER-0001 / CHANGE-2026-06-12-THEME-STANDARD
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeType =
  | "collectium"
  | "samler"
  | "museum"
  | "finans";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext =
  createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "collectium-theme";

function isTheme(value: string | null): value is ThemeType {
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
  const [theme, setThemeState] =
    useState<ThemeType>("collectium");

  function applyTheme(nextTheme: ThemeType) {
    setThemeState(nextTheme);

    document.documentElement.dataset.theme =
      nextTheme;

    document.body.dataset.theme =
      nextTheme;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        nextTheme
      );
    } catch {
      // Theme still applies in DOM.
    }
  }

  useEffect(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    applyTheme(
      isTheme(saved)
        ? saved
        : "collectium"
    );
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error(
      "useTheme must be inside ThemeProvider"
    );
  }

  return ctx;
}
