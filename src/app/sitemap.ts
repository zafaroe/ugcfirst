import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ugcfirst.com'

  // Static pages - these are the pages we want Google to index
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Future: Add dynamic pages here (e.g., public video pages at /v/[id])
  // const { data: publicVideos } = await supabase
  //   .from('generations')
  //   .select('id, updated_at')
  //   .eq('visibility', 'public')
  //   .limit(1000)
  //
  // const videoPages = publicVideos?.map(video => ({
  //   url: `${baseUrl}/v/${video.id}`,
  //   lastModified: new Date(video.updated_at),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.5,
  // })) || []

  return [...staticPages]
}
