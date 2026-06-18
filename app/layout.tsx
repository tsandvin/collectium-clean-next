import type { Metadata } from "next";
import {
  Cinzel,
  Comfortaa,
  Cormorant_Garamond,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";
import { CollectiumAppShell } from "@/components/layout/CollectiumAppShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const collectiumDisplay = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-collectium-display",
  display: "swap",
});

const samlerDisplay = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-samler-display",
  display: "swap",
});

const museumDisplay = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-museum-display",
  display: "swap",
});

const historicText = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-historic-text",
  display: "swap",
});

const financeSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-finance-sans",
  display: "swap",
});

const financeMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-finance-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Collectium",
  description: "Collectium UI/UX 8.6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVariables = [
    inter.variable,
    collectiumDisplay.variable,
    samlerDisplay.variable,
    museumDisplay.variable,
    historicText.variable,
    financeSans.variable,
    financeMono.variable,
  ].join(" ");

  return (
    <html
      lang="nb"
      className={fontVariables}
      data-template="collectium"
      data-skin="collectium"
      data-theme="collectium"
      data-vp="pc"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const aliases = {
                    "signature-light": "collectium",
                    "signature-dark": "museum",
                    "finance": "finans"
                  };
                  const allowed = ["collectium", "samler", "museum", "finans"];
                  const stored = localStorage.getItem('collectium-active-skin');
                  const normalized = aliases[stored] || stored || "collectium";
                  const nextSkin = allowed.indexOf(normalized) >= 0 ? normalized : "collectium";
                  document.documentElement.setAttribute('data-skin', nextSkin);
                  document.documentElement.setAttribute('data-theme', nextSkin);
                  document.documentElement.setAttribute('data-ct-skin', nextSkin);
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
