import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Siargao Private Van Hire | Airport Transfers and Day Tours",
  description:
    "Comfortable private van hire in Siargao for airport pickups and 8-hour day tours. Friendly local drivers, clear rates, and fast WhatsApp booking.",
  keywords: [
    "van hire in Siargao",
    "private van transfer Siargao",
    "private van airport transfer Siargao",
    "all day van hire in Siargao",
    "land tour in Siargao",
  ],
  openGraph: {
    title: "Siargao Private Van Hire | Airport Transfers and Day Tours",
    description:
      "Book a private van in Siargao for airport transfers and custom day tours. Professional service with quick WhatsApp booking.",
    url: absoluteUrl("/"),
    siteName: "Siargao Rides",
    type: "website",
    images: [
      {
        url: absoluteUrl("/daku-island.webp"),
        width: 1200,
        height: 630,
        alt: "Private van hire in Siargao",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Siargao Private Van Hire | Airport Transfers and Day Tours",
    description:
      "Book a private van in Siargao for airport transfers and custom day tours. Professional service with quick WhatsApp booking.",
    images: [absoluteUrl("/daku-island.webp")],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased selection:bg-slate-200 selection:text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
