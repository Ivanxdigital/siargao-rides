import { Metadata } from 'next'
import PrivateVanHireClient from './private-van-hire-client'
import { generateLocalBusinessSchema, generateJSONLD } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'All-Day Private Van Hire Siargao | Land Tour ₱8,000 | WhatsApp Booking',
  description: 'All-day private van hire in Siargao for land tours and flexible itineraries. ₱8,000 all day (temporary rate). Private-only service with professional drivers. Message us on WhatsApp to confirm availability or request a custom quote.',
  keywords: 'private van hire siargao, all day van hire siargao, siargao land tour private, private transport siargao, siargao private driver, van rental with driver siargao, siargao group transport, siargao tour van hire, general luna private van, siargao itinerary transport',
  openGraph: {
    title: 'All-Day Private Van Hire Siargao | ₱8,000 All Day | Private Land Tours',
    description: 'Book all-day private van hire in Siargao for land tours and custom itineraries. ₱8,000 all day (temporary rate). Message us on WhatsApp.',
    images: [
      {
        url: '/images/hero-bg-1.png',
        width: 1200,
        height: 630,
        alt: 'Private van hire service in Siargao Island - General Luna to Airport transfers and custom routes available',
      },
    ],
  },
}

export default function PrivateVanHirePage() {
  // Generate structured data for SEO
  const vanHireServiceSchema = {
    ...generateLocalBusinessSchema(),
    '@type': ['LocalBusiness', 'TaxiService', 'TouristInformationCenter'],
    name: 'Siargao Rides - Private Van Hire Service',
    description: 'Private van hire service in Siargao Island. Fixed price transfers between General Luna and Airport, plus custom quotes for all other island destinations.',
    priceRange: '₱₱',
    areaServed: [
      {
        '@type': 'City',
        name: 'General Luna',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'General Luna',
          addressRegion: 'Surigao del Norte',
          addressCountry: 'PH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 9.8021,
          longitude: 126.1164,
        },
      },
      {
        '@type': 'City', 
        name: 'Cloud 9',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Cloud 9',
          addressRegion: 'Surigao del Norte',
          addressCountry: 'PH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 9.8147,
          longitude: 126.1547,
        },
      },
      {
        '@type': 'City',
        name: 'Pacifico',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Pacifico',
          addressRegion: 'Surigao del Norte',
          addressCountry: 'PH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 9.7653,
          longitude: 126.1342,
        },
      },
      {
        '@type': 'City',
        name: 'Dapa',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dapa',
          addressRegion: 'Surigao del Norte',
          addressCountry: 'PH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 9.7591,
          longitude: 126.0489,
        },
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Private Van Hire Services',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'All-Day Private Van Hire (Land Tour)',
          description: 'All-day private van hire for land tours and flexible itineraries in Siargao with professional driver',
          price: '8000',
          priceCurrency: 'PHP',
          availability: 'https://schema.org/InStock',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 10,
          },
        },
        {
          '@type': 'Offer',
          name: 'Custom Itinerary / Multi-stop Hire',
          description: 'Private van hire for custom itineraries, multi-stop routes, and special requests via WhatsApp quote',
          priceCurrency: 'PHP',
          availability: 'https://schema.org/InStock',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 10,
          },
        },
      ],
    },
  }

  // FAQ Schema for rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does private van hire cost in Siargao?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our temporary fixed price for all-day private van hire (land tour) is ₱8,000. For custom itineraries or special routes, message us on WhatsApp for a quote.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I book all-day private van hire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Booking is WhatsApp-first. Message us your date, pickup location, itinerary, and number of guests and we will confirm availability and coordinate the driver.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is this a private service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We only offer private van hire for your group or couple. No shared rides.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your reconfirmation policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If no reservation fee is collected, we require reconfirmation a few hours before pickup. If you do not reconfirm, we automatically cancel the booking.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is included in the private van hire service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All-day hire includes a professional driver, air-conditioned van, and door-to-door pickup for your itinerary. Inclusions can vary by route and requests; confirm details via WhatsApp.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(vanHireServiceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <PrivateVanHireClient />
    </>
  )
}
