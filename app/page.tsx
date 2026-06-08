/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Hjem route
 *
 * Definering / formål:
 * Sender brukeren til startsideinnhold uten å lage egen sidebar, topbar eller lokalt shell.
 *
 * Bruksområde:
 * Route /
 *
 * Berørte sider / routes:
 * - /
 *
 * Berørte DB-brytere / feature_keys:
 * - landing.view
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

export default function HomePage() {
  return (
    <main className="ct-stack">
      <PageHeader
        eyebrow="Collectium clean rebuild"
        title="For samlere. Av samlere. Alt på ett sted."
        lead="Dette er ren Collectium-baseline med én global sidemeny, én global topbar og sider som bare leverer innhold."
      />

      <section className="ct-grid ct-grid--three" aria-label="Hovedinnganger">
        <InfoCard title="Startside" label="Inngang" text="Ren startside uten lokal sidebar eller gammel templatekode." href="/startside" />
        <InfoCard title="Katalog" label="Samler · Historie · Finans" text="Katalogflate som senere kobles til API og MariaDB. Ingen hardkodet sannhet i frontend." href="/katalog" />
        <InfoCard title="Min side" label="Brukerflate" text="Enkel placeholder for profil, samling, varsler og prosesser." href="/min-side" />
      </section>

      <section className="ct-panel ct-signature-box">
        <p className="ct-eyebrow">Låst regel</p>
        <h2>Kun global template eier layout.</h2>
        <p>
          Vanlige sider skal ikke lage egen topbar, sidebar, body, html, bakgrunn eller visuell ramme. Dette hindrer dobbel og trippel sidebar.
        </p>
        <div className="ct-actions"><Link className="ct-button ct-button--primary" href="/startside">Åpne startside</Link></div>
      </section>
    </main>
  );
}
