import Link from "next/link";

const cards = [
  {
    title: "Katalog",
    body: "Objekter, kilder, relasjoner, perioder og historiske koblinger.",
    href: "/katalog",
    label: "Samling",
  },
  {
    title: "Objektpresentasjon",
    body: "En rolig visningsflate for fakta, historikk, verdi og relasjoner.",
    href: "/katalog",
    label: "Museum",
  },
  {
    title: "Systemkontroll",
    body: "MariaDB, Neon, API-ruter og kontrollstatus pÃ¥ ett sted.",
    href: "/admin/system/mariadb-neon",
    label: "Kontroll",
  },
];

export default function HomePage() {
  return (
    <div className="ct-page">
      <section className="ct-hero">
        <div>
          <p className="ct-eyebrow">Collectium Museum</p>
          <h1>Katalog og historiske objekter i en rolig museumsflate.</h1>
          <p className="ct-lead">
            Dette er en fast default-design uten skinvelger. MÃ¥let er fÃ¸rst Ã¥ fÃ¥
            skall, rammer, typografi, ikoner og vanlige felt riktig fÃ¸r vi bygger
            videre med flere tema.
          </p>
          <div className="ct-actions">
            <Link className="ct-button ct-button-primary" href="/katalog">
              Ã…pne katalog
            </Link>
            <Link className="ct-button" href="/admin/system/mariadb-neon">
              Systemkontroll
            </Link>
          </div>
        </div>

        <aside className="ct-hero-panel">
          <span>Aktiv design</span>
          <strong>Museum default</strong>
          <p>Ingen skinvelger Â· ingen themeprovider Â· Ã©n global CSS-standard</p>
        </aside>
      </section>

      <section className="ct-grid ct-grid-3" aria-label="HovedomrÃ¥der">
        {cards.map((card) => (
          <Link className="ct-card collectium-card" href={card.href} key={card.title}>
            <span className="ct-card-label">{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </Link>
        ))}
      </section>

      <section className="ct-panel">
        <div className="ct-section-head">
          <div>
            <p className="ct-eyebrow">Normal sidekontroll</p>
            <h2>Skall, ramme, paneler og ikoner er nÃ¥ standardisert.</h2>
          </div>
          <span className="ct-pill">Default</span>
        </div>

        <div className="ct-status-grid">
          <div>
            <strong>Layout</strong>
            <span>App Router + server layout</span>
          </div>
          <div>
            <strong>Design</strong>
            <span>app/globals.css</span>
          </div>
          <div>
            <strong>Ikoner</strong>
            <span>Inline SVG</span>
          </div>
        </div>
      </section>
    </div>
  );
}
