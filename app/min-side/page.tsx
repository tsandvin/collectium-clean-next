/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side page
 *
 * Definering / formål:
 * Next.js route for Collectium Min side. Siden viser brukerens rollebaserte
 * kontrollsenter med arkivmappe-faner, oversikt, samling, transaksjoner,
 * prosesser, varsler, meldinger, dokumenter, sikkerhet, forhandler og admin.
 *
 * Bruksområde:
 * Brukes som hovedside for /min-side i app.collectium.no.
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.overview.view
 * - profile.view
 * - membership.view
 * - collection.view
 * - collection.wishlist.view
 * - collection.favorite.view
 * - transactions.view
 * - processes.view
 * - notifications.view
 * - messages.view
 * - documents.view
 * - security.sessions.view
 * - dealer.dashboard.view
 * - admin.dashboard.view
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - GET /api/account/overview
 * - GET /api/account/activity
 * - GET /api/account/processes
 * - GET /api/account/transactions
 * - GET /api/account/notifications
 * - GET /api/account/messages
 *
 * Berørte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 * - ct_user_object_states
 * - ct_collection_items
 * - ct_collection_transactions
 * - ct_activity_log
 * - ct_notifications
 * - ct_messages
 * - ct_processes
 *
 * Dataretning:
 * API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: account
 * log_action: min_side.view
 *
 * Versjon:
 * CT-FILE-MINSIDE-0001 / CHANGE-2026-06-11-0001
 *
 * Endringsregel:
 * Hovedkode skal ikke overskrives uten snapshot, manifest og godkjenning.
 */

import MinSideShell from "@/components/account/MinSideShell";

export const metadata = {
  title: "Min side | Collectium",
  description: "Rollebasert kontrollsenter for Collectium-brukere.",
};

export default function MinSidePage() {
  return <MinSideShell />;
}
