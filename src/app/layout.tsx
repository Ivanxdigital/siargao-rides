import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./calendar.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from './providers';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Siargao Rides - Motorbike Rental Directory",
  description: "Find and book motorbikes from local rental shops in Siargao Island.",
  applicationName: "Siargao Rides",
  authors: [{ name: "Siargao Rides Team" }],
  keywords: ["motorbike rental", "Siargao", "Philippines", "tourism", "bike rental"],
  creator: "Siargao Rides",
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
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
