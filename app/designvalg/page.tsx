/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium designvalgside for brytere, faner og mapper
 *
 * Definering / formÃ¥l:
 * Viser alternative designvalg for Collectium-brytere, folder-tabs,
 * arkivmapper, statusbrytere og mobil/bunnbar-knapper.
 *
 * BruksomrÃ¥de:
 * /designvalg
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - Ingen. Visuell kontrollside / UI-valgside.
 *
 * Dataretning:
 * Statisk UI-visning -> senere global template/skin-valg.
 */

import "./page.css";

const switchRows = [
  {
    title: "Ren strek",
    text: "Aktiv bryter markeres med en enkel venstrestrek. Ingen ekstra hjÃ¸rne.",
    className: "variant-line",
  },
  {
    title: "Myk fyllflate",
    text: "Aktiv bryter fÃ¥r myk bakgrunn og rolig markering.",
    className: "variant-soft",
  },
  {
    title: "Pille",
    text: "Aktiv bryter er en avrundet app-lignende knapp.",
    className: "variant-pill",
  },
  {
    title: "Underlinje",
    text: "Passer for toppmeny og smÃ¥ statusvalg.",
    className: "variant-underline",
  },
];

const folderRows = [
  "Arkivmappe hÃ¸y",
  "Arkivmappe lav",
  "Museum fane",
  "Finans fane",
];

export default function DesignvalgPage() {
  return (
    <div className="ct-designvalg-page">
      <section className="ct-designvalg-hero">
        <p className="ct-eyebrow">UI 8.5 / designvalg</p>
        <h1>Brytere, mapper og faner</h1>
        <p>
          Denne siden viser rene alternativer uten dobbel hjÃ¸rnesignatur. MÃ¥let er Ã¥ velge Ã©n
          global bryterlogikk som kan brukes pÃ¥ sidemeny, toppmeny, mobilmeny, filter,
          arkivfaner og mappevisning.
        </p>
      </section>

      <section className="ct-designvalg-section">
        <div className="ct-section-head">
          <span>01</span>
          <div>
            <h2>Aktive brytere</h2>
            <p>Forskjellige mÃ¥ter Ã¥ vise aktiv tilstand uten ekstra grÃ¸nt hjÃ¸rne.</p>
          </div>
        </div>

        <div className="ct-switch-grid">
          {switchRows.map((row) => (
            <article className={`ct-switch-card ${row.className}`} key={row.title}>
              <button type="button" className="ct-demo-switch is-active">
                <span className="ct-demo-icon">â—Ž</span>
                <span>
                  <strong>{row.title}</strong>
                  <small>Aktiv</small>
                </span>
                <em>01</em>
              </button>

              <button type="button" className="ct-demo-switch">
                <span className="ct-demo-icon">â—‡</span>
                <span>
                  <strong>Katalog</strong>
                  <small>Standard</small>
                </span>
                <em>24</em>
              </button>

              <p>{row.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-designvalg-section">
        <div className="ct-section-head">
          <span>02</span>
          <div>
            <h2>Arkivfaner / mapper</h2>
            <p>Faner skal se ut som mapper, men ikke lage harde doble rammer.</p>
          </div>
        </div>

        <div className="ct-folder-demo">
          {folderRows.map((item, index) => (
            <button className={index === 0 ? "ct-folder is-active" : "ct-folder"} key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </button>
          ))}
        </div>

        <div className="ct-folder-panel">
          <h3>Mappeinnhold</h3>
          <p>
            Aktiv mappe bruker Ã©n tydelig topp/fyll-markering. Undersiden er Ã¥pen slik at
            fanen visuelt henger sammen med innholdspanelet.
          </p>
        </div>
      </section>

      <section className="ct-designvalg-section two">
        <article className="ct-mini-panel">
          <h2>Mobil bunnbar</h2>
          <div className="ct-bottom-demo">
            <button>SÃ¸k</button>
            <button className="is-active">Index</button>
            <button>Katalog</button>
            <button>Min side</button>
          </div>
        </article>

        <article className="ct-mini-panel">
          <h2>Statusbrytere</h2>
          <div className="ct-status-demo">
            <button className="is-active">Collectium</button>
            <button>Samler</button>
            <button>Museum</button>
            <button>Finans</button>
          </div>
        </article>
      </section>
    </div>
  );
}