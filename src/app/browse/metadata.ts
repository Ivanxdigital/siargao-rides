import type { Metadata } from 'next';

export function generateBrowseMetadata(
  vehicleType?: string,
  location?: string,
  vehicleCount?: number
): Metadata {
  // Generate dynamic title based on filters
  let title = "Browse Vehicle Rentals in Siargao Island | Siargao Rides";
  if (vehicleType && vehicleType !== 'all') {
    const vehicleTypeName = vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
    title = `${vehicleTypeName} Rentals in Siargao Island | Browse & Compare Prices`;
  }
  if (location) {
    title = title.replace('Siargao Island', location);
  }

  // Generate dynamic description
  let description = `Browse ${vehicleCount || 'available'} vehicle rentals in Siargao Island, Philippines. Compare prices from trusted local rental shops with flexible pickup and competitive rates.`;
  
  if (vehicleType && vehicleType !== 'all') {
    const vehicleTypeName = vehicleType === 'motorcycle' ? 'motorbike and scooter' : vehicleType;
    description = `Find the perfect ${vehicleTypeName} rental in Siargao Island. ${vehicleCount || 'Multiple'} ${vehicleTypeName}s available from verified local shops.`;
  }
  
  if (location) {
    description = description.replace('Siargao Island', location);
  }

  // Generate dynamic keywords
  const baseKeywords = [
    "motorbike rental Siargao",
    "motorcycle rental Siargao", 
    "car rental Siargao",
    "scooter rental Siargao",
    "vehicle rental Siargao Philippines",
    "browse vehicles Siargao",
    "compare prices Siargao rental",
    "Siargao transportation",
    "General Luna vehicle rental",
    "Cloud 9 motorbike rental"
  ];

  // Add vehicle-type specific keywords
  if (vehicleType === 'motorcycle') {
    baseKeywords.push(
      "Honda Beat rental Siargao",
      "automatic scooter rental Siargao",
      "manual motorcycle rental Siargao",
      "motorcycle delivery Siargao"
    );
  } else if (vehicleType === 'car') {
    baseKeywords.push(
      "car hire Siargao",
      "family car rental Siargao",
      "SUV rental Siargao",
      "automatic car rental Siargao"
    );
  } else if (vehicleType === 'tuktuk') {
    baseKeywords.push(
      "tricycle rental Siargao",
      "tuktuk hire Siargao",
      "local transport Siargao"
    );
  }

  // Add location-specific keywords
  if (location) {
    baseKeywords.push(
      `vehicle rental ${location}`,
      `motorbike rental ${location}`,
      `${location} transportation`
    );
  }

  return {
    title,
    description,
    keywords: baseKeywords.join(', '),
    openGraph: {
      title,
      description,
      url: 'https://siargaorides.com/browse',
      type: 'website',
      images: [
        {
          url: '/images/siargao-vehicle-browse-og.jpg',
          width: 1200,
          height: 630,
          alt: 'Browse Vehicle Rentals in Siargao Island - Siargao Rides',
        },
      ],
    },
    twitter: {
      title,
      description,
      images: ['/images/siargao-vehicle-browse-og.jpg'],
    },
    alternates: {
      canonical: 'https://siargaorides.com/browse',
    },
    other: {
      'geo.region': 'PH-AGN',
      'geo.placename': location || 'Siargao Island',
      'geo.position': '9.8756;126.0892',
      'ICBM': '9.8756, 126.0892',
    },
  };
}

export const defaultBrowseMetadata: Metadata = generateBrowseMetadata();