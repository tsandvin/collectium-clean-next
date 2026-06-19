/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Tidslinjeperiode testside
 *
 * Definering / formål:
 * Next.js App Router-side for ny periode-/tidslinjevisning basert på Neon/API-data.
 *
 * Bruksområde:
 * Brukes som testside for å vise perioder, nivåer, relasjoner og objektkoblinger i historisk rekkefølge.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_v_period_filter_registry_active
 * - ct_catalog_period_relations
 * - ct_v_catalog_period_relations
 * - ct_sn_period_relation
 * - ct_sn_period_relation_links
 * - ct_sn_period_type_registry
 * - ct_v_period_filter_find_relations
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: view
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-0001 / CHANGE-2026-06-19-0001
 */

import { CollectiumPeriodTimelineClient } from "@/components/period-timeline/CollectiumPeriodTimelineClient";

export default function PeriodetidslinjePage() {
  return <CollectiumPeriodTimelineClient />;
}
