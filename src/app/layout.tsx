import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./calendar.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from './providers';
import { PerformanceInit } from '@/components/PerformanceInit';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://siargaorides.ph'),
  title: "Private Van Hire & Private Tours Siargao | Airport Transfer & Land Tours",
  description: "Premium private van hire and private tours in Siargao. Fixed ₱3,000 Airport ↔ General Luna transfers and ₱8,000 all-day private van hire (temporary rate). Book via WhatsApp for fast quotes.",
  applicationName: "Siargao Rides",
  authors: [{ name: "Siargao Rides Team" }],
  keywords: [
    "private van hire Siargao",
    "private airport transfer Siargao",
    "Siargao airport pickup",
    "General Luna airport transfer",
    "all day private van hire Siargao",
    "private land tour Siargao",
    "private tours Siargao",
    "private island hopping Siargao",
    "premium tour Siargao",
    "Siargao transportation"
  ],
  creator: "Siargao Rides",
  category: "Transportation & Tours",
  classification: "Local Service",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://siargaorides.ph',
    siteName: 'Siargao Rides',
    title: 'Private Van Hire & Private Tours Siargao | WhatsApp Booking',
    description: 'Premium private van hire and private tours in Siargao. Airport transfers and all-day private hire coordinated via WhatsApp for fast quotes.',
    images: [
      {
        url: '/images/siargao-rides-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Siargao Rides - Private Van Hire and Private Tours in Siargao',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Private Van Hire & Private Tours Siargao | WhatsApp Booking',
    description: 'Premium private van hire and private tours in Siargao. Airport transfers and all-day private hire coordinated via WhatsApp.',
    images: ['/images/siargao-rides-og-image.jpg'],
    creator: '@siargaorides',
    site: '@siargaorides',
  },
  alternates: {
    canonical: 'https://siargaorides.ph',
  },
  other: {
    'geo.region': 'PH-AGN',
    'geo.placename': 'Siargao Island',
    'geo.position': '9.8756;126.0892',
    'ICBM': '9.8756, 126.0892',
  },
  icons: {
    icon: [
      {
        url: '/favicon/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/favicon/favicon.svg',
    apple: '/favicon/favicon.svg',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head />
      <body className={cn('bg-background min-h-screen font-sans antialiased overflow-x-hidden', inter.className)}>
        <Providers>
          <AuthProvider>
            <PerformanceInit />
            <div className="relative flex min-h-screen flex-col">
              <ScrollToTop />
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <WhatsAppFloat hiddenOnPages={['/airport-transfer-siargao']} />
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
