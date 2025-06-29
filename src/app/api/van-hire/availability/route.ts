import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Validation schema for availability check
const availabilitySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  passengerCount: z.number().min(1).max(8).default(1),
  duration: z.number().optional() // estimated duration in minutes
})

// Van service operational hours
const OPERATIONAL_HOURS = {
  start: 5, // 5:00 AM
  end: 23   // 11:00 PM
}

// Minimum time between bookings (in minutes)
const BUFFER_TIME = 30

// Maximum bookings per day
const MAX_DAILY_BOOKINGS = 12

// Check if a time slot conflicts with existing bookings
function hasTimeConflict(
  requestedStart: Date, 
  requestedEnd: Date, 
  existingBookings: any[]
): boolean {
  return existingBookings.some(booking => {
    const bookingStart = new Date(booking.start_date)
    const bookingEnd = new Date(booking.end_date)
    
    // Add buffer time to existing bookings
    const bufferedStart = new Date(bookingStart.getTime() - (BUFFER_TIME * 60 * 1000))
    const bufferedEnd = new Date(bookingEnd.getTime() + (BUFFER_TIME * 60 * 1000))
    
    // Check for overlap
    return (requestedStart < bufferedEnd && requestedEnd > bufferedStart)
  })
}

// Generate available time slots for a given date
function generateTimeSlots(date: string, existingBookings: any[] = []): string[] {
  const slots: string[] = []
  const requestedDate = new Date(date)
  const today = new Date()
  
  // Don't allow booking for past dates
  if (requestedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return slots
  }
  
  // For today, start from current hour + 2 (minimum advance booking)
  let startHour = OPERATIONAL_HOURS.start
  if (requestedDate.toDateString() === today.toDateString()) {
    startHour = Math.max(today.getHours() + 2, OPERATIONAL_HOURS.start)
  }
  
  // Generate 30-minute slots
  for (let hour = startHour; hour < OPERATIONAL_HOURS.end; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      
      // Create date objects for conflict checking (assume 2-hour duration for checking)
      const slotStart = new Date(`${date}T${slotTime}:00`)
      const slotEnd = new Date(slotStart.getTime() + (2 * 60 * 60 * 1000)) // 2 hours default
      
      // Check if this slot conflicts with existing bookings
      if (!hasTimeConflict(slotStart, slotEnd, existingBookings)) {
        slots.push(slotTime)
      }
    }
  }
  
  return slots
}

// Get booking density for a date (to show busy/available status)
function getBookingDensity(existingBookings: any[]): 'low' | 'medium' | 'high' {
  const bookingCount = existingBookings.length
  
  if (bookingCount === 0) return 'low'
  if (bookingCount <= 4) return 'low'
  if (bookingCount <= 8) return 'medium'
  return 'high'
}

