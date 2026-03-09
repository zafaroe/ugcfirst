import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // Don't crawl API routes
          '/dashboard/',     // Don't index authenticated pages
          '/create/',        // Don't index authenticated pages
          '/projects/',      // Don't index authenticated pages
          '/settings/',      // Don't index authenticated pages
          '/onboarding/',    // Don't index onboarding flow
          '/auth/',          // Don't index auth callbacks
        ],
      },
    ],
    sitemap: 'https://ugcfirst.com/sitemap.xml',
  }
}
