import type { Metadata } from "next";
import { Archivo, Inter, Caveat } from "next/font/google";
import "./globals.css";
import "./brand.css";
import { ToastProvider } from "@/components/ui";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", weight: ["500", "700", "800", "900"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

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
