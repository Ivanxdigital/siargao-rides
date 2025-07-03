import { Metadata } from 'next'
import NotFoundClient from './not-found-client'

export const metadata: Metadata = {
  title: 'Page Not Found | Siargao Rides',
  description: 'The page you are looking for could not be found. Explore our vehicle rental options or return to the homepage.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Page Not Found | Siargao Rides',
    description: 'The page you are looking for could not be found. Browse our vehicle rental options in Siargao Island.',
    type: 'website',
    images: [
      {
        url: '/images/siargao-rides-og-image.jpg',
        width: 1200,
        height: 630,
        alt: '404 - Page Not Found | Siargao Rides',
      },
    ],
  },
}

export default function NotFound() {
  return <NotFoundClient />
}