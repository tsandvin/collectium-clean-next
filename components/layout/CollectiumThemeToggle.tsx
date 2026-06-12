"use client";

import { useEffect, useState } from "react";

type Theme = "collectium" | "museum";

const STORAGE_KEY = "collectium-theme-mode";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Theme still applies for this session.
  }
}

export function CollectiumThemeToggle() {
  const [theme, setTheme] = useState<Theme>("collectium");

  useEffect(() => {
    let saved: string | null = null;

    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }

    const nextTheme: Theme = saved === "museum" ? "museum" : "collectium";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "collectium" ? "museum" : "collectium";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="ct-theme-toggle"
      aria-label="Bytt mellom lyst Collectium-tema og mÃ¸rkt Museum-tema"
      onClick={toggleTheme}
    >
      <span className="ct-theme-toggle-icon" aria-hidden="true">
        {theme === "collectium" ? "â˜€" : "â˜¾"}
      </span>
      <span>{theme === "collectium" ? "Lys" : "MÃ¸rk"}</span>
    </button>
  );
}
