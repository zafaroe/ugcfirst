import type {
  FetchedProduct,
  GeneratedScript,
  SocialPostCopy,
  StrategyBrief,
  PostingTimeRecommendation,
} from '@/types/generation';

// ============================================
// MOCK FETCHED PRODUCTS
// ============================================

export const mockFetchedProducts: FetchedProduct[] = [
  {
    name: 'GlowSerum Pro - Vitamin C Brightening Serum',
    image: '/images/products/serum.svg',
    price: '$29.99',
    description:
      'Advanced vitamin C serum with hyaluronic acid for radiant, youthful skin. Reduces dark spots and fine lines.',
    features: [
      '20% Vitamin C concentration',
      'Hyaluronic acid for deep hydration',
      'Reduces dark spots in 2 weeks',
      'Suitable for all skin types',
      'Cruelty-free & vegan',
    ],
    source: 'url',
    url: 'https://example.com/products/glowserum-pro',
  },
  {
    name: 'CloudWalk Ultra - Memory Foam Sneakers',
    image: '/images/products/sneakers.svg',
    price: '$89.00',
    description:
      'Revolutionary memory foam sneakers that feel like walking on clouds. Perfect for all-day comfort.',
    features: [
      'Memory foam insoles',
      'Breathable mesh upper',
      'Slip-resistant sole',
      'Machine washable',
      'Available in 12 colors',
    ],
    source: 'url',
    url: 'https://example.com/products/cloudwalk-ultra',
  },
  {
    name: 'AirPods Max Alternative - Studio Pro Headphones',
    image: '/images/products/headphones.svg',
    price: '$149.99',
    description:
      'Premium wireless headphones with active noise cancellation and 40-hour battery life.',
    features: [
      'Active noise cancellation',
      '40-hour battery life',
      'Premium leather cushions',
      'Bluetooth 5.3',
      'Foldable design',
    ],
    source: 'manual',
  },
];

// Helper to simulate fetching a product from URL
export function getMockFetchedProduct(url: string): FetchedProduct {
  // Simulate different products based on URL keywords
  if (url.toLowerCase().includes('skincare') || url.toLowerCase().includes('serum')) {
    return mockFetchedProducts[0];
  }
  if (url.toLowerCase().includes('shoe') || url.toLowerCase().includes('sneaker')) {
    return mockFetchedProducts[1];
  }
  // Default product
  return {
    ...mockFetchedProducts[0],
    url,
  };
}

// ============================================
// MOCK GENERATED SCRIPTS
// ============================================

