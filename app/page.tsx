import Link from "next/link";

const cards = [
  {
    title: "Katalog",
    body: "SÃ¸k og arbeid med objekter, kilder, relasjoner og historiske data.",
    href: "/katalog",
  },
  {
    title: "Min side",
    body: "Se samling, prosesser, varsler, meldinger og brukerstatus.",
    href: "/min-side",
  },
  {
    title: "Systemkontroll",
    body: "Kontroller MariaDB, Neon, API-status og plattformkrav.",
    href: "/admin/system/mariadb-neon",
  },
];

export default function HomePage() {
  return (
    <div className="ct-page">
      <section className="ct-page-header">
        <p className="ct-eyebrow">Collectium</p>
        <h1>Katalog, samling og marked i Ã©n arbeidsflate.</h1>
        <p className="ct-lead">
          Collectium er en kontrollert Next.js-front for katalogdata,
          samlinger, relasjoner, prosesser og markedsinnsikt.
        </p>
        <div className="ct-actions">
          <Link className="ct-button ct-button-primary" href="/katalog">
            Ã…pne katalog
          </Link>
          <Link className="ct-button" href="/min-side">
            Min side
          </Link>
        </div>
      </section>

      <section className="ct-grid ct-grid-3" aria-label="HovedomrÃ¥der">
        {cards.map((card) => (
          <Link className="ct-card" href={card.href} key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
