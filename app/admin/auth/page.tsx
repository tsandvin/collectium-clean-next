import { runAuthControlCheck, type CtCheckStatus } from "@/lib/access/auth-control";

export const dynamic = "force-dynamic";

function statusLabel(status: CtCheckStatus) {
  if (status === "OK") return "OK";
  if (status === "MANGLER") return "MANGLER";
  return "FEIL";
}

function statusClass(status: CtCheckStatus) {
  if (status === "OK") return "ctAuthStatusOk";
  if (status === "MANGLER") return "ctAuthStatusMissing";
  return "ctAuthStatusError";
}

function CheckTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, CtCheckStatus>;
}) {
  return (
    <section className="ctAuthPanel">
      <h2>{title}</h2>
      <div className="ctAuthRows">
        {Object.entries(rows).map(([name, status]) => (
          <div className="ctAuthRow" key={name}>
            <span>{name}</span>
            <strong className={statusClass(status)}>{statusLabel(status)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function AdminAuthPage() {
  const check = await runAuthControlCheck();

  return (
    <main className="ctAuthPage">
      <header className="ctAuthHeader">
        <p className="ctAuthEyebrow">Collectium admin</p>
        <h1>Auth-status</h1>
        <p>
          Clean Next.js auth-kontroll mot MariaDB og DB 8.4-kjeden. Ingen Better Auth,
          Auth.js, Clerk eller ekstern auth-integrasjon.
        </p>
      </header>

      <section className="ctAuthPanel">
        <h2>MariaDB connection</h2>
        <div className="ctAuthRows">
          <div className="ctAuthRow">
            <span>Status</span>
            <strong className={statusClass(check.database.status)}>
              {statusLabel(check.database.status)}
            </strong>
          </div>
          <div className="ctAuthRow">
            <span>Database</span>
            <strong>{check.database.name ?? "Ikke tilgjengelig"}</strong>
          </div>
          {check.database.error ? (
            <div className="ctAuthErrorBox">{check.database.error}</div>
          ) : null}
        </div>
      </section>

      <CheckTable title="Tabeller" rows={check.tables} />
      <CheckTable title="Features / brytere" rows={check.features} />
      <CheckTable title="Action routes" rows={check.routes} />

      <section className="ctAuthPanel">
        <h2>Oppsummering</h2>
        <div className="ctAuthSummary">
          <div>
            <span>OK</span>
            <strong>{check.summary.ok}</strong>
          </div>
          <div>
            <span>MANGLER</span>
            <strong>{check.summary.missing}</strong>
          </div>
          <div>
            <span>FEIL</span>
            <strong>{check.summary.errors}</strong>
          </div>
        </div>
      </section>

      <section className="ctAuthPanel">
        <h2>Svar til ChatGPT</h2>
        <pre className="ctAuthPre">{check.answerForChatGPT}</pre>
      </section>
    </main>
  );
}
