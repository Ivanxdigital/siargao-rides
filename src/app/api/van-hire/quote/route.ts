import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Location coordinates for distance calculation
const LOCATION_COORDINATES = {
  'sayak-airport': { lat: 9.859461, lng: 126.017731 },
  'general-luna': { lat: 9.802778, lng: 126.152778 },
  'cloud-9': { lat: 9.800556, lng: 126.157222 },
  'pacifico': { lat: 9.653889, lng: 126.124167 },
  'dapa': { lat: 9.761944, lng: 126.050833 },
  'burgos': { lat: 9.833333, lng: 126.050000 },
  'catangnan': { lat: 9.883333, lng: 126.116667 },
  'sugba-lagoon': { lat: 9.795000, lng: 126.105000 },
  'gl-center': { lat: 9.802778, lng: 126.152778 },
  'gl-beach': { lat: 9.800000, lng: 126.155000 },
  'cloud9-area': { lat: 9.800556, lng: 126.157222 },
  'pacifico-resorts': { lat: 9.653889, lng: 126.124167 },
  'dapa-hotels': { lat: 9.761944, lng: 126.050833 }
}

// Predefined routes with fixed pricing
const POPULAR_ROUTES = {
  'sayak-airport_general-luna': { basePrice: 1200, duration: 45, distance: 25 },
  'general-luna_sayak-airport': { basePrice: 1200, duration: 45, distance: 25 },
  'sayak-airport_cloud-9': { basePrice: 1000, duration: 35, distance: 20 },
  'cloud-9_sayak-airport': { basePrice: 1000, duration: 35, distance: 20 },
  'sayak-airport_pacifico': { basePrice: 1800, duration: 75, distance: 45 },
  'pacifico_sayak-airport': { basePrice: 1800, duration: 75, distance: 45 },
  'sayak-airport_dapa': { basePrice: 800, duration: 25, distance: 15 },
  'dapa_sayak-airport': { basePrice: 800, duration: 25, distance: 15 }
}

// Validation schema
const quoteSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  pickupCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  dropoffCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  passengerCount: z.number().min(1).max(8).default(1),
  luggageCount: z.number().min(0).max(10).default(1),
  date: z.string().optional(),
  time: z.string().optional(),
  specialRequests: z.string().optional()
})

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Calculate pricing based on distance and other factors
function calculatePricing(distance: number, passengerCount: number, luggageCount: number, isPopularRoute: boolean = false) {
  // Base pricing structure
  const BASE_PRICE = 600 // Minimum price
  const PRICE_PER_KM = 30 // Price per kilometer
  const PASSENGER_SURCHARGE = 50 // Additional cost per passenger above 4
  const LUGGAGE_SURCHARGE = 25 // Additional cost per luggage piece above 4
  const POPULAR_ROUTE_DISCOUNT = 0.9 // 10% discount for popular routes
  
  let totalPrice = BASE_PRICE + (distance * PRICE_PER_KM)
  
  // Passenger surcharge for groups larger than 4
  if (passengerCount > 4) {
    totalPrice += (passengerCount - 4) * PASSENGER_SURCHARGE
  }
  
  // Luggage surcharge for more than 4 bags
  if (luggageCount > 4) {
    totalPrice += (luggageCount - 4) * LUGGAGE_SURCHARGE
  }
  
  // Apply popular route discount
  if (isPopularRoute) {
    totalPrice *= POPULAR_ROUTE_DISCOUNT
  }
  
  // Round to nearest 50 pesos
  totalPrice = Math.ceil(totalPrice / 50) * 50
  
  // Minimum price enforcement
  totalPrice = Math.max(totalPrice, BASE_PRICE)
  
  return totalPrice
}

