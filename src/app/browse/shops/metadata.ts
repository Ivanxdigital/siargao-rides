import type { Metadata } from 'next';

export function generateShopsMetadata(
  location?: string,
  shopCount?: number,
  vehicleTypes?: string[]
): Metadata {
  // Generate dynamic title based on filters
  let title = "Best Vehicle Rental Shops in Siargao Island | Verified Companies";
  
  if (location) {
    title = `Top Vehicle Rental Shops in ${location} | Trusted Motorbike & Car Rental Companies`;
  }

  // Generate dynamic description with high-intent keywords
  let description = `Discover ${shopCount || 'trusted'} verified vehicle rental shops in Siargao Island. Compare motorbike rental companies, car hire shops, and scooter rental businesses. Book directly from licensed operators with competitive rates and reliable service.`;
  
  if (location) {
    description = `Find the best vehicle rental shops in ${location}, Siargao. ${shopCount || 'Multiple'} verified motorbike rental companies and car hire businesses with excellent ratings and local expertise.`;
  }

  // Add vehicle type specific descriptions
  if (vehicleTypes && vehicleTypes.length > 0) {
    const types = vehicleTypes.join(' and ');
    description = description.replace('vehicle rental shops', `${types} rental shops`);
  }

  // High-intent keywords targeting shop searches
  const baseKeywords = [
    // Primary shop-focused keywords
    "motorbike rental shops Siargao",
    "motorcycle rental shops Siargao", 
    "car rental shops Siargao",
    "vehicle rental companies Siargao",
    "scooter rental shops Siargao",
    "rental shops General Luna",
    "motorbike rental companies General Luna",
    
    // Verification and trust keywords
    "verified rental shops Siargao",
    "trusted vehicle rental Siargao",
    "licensed motorbike rental Siargao",
    "reliable rental companies Siargao",
    "best motorbike shops Siargao",
    "top rental shops Siargao",
    
    // Local area specific
    "Siargao rental businesses",
    "General Luna motorcycle shops",
    "Cloud 9 rental shops",
    "Siargao vehicle rental directory",
    "motorcycle dealers Siargao",
    
    // Service-focused keywords
    "rental shops with delivery Siargao",
    "motorbike rental pickup Siargao",
    "24/7 rental shops Siargao",
    "rental shops near me Siargao",
    
    // Comparison keywords
    "compare rental shops Siargao",
    "best prices motorbike rental Siargao",
    "rental shop reviews Siargao",
    "cheapest motorbike rental shops Siargao"
  ];

  // Add location-specific keywords
  if (location && location !== 'Siargao Island') {
    baseKeywords.push(
      `vehicle rental shops ${location}`,
      `motorbike rental companies ${location}`,
      `car rental shops ${location}`,
      `${location} rental businesses`,
      `trusted rental shops ${location}`
    );
  }

  // Add vehicle type specific keywords
  if (vehicleTypes && vehicleTypes.includes('motorcycle')) {
    baseKeywords.push(
      "Honda Beat rental shops Siargao",
      "automatic scooter rental companies Siargao",
      "manual motorcycle rental shops Siargao",
      "motorcycle rental dealers Siargao"
    );
  }

  if (vehicleTypes && vehicleTypes.includes('car')) {
    baseKeywords.push(
      "car hire companies Siargao",
      "SUV rental shops Siargao",
      "family car rental companies Siargao",
      "van rental shops Siargao"
    );
  }

  return {
    title,
    description,
    keywords: baseKeywords.join(', '),
    openGraph: {
      title,
      description,
      url: 'https://siargaorides.com/browse/shops',
      type: 'website',
      images: [
        {
          url: '/images/siargao-rental-shops-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Best Vehicle Rental Shops in Siargao Island - Siargao Rides',
        },
      ],
    },
    twitter: {
      title,
      description,
      images: ['/images/siargao-rental-shops-og.jpg'],
    },
    alternates: {
      canonical: 'https://siargaorides.com/browse/shops',
    },
    other: {
      'geo.region': 'PH-AGN',
      'geo.placename': location || 'Siargao Island',
      'geo.position': '9.8756;126.0892',
      'ICBM': '9.8756, 126.0892',
      // Business directory specific
      'article:section': 'Vehicle Rental Directory',
      'article:tag': 'Motorbike Rental Shops, Car Rental Companies, Siargao Transportation',
    },
  };
}

export const defaultShopsMetadata: Metadata = generateShopsMetadata();