"use client";

/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Design state testside
 *
 * Definering / formål:
 * Enkel testside for å kontrollere at skin og skjermmodus lagres i browser.
 *
 * Bruksområde:
 * Midlertidig test under /test/design-state.
 *
 * Berørte sider / routes:
 * - /test/design-state
 *
 * Berørte DB-brytere / feature_keys:
 * - Ingen. Lokal testside.
 *
 * Berørte API-ruter:
 * - Ingen.
 *
 * Berørte tabeller / views:
 * - Ingen.
 */

import { useEffect, useState } from "react";

type DesignState = {
  skin?: string;
  screenMode?: string;
  vp?: string;
  resolvedVp?: string;
  actualWidth?: string;
  screenOverride?: string;
  storageSkin?: string | null;
  storageScreenMode?: string | null;
};

export default function CollectiumDesignStatePage() {
  const [state, setState] = useState<DesignState>({});

  function refresh() {
    const root = document.documentElement;

    setState({
      skin: root.dataset.skin,
      screenMode: root.dataset.screenMode,
      vp: root.dataset.vp,
      resolvedVp: root.dataset.resolvedVp,
      actualWidth: root.dataset.actualWidth,
      screenOverride: root.dataset.screenOverride,
      storageSkin: window.localStorage.getItem("collectium.skin"),
      storageScreenMode: window.localStorage.getItem("collectium.screenMode"),
    });
  }

  useEffect(() => {
    refresh();
    window.addEventListener("resize", refresh);

    const interval = window.setInterval(refresh, 500);

    return () => {
      window.removeEventListener("resize", refresh);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main style={{ padding: 32, maxWidth: 980 }}>
      <h1>Collectium design-state test</h1>

      <p>
        Denne siden viser hva browseren har lagret og hvilke data-attributter som
        ligger på html-elementet.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        <button onClick={() => window.collectiumSetScreenMode?.("auto")}>Auto</button>
        <button onClick={() => window.collectiumSetScreenMode?.("desktop")}>Desktop</button>
        <button onClick={() => window.collectiumSetScreenMode?.("wide")}>Bredskjerm</button>
        <button onClick={() => window.collectiumSetScreenMode?.("tv")}>TV / Presentasjon</button>
        <button onClick={() => window.collectiumSetSkin?.("collectium")}>Skin: Collectium</button>
        <button onClick={() => window.collectiumSetSkin?.("samler")}>Skin: Samler</button>
        <button onClick={() => window.collectiumSetSkin?.("museum")}>Skin: Museum</button>
        <button onClick={() => window.collectiumSetSkin?.("finans")}>Skin: Finans</button>
        <button onClick={refresh}>Oppdater status</button>
      </div>

      <pre
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid #d7e2ef",
          borderRadius: 12,
          overflow: "auto",
          background: "#fff",
        }}
      >
        {JSON.stringify(state, null, 2)}
      </pre>
    </main>
  );
}