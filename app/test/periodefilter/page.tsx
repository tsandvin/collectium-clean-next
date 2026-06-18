/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter testside UI/UX 8.6
 *
 * Definering / formål:
 * Viser testflate for periodefilterets tre rader: Nasjonal hovedperiode, Hovedperiode og Underperiode / relasjon.
 *
 * Bruksområde:
 * Åpnes på /test/periodefilter for å kontrollere periodefiltermodellen mot Neon/API.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 *
 * Berørte API-ruter:
 * - GET /api/filter/period/options
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_object_relations_resolved
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_test_page_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0002 / CHANGE-2026-06-18-0001
 */

import CollectiumPeriodFilterTest from "@/components/period-filter-test/CollectiumPeriodFilterTest";

export const dynamic = "force-dynamic";

export default function PeriodFilterTestPage() {
  return <CollectiumPeriodFilterTest />;
}
