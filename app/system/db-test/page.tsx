export const dynamic = "force-dynamic";

export default function DbTestPage() {
  return (
    <main className="collectium-page-content">
      <section className="collectium-hero-panel">
        <p className="collectium-kicker">SYSTEMTEST</p>
        <h1>MariaDB connection test</h1>
        <p className="collectium-lead">
          Denne siden tester ikke katalogdata ennå. Den kontrollerer bare at
          Next.js-serveren kan nå MariaDB via CT_DB_* miljøvariabler.
        </p>

        <div className="collectium-action-row">
          <a className="collectium-primary-action" href="/api/system/db-test">
            Åpne API-test
          </a>
        </div>
      </section>
    </main>
  );
}
