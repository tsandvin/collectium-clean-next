/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Min side page
 *
 * Definering / formål:
 * Next.js page route for /min-side. Setter metadata og laster
 * klientsiden av brukerpanelet (CollectiumMinSideClient).
 *
 * Berørte sider / routes:
 * - /min-side
 *
 * Berørte DB-brytere / feature_keys:
 * - account.view
 * - account.overview.view
 * - profile.view
 * - membership.view
 * - collection.view
 * - notifications.view
 * - processes.view
 *
 * Berørte API-ruter:
 * - GET /api/account/overview
 * - GET /api/account/profile
 * - GET /api/account/membership
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: account
 * log_action: view
 */

import CollectiumMinSideClient from "./CollectiumMinSideClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Min side | Collectium",
  description: "Ditt kontrollsenter for profil, medlemskap, samling, kjøp, salg, varsler og prosesser.",
};

export default function MinSidePage() {
  return <CollectiumMinSideClient />;
}
