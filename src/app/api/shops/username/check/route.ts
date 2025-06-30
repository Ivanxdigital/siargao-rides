import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Username validation regex: 3-30 characters, alphanumeric, hyphens, underscores
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/

// Reserved usernames that cannot be used
const RESERVED_USERNAMES = [
  'admin', 'api', 'www', 'app', 'dashboard', 'browse', 'search',
  'about', 'contact', 'privacy', 'terms', 'help', 'support',
  'booking', 'payment', 'auth', 'login', 'register', 'signup',
  'siargao', 'rides', 'rental', 'bike', 'motorcycle', 'car',
  'root', 'system', 'test', 'demo', 'example', 'null', 'undefined',
  'van-hire', 'vanhire', 'hire', 'private'
]

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Username is required',
          suggestions: []
        }, 
        { status: 400 }
      )
    }

    // Normalize username (trim and lowercase for checking)
    const normalizedUsername = username.trim().toLowerCase()
    
    // Validate username format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores',
        suggestions: generateSuggestions(username)
      })
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json({
        available: false,
        error: 'This username is reserved and cannot be used',
        suggestions: generateSuggestions(username)
      })
    }

    // Check if username is already taken (case-insensitive)
    const { data: existingShop, error: dbError } = await supabase
      .from('rental_shops')
      .select('id, username')
      .ilike('username', normalizedUsername)
      .limit(1)

    if (dbError) {
      console.error('Database error checking username:', dbError)
      return NextResponse.json(
        { 
          available: false, 
          error: 'Unable to check username availability. Please try again.',
          suggestions: []
        }, 
        { status: 500 }
      )
    }

    const isAvailable = !existingShop || existingShop.length === 0

    return NextResponse.json({
      available: isAvailable,
      username: username,
      normalizedUsername: normalizedUsername,
      suggestions: isAvailable ? [] : generateSuggestions(username)
    })

  } catch (error) {
    console.error('Username availability check error:', error)
    return NextResponse.json(
      { 
        available: false, 
        error: 'Internal server error',
        suggestions: []
      }, 
      { status: 500 }
    )
  }
}

// Generate username suggestions when the requested one is unavailable
function generateSuggestions(baseUsername: string): string[] {
  const cleanBase = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  
  if (cleanBase.length < 3) {
    return ['siargao-rides', 'island-rental', 'ride-siargao']
  }

  const suggestions = [
    `${cleanBase}siargao`,
    `${cleanBase}rental`,
    `${cleanBase}rides`,
    `siargao${cleanBase}`,
    `${cleanBase}ph`,
    `${cleanBase}island`
  ]

  // Add numbered suggestions
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${cleanBase}${i}`)
  }

  return suggestions.slice(0, 6) // Return max 6 suggestions
}

export async function POST(request: NextRequest) {
  // Handle username availability check with additional context (e.g., current shop ID for updates)
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    const body = await request.json()
    const { username, currentShopId } = body
    
    if (!username) {
      return NextResponse.json(
        { 
          available: false, 
          error: 'Username is required',
          suggestions: []
        }, 
        { status: 400 }
      )
    }

    const normalizedUsername = username.trim().toLowerCase()
    
    // Validate username format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores',
        suggestions: generateSuggestions(username)
      })
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json({
        available: false,
        error: 'This username is reserved and cannot be used',
        suggestions: generateSuggestions(username)
      })
    }

    // Check if username is already taken (case-insensitive)
    // Exclude current shop if updating existing username
    let query = supabase
      .from('rental_shops')
      .select('id, username')
      .ilike('username', normalizedUsername)

    if (currentShopId) {
      query = query.neq('id', currentShopId)
    }

    const { data: existingShop, error: dbError } = await query.limit(1)

    if (dbError) {
      console.error('Database error checking username:', dbError)
      return NextResponse.json(
        { 
          available: false, 
          error: 'Unable to check username availability. Please try again.',
          suggestions: []
        }, 
        { status: 500 }
      )
    }

    const isAvailable = !existingShop || existingShop.length === 0

    return NextResponse.json({
      available: isAvailable,
      username: username,
      normalizedUsername: normalizedUsername,
      suggestions: isAvailable ? [] : generateSuggestions(username)
    })

  } catch (error) {
    console.error('Username availability check error:', error)
    return NextResponse.json(
      { 
        available: false, 
        error: 'Internal server error',
        suggestions: []
      }, 
      { status: 500 }
    )
  }
}