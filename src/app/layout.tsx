import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./calendar.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from './providers';
import { PerformanceInit } from '@/components/PerformanceInit';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Motorbike & Car Rental Siargao | Best Vehicle Rentals in Siargao Island",
  description: "Rent motorbikes, cars, and scooters in Siargao Island, Philippines. Compare prices from trusted local rental shops. Book online with flexible pickup and competitive rates.",
  applicationName: "Siargao Rides",
  authors: [{ name: "Siargao Rides Team" }],
  keywords: [
    "motorbike rental Siargao", "motorcycle rental Siargao", "car rental Siargao", 
    "scooter rental Siargao", "vehicle rental Siargao Philippines", "Siargao bike rental",
    "rent motorbike Siargao Island", "tuktuk rental Siargao", "automatic motorcycle rental Siargao",
    "Siargao vehicle rental", "Cloud 9 motorbike rental", "General Luna scooter rental",
    "Siargao transportation", "Philippines motorbike rental", "Siargao tourism"
  ],
  creator: "Siargao Rides",
  category: "Transportation & Vehicle Rental",
  classification: "Local Business Directory",
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
    url: 'https://siargaorides.com',
    siteName: 'Siargao Rides',
    title: 'Motorbike & Car Rental Siargao | Best Vehicle Rentals in Siargao Island',
    description: 'Rent motorbikes, cars, and scooters in Siargao Island, Philippines. Compare prices from trusted local rental shops with flexible pickup and competitive rates.',
    images: [
      {
        url: '/images/siargao-rides-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Siargao Rides - Vehicle Rental Services in Siargao Island',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Motorbike & Car Rental Siargao | Best Vehicle Rentals in Siargao Island',
    description: 'Rent motorbikes, cars, and scooters in Siargao Island, Philippines. Compare prices from trusted local rental shops.',
    images: ['/images/siargao-rides-og-image.jpg'],
    creator: '@siargaorides',
    site: '@siargaorides',
  },
  alternates: {
    canonical: 'https://siargaorides.com',
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
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
