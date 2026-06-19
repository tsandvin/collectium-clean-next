/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium login page
 *
 * Definering / formål:
 * Login-side for Collectium med sessionstatus, medlemsnivåvisning og CollectiumBro-adminmodus.
 *
 * Berørte sider / routes:
 * - /login
 * - /min-side
 * - /admin
 * - /admin/neon
 *
 * Berørte DB-brytere / feature_keys:
 * - auth.login
 * - auth.logout
 * - auth.session.view
 * - account.view
 * - admin.collectiumbro.view
 *
 * Berørte API-ruter:
 * - GET /api/auth/session
 * - POST /api/auth/login
 * - POST /api/auth/logout
 *
 * Dataretning:
 * Neon → API/backend → Next.js → React → UI
 *
 * Logging:
 * log_category: auth
 * log_action: login_view
 */

import CollectiumLoginClient from "./CollectiumLoginClient";

export const metadata = {
  title: "Logg inn | Collectium",
  description: "Logg inn på Collectium med sessionstatus og CollectiumBro-adminmodus.",
};

export default function LoginPage() {
  return <CollectiumLoginClient />;
}
