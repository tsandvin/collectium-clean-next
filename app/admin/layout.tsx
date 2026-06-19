/**
 * COLLECTIUM FILE HEADER
 *
 * Overskrift:
 * Admin layout and route guard
 *
 * Definering / formål:
 * Håndterer server-side tilgangskontroll for alle sider under /admin.
 * Fjerner admin-visning for vanlige brukere og gjester.
 *
 * Berørte sider / routes:
 * - /admin/*
 *
 * Berørte DB-brytere / feature_keys:
 * - admin.collectiumbro.view
 *
 * Dataretning:
 * Neon -> API/backend -> UI
 */

import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth/neon-session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login?next=/admin/neon");
  }

  if (!user.is_admin) {
    return (
      <div className="ct-page" style={{ padding: "40px 20px" }}>
        <div 
          className="ct-card" 
          style={{ 
            maxWidth: "500px", 
            margin: "60px auto", 
            textAlign: "center",
            padding: "30px",
            border: "1px solid var(--ct-panel-border, #e2d7c5)",
            borderRadius: "var(--ct-radius-card, 8px)",
            background: "var(--ct-panel, #ffffff)"
          }}
        >
          <h2 style={{ color: "var(--ct-status-error, #a34024)", marginBottom: "16px" }}>Tilgang nektet</h2>
          <p style={{ marginBottom: "24px", color: "var(--ct-text-muted)" }}>Denne siden krever CollectiumBro-tilgang.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