// Mock scripts using the new n8n 12-second UGC format
export const mockGeneratedScripts: GeneratedScript[] = [
  {
    approach: 'excited_discovery',
    approachLabel: 'Excited Discovery',
    energy: 'Excited, caffeinated, just discovered something amazing',
    dialogue: [
      { timestamp: '0:00-0:02', text: "Okay wait, you guys need to see this..." },
      { timestamp: '0:02-0:09', text: "I just found this vitamin C serum and it literally changed my entire skincare game. Like, my dark spots? Fading. That tired look? Gone." },
      { timestamp: '0:09-0:12', text: "Link in bio, trust me on this." },
    ],
    shotBreakdown: [
      { second: 0, cameraPosition: 'Selfie mode, chest height', cameraMovement: 'Shaky, excited movement', whatsInFrame: 'Face, messy room behind', creatorAction: 'Leaning into camera excitedly', productVisibility: 'Not visible yet', audioCue: 'Okay wait, you guys...' },
    ],
    technicalDetails: {
      phoneOrientation: 'Vertical',
      filmingMethod: 'Selfie mode, one hand',
      dominantHand: 'Right hand holds phone, left holds product',
      locationSpecifics: 'Bedroom, natural window light',
      audioEnvironment: 'Quiet, slight room echo',
    },
    fullScript: "Okay wait, you guys need to see this... I just found this vitamin C serum and it literally changed my entire skincare game. Like, my dark spots? Fading. That tired look? Gone. Link in bio, trust me on this.",
    wordCount: 45,
    estimatedDuration: 12,
    // Legacy fields
    hookLine: "Okay wait, you guys need to see this...",
    content: "Okay wait, you guys need to see this... I just found this vitamin C serum and it literally changed my entire skincare game. Like, my dark spots? Fading. That tired look? Gone. Link in bio, trust me on this.",
  },
  {
    approach: 'casual_recommendation',
    approachLabel: 'Casual Recommendation',
    energy: 'Chill, matter-of-fact, talking to a friend',
    dialogue: [
      { timestamp: '0:00-0:02', text: "So like, these sneakers..." },
      { timestamp: '0:02-0:09', text: "I'm on my feet all day and they're literally like walking on clouds. Memory foam, machine washable, the whole thing." },
      { timestamp: '0:09-0:12', text: "I've bought three pairs. That serious." },
    ],
    shotBreakdown: [
      { second: 0, cameraPosition: 'Propped on counter', cameraMovement: 'Slight wobble as they gesture', whatsInFrame: 'Upper body, kitchen behind', creatorAction: 'Holding sneaker, pointing at it', productVisibility: 'Product in hand', audioCue: 'So like, these sneakers...' },
    ],
    technicalDetails: {
      phoneOrientation: 'Vertical',
      filmingMethod: 'Propped on stack of books',
      dominantHand: 'Both hands free for product',
      locationSpecifics: 'Kitchen counter, morning light',
      audioEnvironment: 'Ambient home sounds, faint TV',
    },
    fullScript: "So like, these sneakers... I'm on my feet all day and they're literally like walking on clouds. Memory foam, machine washable, the whole thing. I've bought three pairs. That serious.",
    wordCount: 38,
    estimatedDuration: 12,
    // Legacy fields
    hookLine: "So like, these sneakers...",
    content: "So like, these sneakers... I'm on my feet all day and they're literally like walking on clouds. Memory foam, machine washable, the whole thing. I've bought three pairs. That serious.",
  },
  {
    approach: 'in_the_moment_demo',
    approachLabel: 'In-the-Moment Demo',
    energy: 'Focused, demonstrating, impressed by what they\'re seeing',
    dialogue: [
      { timestamp: '0:00-0:02', text: "Okay so I'm trying these headphones..." },
      { timestamp: '0:02-0:09', text: "The noise cancellation is insane. Like, I can't hear anything. 40 hours battery. Under $150. What?" },
      { timestamp: '0:09-0:12', text: "AirPods Max could never." },
    ],
    shotBreakdown: [
      { second: 0, cameraPosition: 'Mirror selfie, holding phone', cameraMovement: 'Adjusting to show headphones', whatsInFrame: 'Full upper body with headphones', creatorAction: 'Putting on headphones, tapping ear cups', productVisibility: 'Headphones on head, prominent', audioCue: 'Okay so I\'m trying these...' },
    ],
    technicalDetails: {
      phoneOrientation: 'Vertical',
      filmingMethod: 'Mirror selfie, back camera',
      dominantHand: 'Right hand holds phone',
      locationSpecifics: 'Bedroom mirror, lamp light',
      audioEnvironment: 'Quiet room, slight echo',
    },
    fullScript: "Okay so I'm trying these headphones... The noise cancellation is insane. Like, I can't hear anything. 40 hours battery. Under $150. What? AirPods Max could never.",
    wordCount: 32,
    estimatedDuration: 12,
    // Legacy fields
    hookLine: "Okay so I'm trying these headphones...",
    content: "Okay so I'm trying these headphones... The noise cancellation is insane. Like, I can't hear anything. 40 hours battery. Under $150. What? AirPods Max could never.",
  },
];

// Helper to get script based on product
export function getMockScript(product: FetchedProduct): GeneratedScript {
  if (product.name.toLowerCase().includes('serum') || product.name.toLowerCase().includes('skin')) {
    return mockGeneratedScripts[0];
  }
  if (product.name.toLowerCase().includes('sneaker') || product.name.toLowerCase().includes('shoe')) {
    return mockGeneratedScripts[1];
  }
  if (product.name.toLowerCase().includes('headphone') || product.name.toLowerCase().includes('audio')) {
    return mockGeneratedScripts[2];
  }
  // Return first script with modified hook
  const defaultScript = { ...mockGeneratedScripts[0] };
  const newHook = `Okay wait, you need to see this ${product.name.split(' ')[0]}...`;
  defaultScript.dialogue = [
    { timestamp: '0:00-0:02', text: newHook },
    ...defaultScript.dialogue.slice(1),
  ];
  defaultScript.hookLine = newHook;
  return defaultScript;
}

// ============================================
// MOCK SOCIAL POST COPIES
// ============================================

