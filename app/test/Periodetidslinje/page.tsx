/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Tidslinjeperiode testside
 *
 * Definering / formål:
 * Next.js App Router-side for ny horisontal periodetidslinje med Masterfilter,
 * tidslinjevalg, dynamiske informasjonsfelt og katalogtreff.
 *
 * Bruksområde:
 * Brukes som testside for periodefilter/tidslinje i UI/UX 8.6.
 *
 * Berørte sider / routes:
 * - /test/Periodetidslinje
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 * - ct_catalog_period_relations / ct_v_catalog_period_relations når tilgjengelig
 * - ct_v_object_presentation_resolved når tilgjengelig
 *
 * Dataretning:
 * Neon -> API route -> Next.js page -> React client component -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: view
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-V4
 */

import { CollectiumPeriodTimelineClient } from "@/components/period-timeline/CollectiumPeriodTimelineClient";

export default function PeriodetidslinjePage() {
  return <CollectiumPeriodTimelineClient />;
}
