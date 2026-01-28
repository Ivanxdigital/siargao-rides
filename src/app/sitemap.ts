import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://siargaorides.ph'

// Static routes configuration
const staticRoutes = [
  {
    path: '/',
    priority: 1.0,
    changeFrequency: 'daily' as const,
  },
  {
    path: '/airport-transfer-siargao',
    priority: 0.9,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/private-van-hire-siargao',
    priority: 0.9,
    changeFrequency: 'monthly' as const,
  },
  {
    path: '/tours-siargao',
    priority: 0.9,
    changeFrequency: 'monthly' as const,
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

    // Combine all entries
    const allEntries = [...staticSitemapEntries]

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
