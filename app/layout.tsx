import type { Metadata } from "next";
import "./globals.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Samlerplattform for katalog, historie og marked.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
