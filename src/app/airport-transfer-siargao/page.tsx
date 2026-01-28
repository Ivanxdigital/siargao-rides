import { Metadata } from 'next'
import AirportTransferClient from './airport-transfer-client'
import { generateLocalBusinessSchema, generateJSONLD } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Private Airport Transfer Siargao | Airport ↔ General Luna ₱3,000 | WhatsApp Booking',
  description: 'Private airport transfer in Siargao: ₱3,000 one-way between Sayak Airport and General Luna. Door-to-door service with professional drivers. Custom quotes for other destinations. No shared shuttles, no waiting.',
  keywords: 'private van hire siargao, airport transfer siargao, private van rental siargao, siargao airport pickup, private airport transfer siargao, sayak airport transfer, general luna airport transfer, cloud 9 airport transfer, pacifico airport transfer, santa monica airport transfer, siargao airport shuttle, door to door airport service siargao, private airport pickup siargao, siargao van service, airport transport siargao philippines, siargao travel transfer service, siargao airport taxi, burgos airport transfer, dapa airport transfer, van hire siargao today, immediate airport transfer siargao, same day booking siargao',
  openGraph: {
    title: 'Private Airport Transfer Siargao | Same Day Booking Available',
    description: 'Private airport transfer in Siargao: ₱3,000 one-way Airport ↔ General Luna. Custom quotes for other destinations. Skip the shared shuttles.',
    images: [
      {
        url: '/images/hero-bg-1.png',
        width: 1200,
        height: 630,
        alt: 'Private van hire service in Siargao Island - Same day booking available with professional drivers',
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
    description: 'Private van hire and airport transfer service in Siargao Island. Same day booking available with professional drivers',
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
      name: 'Private Van Hire Services',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'Private Airport Transfer (Airport ↔ General Luna)',
          description: 'Fixed price private airport transfer between Sayak Airport and General Luna with professional driver and door-to-door service',
          price: '3000',
          priceCurrency: 'PHP',
          availability: 'https://schema.org/InStock',
          eligibleQuantity: {
            '@type': 'QuantitativeValue',
            maxValue: 10,
          },
        },
        {
          '@type': 'Offer',
          name: 'Custom Route Airport Transfer',
          description: 'Private airport transfer to/from other Siargao destinations (Cloud 9, Pacifico, Santa Monica, Burgos, Dapa) via WhatsApp quote',
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
        name: 'How much is airport transfer in Siargao?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our fixed price is ₱3,000 one-way between Sayak Airport and General Luna. For other destinations, message us on WhatsApp for a custom quote.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I book airport transfer for today or tomorrow?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Contact us via WhatsApp with your date/time and flight details and we will confirm availability and arrange a private pickup.',
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
      {
        '@type': 'Question',
        name: 'Why choose private van over shared shuttle?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Private van means no waiting for other passengers, direct route to your destination, departure on your schedule, and privacy for your group. Plus dedicated surf rack space and personal attention from your driver.',
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
