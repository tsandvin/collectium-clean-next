import type { Metadata } from "next";
import "./globals.css";
import "./styles/themes.css";
import "./styles/collectium-ui85-hard-polish.css";
import "./styles/collectium-ui85-sidebar-theme-layout.css";
import "./styles/collectium-ui85-sidebar-icons-clean.css";
import "./styles/collectium-ui85-v36.css";
import "./styles/collectium-ui85-fixed-sidebar-frame.css";
import "./styles/collectium-ui85-responsive-screen-engine.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

import CollectiumResponsiveRuntime from "@/components/CollectiumResponsiveRuntime";
export const metadata: Metadata = {
  title: "Collectium",
  description: "Samlerplattform for katalog, samling, marked og systemkontroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" data-theme="collectium">
      <body>
        <CollectiumResponsiveRuntime />
        <div className="collectium-shell">
          <Sidebar />

          <div className="collectium-workspace">
            <Topbar />

            <main className="collectium-app">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
