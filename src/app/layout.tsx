import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
    type: "website",
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
