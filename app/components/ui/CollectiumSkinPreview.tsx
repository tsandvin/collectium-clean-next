/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * CollectiumSkinPreview
 *
 * Definering / formål:
 * Testkomponent som viser samme markup i alle fire skins for å kontrollere tokenbasert design.
 *
 * Bruksområde:
 * Brukes på intern designsjekk/support/sandboxside.
 *
 * Berørte sider / routes:
 * - /admin/system/design-preview eller annen kontrollside
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.system.design_preview.view dersom den brukes i admin
 *
 * Berørte API-ruter:
 * - Ingen
 *
 * Berørte tabeller / views:
 * - Ingen
 *
 * Dataretning:
 * Statisk UI-preview. Ingen DB.
 *
 * Logging:
 * log_category: design
 * log_action: preview.view
 *
 * Versjon:
 * CT-SKIN-PREVIEW-0001 / CHANGE-2026-06-11-0001
 */

export function CollectiumSkinPreview() {
  return (
    <main className="ct-page-frame">
      <section className="ct-content-shell">
        <div className="ct-panel">
          <p className="ct-muted" style={{ margin: 0 }}>Collectium UI 8.5</p>
          <h1 className="ct-headline">Fire globale skins med samme struktur</h1>
          <p className="ct-body ct-soft" style={{ maxWidth: 760 }}>
            Skin skal kun bytte tokens for farge, kontrast, typografi og stemning. Katalogkort, objektpresentasjon,
            relasjoner, filter og DB/API-logikk skal ha samme struktur uansett valgt skin.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 18 }}>
            <article className="ct-card">
              <p className="ct-muted">Objekt</p>
              <h2 className="ct-title">100 kroner · 1877 · Standardutgave</h2>
              <p className="ct-body">NSNR 23a · Norske sedler · Banknote</p>
              <button className="ct-button">Åpne objekt</button>
            </article>
            <article className="ct-card">
              <p className="ct-muted">Relasjon</p>
              <h2 className="ct-title">Oscar II</h2>
              <p className="ct-body">Regent, periode, objekter og historisk kontekst.</p>
              <button className="ct-button" data-variant="secondary">Se relasjon</button>
            </article>
            <article className="ct-card">
              <p className="ct-muted">Marked</p>
              <h2 className="ct-title">▲ 8,4 % · 12 mnd</h2>
              <p className="ct-body">Verdi, trend, likviditet og observasjoner.</p>
              <button className="ct-button">Finans</button>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