export const mockSocialCopies: SocialPostCopy[] = [
  {
    text: `Stop everything!! This serum is changing lives and I had to share 😭✨

The vitamin C concentration is INSANE and my dark spots are literally disappearing

If you've been looking for that holy grail skincare product, THIS IS IT

Comment "GLOW" and I'll send you the link!`,
    hashtags: ['skincare', 'glowup', 'tiktokmademebuyit', 'skincareroutine', 'vitaminc', 'fyp', 'viral'],
    platform: 'tiktok',
    characterCount: 298,
  },
  {
    text: `My feet have never been happier 😩☁️

These memory foam sneakers are absolutely ridiculous. Like walking on actual clouds.

10/10 recommend if you're on your feet all day

Drop a 🙋‍♀️ if you need comfy shoes!`,
    hashtags: ['sneakers', 'comfortshoes', 'tiktokmademebuyit', 'footwear', 'memoryfoam', 'fyp'],
    platform: 'tiktok',
    characterCount: 247,
  },
  {
    text: `AirPods Max quality WITHOUT the AirPods Max price? Say less 🎧

These headphones have been my daily driver for a month now and I'm obsessed

The noise cancellation is *actually* good

Link in bio for the plug 🔌`,
    hashtags: ['headphones', 'techreview', 'tiktokmademebuyit', 'audiophile', 'tech', 'fyp'],
    platform: 'tiktok',
    characterCount: 265,
  },
];

// Helper to get social copy based on product
export function getMockSocialCopy(product: FetchedProduct, platform: 'tiktok' | 'instagram' | 'youtube' = 'tiktok'): SocialPostCopy {
  let baseCopy = mockSocialCopies[0];

  if (product.name.toLowerCase().includes('sneaker') || product.name.toLowerCase().includes('shoe')) {
    baseCopy = mockSocialCopies[1];
  } else if (product.name.toLowerCase().includes('headphone') || product.name.toLowerCase().includes('audio')) {
    baseCopy = mockSocialCopies[2];
  }

  return {
    ...baseCopy,
    platform,
  };
}

// Backward compatibility aliases
export const mockVideoCaptions = mockSocialCopies;
export const getMockCaption = getMockSocialCopy;

// ============================================
// MOCK STRATEGY BRIEF
// ============================================

export const mockStrategyBrief: StrategyBrief = {
  platforms: {
    primary: {
      name: 'tiktok',
      reason: 'Highest organic reach potential for viral UGC content. Your product niche performs exceptionally well here.',
      adFormat: 'Spark Ads (boosted organic posts)',
      startingBudget: '$50-100/day',
      tips: [
        'Post during peak hours (7-9 PM)',
        'Use trending sounds for extra reach',
        'Hook viewers in first 0.5 seconds',
        'Reply to comments to boost engagement',
      ],
    },
    secondary: {
      name: 'instagram',
      reason: 'Strong for retargeting and building brand trust. Reels algorithm favors UGC content.',
      adFormat: 'Reels Ads + Story Placements',
      startingBudget: '$30-50/day',
      tips: [
        'Cross-post your TikToks as Reels',
        'Add product tags for shopping',
        'Use carousel posts for testimonials',
        'Leverage Instagram Stories for urgency',
      ],
    },
    alsoTest: {
      name: 'youtube',
      reason: 'YouTube Shorts is growing fast with less competition. Great for evergreen content.',
      adFormat: 'YouTube Shorts Ads',
      startingBudget: '$20-30/day',
      tips: [
        'Shorts under 30 seconds perform best',
        'Add chapters to longer videos',
        'SEO-optimize your titles',
        'Pin a comment with your link',
      ],
    },
  },
  testingRoadmap: [
    {
      phase: 1,
      days: 'Days 1-3',
      action: 'Launch with $50/day on TikTok Spark Ads. Test 3 different hooks with the same video.',
      budget: '$150 total',
      kpis: ['CTR > 1%', 'CPM < $10', 'Hook rate > 40%'],
    },
    {
      phase: 2,
      days: 'Days 4-7',
      action: 'Scale winning hook to $100/day. Add Instagram Reels with $30/day budget.',
      budget: '$520 total',
      kpis: ['ROAS > 2x', 'CPC < $1', 'Add to cart rate > 3%'],
    },
    {
      phase: 3,
      days: 'Days 8-14',
      action: 'Scale to $200/day on best performers. Test YouTube Shorts. Create retargeting audiences.',
      budget: '$1,400 total',
      kpis: ['ROAS > 3x', 'Blended CPA < $25', 'Frequency < 3'],
    },
  ],
  hookPriority: [
    {
      scriptIndex: 0,
      hookType: 'Problem-Agitation',
      openingLine: "Stop scrolling if you've been struggling with dull skin...",
      reasoning: 'Directly calls out the pain point. Creates immediate relevance for target audience.',
      expectedHookRate: '45-55%',
      priority: 1,
    },
    {
      scriptIndex: 1,
      hookType: 'POV/Storytelling',
      openingLine: 'POV: You finally found the product that actually works...',
      reasoning: 'Creates curiosity and emotional connection. Strong for building trust.',
      expectedHookRate: '35-45%',
      priority: 2,
    },
    {
      scriptIndex: 2,
      hookType: 'Controversy/Hot Take',
      openingLine: "Everyone's wrong about skincare and here's why...",
      reasoning: 'Polarizing hooks drive engagement through comments. Use sparingly.',
      expectedHookRate: '50-60%',
      priority: 3,
    },
  ],
  metrics: [
    {
      name: 'Hook Rate',
      target: '> 40%',
      howToImprove: 'Test different opening lines. First 0.5 seconds are critical.',
    },
    {
      name: 'Watch Time',
      target: '> 50%',
      howToImprove: 'Keep videos under 30 seconds. Add visual variety every 2-3 seconds.',
    },
    {
      name: 'CTR',
      target: '> 1%',
      howToImprove: 'Strong CTA at the end. Create urgency with limited offers.',
    },
    {
      name: 'ROAS',
      target: '> 2x',
      howToImprove: 'Optimize landing page. Test different price points and offers.',
    },
  ],
  audiences: [
    {
      segment: 'Primary: Problem-Aware Shoppers',
      ageRange: '18-34',
      whyItWorks: 'Actively searching for solutions. High purchase intent when they see social proof.',
      interests: ['Skincare', 'Beauty', 'Self-care', 'TikTok trends'],
      behaviors: ['Online shoppers', 'Engaged with beauty content'],
    },
    {
      segment: 'Secondary: Trend Followers',
      ageRange: '16-28',
      whyItWorks: 'FOMO-driven purchases. Love discovering viral products.',
      interests: ['TikTok', 'Instagram', 'Viral products', 'Influencers'],
      behaviors: ['High social media usage', 'Frequent impulse buyers'],
    },
    {
      segment: 'Tertiary: Gift Buyers',
      ageRange: '25-45',
      whyItWorks: 'Looking for popular gifts. Trust social proof for purchasing decisions.',
      interests: ['Gift ideas', 'Trending products', 'Reviews'],
      behaviors: ['Seasonal shoppers', 'Research before buying'],
    },
  ],
  optimizationTips: {
    do: [
      'Test multiple hooks with the same video',
      'Post organically before running ads',
      'Engage with every comment in first hour',
      'Use trending sounds when relevant',
      'Create urgency with limited-time offers',
    ],
    dont: [
      'Start with too high of a budget',
      'Ignore negative comments (respond professionally)',
      'Use the same creative for more than 2 weeks',
      'Forget to add captions (85% watch muted)',
      'Skip the landing page optimization',
    ],
    proTips: [
      'The best performing ads often look like organic content - avoid polished production',
      'Create a "Comment to get link" strategy to boost engagement',
      'Retarget video viewers who watched 50%+ at lower CPMs',
    ],
  },
  quickStats: {
    estimatedCPM: '$8-15',
    expectedROAS: '2-4x',
    testingDuration: '14 days',
    totalBudget: '$500-2,000',
  },
  bestPostingTimes: [
    'Monday-Friday: 7-9 PM (highest engagement)',
    'Weekends: 10 AM - 12 PM (leisure browsing)',
    'Avoid: 2-5 PM (lowest engagement)',
  ],
};

