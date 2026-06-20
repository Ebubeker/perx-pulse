import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Space_Mono, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-spacemono",
  weight: ["400", "700"],
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Perx Pulse",
  description: "The perks employees actually want — built for Albania, ready for the world.",
};

// Next 16: viewport/themeColor must be a separate export, not keys on `metadata`.
export const viewport: Viewport = {
  themeColor: "#ec6a4d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} ${serif.variable}`}>
        <body className="min-h-dvh">{children}</body>
      </html>
    </ClerkProvider>
  );
}
