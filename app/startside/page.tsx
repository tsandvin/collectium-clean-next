/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Startside
 *
 * Definering / formål:
 * Ren startsideinnholdskomponent. Skal ikke eie topbar, sidebar eller shell.
 *
 * Bruksområde:
 * Route /startside
 *
 * Berørte sider / routes:
 * - /startside
 *
 * Berørte DB-brytere / feature_keys:
 * - landing.view
 * - landing.register
 * - landing.login
 *
 * Berørte API-ruter:
 * - Ingen i v1 clean template
 *
 * Berørte tabeller / views:
 * - Ingen i v1 clean template
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: landing
 * log_action: view
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { InfoCard } from '@/components/ui/InfoCard';

export default function StartsidePage() {
  return (
    <main className="ct-stack">
      <PageHeader
        eyebrow="For samlere · For historien · For markedet"
        title="Collectium bygger katalog, samling og markedsforståelse i samme flate."
        lead="Første rene versjon viser bare grunnstruktur. Katalogdata, tilgang, handlinger og medlemskap kobles senere via API og MariaDB."
      />

      <section className="ct-grid ct-grid--three">
        <InfoCard title="Samler" label="Brukerstatus" text="Min samling, ønskeliste, favoritter og transaksjoner skal senere ligge bak tilgang og API." />
        <InfoCard title="Historie" label="Relasjoner" text="Regenter, personer, produsenter, perioder, funn og kilder bygges som relasjonspresentasjoner." />
        <InfoCard title="Finans" label="Marked" text="Markedsverdi, trend, auksjon, nettbutikk og index kobles til egne datakilder." />
      </section>

      <section className="ct-panel ct-signature-box">
        <p className="ct-eyebrow">Ren base</p>
        <h2>Ingen gamle komponentgenerasjoner er importert.</h2>
        <p>Dette prosjektet skal bygges videre modul for modul, ikke ved å kopiere inn gamle startside-, katalog- eller shell-filer.</p>
        <div className="ct-actions"><Link className="ct-button" href="/katalog">Se katalog placeholder</Link></div>
      </section>
    </main>
  );
}
