"use client";

import { useEffect, useState } from "react";

type CtAuthUser = {
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

type CtSessionItem = {
  id: number;
  user_id: number;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  last_seen_at: string | null;
  device_type: string;
};

type ProfileResponse =
  | {
      ok: true;
      user: CtAuthUser;
    }
  | {
      ok: false;
      message: string;
    };

type SessionsResponse =
  | {
      ok: true;
      sessions: CtSessionItem[];
    }
  | {
      ok: false;
      message: string;
    };

export default function CollectiumMinSideClient() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CtAuthUser | null>(null);
  const [sessions, setSessions] = useState<CtSessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);

    try {
      const profileResponse = await fetch("/api/profile/me", {
        method: "GET",
        cache: "no-store",
      });

      const profileData = (await profileResponse.json()) as ProfileResponse;

      if (!profileResponse.ok || !profileData.ok) {
        setUser(null);
        setSessions([]);
        setError("Du er ikke logget inn.");
        return;
      }

      setUser(profileData.user);

      const sessionsResponse = await fetch("/api/profile/sessions", {
        method: "GET",
        cache: "no-store",
      });

      const sessionsData = (await sessionsResponse.json()) as SessionsResponse;

      if (sessionsResponse.ok && sessionsData.ok) {
        setSessions(sessionsData.sessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente Min side-data.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    setUser(null);
    setSessions([]);
    setError("Du er logget ut.");
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  if (loading) {
    return (
      <main>
        <h1>Min side</h1>
        <p>Henter innlogget bruker fra Collectium-session ...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <h1>Min side</h1>
        <p>{error ?? "Du er ikke logget inn."}</p>
        <p>Logg inn for å vise profil, samling, prosesser, varsler og aktive økter.</p>
      </main>
    );
  }

  return (
    <main>
      <section>
        <p>Collectium / Min side</p>
        <h1>{user.display_name}</h1>
        <p>{user.email}</p>

        <dl>
          <div>
            <dt>Bruker-ID</dt>
            <dd>{user.id}</dd>
          </div>
          <div>
            <dt>Public ID</dt>
            <dd>{user.public_id}</dd>
          </div>
          <div>
            <dt>Konto</dt>
            <dd>{user.account_status}</dd>
          </div>
          <div>
            <dt>E-post</dt>
            <dd>{user.email_status}</dd>
          </div>
          <div>
            <dt>Admin-godkjenning</dt>
            <dd>{user.admin_approval_status}</dd>
          </div>
          <div>
            <dt>Rolle</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>

        <button type="button" onClick={logout}>
          Logg ut
        </button>
      </section>

      <section>
        <h2>Aktive og tidligere økter</h2>

        {sessions.length === 0 ? (
          <p>Ingen session-rader funnet for brukeren.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Enhet</th>
                <th>IP</th>
                <th>Opprettet</th>
                <th>Sist sett</th>
                <th>Utløper</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.device_type}</td>
                  <td>{session.ip_address ?? "Ukjent"}</td>
                  <td>{session.created_at}</td>
                  <td>{session.last_seen_at ?? "Ikke registrert"}</td>
                  <td>{session.expires_at}</td>
                  <td>{session.revoked_at ? "Avsluttet" : "Aktiv"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Neste Min side-moduler</h2>
        <p>
          Denne siden er nå koblet til ekte auth/session. Neste moduler bør være
          samling, transaksjonslogg, prosesser, varsler og meldinger.
        </p>
      </section>
    </main>
  );
}
