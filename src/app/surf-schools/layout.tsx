import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Surf Schools & Instructors in Siargao Island | Siargao Rides',
  description: 'Find the best surf schools and instructors in Siargao Island. Learn to surf at Cloud 9, General Luna, and other world-class surf breaks. Professional, verified instructors available.',
  keywords: 'surf schools siargao, surf lessons siargao, surf instructors siargao, cloud 9 surf, general luna surf, siargao surf academy, learn to surf siargao',
  openGraph: {
    title: 'Surf Schools & Instructors in Siargao Island',
    description: 'Find the best surf schools and instructors in Siargao Island. Learn to surf at Cloud 9, General Luna, and other world-class surf breaks.',
    type: 'website',
    locale: 'en_US',
    url: 'https://siargaorides.ph/surf-schools',
    siteName: 'Siargao Rides',
    images: [
      {
        url: '/og-surf-schools.jpg',
        width: 1200,
        height: 630,
        alt: 'Surf Schools in Siargao Island'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SiargaoRides',
    creator: '@SiargaoRides',
    title: 'Surf Schools & Instructors in Siargao Island',
    description: 'Find the best surf schools and instructors in Siargao Island. Learn to surf at Cloud 9, General Luna, and other world-class surf breaks.',
    images: ['/og-surf-schools.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://siargaorides.ph/surf-schools'
  }
}

export default function SurfSchoolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}