// Check if date is available for booking
function isDateAvailable(date: string, existingBookings: any[]): boolean {
  const requestedDate = new Date(date)
  const today = new Date()
  
  // Don't allow booking for past dates
  if (requestedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return false
  }
  
  // Don't allow booking more than 30 days in advance
  const maxDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
  if (requestedDate > maxDate) {
    return false
  }
  
  // Check if we've reached maximum daily bookings
  if (existingBookings.length >= MAX_DAILY_BOOKINGS) {
    return false
  }
  
  return true
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const validatedData = availabilitySchema.parse(body)
    
    const { date, pickupLocation, dropoffLocation, passengerCount, duration } = validatedData
    
    // Get existing van hire bookings for the requested date
    const { data: existingBookings, error } = await supabase
      .from('rentals')
      .select('start_date, end_date, passenger_count, status')
      .eq('is_van_hire', true)
      .gte('start_date', `${date}T00:00:00`)
      .lt('start_date', `${date}T23:59:59`)
      .in('status', ['booked', 'in_progress']) // Only consider active bookings
    
    if (error) {
      console.error('Error fetching existing bookings:', error)
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }
    
    const bookings = existingBookings || []
    
    // Check basic date availability
    const dateAvailable = isDateAvailable(date, bookings)
    if (!dateAvailable) {
      return NextResponse.json({
        success: true,
        availability: {
          date,
          available: false,
          reason: 'Date not available for booking',
          timeSlots: [],
          bookingDensity: 'high',
          existingBookings: bookings.length,
          maxBookings: MAX_DAILY_BOOKINGS
        }
      })
    }
    
    // Generate available time slots
    const availableSlots = generateTimeSlots(date, bookings)
    const bookingDensity = getBookingDensity(bookings)
    
    // Check capacity constraints
    const totalPassengersBooked = bookings.reduce((sum, booking) => 
      sum + (booking.passenger_count || 0), 0
    )
    const remainingCapacity = (MAX_DAILY_BOOKINGS * 8) - totalPassengersBooked // Assuming 8 passengers per van
    
    // Special considerations for specific routes or conditions
    const routeNotes: string[] = []
    if (pickupLocation === 'sayak-airport' || dropoffLocation === 'sayak-airport') {
      routeNotes.push('Airport transfers require 2-hour advance booking')
      routeNotes.push('Meet at designated pickup area with name sign')
    }
    
    if (passengerCount > 6) {
      routeNotes.push('Large group booking - please confirm vehicle availability')
    }
    
    // Peak time warnings
    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      routeNotes.push('Weekend booking - higher demand expected')
    }
    
    const response = {
      success: true,
      availability: {
        date,
        available: true,
        timeSlots: availableSlots,
        bookingDensity,
        capacity: {
          existingBookings: bookings.length,
          maxDailyBookings: MAX_DAILY_BOOKINGS,
          remainingCapacity,
          passengerCapacity: remainingCapacity >= passengerCount
        },
        operationalHours: {
          start: `${OPERATIONAL_HOURS.start.toString().padStart(2, '0')}:00`,
          end: `${OPERATIONAL_HOURS.end.toString().padStart(2, '0')}:00`
        },
        advanceBooking: {
          minimumHours: 2,
          maximumDays: 30
        },
        restrictions: [
          'Minimum 2 hours advance booking required',
          'Maximum 8 passengers per booking',
          'Service available 5:00 AM - 11:00 PM daily'
        ],
        notes: routeNotes
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Van hire availability error:', error)
    
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
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const month = searchParams.get('month') // Format: YYYY-MM
    const action = searchParams.get('action')
    
    if (action === 'calendar' && month) {
      // Get availability for entire month
      const startDate = `${month}-01`
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
        .toISOString().split('T')[0]
      
      const { data: monthlyBookings, error } = await supabase
        .from('rentals')
        .select('start_date, passenger_count, status')
        .eq('is_van_hire', true)
        .gte('start_date', `${startDate}T00:00:00`)
        .lte('start_date', `${endDate}T23:59:59`)
        .in('status', ['booked', 'in_progress'])
      
      if (error) {
        return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 })
      }
      
      // Group bookings by date
      const dailyBookings: { [key: string]: any[] } = {}
      monthlyBookings?.forEach(booking => {
        const bookingDate = booking.start_date.split('T')[0]
        if (!dailyBookings[bookingDate]) {
          dailyBookings[bookingDate] = []
        }
        dailyBookings[bookingDate].push(booking)
      })
      
      // Generate calendar data
      const calendarData: { [key: string]: any } = {}
      const currentDate = new Date(startDate)
      const lastDate = new Date(endDate)
      
      while (currentDate <= lastDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayBookings = dailyBookings[dateStr] || []
        
        calendarData[dateStr] = {
          available: isDateAvailable(dateStr, dayBookings),
          bookingCount: dayBookings.length,
          density: getBookingDensity(dayBookings),
          hasSlots: generateTimeSlots(dateStr, dayBookings).length > 0
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      return NextResponse.json({
        success: true,
        month,
        calendar: calendarData
      })
    }
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }
    
    // Single date availability check
    const { data: bookings, error } = await supabase
      .from('rentals')
      .select('start_date, end_date, passenger_count, status')
      .eq('is_van_hire', true)
      .gte('start_date', `${date}T00:00:00`)
      .lt('start_date', `${date}T23:59:59`)
      .in('status', ['booked', 'in_progress'])
    
    if (error) {
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }
    
    const dayBookings = bookings || []
    const available = isDateAvailable(date, dayBookings)
    const timeSlots = available ? generateTimeSlots(date, dayBookings) : []
    
    return NextResponse.json({
      success: true,
      availability: {
        date,
        available,
        timeSlots,
        bookingDensity: getBookingDensity(dayBookings),
        existingBookings: dayBookings.length,
        maxBookings: MAX_DAILY_BOOKINGS
      }
    })
    
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}