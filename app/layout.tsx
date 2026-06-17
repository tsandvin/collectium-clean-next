import type { Metadata } from "next";
import "./globals.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Collectium UI/UX 8.6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" data-template="collectium" data-skin="signature-light" data-vp="pc">
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
