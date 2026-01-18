import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { BrowseShopsFilters, ShopsPaginationResponse, ShopWithMetadata, VehicleType } from '@/lib/types'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse filters from query params
    const filters: BrowseShopsFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      sort_by: (searchParams.get('sort_by') as 'rating_desc' | 'rating_asc' | 'vehicles_desc' | 'price_asc' | 'price_desc' | 'newest') || 'rating_desc',
      location: searchParams.get('location') || undefined,
      vehicle_types: searchParams.getAll('vehicle_types') as VehicleType[] || undefined,
      verified_only: searchParams.get('verified_only') === 'true',
      offers_delivery: searchParams.get('offers_delivery') === 'true' || undefined,
      has_whatsapp: searchParams.get('has_whatsapp') === 'true' || undefined,
      min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
      search: searchParams.get('search') || undefined,
    }

    const offset = (filters.page! - 1) * filters.limit!

    // First, get shop IDs that have at least one available vehicle
    const { data: shopsWithVehicles, error: vehicleCheckError } = await supabase
      .from('vehicles')
      .select('shop_id')
      .eq('is_available', true)

    if (vehicleCheckError) {
      console.error('Error checking shops with vehicles:', vehicleCheckError)
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
    }

    // Get unique shop IDs that have vehicles
    const shopIdsWithVehicles = [...new Set(shopsWithVehicles?.map(v => v.shop_id) || [])]

    if (shopIdsWithVehicles.length === 0) {
      // No shops have available vehicles
      return NextResponse.json({
        shops: [],
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total: 0,
          totalPages: 0
        },
        locations: []
      } as ShopsPaginationResponse)
    }

    // Base query for shops - only include shops that have at least one available vehicle
    let shopsQuery = supabase
      .from('rental_shops')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .in('id', shopIdsWithVehicles)

    // Apply filters
    if (filters.verified_only) {
      shopsQuery = shopsQuery.eq('is_verified', true)
    }

    if (filters.offers_delivery) {
      shopsQuery = shopsQuery.eq('offers_delivery', true)
    }

    if (filters.has_whatsapp) {
      shopsQuery = shopsQuery.not('whatsapp', 'is', null)
    }

    if (filters.location) {
      shopsQuery = shopsQuery.or(`city.ilike.%${filters.location}%,location_area.ilike.%${filters.location}%`)
    }

    if (filters.search) {
      shopsQuery = shopsQuery.ilike('name', `%${filters.search}%`)
    }

    // Execute shop query
    const { data: shops, error: shopsError, count } = await shopsQuery
      .range(offset, offset + filters.limit! - 1)

    if (shopsError) {
      console.error('Error fetching shops:', shopsError)
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json({
        shops: [],
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total: 0,
          totalPages: 0
        },
        locations: []
      } as ShopsPaginationResponse)
    }

    // Get shop IDs
    const shopIds = shops.map(shop => shop.id)

    // Fetch vehicles for these shops with proper joins
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        shop_id, 
        price_per_day,
        vehicle_types!inner(name)
      `)
      .in('shop_id', shopIds)
      .eq('is_available', true)

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
    }

    // Fetch vehicle images with proper joins
    const { data: vehicleImages, error: imagesError } = await supabase
      .from('vehicles')
      .select(`
        shop_id,
        vehicle_images!inner(image_url)
      `)
      .in('shop_id', shopIds)
      .eq('is_available', true)

    if (imagesError) {
      console.error('Error fetching vehicle images:', imagesError)
    }

    // Fetch reviews for rating calculation
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('shop_id, rating')
      .in('shop_id', shopIds)

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
    }

    // Get all unique locations
    const { data: allShops } = await supabase
      .from('rental_shops')
      .select('city, location_area')
      .eq('is_active', true)
      .neq('status', 'rejected')

    const locations = new Set<string>()
    if (allShops) {
      allShops.forEach(shop => {
        if (shop.city) locations.add(shop.city)
        if (shop.location_area) locations.add(shop.location_area)
      })
    }

    // Transform shops with metadata
    const shopsWithMetadata: ShopWithMetadata[] = shops.map(shop => {
      // Calculate vehicle data
      const shopVehicles = vehicles?.filter(v => v.shop_id === shop.id) || []
      const vehicleTypes = [...new Set(shopVehicles.map(v => v.vehicle_types?.name).filter(Boolean))] as VehicleType[]
      const startingPrice = shopVehicles.length > 0 
        ? Math.min(...shopVehicles.map(v => v.price_per_day))
        : undefined

      // Calculate rating
      const shopReviews = reviews?.filter(r => r.shop_id === shop.id) || []
      const averageRating = shopReviews.length > 0
        ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length
        : undefined

      // Get images from vehicle_images relationship
      const shopImageData = vehicleImages?.filter(v => v.shop_id === shop.id) || []
      const images: string[] = []
      shopImageData.forEach(vehicle => {
        if (vehicle.vehicle_images && Array.isArray(vehicle.vehicle_images)) {
          vehicle.vehicle_images.forEach((img: { image_url?: string }) => {
            if (img.image_url && images.length < 4) {
              images.push(img.image_url)
            }
          })
        }
      })

      return {
        ...shop,
        starting_price: startingPrice,
        average_rating: averageRating,
        review_count: shopReviews.length,
        vehicle_count: shopVehicles.length,
        vehicle_types: vehicleTypes,
        images: images
      }
    })

    // Apply vehicle type filter if specified
    let filteredShops = shopsWithMetadata
    if (filters.vehicle_types && filters.vehicle_types.length > 0) {
      filteredShops = shopsWithMetadata.filter(shop => 
        shop.vehicle_types?.some(vt => filters.vehicle_types?.includes(vt))
      )
    }

    // Apply min rating filter
    if (filters.min_rating) {
      filteredShops = filteredShops.filter(shop => 
        (shop.average_rating || 0) >= filters.min_rating!
      )
    }

    // Sort shops
    switch (filters.sort_by) {
      case 'rating_desc':
        filteredShops.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        break
      case 'rating_asc':
        filteredShops.sort((a, b) => (a.average_rating || 0) - (b.average_rating || 0))
        break
      case 'vehicles_desc':
        filteredShops.sort((a, b) => (b.vehicle_count || 0) - (a.vehicle_count || 0))
        break
      case 'price_asc':
        filteredShops.sort((a, b) => (a.starting_price || 999999) - (b.starting_price || 999999))
        break
      case 'price_desc':
        filteredShops.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0))
        break
      case 'newest':
        filteredShops.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    const response: ShopsPaginationResponse = {
      shops: filteredShops,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit!)
      },
      locations: Array.from(locations).sort()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Browse shops error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
