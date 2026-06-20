/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Period 8.6 Result Demo Page
 *
 * Definering / formål:
 * Testside for å vise hvordan Periode 8.6 forklarer resultat i alle felt:
 * Norge, 1900, Rad 1 Konge, Rad 2 Krig, Rad 3 Historisk, Rad 4 Motiv.
 *
 * Bruksområde:
 * Intern testside før modellen kobles sterkere mot Neon.
 *
 * Berørte sider / routes:
 * - /test/period86-result
 *
 * Berørte DB-brytere / feature_keys:
 * - period86.result.demo.view
 *
 * Berørte API-ruter:
 * - GET /api/period86/result-demo
 *
 * Berørte tabeller / views:
 * - Senere: ct_v_period_filter_options
 * - Senere: ct_v_period86_dynamic_field_resolved
 *
 * Dataretning:
 * API -> komponent -> UI
 *
 * Logging:
 * log_category: period86
 * log_action: result_demo_page
 *
 * Versjon:
 * CT-PERIOD86-RESULT-DEMO-PAGE-0001
 */

import Period86ResultDemo from "@/components/period86/Period86ResultDemo";

export const dynamic = "force-dynamic";

export default function Period86ResultDemoPage() {
  return <Period86ResultDemo />;
}