// ============================================
// MOCK POSTING TIME RECOMMENDATIONS
// ============================================

export const mockPostingTimes: PostingTimeRecommendation[] = [
  {
    day: 'Monday',
    times: ['7:00 AM', '12:00 PM', '7:00 PM'],
    engagement: 'medium',
  },
  {
    day: 'Tuesday',
    times: ['9:00 AM', '1:00 PM', '8:00 PM'],
    engagement: 'high',
  },
  {
    day: 'Wednesday',
    times: ['7:00 AM', '11:00 AM', '7:00 PM'],
    engagement: 'high',
  },
  {
    day: 'Thursday',
    times: ['9:00 AM', '12:00 PM', '9:00 PM'],
    engagement: 'high',
  },
  {
    day: 'Friday',
    times: ['5:00 PM', '7:00 PM', '9:00 PM'],
    engagement: 'medium',
  },
  {
    day: 'Saturday',
    times: ['10:00 AM', '12:00 PM', '8:00 PM'],
    engagement: 'medium',
  },
  {
    day: 'Sunday',
    times: ['10:00 AM', '7:00 PM', '9:00 PM'],
    engagement: 'low',
  },
];

// Helper to get strategy brief for a product
export function getMockStrategyBrief(product: FetchedProduct): StrategyBrief {
  // Customize strategy based on product type
  const strategy = { ...mockStrategyBrief };

  // Adjust audiences based on product
  if (product.name.toLowerCase().includes('sneaker') || product.name.toLowerCase().includes('shoe')) {
    strategy.audiences[0] = {
      ...strategy.audiences[0],
      segment: 'Primary: Active Lifestyle Seekers',
      interests: ['Fitness', 'Running', 'Athleisure', 'Comfort shoes'],
    };
  }

  return strategy;
}
