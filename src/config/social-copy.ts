/**
 * Social Post Copy Generator (Placeholder)
 * TODO: Replace with AI-generated social copy from pipeline
 */

import type { FetchedProduct, SocialPostCopy } from '@/types/generation'

/**
 * Generate template-based social copy for a product
 * This is a placeholder until AI-generated copy is added to the pipeline
 */
export function generateSocialCopy(
  product: FetchedProduct,
  platform: 'tiktok' | 'instagram' | 'youtube' = 'tiktok'
): SocialPostCopy {
  const productName = product.name.split(' ').slice(0, 3).join(' ')

  const templates = {
    tiktok: {
      text: `Stop everything! You need to see this ${productName} \u{1F62D}\u{2728}\n\nI've been using it and the results are insane. If you've been looking for something that actually works, THIS IS IT.\n\nComment "LINK" and I'll send you the details!`,
      hashtags: ['tiktokmademebuyit', 'fyp', 'viral', 'musthave', 'review'],
    },
    instagram: {
      text: `Okay but have you tried ${productName}? \u{1F929}\n\nI was skeptical at first but WOW. The results speak for themselves.\n\nLink in bio to shop! \u{2728}`,
      hashtags: ['instagramreels', 'reels', 'trending', 'musthave', 'review', 'sponsored'],
    },
    youtube: {
      text: `HONEST review of ${productName} - Is it worth the hype?\n\nI tested it for a week and here's what happened...\n\n#shorts #review #honest`,
      hashtags: ['shorts', 'review', 'honest', 'productreview'],
    },
  }

  const template = templates[platform]
  const text = template.text

  return {
    text,
    hashtags: template.hashtags,
    platform,
    characterCount: text.length,
  }
}
