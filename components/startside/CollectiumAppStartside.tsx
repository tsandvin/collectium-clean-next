/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumAppStartside
 *
 * Definering / formål:
 * Innholdskomponent for app-startsiden på app.collectium.no.
 * Siden forklarer skillet mellom offentlig nettside og applikasjon,
 * og gir tydelige innganger til katalog, login og Min side.
 *
 * Bruksområde:
 * Brukes av app/page.tsx og app/startside/page.tsx.
 *
 * Berørte sider / routes:
 * - /
 * - /startside
 *
 * Berørte DB-brytere / feature_keys:
 * - landing.view
 * - catalog.view
 * - auth.login
 * - user.dashboard.view
 *
 * Berørte API-ruter:
 * - Ingen i denne første statiske gateway-versjonen.
 *
 * Berørte tabeller / views:
 * - Ingen direkte. Senere skal statuskort hente data via API/backend.
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: app
 * log_action: startside.view
 *
 * Versjon:
 * CT-FILE-STARTSIDE-0001 / CHANGE-DOMAIN-LOCK-0001
 *
 * Endringsregel:
 * Dette er innhold inne i global AppShell. Komponenten skal ikke lage
 * egen sidebar, topbar, html, body eller globalt skall.
 */

import Link from "next/link";

const primaryLinks = [
  {
    title: "Katalog",
    text: "Utforsk objekter, relasjoner, historikk og markedsdata.",
    href: "/katalog",
    label: "Åpne katalog",
  },
  {
    title: "Min side",
    text: "Samling, medlemskap, varsler, prosesser og aktivitet.",
    href: "/min-side",
    label: "Gå til Min side",
  },
  {
    title: "Logg inn",
    text: "Bruk konto for å åpne personlige funksjoner og samling.",
    href: "/login",
    label: "Logg inn",
  },
];

export default function CollectiumAppStartside() {
  return (
    <main className="collectium-page-content" aria-labelledby="collectium-startside-title">
      <section className="collectium-hero-panel">
        <p className="collectium-kicker">COLLECTIUM APP</p>

        <h1 id="collectium-startside-title">
          Applikasjonen for katalog, samling og markedsinnsikt.
        </h1>

        <p className="collectium-lead">
          Dette er app.collectium.no. Her ligger innlogging, Min side, katalog,
          samling og de kontrollerte arbeidsflatene. Den offentlige nettsiden
          ligger separat på collectium.no.
        </p>

        <div className="collectium-action-row" aria-label="Hovedhandlinger">
          <Link className="collectium-primary-action" href="/katalog">
            Åpne katalog
          </Link>
          <Link className="collectium-secondary-action" href="/login">
            Logg inn
          </Link>
          <a className="collectium-secondary-action" href="https://collectium.no">
            Gå til collectium.no
          </a>
        </div>
      </section>

      <section className="collectium-card-grid" aria-label="App-innganger">
        {primaryLinks.map((item) => (
          <article className="collectium-info-card" key={item.href}>
            <p className="collectium-kicker">{item.title}</p>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
            <Link className="collectium-card-link" href={item.href}>
              {item.label}
            </Link>
          </article>
        ))}
      </section>

      <section className="collectium-info-card collectium-wide-card">
        <p className="collectium-kicker">LÅST DOMENEMODELL</p>
        <h2>collectium.no og app.collectium.no har ulike roller.</h2>
        <p>
          collectium.no brukes som offentlig nettside og inngang. app.collectium.no
          er selve Next.js-applikasjonen med login, Min side, katalog og senere
          rollebaserte moduler for forhandler og admin.
        </p>
      </section>
    </main>
  );
}
