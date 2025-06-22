import { RentalShop, Vehicle } from './types'

export interface LocalBusinessSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  telephone?: string
  email?: string
  address: {
    '@type': string
    streetAddress?: string
    addressLocality: string
    addressRegion: string
    postalCode?: string
    addressCountry: string
  }
  geo: {
    '@type': string
    latitude: number
    longitude: number
  }
  openingHours?: string[]
  sameAs?: string[]
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
  }
  priceRange: string
  serviceArea: {
    '@type': string
    name: string
  }
  hasOfferCatalog: {
    '@type': string
    name: string
    itemListElement: Array<{
      '@type': string
      itemOffered: {
        '@type': string
        name: string
        description: string
      }
    }>
  }
}

export interface FAQPageSchema {
  '@context': string
  '@type': string
  mainEntity: Array<{
    '@type': string
    name: string
    acceptedAnswer: {
      '@type': string
      text: string
    }
  }>
}

export interface ProductSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  image: string[]
  offers: {
    '@type': string
    price: number
    priceCurrency: string
    availability: string
    validFrom: string
    priceValidUntil: string
  }
  brand: {
    '@type': string
    name: string
  }
  category: string
  aggregateRating?: {
    '@type': string
    ratingValue: number
    reviewCount: number
  }
}

export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Siargao Rides',
    description: 'Premier vehicle rental directory in Siargao Island, Philippines. Rent motorbikes, cars, and scooters from trusted local rental shops with competitive rates and flexible pickup options.',
    url: 'https://siargaorides.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'General Luna',
      addressRegion: 'Siargao Island, Surigao del Norte',
      addressCountry: 'PH'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.8756,
      longitude: 126.0892
    },
    priceRange: '₱₱',
    serviceArea: {
      '@type': 'Place',
      name: 'Siargao Island, Philippines'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Vehicle Rental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Motorbike Rental',
            description: 'Rent scooters, semi-automatic, and manual motorcycles in Siargao'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Car Rental',
            description: 'Rent cars and vehicles for comfortable island exploration'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'TukTuk Rental',
            description: 'Rent traditional Filipino tricycles for local transportation'
          }
        }
      ]
    }
  }
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

export function generateVehicleProductSchema(vehicle: Vehicle, shop: RentalShop): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.name} - ${vehicle.vehicle_type} Rental in Siargao`,
    description: `Rent ${vehicle.name} ${vehicle.vehicle_type} in Siargao Island from ${shop.name}. ${vehicle.category ? `Category: ${vehicle.category}.` : ''} Book online with competitive daily rates.`,
    image: vehicle.images?.map(img => img.image_url) || [],
    offers: {
      '@type': 'Offer',
      price: vehicle.price_per_day,
      priceCurrency: 'PHP',
      availability: vehicle.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      validFrom: new Date().toISOString(),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    },
    brand: {
      '@type': 'Brand',
      name: shop.name
    },
    category: `${vehicle.vehicle_type} Rental Siargao`
  }
}

export function generateRentalShopSchema(shop: RentalShop, averageRating?: number, reviewCount?: number): LocalBusinessSchema {
  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    description: `${shop.name} - Vehicle rental shop in Siargao Island offering motorbikes, cars, and scooters for rent. Located in ${shop.city || 'Siargao Island'}.`,
    url: `https://siargaorides.com/shop/${shop.id}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address || undefined,
      addressLocality: shop.city || 'General Luna',
      addressRegion: 'Siargao Island, Surigao del Norte',
      addressCountry: 'PH'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.8756, // Default to Siargao coordinates
      longitude: 126.0892
    },
    telephone: shop.phone || undefined,
    email: shop.email || undefined,
    priceRange: '₱₱',
    serviceArea: {
      '@type': 'Place',
      name: 'Siargao Island, Philippines'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Vehicle Rental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Vehicle Rental',
            description: `Vehicle rental services in Siargao from ${shop.name}`
          }
        }
      ]
    }
  }

  // Add rating if available
  if (averageRating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      reviewCount: reviewCount
    }
  }

  return schema
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

// Utility function to safely stringify JSON-LD
export function generateJSONLD(schema: object): string {
  try {
    return JSON.stringify(schema, null, 0)
  } catch (error) {
    console.error('Error generating JSON-LD:', error)
    return '{}'
  }
}

// Helper function to generate structured data as HTML string
export function generateStructuredDataHTML(schemas: object[]): string {
  return schemas
    .map((schema) => 
      `<script type="application/ld+json">${generateJSONLD(schema)}</script>`
    )
    .join('\n')
}