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
  title: "Siargao Rides | Private Van Transfers and Day Hire",
  description:
    "Private airport transfers and 8-hour day hire vans in Siargao. Fast WhatsApp booking, transparent rates, and premium local drivers.",
  openGraph: {
    title: "Siargao Rides | Private Van Transfers and Day Hire",
    description:
      "Book private airport transfers and full-day van hire around Siargao with quick WhatsApp support.",
    type: "website",
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
