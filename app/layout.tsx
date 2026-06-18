import type { Metadata } from "next";
import "./globals.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

export const metadata: Metadata = {
  title: "Collectium",
  description: "Collectium UI/UX 8.6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" data-template="collectium" data-skin="collectium" data-vp="pc">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('collectium-active-skin');
                  if (stored) {
                    document.documentElement.setAttribute('data-skin', stored);
                    document.documentElement.setAttribute('data-ct-skin', stored);
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        <CollectiumAppShell>{children}</CollectiumAppShell>
      </body>
    </html>
  );
}
