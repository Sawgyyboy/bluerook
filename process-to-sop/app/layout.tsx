import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Process to SOP — Free Operations Tool by Bluerook",
  description:
    "Turn a messy business process into a clear SOP with steps, owners, controls, risks and automation opportunities.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Process to SOP — Free Operations Tool by Bluerook",
    description:
      "Turn a messy business process into a clear SOP with steps, owners, controls, risks and automation opportunities.",
    url: siteUrl,
    siteName: "Bluerook",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Process to SOP — Free Operations Tool by Bluerook",
    description:
      "Turn a messy business process into a clear SOP with steps, owners, controls, risks and automation opportunities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${geist.variable} ${geistMono.variable} min-h-dvh`}
      >
        {children}
      </body>
    </html>
  );
}
