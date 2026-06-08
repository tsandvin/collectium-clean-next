/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side
 *
 * Definering / formål:
 * Enkel Min side-placeholder. Skal ikke eie topbar, sidebar eller shell.
 *
 * Bruksområde:
 * Route /min-side
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - user.dashboard.view
 * - collection.view
 * - notifications.view
 *
 * Berørte API-ruter:
 * - GET /api/min-side/summary senere
 *
 * Berørte tabeller / views:
 * - ct_users senere
 * - ct_collection_items senere
 * - ct_user_object_states senere
 *
 * Dataretning:
 * MariaDB -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: user
 * log_action: dashboard.view
 *
 * Versjon:
 * CT-CLEAN-0001
 */
import { PageHeader } from '@/components/ui/PageHeader';
import { InfoCard } from '@/components/ui/InfoCard';

export default function MinSidePage() {
  return (
    <main className="ct-stack">
      <PageHeader
        eyebrow="Min side"
        title="Ett rollebasert kontrollsenter for bruker, samling og aktivitet."
        lead="Denne siden er ren innholdsflate. Forhandler- og adminmoduler legges senere som egne kontrollerte moduler."
      />

      <section className="ct-grid ct-grid--three">
        <InfoCard title="Samling" label="0 objekter" text="Privat samling, ønskeliste og favoritter kobles senere til API." />
        <InfoCard title="Varsler" label="0 nye" text="Varsler, prosesser og meldinger skal være global aktivitet, ikke lokal sidekode." />
        <InfoCard title="Medlemskap" label="Ikke innlogget" text="Tilgang styres senere av DB 8.4 og medlemskap, ikke av frontend." />
      </section>
    </main>
  );
}