// Calculate estimated duration based on distance and route conditions
function calculateDuration(distance: number, pickupLocation: string, dropoffLocation: string): number {
  const BASE_SPEED = 25 // km/h average speed
  const AIRPORT_PROCESSING_TIME = 15 // Additional time for airport pickups/dropoffs
  const TRAFFIC_BUFFER = 1.2 // 20% buffer for traffic
  
  let duration = (distance / BASE_SPEED) * 60 // Convert to minutes
  
  // Add airport processing time
  if (pickupLocation === 'sayak-airport' || dropoffLocation === 'sayak-airport') {
    duration += AIRPORT_PROCESSING_TIME
  }
  
  // Apply traffic buffer
  duration *= TRAFFIC_BUFFER
  
  // Round to nearest 5 minutes
  duration = Math.ceil(duration / 5) * 5
  
  return Math.max(duration, 20) // Minimum 20 minutes
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = quoteSchema.parse(body)
    
    const { 
      pickupLocation, 
      dropoffLocation, 
      pickupCoords, 
      dropoffCoords,
      passengerCount, 
      luggageCount 
    } = validatedData
    
    // Check if this is a popular route with predefined pricing
    const routeKey = `${pickupLocation}_${dropoffLocation}`
    const popularRoute = POPULAR_ROUTES[routeKey as keyof typeof POPULAR_ROUTES]
    
    let distance: number
    let duration: number
    let basePrice: number
    let isPopularRoute = false
    
    if (popularRoute) {
      // Use predefined values for popular routes
      distance = popularRoute.distance
      duration = popularRoute.duration
      basePrice = popularRoute.basePrice
      isPopularRoute = true
    } else {
      // Calculate for custom routes
      let pickup_coords = pickupCoords
      let dropoff_coords = dropoffCoords
      
      // Get coordinates from predefined locations if not provided
      if (!pickup_coords) {
        pickup_coords = LOCATION_COORDINATES[pickupLocation as keyof typeof LOCATION_COORDINATES]
      }
      if (!dropoff_coords) {
        dropoff_coords = LOCATION_COORDINATES[dropoffLocation as keyof typeof LOCATION_COORDINATES]
      }
      
      if (!pickup_coords || !dropoff_coords) {
        return NextResponse.json(
          { error: 'Invalid location coordinates. Please provide valid pickup and dropoff locations.' },
          { status: 400 }
        )
      }
      
      // Calculate distance and duration
      distance = calculateDistance(
        pickup_coords.lat, 
        pickup_coords.lng, 
        dropoff_coords.lat, 
        dropoff_coords.lng
      )
      
      duration = calculateDuration(distance, pickupLocation, dropoffLocation)
      basePrice = calculatePricing(distance, passengerCount, luggageCount, false)
    }
    
    // Apply passenger and luggage adjustments even for popular routes
    let finalPrice = basePrice
    if (passengerCount > 4) {
      finalPrice += (passengerCount - 4) * 50
    }
    if (luggageCount > 4) {
      finalPrice += (luggageCount - 4) * 25
    }
    
    // Calculate breakdown
    const breakdown = {
      basePrice,
      passengerSurcharge: passengerCount > 4 ? (passengerCount - 4) * 50 : 0,
      luggageSurcharge: luggageCount > 4 ? (luggageCount - 4) * 25 : 0,
      popularRouteDiscount: isPopularRoute ? Math.round(basePrice * 0.1) : 0
    }
    
    // Service features included
    const includedFeatures = [
      'Air conditioning',
      'Professional driver',
      'Complimentary water',
      'Luggage assistance',
      'Airport pickup signs',
      'Vehicle insurance'
    ]
    
    const response = {
      success: true,
      quote: {
        routeId: routeKey,
        pickup: {
          location: pickupLocation,
          coordinates: pickup_coords || LOCATION_COORDINATES[pickupLocation as keyof typeof LOCATION_COORDINATES]
        },
        dropoff: {
          location: dropoffLocation,
          coordinates: dropoff_coords || LOCATION_COORDINATES[dropoffLocation as keyof typeof LOCATION_COORDINATES]
        },
        distance: {
          km: distance,
          note: `Approximately ${distance}km via main roads`
        },
        duration: {
          estimated: duration,
          note: `Including ${pickupLocation === 'sayak-airport' || dropoffLocation === 'sayak-airport' ? 'airport processing time and ' : ''}traffic buffer`
        },
        pricing: {
          currency: '₱',
          total: finalPrice,
          breakdown,
          note: 'All-inclusive pricing with no hidden fees'
        },
        passengers: {
          count: passengerCount,
          maxCapacity: 8
        },
        luggage: {
          count: luggageCount,
          maxCapacity: 10
        },
        features: includedFeatures,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        terms: [
          'Price valid for 24 hours from quote generation',
          'Final price may vary based on actual pickup/dropoff locations',
          'Cancellation allowed up to 2 hours before scheduled pickup',
          'Additional waiting time charged at ₱100 per 15-minute block'
        ]
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Van hire quote error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate quote. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return popular routes and locations for reference
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  
  if (action === 'locations') {
    return NextResponse.json({
      locations: Object.keys(LOCATION_COORDINATES).map(key => ({
        id: key,
        name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        coordinates: LOCATION_COORDINATES[key as keyof typeof LOCATION_COORDINATES]
      }))
    })
  }
  
  if (action === 'popular-routes') {
    return NextResponse.json({
      routes: Object.entries(POPULAR_ROUTES).map(([key, data]) => ({
        id: key,
        pickup: key.split('_')[0],
        dropoff: key.split('_')[1],
        ...data
      }))
    })
  }
  
  return NextResponse.json({
    message: 'Van Hire Quote API',
    endpoints: {
      'POST /': 'Generate price quote',
      'GET /?action=locations': 'Get available locations',
      'GET /?action=popular-routes': 'Get popular routes'
    }
  })
}