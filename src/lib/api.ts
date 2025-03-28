import { supabase } from './supabase'
import { supabaseUrl } from './supabase'
import { createClient } from '@supabase/supabase-js'
import { 
  BikeCategory, 
  Bike, 
  RentalShop, 
  User, 
  Rental, 
  Review, 
  Favorite,
  RentalStatus,
  BikeImage
} from './types'

// User-related functions
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error(`Error fetching user profile:`, error)
    return null
  }

  return data
}

// Shop-related functions
export async function getShops(): Promise<RentalShop[]> {
  const { data, error } = await supabase
    .from('rental_shops')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching shops:', error)
    return []
  }

  return data
}

export async function getShopById(id: string): Promise<RentalShop | null> {
  const { data, error } = await supabase
    .from('rental_shops')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching shop with id ${id}:`, error)
    return null
  }

  return data
}

export async function createShop(shop: Omit<RentalShop, 'id' | 'created_at' | 'updated_at' | 'is_verified'>): Promise<RentalShop | null> {
  console.log('Creating shop with data:', JSON.stringify(shop, null, 2));
  
  try {
    // Use regular Supabase client for now, we'll need a backend API for proper service role usage
    const { data, error } = await supabase
      .from('rental_shops')
      .insert({
        ...shop,
        is_verified: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating shop:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // If we get a permission denied error, it's likely due to RLS
      if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
        console.log('Permission denied - likely due to missing RLS policy for INSERT on rental_shops table');
      }
      
      return null;
    }

    console.log('Shop created successfully:', data);
    return data;
  } catch (e) {
    console.error('Exception caught in createShop:', e);
    return null;
  }
}

// Bike-related functions
export async function getBikes(filters?: {
  shop_id?: string
  category?: BikeCategory
  min_price?: number
  max_price?: number
  is_available?: boolean
}): Promise<Bike[]> {
  let query = supabase.from('bikes').select(`
    *,
    bike_images(*)
  `)

  // Apply filters if provided
  if (filters?.shop_id) {
    query = query.eq('shop_id', filters.shop_id)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.is_available !== undefined) {
    query = query.eq('is_available', filters.is_available)
  }

  if (filters?.min_price !== undefined) {
    query = query.gte('price_per_day', filters.min_price)
  }

  if (filters?.max_price !== undefined) {
    query = query.lte('price_per_day', filters.max_price)
  }

  const { data, error } = await query.order('price_per_day')

  if (error) {
    console.error('Error fetching bikes:', error)
    return []
  }

  // Transform the data to match our type
  return data.map((bike: any) => ({
    ...bike,
    images: bike.bike_images
  }))
}

export async function getBikeById(id: string): Promise<Bike | null> {
  const { data, error } = await supabase
    .from('bikes')
    .select(`
      *,
      bike_images(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching bike with id ${id}:`, error)
    return null
  }

  // Transform the data to match our type
  return {
    ...data,
    images: data.bike_images
  }
}

export async function addBike(
  bike: Omit<Bike, 'id' | 'created_at' | 'updated_at' | 'images'>, 
  images: { url: string, is_primary: boolean }[]
): Promise<Bike | null> {
  // Start a transaction for the bike and images
  const { data: bikeData, error: bikeError } = await supabase
    .from('bikes')
    .insert(bike)
    .select()
    .single()

  if (bikeError) {
    console.error('Error adding bike:', bikeError)
    return null
  }

  // Add bike images if any
  if (images && images.length > 0) {
    const imageInserts = images.map(img => ({
      bike_id: bikeData.id,
      image_url: img.url,
      is_primary: img.is_primary
    }))

    const { data: imageData, error: imageError } = await supabase
      .from('bike_images')
      .insert(imageInserts)
      .select()

    if (imageError) {
      console.error('Error adding bike images:', imageError)
      // We don't return null here because the bike was created successfully
    }

    return {
      ...bikeData,
      images: imageData
    }
  }

  return bikeData
}

// Bike images functions
export async function addBikeImage(bikeImage: Omit<BikeImage, 'id' | 'created_at'>): Promise<BikeImage | null> {
  const { data, error } = await supabase
    .from('bike_images')
    .insert(bikeImage)
    .select()
    .single()

  if (error) {
    console.error('Error adding bike image:', error)
    return null
  }

  return data
}

// Rental-related functions
export async function createRental(rental: Omit<Rental, 'id' | 'created_at' | 'updated_at'>): Promise<Rental | null> {
  const { data, error } = await supabase
    .from('rentals')
    .insert(rental)
    .select()
    .single()

  if (error) {
    console.error('Error creating rental:', error)
    return null
  }

  return data
}

export async function getUserRentals(userId: string): Promise<Rental[]> {
  const { data, error } = await supabase
    .from('rentals')
    .select(`
      *,
      bikes!inner(*),
      rental_shops!inner(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching rentals for user ${userId}:`, error)
    return []
  }

  return data
}

export async function getShopRentals(shopId: string): Promise<Rental[]> {
  const { data, error } = await supabase
    .from('rentals')
    .select(`
      *,
      bikes!inner(*),
      users!inner(*)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching rentals for shop ${shopId}:`, error)
    return []
  }

  return data
}

export async function updateRentalStatus(rentalId: string, status: RentalStatus): Promise<boolean> {
  const { error } = await supabase
    .from('rentals')
    .update({ status })
    .eq('id', rentalId)

  if (error) {
    console.error(`Error updating rental status:`, error)
    return false
  }

  return true
}

// Review functions
export async function createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return null
  }

  return data
}

export async function getShopReviews(shopId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching reviews for shop ${shopId}:`, error)
    return []
  }

  return data
}

