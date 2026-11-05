import type { Metadata, Viewport } from "next";
import { Amiri, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-cormorant" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Our Little Universe",
  description: "A private place for our memories.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#080808", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${amiri.variable} ${cormorant.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
