/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Password helper
 *
 * Definering / formÃ¥l:
 * Hashing og validering av passord for Neon-auth.
 *
 * BruksomrÃ¥de:
 * Brukes av login og registrering.
 *
 * BerÃ¸rte sider / routes:
 * - /login
 * - /registrering
 *
 * BerÃ¸rte DB-brytere / feature_keys:
 * - auth.login
 * - auth.register
 *
 * BerÃ¸rte API-ruter:
 * - POST /api/auth/login
 * - POST /api/auth/register
 *
 * BerÃ¸rte tabeller / views:
 * - ct_users
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: password.verify/password.hash
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0002 / CHANGE-2026-06-10-0002
 */

import bcrypt from "bcryptjs";

export function normalizeBcryptHash(hash: string): string {
  if (hash.startsWith("$2y$")) {
    return `$2b$${hash.slice(4)}`;
  }

  return hash;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, normalizeBcryptHash(passwordHash));
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Passordet mÃ¥ ha minst 8 tegn.";
  }

  return null;
}
