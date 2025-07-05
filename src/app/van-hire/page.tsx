import { Metadata } from 'next'
import VanHireClient from './van-hire-client'
import { generateLocalBusinessSchema, generateJSONLD } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Private Van Hire Siargao - Airport Transfer | Hyundai Staria',
  description: 'Premium airport transfer service in Siargao Island. Travel in comfort with our luxury Hyundai Staria van. Fixed rates: ₱2,500 for 2 PAX, ₱3,500 for 3-8 PAX. Professional drivers, complimentary water, USB charging.',
  keywords: 'siargao airport transfer, private van hire siargao, hyundai staria siargao, sayak airport transfer, siargao van rental, luxury transfer siargao, airport pickup siargao',
  openGraph: {
    title: 'Private Van Hire Siargao - Airport Transfer | Hyundai Staria',
    description: 'Premium airport transfer service in Siargao Island. Travel in comfort with our luxury Hyundai Staria van.',
    images: [
      {
        url: '/images/hero-bg-1.png',
        width: 1200,
        height: 630,
        alt: 'Luxury Van on Siargao Beach for Airport Transfers',
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
    description: 'Premium airport transfer service in Siargao Island with luxury Hyundai Staria van',
    priceRange: '₱₱',
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 9.8683,
        longitude: 126.0453,
      },
      geoRadius: '50km',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Airport Transfer Services',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Airport Transfer (2 Passengers)',
          price: '2500',
          priceCurrency: 'PHP',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 2,
          },
        },
        {
          '@type': 'Offer',
          name: 'Airport Transfer (3-8 Passengers)',
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJSONLD(taxiServiceSchema),
        }}
      />
      <VanHireClient />
    </>
  )
}