export async function getBikeReviews(bikeId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('bike_id', bikeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching reviews for bike ${bikeId}:`, error)
    return []
  }

  return data
}

// Favorite functions
export async function toggleFavorite(userId: string, bikeId: string): Promise<boolean> {
  // Check if favorite already exists
  const { data: existingFavorite, error: checkError } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('bike_id', bikeId)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected if no favorite exists
    console.error(`Error checking favorite:`, checkError)
    return false
  }

  // If favorite exists, remove it
  if (existingFavorite) {
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existingFavorite.id)

    if (deleteError) {
      console.error(`Error removing favorite:`, deleteError)
      return false
    }
    return false // Return false to indicate the favorite was removed
  }

  // If no favorite exists, add it
  const { error: insertError } = await supabase
    .from('favorites')
    .insert({ user_id: userId, bike_id: bikeId })

  if (insertError) {
    console.error(`Error adding favorite:`, insertError)
    return false
  }

  return true // Return true to indicate the favorite was added
}

export async function getUserFavorites(userId: string): Promise<Bike[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      bike_id,
      bikes!inner(
        *,
        bike_images(*)
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error(`Error fetching favorites for user ${userId}:`, error)
    return []
  }

  // Transform the data to match our type
  return data.map((favorite: any) => ({
    ...favorite.bikes,
    images: favorite.bikes.bike_images
  }))
}

// Search function
export async function searchShops(query: string): Promise<RentalShop[]> {
  const { data, error } = await supabase
    .from('rental_shops')
    .select('*')
    .or(`name.ilike.%${query}%, description.ilike.%${query}%, city.ilike.%${query}%, address.ilike.%${query}%`)
    .order('name')

  if (error) {
    console.error('Error searching shops:', error)
    return []
  }

  return data
}

export async function searchBikes(query: string): Promise<Bike[]> {
  const { data, error } = await supabase
    .from('bikes')
    .select(`
      *,
      bike_images(*)
    `)
    .or(`name.ilike.%${query}%, description.ilike.%${query}%, category.ilike.%${query}%`)
    .order('name')

  if (error) {
    console.error('Error searching bikes:', error)
    return []
  }

  // Transform the data to match our type
  return data.map((bike: any) => ({
    ...bike,
    images: bike.bike_images
  }))
} 