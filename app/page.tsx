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
    label: "Objekt",
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
          <p className="ct-eyebrow">Collectium</p>
          <h1>Katalog, samling og marked i Ã©n kontrollert arbeidsflate.</h1>
          <p className="ct-lead">
            Standardvisningen bruker Collectium som lyst tema og Museum som mÃ¸rkt tema.
            Du kan bytte mellom lys og mÃ¸rk visning fra toppmenyen.
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
          <span>Aktiv standard</span>
          <strong>Collectium / Museum</strong>
          <p>Sidebar Â· topmeny Â· lys/mÃ¸rk-bryter Â· login</p>
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
    </div>
  );
}
