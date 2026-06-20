/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Periodefilter Test Page - Comparison Groups v21
 *
 * Definering / formål:
 * Testside for Periode 8.6 sammenligning. Filter/rullegardin viser grupper.
 * Tidslinjen viser verdier/noder under valgt gruppe.
 *
 * Bruksområde:
 * Brukes for å teste sammenligning mellom konge/regent, nasjonal periode,
 * krig/konflikt, finans/økonomi, objektutgivelser, sykdom, motiv og proveniens.
 *
 * Berørte sider / routes:
 * - /test/periodefilter
 *
 * Berørte API-ruter:
 * - GET /api/period86/comparison-demo
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.comparison.view
 * - period86.timeline.view
 * - period86.group_filter.view
 *
 * Dataretning:
 * API -> komponent -> UI
 *
 * Versjon:
 * CT-PERIODEFILTER-COMPARISON-GROUPS-0021
 */

import Period86ComparisonDemo from "@/components/period86/Period86ComparisonDemo";

export const dynamic = "force-dynamic";

export default function PeriodefilterTestPage() {
  return <Period86ComparisonDemo />;
}
