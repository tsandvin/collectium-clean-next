/**
 * Collectium test page: Period filter + DB backed view cards.
 * Purpose: controlled test surface for locked UI 8.6 period filter and view-card layout.
 * Route: /test/periodefilter
 * DB/features touched through API only:
 * - catalog.object.open
 * - object.presentation.view
 * - object.relations.view
 * - object.market.view
 * - object.user_state.view
 */

import CollectiumPeriodFilterTest from "@/components/period-filter-test/CollectiumPeriodFilterTest";

export const dynamic = "force-dynamic";

export default function PeriodFilterTestPage() {
  return <CollectiumPeriodFilterTest />;
}
