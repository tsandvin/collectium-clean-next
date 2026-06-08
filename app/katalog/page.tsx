/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Katalog
 *
 * Definering / formål:
 * Ren katalogside-placeholder. Skal ikke eie topbar, sidebar, local shell eller skinmotor.
 *
 * Bruksområde:
 * Route /katalog
 *
 * Berørte sider / routes:
 * - /katalog
 *
 * Berørte DB-brytere / feature_keys:
 * - catalog.view
 * - catalog.search
 * - catalog.filters
 * - catalog.object.open
 *
 * Berørte API-ruter:
 * - GET /api/catalog/search senere
 * - GET /api/catalog/filters senere
 *
 * Berørte tabeller / views:
 * - ct_v_catalog_objects_resolved senere
 * - ct_v_catalog_filter_counts senere
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: catalog
 * log_action: view
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { InfoCard } from '@/components/ui/InfoCard';

export default function KatalogPage() {
  return (
    <main className="ct-stack">
      <PageHeader
        eyebrow="Katalog"
        title="Relasjonskatalog for objekt, kilde, historie og marked."
        lead="Dette er bare en ren katalogflate. Filter, visningskort og API kobles inn kontrollert senere."
      />

      <section className="ct-panel ct-signature-box">
        <div className="ct-section-head">
          <div>
            <p className="ct-eyebrow">Filterrekkefølge</p>
            <h2>Source-scoped filter skal bygges fra API.</h2>
          </div>
          <span className="ct-pill">source_key + object_group</span>
        </div>
        <div className="ct-filter-row" aria-label="Filter placeholder">
          <span>Kilde</span><span>Objekttype</span><span>Land</span><span>Produsent</span><span>År</span><span>Valør</span><span>Regent</span><span>Verdi</span>
        </div>
      </section>

      <section className="ct-grid ct-grid--three">
        <InfoCard title="ObjectCard UI 8.5" label="Kort" text="Felles markup for horisontal, stående, liste og museum. Skin skal bare endre tokens." />
        <InfoCard title="Samler · Historie · Finans" label="Segment" text="Segmentene skal redusere støy uten å endre objektets tekniske nøkkel." />
        <InfoCard title="Åpne objekt" label="Route" text="Objektoppslag skal bruke source_key + object_group + object_id." />
      </section>
    </main>
  );
}
