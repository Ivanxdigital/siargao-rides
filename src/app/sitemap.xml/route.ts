import { NextRequest, NextResponse } from 'next/server'

// Static routes for the sitemap
const staticRoutes = [
  {
    url: 'https://siargaorides.com',
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  },
  {
    url: 'https://siargaorides.com/browse',
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9
  },
  {
    url: 'https://siargaorides.com/about',
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7
  },
  {
    url: 'https://siargaorides.com/contact',
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6
  },
  {
    url: 'https://siargaorides.com/van-hire',
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  },
  {
    url: 'https://siargaorides.com/siargao-private-van-hire',
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  },
  {
    url: 'https://siargaorides.com/terms',
    lastModified: new Date().toISOString(),
    changeFrequency: 'yearly' as const,
    priority: 0.3
  },
  {
    url: 'https://siargaorides.com/privacy',
    lastModified: new Date().toISOString(),
    changeFrequency: 'yearly' as const,
    priority: 0.3
  }
]

function generateSitemapXML(routes: typeof staticRoutes): string {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${routes
  .map(
    (route) => `  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return sitemap
}

export async function GET(request: NextRequest) {
  try {
    // In a real application, you would fetch dynamic routes from your database
    // For example:
    // const shops = await getVerifiedShops()
    // const dynamicRoutes = shops.map(shop => ({
    //   url: `https://siargaorides.com/shop/${shop.id}`,
    //   lastModified: shop.updated_at || new Date().toISOString(),
    //   changeFrequency: 'weekly' as const,
    //   priority: 0.8
    // }))
    
    // For now, we'll use static routes only
    // You can extend this to include dynamic routes from your database
    const allRoutes = [...staticRoutes]
    
    const sitemap = generateSitemapXML(allRoutes)
    
    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}

// Export the same handler for other HTTP methods if needed
export { GET as POST }