import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./brand.css";
import { ToastProvider } from "@/components/ui";

// Self-host the same brand fonts so local development never depends on Google.
const archivo = localFont({ src: "../../public/fonts/archivo-latin.woff2", variable: "--font-archivo", weight: "100 900", display: "swap" });
const inter = localFont({ src: "../../public/fonts/inter-latin.woff2", variable: "--font-inter", weight: "100 900", display: "swap" });
const caveat = localFont({ src: "../../public/fonts/caveat-latin.woff2", variable: "--font-caveat", weight: "400 700", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "OWNIT — Design It. Own It. Wear It.",
    template: "%s — OWNIT",
  },
  description:
    "Your imagination, on premium apparel. Create your own designs, preview your artwork, and wear something only you could make.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${caveat.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
