"use client";

import { useEffect, useState } from "react";

const themes = [
  { value: "neon-dark", label: "01 Neon Dark" },
  { value: "corporate", label: "02 Corporate Clean" },
  { value: "brutalist", label: "03 Tech Brutalist" },
  { value: "editorial", label: "04 Editorial Luxury" },
];

export default function Topbar() {
  const [theme, setTheme] = useState("corporate");

  useEffect(() => {
    const saved = window.localStorage.getItem("collectium-workspace-theme");
    const nextTheme = saved || "corporate";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("collectium-workspace-theme", nextTheme);
  }

  return (
    <header className="collectium-topbar">
      <input
        className="collectium-search"
        type="text"
        placeholder="02 SÃ¸k / bruker..."
      />

      <div className="collectium-topbar-actions">
        <select
          className="collectium-theme-select"
          value={theme}
          onChange={(event) => updateTheme(event.target.value)}
          aria-label="Velg tema"
        >
          {themes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <a className="collectium-login-button" href="/login">
          Login
        </a>
      </div>
    </header>
  );
}
