import { NextRequest, NextResponse } from 'next/server'

function generateRobotsTxt(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siargaorides.ph'
  
  const robotsTxt = `# Robots.txt for Siargao Rides - Vehicle Rental Directory
# https://siargaorides.ph

User-agent: *
Allow: /

# Allow all search engines to access public pages
Allow: /browse
Allow: /shop/
Allow: /about
Allow: /contact
Allow: /terms
Allow: /privacy

# Disallow private/sensitive pages
Disallow: /dashboard/
Disallow: /api/
Disallow: /admin/
Disallow: /profile/
Disallow: /booking/payment/
Disallow: /booking/deposit/
Disallow: /verify-email
Disallow: /reset-password
Disallow: /forgot-password

# Disallow auth-related pages
Disallow: /sign-in
Disallow: /sign-up
Disallow: /register

# Disallow dynamic booking pages (to avoid indexing incomplete bookings)
Disallow: /booking/*/
Allow: /booking/$

# Allow sitemap
Allow: /sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Specific directives for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

# Block aggressive crawlers and scrapers
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: SemrushBot
Disallow: /

# Block social media bots from sensitive areas
User-agent: facebookexternalhit
Allow: /
Disallow: /dashboard/
Disallow: /api/

User-agent: Twitterbot
Allow: /
Disallow: /dashboard/
Disallow: /api/

User-agent: LinkedInBot
Allow: /
Disallow: /dashboard/
Disallow: /api/`

  return robotsTxt
}

export async function GET(request: NextRequest) {
  try {
    const robotsTxt = generateRobotsTxt()
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    return new NextResponse('Error generating robots.txt', { status: 500 })
  }
}

// Export the same handler for other HTTP methods if needed
export { GET as POST }