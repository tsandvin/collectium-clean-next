/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Tidslinjeperiode testside
 *
 * Definering / formål:
 * Next.js server component for en horisontal tidslinjevisning av perioder fra Neon/API.
 *
 * Bruksområde:
 * Testside for Collectium UI/UX 8.6 periode- og relasjonstidslinje.
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
 * Neon/Postgres -> Next.js route handler -> React client component -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: page_render
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-PAGE-0002 / CHANGE-2026-06-19-0002
 */

import { CollectiumPeriodTimelineClient } from "@/components/period-timeline/CollectiumPeriodTimelineClient";

export default function PeriodetidslinjePage() {
  return <CollectiumPeriodTimelineClient />;
}
