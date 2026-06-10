/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Registration page
 *
 * Definering / formÃ¥l:
 * Next.js-side for Neon-basert Collectium-registrering.
 *
 * BruksomrÃ¥de:
 * Brukes av nye brukere som skal registrere konto.
 *
 * BerÃ¸rte sider / routes:
 * - /registrering
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.register
 *
 * BerÃ¸rte API-ruter:
 * - POST /api/auth/register
 *
 * BerÃ¸rte tabeller / views:
 * - ct_users
 * - ct_user_sessions
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: register.page
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0010 / CHANGE-2026-06-10-0002
 */

import CollectiumAuthForm from "@/components/auth/CollectiumAuthForm";

export const metadata = {
  title: "Registrer deg | Collectium",
  description: "Opprett Collectium-konto med Neon-basert auth.",
};

export default function RegistrationPage() {
  return <CollectiumAuthForm mode="register" />;
}
