/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Collectium Auth Form
 *
 * Definering / formÃ¥l:
 * Klientkomponent for login og registrering mot Neon-auth API.
 *
 * BruksomrÃ¥de:
 * Brukes pÃ¥ /login og /registrering.
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
 * - ct_user_sessions
 * - ct_login_attempts
 *
 * Dataretning:
 * Neon/Postgres -> API/backend -> Next.js -> React -> UI
 *
 * Logging:
 * log_category: auth
 * log_action: form.submit
 *
 * Versjon:
 * CT-FILE-AUTH-NEON-0008 / CHANGE-2026-06-10-0002
 */

"use client";

import { useState } from "react";
import styles from "./CollectiumAuthForm.module.css";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
};

type ApiResult = {
  ok: boolean;
  message?: string;
  error?: string;
  authenticated?: boolean;
  mode?: string;
};

export default function CollectiumAuthForm({ mode }: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";
  const title = isRegister ? "Registrer deg" : "Logg inn";
  const subtitle = isRegister
    ? "Opprett Collectium-konto i Neon-auth. Kontoen starter som Free og kan senere kobles til medlemskap."
    : "Logg inn med Collectium-kontoen din. Session leses fra Neon.";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          display_name: displayName,
        }),
      });

      const result = (await response.json()) as ApiResult;

      if (!response.ok || !result.ok) {
        setError(result.message || result.error || "Auth-feil.");
        return;
      }

      setMessage(isRegister ? "Registrering OK. Sender deg til Min side." : "Login OK. Sender deg til Min side.");
      window.location.href = "/min-side";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent auth-feil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.kicker}>Collectium Neon Auth</div>
        <h1>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        <form className={styles.form} onSubmit={onSubmit}>
          {isRegister ? (
            <label className={styles.field}>
              <span>Navn</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Navn / visningsnavn"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span>E-post</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="din@epost.no"
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Passord</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 tegn"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          {error ? <div className={styles.error}>{error}</div> : null}
          {message ? <div className={styles.success}>{message}</div> : null}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Behandler ..." : title}
          </button>
        </form>

        <div className={styles.links}>
          {isRegister ? (
            <a href="/login">Har du konto? Logg inn</a>
          ) : (
            <a href="/registrering">Ny bruker? Registrer deg</a>
          )}
        </div>

        <div className={styles.statusBox}>
          <strong>Teknisk status</strong>
          <span>API: {isRegister ? "POST /api/auth/register" : "POST /api/auth/login"}</span>
          <span>Database: Neon/Postgres</span>
          <span>Session: ct_session cookie + ct_user_sessions</span>
        </div>
      </section>
    </main>
  );
}
