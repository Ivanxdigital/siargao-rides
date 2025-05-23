import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./calendar.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from './providers';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Siargao Rides - Vehicle Rental Directory",
  description: "Find and book motorcycles, cars, and tuktuks from local rental shops in Siargao Island.",
  applicationName: "Siargao Rides",
  authors: [{ name: "Siargao Rides Team" }],
  keywords: ["vehicle rental", "motorbike rental", "car rental", "tuktuk rental", "Siargao", "Philippines", "tourism"],
  creator: "Siargao Rides",
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
  }
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
            <div className="relative flex min-h-screen flex-col">
              <ScrollToTop />
              <AnnouncementBar />
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
