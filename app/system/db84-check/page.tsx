export const dynamic = "force-dynamic";

export default function Db84CheckPage() {
  return (
    <main className="collectium-page-content">
      <section className="collectium-hero-panel">
        <p className="collectium-kicker">SYSTEMTEST</p>
        <h1>DB 8.4 system check</h1>
        <p className="collectium-lead">
          Denne testen kontrollerer at Collectium DB 8.4-styringskjeden finnes:
          sider, features, access-regler, resolved access-view og action-routes.
        </p>

        <div className="collectium-action-row">
          <a className="collectium-primary-action" href="/api/system/db84-check">
            Åpne DB 8.4 API-test
          </a>
        </div>
      </section>
    </main>
  );
}
