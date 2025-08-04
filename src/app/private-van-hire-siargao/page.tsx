import { Metadata } from 'next'
import PrivateVanHireClient from './private-van-hire-client'
import { generateLocalBusinessSchema, generateJSONLD } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Private Van Hire Siargao | General Luna Airport Transfer ₱2,500 | Custom Routes Available',
  description: 'Private van hire in Siargao. Fixed price ₱2,500 for General Luna ↔ Airport transfers (up to 10 passengers). Custom quotes for Cloud 9, Pacifico, Dapa & other routes. Professional drivers, door-to-door service.',
  keywords: 'private van hire siargao, siargao van rental, general luna airport transfer, siargao group transport, van hire siargao philippines, cloud 9 transfer siargao, pacifico van hire, dapa transport siargao, siargao island van service, group transportation siargao, private transport siargao, siargao van booking',
  openGraph: {
    title: 'Private Van Hire Siargao | ₱2,500 General Luna ↔ Airport | Custom Routes',
    description: 'Book private van hire in Siargao. Fixed ₱2,500 for General Luna-Airport transfers. Custom quotes for other routes. Up to 10 passengers, professional drivers.',
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
          name: 'General Luna to Airport Transfer',
          description: 'Fixed price private van transfer from General Luna to Siargao Airport, accommodating up to 10 passengers with luggage',
          price: '2500',
          priceCurrency: 'PHP',
          availability: 'https://schema.org/InStock',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 10,
          },
        },
        {
          '@type': 'Offer',
          name: 'Airport to General Luna Transfer',
          description: 'Fixed price private van transfer from Siargao Airport to General Luna, door-to-door service with professional driver',
          price: '2500',
          priceCurrency: 'PHP',
          availability: 'https://schema.org/InStock',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 10,
          },
        },
        {
          '@type': 'Offer',
          name: 'Custom Route Van Hire',
          description: 'Private van hire for custom routes including Cloud 9, Pacifico, Dapa and other Siargao destinations',
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
          text: 'Our fixed price for General Luna ↔ Airport transfers is ₱2,500 one-way for up to 10 passengers. Other routes require custom quotes based on distance and destination.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many people can fit in the private van?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our vans can accommodate 8-10 passengers depending on the amount of luggage. We prioritize comfort and safety for all passengers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you provide transfers to Cloud 9 and other Siargao destinations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! We provide custom quote transfers to Cloud 9, Pacifico, Dapa, and all other Siargao destinations. Contact us via WhatsApp for personalized pricing.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I book private van hire in Siargao?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For General Luna-Airport transfers, click our WhatsApp booking button for instant ₱2,500 fixed price booking. For other routes, contact us for a custom quote.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is included in the private van hire service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All bookings include professional local driver, door-to-door pickup and drop-off, luggage assistance, air-conditioned van, and free waiting time up to 30 minutes.',
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