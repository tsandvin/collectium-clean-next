import CollectiumFolderTabs from "@/components/ui/CollectiumFolderTabs";
"use client";

import { useState } from "react";
import CollectiumCard from "@/components/ui/CollectiumCard";

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="collectium-page-inner">

      <section className="collectium-hero">
        <div className="collectium-section-label">03 PageHeader / HeroPanel</div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "4px" }}>
          System- og kjerneovervÃƒÂ¥king
        </h1>
        <p className="collectium-soft" style={{ marginTop: "4px", fontSize: "0.95rem" }}>
          Dataretning: DB/API Ã¢â€ â€™ Next.js Ã¢â€ â€™ React Ã¢â€ â€™ UI
        </p>
      </section>

      <nav className="collectium-tabs" aria-label="Workspace-faner">
        {["Sanntid", "Arkivlag logg", "Konfigurasjon"].map((tabTitle, idx) => (
          <button
            key={tabTitle}
            type="button"
            onClick={() => setActiveTab(idx)}
            className="collectium-tab"
            data-active={activeTab === idx ? "true" : "false"}
          >
            04 {tabTitle}
          </button>
        ))}
      </nav>

      <section>
        <div className="collectium-section-label">05 Fire felt</div>
        <div className="collectium-grid-4">
          <CollectiumCard title="05A MariaDB">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>Kluster OK</div>
          </CollectiumCard>
          <CollectiumCard title="05B Neon">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>99.99% Latency</div>
          </CollectiumCard>
          <CollectiumCard title="05C Plattform">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>Next.js K8s</div>
          </CollectiumCard>
          <CollectiumCard title="05D Template">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>Active v36</div>
          </CollectiumCard>
        </div>
      </section>

      <section>
        <div className="collectium-section-label">06 Tre felt</div>
        <div className="collectium-grid-3">
          <CollectiumCard title="06A Status">
            <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--ct-accent)" }}>
              Synkronisert
            </div>
          </CollectiumCard>
          <CollectiumCard title="06B Neste kontroll">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>12.06.2026</div>
          </CollectiumCard>
          <CollectiumCard title="06C Regel">
            <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>Global Reset</div>
          </CollectiumCard>
        </div>
      </section>

      <section>
        <div className="collectium-section-label">07 To felt</div>
        <div className="collectium-grid-2">
          <CollectiumCard title="07A Venstre panel">
            <p className="collectium-soft">PrimÃƒÂ¦re dataparametere lastet direkte inn i React-skallet.</p>
          </CollectiumCard>
          <CollectiumCard title="07B HÃƒÂ¸yre panel">
            <p className="collectium-soft">Test UU: Klikk her for ÃƒÂ¥ validere fokusomrÃƒÂ¥det ditt.</p>
          </CollectiumCard>
        </div>
      </section>

      <section>
        <div className="collectium-section-label">08 Lang venstre + liten hÃƒÂ¸yre</div>
        <div className="collectium-grid-3-1 collectium-full-width">
          <CollectiumCard title="08A Hovedmatrise / rapport">
            <p>Hovedrapportgenerering kjÃƒÂ¸rer asynkront via Next.js api-pipelines.</p>
          </CollectiumCard>
          <CollectiumCard title="08B Status">
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--ct-accent)", textAlign: "center" }}>
              100%
            </div>
          </CollectiumCard>
        </div>
      </section>

      <section>
        <div className="collectium-section-label">09 Liten venstre + lang hÃƒÂ¸yre</div>
        <div className="collectium-grid-1-3 collectium-full-width">
          <CollectiumCard title="09A Filter">
            <label style={{ display: "block", fontSize: "0.9rem" }}>
              <input type="checkbox" defaultChecked /> Auto-refresh
            </label>
          </CollectiumCard>
          <CollectiumCard title="09B Resultat / detaljer">
            <pre style={{
              background: "var(--ct-app-bg)",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "0.85rem",
              overflowX: "auto",
            }}>
              {`{ "status": "active", "build": "uiv36" }`}
            </pre>
          </CollectiumCard>
        </div>
      </section>

      <section>
        <div className="collectium-section-label">10 Bredskjerm / workspace lanes</div>
        <div className="collectium-lanes">
          {["Lane 1: Innkommende", "Lane 2: Til behandling", "Lane 3: Arkivlag"].map((laneName) => (
            <div key={laneName} className="collectium-lane">
              <div style={{ fontWeight: "bold", color: "var(--ct-accent)", fontSize: "0.9rem" }}>
                {laneName}
              </div>
              <p className="collectium-muted" style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                Seksjon opprettet for dyp TV-visning og brede arbeidsflater.
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}


