"use client";

import { useEffect, useState } from "react";

const themes = [
  { value: "collectium", label: "Collectium" },
  { value: "samler", label: "Samler" },
  { value: "museum", label: "Museum" },
  { value: "finans", label: "Finans" },
];

export default function Topbar() {
  const [theme, setTheme] = useState("collectium");

  useEffect(() => {
    const saved = window.localStorage.getItem("collectium-active-skin") || window.localStorage.getItem("collectium-workspace-theme");
    const allowed = ["collectium", "samler", "museum", "finans"];
    const nextTheme = saved && allowed.includes(saved) ? saved : "collectium";

    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.setAttribute("data-skin", nextTheme);
    document.documentElement.setAttribute("data-ct-skin", nextTheme);
    window.localStorage.setItem("collectium-active-skin", nextTheme);
    window.localStorage.setItem("collectium-workspace-theme", nextTheme);
  }, []);

  function updateTheme(nextTheme: string) {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.setAttribute("data-skin", nextTheme);
    document.documentElement.setAttribute("data-ct-skin", nextTheme);
    window.localStorage.setItem("collectium-workspace-theme", nextTheme);
    window.localStorage.setItem("collectium-active-skin", nextTheme);
  }

  return (
    <header className="collectium-topbar">
      <input
        className="collectium-search"
        type="text"
        placeholder="02 SÃƒÂ¸k / bruker..."
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
