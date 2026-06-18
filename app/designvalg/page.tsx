/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium designvalgside for brytere, mapper, profilikoner og linjevarianter
 *
 * Definering / formÃ¥l:
 * Viser mange alternative designvalg for UI 8.5: brytere, aktive tilstander,
 * folder-tabs, profilkort, linjer, statusfelt, segmenter og bunnbar.
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
import { getSwitchIcon } from "@/components/icons/LaravelOutlineIcons";

const switchVariants = [
  ["Ren venstrestrek", "En enkel aktiv markering uten ekstra hjÃ¸rne.", "variant-line"],
  ["Myk fyllflate", "Rolig aktiv flate med svak Collectium-grÃ¸nn.", "variant-soft"],
  ["Pilleknapp", "Avrundet app-knapp for mobil og korte valg.", "variant-pill"],
  ["Underlinje", "God for toppmeny, faner og smÃ¥ segmentvalg.", "variant-underline"],
  ["Prikk + tekst", "Aktiv status vises med liten indikator ved teksten.", "variant-dot"],
  ["Tynn ramme", "Lett ramme rundt aktivt valg uten hard markering.", "variant-outline"],
  ["Dyp skygge", "Aktiv knapp lÃ¸ftes visuelt fra flaten.", "variant-lift"],
  ["Minimal", "Nesten usynlig markering for tette systemlister.", "variant-minimal"],
];

const folderVariants = [
  ["Arkivmappe", "HÃ¸y fane med Ã¥pen underside."],
  ["Lav mappe", "Lavere arkivfane for tette kontrollpanel."],
  ["Museumsfane", "Roligere mappe med historisk fÃ¸lelse."],
  ["Finansfane", "Strammere fane for verdi, trend og marked."],
  ["Segmentmappe", "SmÃ¥ faner for Samler / Historie / Finans."],
];

const profileCards = [
  ["Samlerprofil", "82%", "FullfÃ¸rt profil", "Rolig kort med stor prosent og fremdrift."],
  ["Forhandler", "Gull", "Aktiv avtale", "Kort for tilgang, avtale, omsetning og objektgrupper."],
  ["Museum", "12", "Publiserte objekter", "Kort for mini-museum og offentlig visning."],
  ["Finans", "+8%", "12 mnd trend", "Kort for trend, verdi og likviditet."],
];

const lineVariants = [
  "Tynn linje",
  "Delt linje",
  "Punktlinje",
  "Signaturlinje",
  "Tidslinje",
  "Relasjonslinje",
];

export default function DesignvalgPage() {
  return (
    <div className="ct-designvalg-page">
      <section className="ct-designvalg-hero">
        <p className="ct-eyebrow">UI 8.5 / Designvalg</p>
        <h1>Brytere, mapper, profilkort og linjer</h1>
        <p>
          Denne siden viser alternative Collectium-komponenter uten dobbel hjÃ¸rnesignatur.
          Teksten er lagret som ekte UTF-8, slik at norske tegn vises riktig: mÃ¥ter, grÃ¸nt,
          hjÃ¸rne, sÃ¸k, bunnmeny og toppmeny.
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
          {switchVariants.map(([title, text, className], index) => (
            <article className={`ct-switch-card ${className}`} key={title}>
              <button type="button" className="ct-demo-switch is-active">
                <span className="ct-demo-icon">{getSwitchIcon(index)}</span>
                <span>
                  <strong>{title}</strong>
                  <small>Aktiv bryter</small>
                </span>
                <em>{String(index + 1).padStart(2, "0")}</em>
              </button>

              <button type="button" className="ct-demo-switch">
                <span className="ct-demo-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    style={{ width: "20px", height: "20px" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span>
                  <strong>Katalog</strong>
                  <small>Standardvalg</small>
                </span>
                <em>24</em>
              </button>

              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-designvalg-section">
        <div className="ct-section-head">
          <span>02</span>
          <div>
            <h2>Mapper og arkivfaner</h2>
            <p>Fanene skal oppleves som mapper, men uten harde doble rammer.</p>
          </div>
        </div>

        <div className="ct-folder-grid">
          {folderVariants.map(([title, text], index) => (
            <article className="ct-folder-example" key={title}>
              <div className="ct-folder-row">
                <button className="ct-folder is-active">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {title}
                </button>
                <button className="ct-folder">
                  <span>0{index + 2}</span>
                  Alternativ
                </button>
              </div>
              <div className="ct-folder-panel">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-designvalg-section">
        <div className="ct-section-head">
          <span>03</span>
          <div>
            <h2>Profilkort og statuskort</h2>
            <p>Kort for bruker, forhandler, museum og finans uten tung ramme.</p>
          </div>
        </div>

        <div className="ct-profile-grid">
          {profileCards.map(([title, value, label, text]) => (
            <article className="ct-profile-card" key={title}>
              <div className="ct-profile-top">
                <div className="ct-avatar">{title.slice(0, 1)}</div>
                <div>
                  <strong>{title}</strong>
                  <small>{label}</small>
                </div>
                <span>{value}</span>
              </div>
              <div className="ct-progress">
                <i />
              </div>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ct-designvalg-section">
        <div className="ct-section-head">
          <span>04</span>
          <div>
            <h2>Linjevarianter</h2>
            <p>Linjer for signatur, relasjon, tidslinje, status og seksjonsskiller.</p>
          </div>
        </div>

        <div className="ct-line-grid">
          {lineVariants.map((item, index) => (
            <div className={`ct-line-demo line-${index + 1}`} key={item}>
              <span>{item}</span>
              <i />
              <em>Collectium</em>
            </div>
          ))}
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
          <h2>Temabrytere</h2>
          <div className="ct-status-demo">
            <button className="is-active">Collectium</button>
            <button>Samler</button>
            <button>Museum</button>
            <button>Finans</button>
          </div>
        </article>

        <article className="ct-mini-panel">
          <h2>Segmentbrytere</h2>
          <div className="ct-segment-demo">
            <button className="is-active">Samler</button>
            <button>Historie</button>
            <button>Finans</button>
          </div>
        </article>

        <article className="ct-mini-panel">
          <h2>SmÃ¥ handlingsknapper</h2>
          <div className="ct-action-demo">
            <button>Ã…pne objekt</button>
            <button className="is-active">Se relasjon</button>
            <button>Legg i samling</button>
          </div>
        </article>
      </section>
    </div>
  );
}