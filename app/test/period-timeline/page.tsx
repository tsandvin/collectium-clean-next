/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Tidslinjeperiode alias-side
 *
 * Definering / formål:
 * Alias-route for brukere som åpner /test/period-timeline. Hindrer 404 og viser samme
 * Tidslinjeperiode-komponent som /test/Periodetidslinje.
 *
 * Bruksområde:
 * Midlertidig test-/kompatibilitetsroute.
 *
 * Berørte sider / routes:
 * - /test/period-timeline
 * - /test/Periodetidslinje
 *
 * Berørte API-ruter:
 * - GET /api/test/period-timeline
 *
 * Berørte tabeller / views:
 * - ct_v_period_filter_options
 *
 * Dataretning:
 * Neon -> API route -> Next.js page -> React client component -> UI
 *
 * Logging:
 * log_category: test.period_timeline
 * log_action: alias_view
 *
 * Versjon:
 * CT-PERIOD-TIMELINE-V3
 */

import { CollectiumPeriodTimelineClient } from "@/components/period-timeline/CollectiumPeriodTimelineClient";

export default function PeriodTimelineAliasPage() {
  return <CollectiumPeriodTimelineClient />;
}
