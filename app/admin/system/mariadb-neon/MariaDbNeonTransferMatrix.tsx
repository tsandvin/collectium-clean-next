"use client";

import { useEffect, useState } from "react";

type TransferRow = {
  line_no: number;
  source_key: string;
  object_group: string;
  mariadb_table: string | null;
  neon_table: string | null;
  mariadb_exists: boolean;
  neon_exists: boolean;
  mariadb_rows: number | null;
  neon_rows: number | null;
  status: "OK" | "VARSEL" | "MANGLER" | "INFO";
  status_color: "green" | "yellow" | "red" | "blue";
  deviation_no: string;
  next_action_no: string;
};

type TransferMatrixResponse = {
  ok: boolean;
  checked_at: string;
  summary: {
    total: number;
    ok: number;
    varsel: number;
    mangler: number;
    info: number;
  };
  database_summary: {
    mariadb_table_or_view_count: number;
    neon_table_or_view_count: number;
  };
  rows: TransferRow[];
};

function statusStyle(color: TransferRow["status_color"]) {
  if (color === "green") return { color: "#166534", background: "#dcfce7", border: "1px solid #86efac" };
  if (color === "yellow") return { color: "#854d0e", background: "#fef9c3", border: "1px solid #fde68a" };
  if (color === "blue") return { color: "#1e3a8a", background: "#dbeafe", border: "1px solid #93c5fd" };
  return { color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca" };
}

export default function MariaDbNeonTransferMatrix() {
  const [data, setData] = useState<TransferMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/system/mariadb-neon-transfer-matrix", {
          cache: "no-store"
        });

        const json = (await response.json()) as TransferMatrixResponse;

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Ukjent feil");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section style={{ marginTop: 24, padding: 16, border: "1px solid #fecaca", borderRadius: 12 }}>
        <h2>Overføringsmatrise</h2>
        <p>Feil ved lasting: {error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section style={{ marginTop: 24, padding: 16, border: "1px solid #d8dde7", borderRadius: 12 }}>
        <h2>Overføringsmatrise</h2>
        <p>Laster MariaDB–Neon-overføring...</p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 24, padding: 16, border: "1px solid #d8dde7", borderRadius: 12 }}>
      <h2>Overføringsmatrise</h2>
      <p>
        Kilder: {data.summary.total}. OK: {data.summary.ok}. Varsel: {data.summary.varsel}. Mangler:{" "}
        {data.summary.mangler}. Info: {data.summary.info}.
      </p>
      <p style={{ opacity: 0.7 }}>
        MariaDB tabeller/views: {data.database_summary.mariadb_table_or_view_count}. Neon tabeller/views:{" "}
        {data.database_summary.neon_table_or_view_count}.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>#</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Kilde</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>MariaDB</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Neon</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Status</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Tiltak</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={`${row.source_key}:${row.object_group}:${row.mariadb_table}`}>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.line_no}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <strong>{row.source_key}</strong>
                  <div style={{ opacity: 0.65, fontSize: 11 }}>{row.object_group}</div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <code>{row.mariadb_table || "—"}</code>
                  <div style={{ opacity: 0.7, fontSize: 11 }}>
                    {row.mariadb_exists ? "finnes" : "mangler"} · rader: {row.mariadb_rows ?? "ukjent"}
                  </div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <code>{row.neon_table || "—"}</code>
                  <div style={{ opacity: 0.7, fontSize: 11 }}>
                    {row.neon_exists ? "finnes" : "mangler"} · rader: {row.neon_rows ?? 0}
                  </div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontWeight: 700,
                      ...statusStyle(row.status_color)
                    }}
                  >
                    {row.status}
                  </span>
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 11 }}>{row.deviation_no}</div>
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{row.next_action_no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

