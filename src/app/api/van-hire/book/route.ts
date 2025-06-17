import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Validation schema for van hire booking
const bookingSchema = z.object({
  // Route information
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  pickupInstructions: z.string().optional(),
  
  // Date and time
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  
  // Passenger information
  passengerCount: z.number().min(1).max(8, 'Maximum 8 passengers allowed'),
  luggageCount: z.number().min(0).max(10, 'Maximum 10 luggage pieces allowed'),
  
  // Contact information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  
  // Special requests
  specialRequests: z.string().optional(),
  
  // Pricing from quote
  estimatedPrice: z.number().min(1, 'Price is required'),
  estimatedDuration: z.number().min(1, 'Duration is required'),
  
  // Quote ID for verification
  quoteId: z.string().optional(),
  
  // Payment method preference
  paymentMethod: z.enum(['cash', 'gcash', 'card']).default('cash'),
  
  // Custom coordinates if provided
  pickupCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  dropoffCoords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional()
})

// Get or create van service record
async function getOrCreateVanService(supabase: any) {
  // Check if default van service exists
  const { data: existingService } = await supabase
    .from('van_services')
    .select('id')
    .eq('name', 'Private Van Transfer Service')
    .single()
  
  if (existingService) {
    return existingService.id
  }
  
  // Create default van service
  const { data: newService, error } = await supabase
    .from('van_services')
    .insert({
      name: 'Private Van Transfer Service',
      description: 'Premium private van transfers for airport and island transport',
      vehicle_type: 'van',
      base_price: 1000,
      price_per_km: 30,
      max_passengers: 8,
      max_luggage: 10,
      features: {
        airConditioning: true,
        complimentaryWater: true,
        professionalDriver: true,
        airportPickupSigns: true,
        luggageAssistance: true,
        vehicleInsurance: true
      },
      is_active: true
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating van service:', error)
    throw new Error('Failed to create van service')
  }
  
  return newService.id
}

// Get van vehicle type ID
async function getVanVehicleTypeId(supabase: any) {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('id')
    .eq('name', 'van')
    .single()
  
  if (error || !data) {
    throw new Error('Van vehicle type not found')
  }
  
  return data.id
}

// Create a dummy vehicle for van services (since we don't have actual van inventory)
async function getOrCreateVanVehicle(supabase: any, vehicleTypeId: string) {
  // Check if van service vehicle exists
  const { data: existingVehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('name', 'Van Service Vehicle')
    .eq('vehicle_type_id', vehicleTypeId)
    .single()
  
  if (existingVehicle) {
    return existingVehicle.id
  }
  
  // We need a shop_id for the vehicle. Let's get the first active shop or create a system shop
  const { data: shop } = await supabase
    .from('rental_shops')
    .select('id')
    .eq('is_verified', true)
    .limit(1)
    .single()
  
  if (!shop) {
    throw new Error('No verified shop found for van service')
  }
  
  // Create van service vehicle
  const { data: newVehicle, error } = await supabase
    .from('vehicles')
    .insert({
      shop_id: shop.id,
      vehicle_type_id: vehicleTypeId,
      vehicle_type: 'van',
      name: 'Van Service Vehicle',
      description: 'Private van for airport transfers and island transport',
      category: 'airport_transfer',
      price_per_day: 0, // Not used for transfers
      is_available: true,
      seats: 8,
      transmission: 'manual',
      fuel_type: 'gasoline',
      air_conditioning: true
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating van vehicle:', error)
    throw new Error('Failed to create van vehicle')
  }
  
  return newVehicle.id
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)
    
    const {
      pickupLocation,
      dropoffLocation,
      pickupInstructions,
      date,
      time,
      passengerCount,
      luggageCount,
      firstName,
      lastName,
      email,
      phone,
      specialRequests,
      estimatedPrice,
      estimatedDuration,
      paymentMethod,
      pickupCoords,
      dropoffCoords
    } = validatedData
    
    // Combine date and time into start_date
    const startDateTime = new Date(`${date}T${time}:00`)
    const endDateTime = new Date(startDateTime.getTime() + (estimatedDuration * 60 * 1000))
    
    // Get required IDs
    const vanServiceId = await getOrCreateVanService(supabase)
    const vehicleTypeId = await getVanVehicleTypeId(supabase)
    const vehicleId = await getOrCreateVanVehicle(supabase, vehicleTypeId)
    
    // Get the first verified shop for now (in a real system, this would be assigned based on availability)
    const { data: shop } = await supabase
      .from('rental_shops')
      .select('id')
      .eq('is_verified', true)
      .limit(1)
      .single()
    
    if (!shop) {
      return NextResponse.json(
        { error: 'No available van service provider' },
        { status: 400 }
      )
    }
    
    // Generate confirmation code
    const confirmationCode = `VAN${Date.now().toString().slice(-6)}`
    
    // Create the rental record with van-specific fields
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert({
        vehicle_id: vehicleId,
        vehicle_type_id: vehicleTypeId,
        user_id: user.id,
        shop_id: shop.id,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        total_price: estimatedPrice,
        status: 'booked',
        payment_status: 'pending',
        confirmation_code: confirmationCode,
        customer_name: `${firstName} ${lastName}`,
        contact_info: {
          email,
          phone,
          firstName,
          lastName
        },
        // Van hire specific fields
        van_service_id: vanServiceId,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_instructions: pickupInstructions,
        passenger_count: passengerCount,
        luggage_count: luggageCount,
        special_requests: specialRequests,
        estimated_duration: estimatedDuration,
        is_van_hire: true
      })
      .select('*')
      .single()
    
    if (rentalError) {
      console.error('Error creating van hire booking:', rentalError)
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      )
    }
    
    // Send booking confirmation email (using existing email system)
    try {
      await fetch(`${request.nextUrl.origin}/api/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          rentalId: rental.id,
          confirmationCode,
          customerName: `${firstName} ${lastName}`,
          bookingType: 'van_hire',
          bookingDetails: {
            pickupLocation,
            dropoffLocation,
            date,
            time,
            passengerCount,
            luggageCount,
            totalPrice: estimatedPrice,
            estimatedDuration
          }
        }),
      })
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Don't fail the booking if email fails
    }
    
    // Send admin notification
    try {
      await fetch(`${request.nextUrl.origin}/api/send-admin-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'van_hire_booking',
          subject: 'New Van Hire Booking',
          message: `New van hire booking received:
            
Booking ID: ${rental.id}
Customer: ${firstName} ${lastName}
Route: ${pickupLocation} → ${dropoffLocation}
Date: ${date} at ${time}
Passengers: ${passengerCount}
Total: ₱${estimatedPrice}
Contact: ${email}, ${phone}`,
          bookingId: rental.id
        }),
      })
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError)
      // Don't fail the booking if notification fails
    }
    
    const response = {
      success: true,
      booking: {
        id: rental.id,
        confirmationCode,
        status: rental.status,
        paymentStatus: rental.payment_status,
        route: {
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          instructions: pickupInstructions
        },
        schedule: {
          date,
          time,
          startDateTime: rental.start_date,
          endDateTime: rental.end_date,
          estimatedDuration
        },
        passengers: {
          count: passengerCount,
          luggage: luggageCount
        },
        contact: {
          name: `${firstName} ${lastName}`,
          email,
          phone
        },
        pricing: {
          total: estimatedPrice,
          currency: '₱',
          paymentMethod,
          status: 'pending'
        },
        specialRequests,
        createdAt: rental.created_at
      },
      nextSteps: {
        payment: paymentMethod === 'cash' 
          ? 'Payment will be collected upon pickup'
          : 'You will be redirected to payment processing',
        confirmation: 'You will receive a confirmation email shortly',
        contact: 'Our team will contact you 1 hour before pickup time'
      }
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Van hire booking error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid booking data',
          details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create booking. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get('id')
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Fetch the van hire booking
    const { data: booking, error } = await supabase
      .from('rentals')
      .select(`
        *,
        vehicles(name, vehicle_type),
        rental_shops(name, phone_number, email)
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .eq('is_van_hire', true)
      .single()
    
    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmation_code,
        status: booking.status,
        paymentStatus: booking.payment_status,
        route: {
          pickup: booking.pickup_location,
          dropoff: booking.dropoff_location,
          instructions: booking.pickup_instructions
        },
        schedule: {
          startDateTime: booking.start_date,
          endDateTime: booking.end_date,
          estimatedDuration: booking.estimated_duration
        },
        passengers: {
          count: booking.passenger_count,
          luggage: booking.luggage_count
        },
        contact: booking.contact_info,
        pricing: {
          total: booking.total_price,
          currency: '₱',
          status: booking.payment_status
        },
        specialRequests: booking.special_requests,
        shop: booking.rental_shops,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    })
    
  } catch (error) {
    console.error('Error fetching van hire booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    )
  }
}