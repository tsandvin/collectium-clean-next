/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side page
 *
 * Definering / formål:
 * Next.js route for /min-side. Siden bruker global Collectium layout/theme
 * og viser kun API/session-status eller tydelig manglende datastatus.
 *
 * Bruksområde:
 * Brukes som hovedside for /min-side i app.collectium.no.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - auth.session.view
 * - account.overview.view
 * - profile.view
 * - membership.view
 * - collection.view
 * - transactions.view
 * - processes.view
 * - notifications.view
 * - messages.view
 * - documents.view
 * - security.sessions.view
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - GET /api/account/overview
 * - GET /api/account/processes
 * - GET /api/account/transactions
 * - GET /api/account/notifications
 * - GET /api/account/messages
 * - GET /api/account/documents
 * - GET /api/account/security
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.view
 *
 * Versjon:
 * CT-FILE-MINSIDE-RAW-0001 / CHANGE-2026-06-11-0002
 */

import MinSideRawClient from "@/components/account/MinSideRawClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Min side | Collectium",
  description: "Rå API-drevet Min side med globalt Collectium-tema.",
};

export default function MinSidePage() {
  return <MinSideRawClient />;
}
