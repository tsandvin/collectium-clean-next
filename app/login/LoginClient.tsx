"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse =
  | {
      ok: true;
      authenticated: true;
      user: {
        id: number;
        public_id: string;
        email: string;
        display_name: string;
        public_display_name: string | null;
        preferred_language: string;
        preferred_theme: string;
        account_status: string;
        email_status: string;
        admin_approval_status: string;
        role: string;
        is_admin: number;
        is_active: number;
      };
    }
  | {
      ok: false;
      message: string;
      error?: string;
    };

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("tsandvin@gmail.com");
  const [password, setPassword] = useState("CollectiumTest123!");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setMessage(data.message || "Innlogging feilet.");
        return;
      }

      router.push("/min-side");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Innlogging feilet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ct-login-page">
      <section className="ct-login-card">
        <p className="ct-kicker">Collectium konto</p>
        <h1>Logg inn</h1>
        <p>
          Bruk Collectium-konto for å åpne Min side, samling, varsler,
          prosesser og personlige arbeidsflater.
        </p>

        <form onSubmit={handleSubmit} className="ct-login-form">
          <label>
            <span>E-post</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            <span>Passord</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {message ? <p className="ct-login-message">{message}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Logger inn ..." : "Logg inn"}
          </button>
        </form>
      </section>

      <section className="ct-login-info">
        <h2>Auth-status</h2>
        <p>
          Denne siden bruker ekte Next.js API-ruter mot MariaDB:
          /api/auth/login, /api/auth/session og /api/profile/me.
        </p>
      </section>
    </main>
  );
}
