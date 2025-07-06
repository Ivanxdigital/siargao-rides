import { Metadata } from 'next'
import AirportTransferClient from './airport-transfer-client'
import { generateLocalBusinessSchema, generateJSONLD } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Pre-Book Private Van Hire Siargao - Airport Transfer | Starting August 2025',
  description: 'Pre-book your private airport transfer in Siargao starting August 2025. Luxury van service from Sayak Airport to General Luna, Cloud 9, Pacifico & Santa Monica. Guaranteed availability, locked-in rates: ₱2,500 for 2 PAX, ₱3,500 for 3-8 PAX. Secure your spot now.',
  keywords: 'pre-book airport transfer siargao, private van hire siargao 2025, airport transfer siargao august 2025, private pick up and drop off siargao, sayak airport transfer, general luna airport transfer, cloud 9 airport transfer, pacifico airport transfer, santa monica airport transfer, siargao airport shuttle, door to door airport service siargao, luxury airport transfer siargao, private airport pickup siargao, siargao van service pre-booking, airport transport siargao philippines, siargao travel transfer service, hyundai staria siargao, siargao airport taxi, burgos airport transfer, dapa airport transfer',
  openGraph: {
    title: 'Pre-Book Private Van Hire Siargao - Airport Transfer | Starting August 2025',
    description: 'Pre-book your private airport transfer in Siargao starting August 2025. Secure your spot for luxury van service from Sayak Airport to all destinations.',
    images: [
      {
        url: '/images/hero-bg-1.png',
        width: 1200,
        height: 630,
        alt: 'Luxury Hyundai Staria van providing private airport transfer service in Siargao Island',
      },
    ],
  },
}

export default function VanHirePage() {
  // Generate structured data for SEO
  const taxiServiceSchema = {
    ...generateLocalBusinessSchema(),
    '@type': ['LocalBusiness', 'TaxiService'],
    name: 'Siargao Rides - Private Van Hire',
    description: 'Private pickup and drop-off airport transfer service in Siargao Island with luxury Hyundai Staria van',
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
        name: 'Santa Monica',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Santa Monica',
          addressRegion: 'Surigao del Norte',
          addressCountry: 'PH',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 9.7891,
          longitude: 126.1123,
        },
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Private Airport Transfer Services',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Private Airport Transfer (2 Passengers)',
          description: 'Door-to-door private pickup and drop-off from Sayak Airport',
          price: '2500',
          priceCurrency: 'PHP',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 2,
          },
        },
        {
          '@type': 'Offer',
          name: 'Private Airport Transfer (3-8 Passengers)',
          description: 'Luxury van service for groups with professional driver',
          price: '3500',
          priceCurrency: 'PHP',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 8,
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
        name: 'How much is airport transfer in Siargao?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our private van hire service costs ₱2,500 for 2 passengers and ₱3,500 for 3-8 passengers. This includes door-to-door pickup and drop-off service from Sayak Airport to any destination in Siargao.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you provide private pickup and drop-off service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we provide private door-to-door pickup and drop-off service. Our driver will meet you at Sayak Airport arrivals with a name sign and take you directly to your destination without any stops.',
        },
      },
      {
        '@type': 'Question',
        name: 'What areas in Siargao do you service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We provide transfers to all major destinations in Siargao including General Luna, Cloud 9, Pacifico, Santa Monica, Burgos, and Dapa. Our service covers the entire island.',
        },
      },
      {
        '@type': 'Question',
        name: 'What happens if my flight is delayed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We monitor flight arrivals and adjust pickup times accordingly. Just provide your flight number when booking and we will track your flight status automatically.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(taxiServiceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <AirportTransferClient />
    </>
  )
}