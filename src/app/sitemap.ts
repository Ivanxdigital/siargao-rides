import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client - use anon key if service key not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://siargaorides.ph'

// Static routes configuration
const staticRoutes = [
  {
    path: '/',
    priority: 1.0,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/browse',
    priority: 0.9,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/browse/shops',
    priority: 0.8,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/about',
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/contact',
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/terms',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
  {
    path: '/privacy',
    priority: 0.3,
    changeFrequency: 'yearly' as const,
  },
  {
    path: '/guides',
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  },
]

// Vehicle types for browse pages
const vehicleTypes = ['motorcycle', 'car', 'tuktuk', 'van']

// Popular locations in Siargao
const popularLocations = ['General Luna', 'Cloud 9', 'Dapa', 'Santa Monica', 'Pilar']

// Guide pages
const guidePages = [
  'how-to-find-motorbike-rental-siargao',
  'where-to-rent-motorbike-siargao',
  'popular-vehicles-ride-siargao',
  'motorbike-rental-prices-siargao',
  'siargao-transportation-guide'
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Generate static routes
    const staticSitemapEntries = staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))

    // Generate vehicle type browse pages
    const vehicleTypeSitemapEntries = vehicleTypes.map((type) => ({
      url: `${SITE_URL}/browse?type=${type}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Generate location-based browse pages
    const locationSitemapEntries = popularLocations.map((location) => ({
      url: `${SITE_URL}/browse/shops?location=${encodeURIComponent(location)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Generate guide page entries
    const guideSitemapEntries = guidePages.map((slug) => ({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

    // Fetch verified shops from database
    const { data: shops, error: shopsError } = await supabase
      .from('rental_shops')
      .select('id, updated_at, username')
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(5000) // Prevent timeout with large datasets

    if (shopsError) {
      console.error('Error fetching shops for sitemap:', shopsError)
    }

    // Generate shop page entries
    const shopSitemapEntries = shops?.map((shop) => ({
      url: `${SITE_URL}/shop/${shop.id}`,
      lastModified: shop.updated_at ? new Date(shop.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

    // Combine all entries
    const allEntries = [
      ...staticSitemapEntries,
      ...vehicleTypeSitemapEntries,
      ...locationSitemapEntries,
      ...guideSitemapEntries,
      ...shopSitemapEntries,
    ]

    // Sort by priority (highest first) for better SEO
    return allEntries.sort((a, b) => (b.priority || 0.5) - (a.priority || 0.5))
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static routes if there's an error
    return staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))
  }
}