/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter testside UI/UX 8.6 - sanne Neon-data
 *
 * Definering / formal:
 * Viser testflate for periodefilterets tre rader: Nasjonal hovedperiode,
 * Hovedperiode / tematisk periode og Objektperiode / konkret relasjon.
 *
 * Bruksomrade:
 * Apnes pa /test/periodefilter for a kontrollere periodefiltermodellen mot Neon/API.
 *
 * Berorte sider / routes:
 * - /test/periodefilter
 *
 * Berorte DB-brytere / feature_keys:
 * - filter.period.simple.view
 * - filter.period.advanced.view
 * - filter.master.resolve
 *
 * Berorte API-ruter:
 * - GET /api/filter/period/options
 * - GET /api/test/period-catalog
 *
 * Berorte tabeller / views:
 * - ct_period_filter_registry
 * - ct_period_filter_value_registry
 * - ct_v_period_filter_options
 * - ct_v_period_filter_registry_active
 * - ct_catalog_period_relations
 * - ct_v_catalog_period_relations
 * - ct_sn_period_relation
 * - ct_sn_period_relation_links
 * - ct_sn_period_type_registry
 * - ct_v_period_filter_find_relations
 * - ct_v_object_relations_resolved
 * - ct_v_object_presentation_resolved
 *
 * Dataretning:
 * MariaDB/Neon -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: filter
 * log_action: period_test_page_view
 *
 * Versjon:
 * CT-FILE-PERIOD-UI86-0003 / CHANGE-2026-06-19-0001
 */

import CollectiumPeriodFilterClient from "@/components/period-filter/CollectiumPeriodFilterClient";

export const dynamic = "force-dynamic";

export default function PeriodFilterTestPage() {
  return <CollectiumPeriodFilterClient />;
}
