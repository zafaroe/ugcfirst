// ============================================
// SPOTLIGHT: Product Animation Categories & Styles
// ============================================

export type SpotlightCategory = 'beauty' | 'fashion' | 'food' | 'tech' | 'home' | 'jewelry';

export interface SpotlightStyle {
  id: string;
  name: string;
  description: string;
  icon: string;              // Lucide icon name
  framePrompt: string;       // Nano Banana prompt for enhanced start frame
  animationPrompt: string;   // Kling 2.6 animation prompt
}

export interface SpotlightCategoryConfig {
  id: SpotlightCategory;
  name: string;
  icon: string;              // Lucide icon name
  description: string;
  styles: SpotlightStyle[];
}

export const SPOTLIGHT_CATEGORIES: SpotlightCategoryConfig[] = [
  {
    id: 'beauty',
    name: 'Beauty & Skincare',
    icon: 'Sparkles',
    description: 'Serums, creams, makeup, perfume',
    styles: [
      {
        id: 'glass-glow',
        name: 'Glass Glow',
        description: 'Reflective surface, light passes across, dewy texture',
        icon: 'Droplets',
        framePrompt: 'Cinematic product photography of the product on a smooth reflective glass surface. Soft diffused light creating a dewy, luminous glow. Dark minimal background with subtle gradient. Product is hero, perfectly centered. 9:16 vertical format. NO text, NO watermarks.',
        animationPrompt: 'Slow cinematic product shot. Soft light slowly sweeps across the product creating a beautiful glow and reflection on the glass surface. Subtle light caustics dance across the background. Smooth, elegant camera drift. Premium beauty brand aesthetic.',
      },
      {
        id: 'drop',
        name: 'Drop',
        description: 'Liquid droplet falls in slow motion, ripple effect',
        icon: 'Droplet',
        framePrompt: 'Product photography with a single droplet of liquid suspended above the product. Clean studio setup, soft backlighting creating a halo effect. Product centered, premium feel. Dark background with subtle color accent. 9:16 vertical. NO text.',
        animationPrompt: 'Slow motion liquid drop falls onto or near the product, creating a beautiful ripple effect. Light catches the liquid creating prismatic reflections. Luxurious, sensory beauty commercial feel. Smooth slow motion throughout.',
      },
      {
        id: 'luxe-reveal',
        name: 'Luxe Reveal',
        description: 'Dark to spotlight, golden particles',
        icon: 'Sun',
        framePrompt: 'Product emerging from darkness with dramatic spotlight from above. Golden light particles floating around the product. Premium luxury feel, dark moody background. Product sharply lit, everything else in shadow. 9:16 vertical. NO text.',
        animationPrompt: 'Product dramatically revealed by a warm spotlight sweeping in from above. Golden particles float and shimmer around the product. Camera slowly pushes in as light intensifies. Luxury perfume commercial aesthetic.',
      },
      {
        id: 'skin-texture',
        name: 'Silk',
        description: 'Smooth flowing texture around product',
        icon: 'Waves',
        framePrompt: 'Product surrounded by smooth flowing silk or cream texture. Soft, tactile, sensory feel. Warm tones, close-up framing showing product detail. Clean composition, premium skincare aesthetic. 9:16 vertical. NO text.',
        animationPrompt: 'Silky smooth texture flows and wraps gently around the product. Camera slowly orbits revealing different angles. Soft, ASMR-like quality. The texture movement suggests the product feel. Calming, premium beauty brand motion.',
      },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    icon: 'Shirt',
    description: 'Clothing, shoes, bags, accessories',
    styles: [
      {
        id: 'wind',
        name: 'Wind',
        description: 'Fabric blows gently, showing drape and movement',
        icon: 'Wind',
        framePrompt: 'Fashion editorial product shot. The clothing/accessory item displayed elegantly with fabric caught mid-movement. Dramatic studio lighting with strong shadows. Clean minimal background. High fashion aesthetic. 9:16 vertical. NO text.',
        animationPrompt: 'Gentle wind causes the fabric to flow and billow beautifully, showing texture and drape. Light shifts across the material revealing details. Slow motion fashion film quality. Editorial, high-end brand commercial aesthetic.',
      },
      {
        id: 'runway',
        name: 'Runway',
        description: 'Product slides in, fashion editorial lighting',
        icon: 'Zap',
        framePrompt: 'Product presented on minimal surface with dramatic fashion runway lighting. Strong side light creating bold shadows. Clean, editorial composition. The product is the star. Dark background, high contrast. 9:16 vertical. NO text.',
        animationPrompt: 'Product slides elegantly into frame from one side. Dramatic lighting shifts as it settles into position. Camera does a slow push-in. Runway show energy with polished commercial execution. Bold, confident motion.',
      },
      {
        id: 'flat-to-3d',
        name: 'Flat to 3D',
        description: 'Starts flat, camera lifts to reveal depth',
        icon: 'Layers',
        framePrompt: 'Top-down flat-lay view of the product arranged beautifully on a clean surface. Styled minimally with complementary props. Soft even lighting. Instagram flat-lay aesthetic. 9:16 vertical. NO text.',
        animationPrompt: 'Camera starts directly above in flat-lay view, then smoothly lifts and tilts to reveal the product in full 3D perspective. The transition from 2D to 3D creates a satisfying depth reveal. Smooth, fluid camera movement throughout.',
      },
      {
        id: 'street',
        name: 'Street',
        description: 'Dynamic urban energy, kinetic motion',
        icon: 'Flame',
        framePrompt: 'Product shot with urban street style energy. Bold colors, dynamic composition with diagonal lines. Product positioned with confident attitude. Gritty but stylish backdrop hints. 9:16 vertical. NO text.',
        animationPrompt: 'Fast, energetic product showcase with dynamic camera movements. Quick angle shifts, bold motion. Product bounces or drops into frame with impact. Urban, streetwear commercial energy. High tempo, confident, youthful.',
      },
    ],
  },
  {
    id: 'food',
    name: 'Food & Beverage',
    icon: 'UtensilsCrossed',
    description: 'Snacks, drinks, supplements, coffee',
    styles: [
      {
        id: 'pour',
        name: 'Pour',
        description: 'Liquid flowing, dripping, visceral texture',
        icon: 'GlassWater',
        framePrompt: 'Product with liquid being poured or mid-pour. Captured at the perfect moment showing viscous flow. Dramatic backlighting highlighting liquid transparency. Dark background, food photography lighting. 9:16 vertical. NO text.',
        animationPrompt: 'Beautiful slow motion pour or liquid flowing around the product. Light catches every droplet and stream. Rich, visceral texture of the liquid is the star. Food commercial quality with appetite appeal. Slow, indulgent pacing.',
      },
      {
        id: 'steam',
        name: 'Steam',
        description: 'Warm steam rising, cozy mood',
        icon: 'CloudFog',
        framePrompt: 'Product with wisps of steam or vapor rising around it. Warm, inviting lighting suggesting heat and freshness. Cozy, appetizing mood. Soft focus background, sharp product. 9:16 vertical. NO text.',
        animationPrompt: 'Gentle steam rises and curls around the product. Warm light shifts subtly creating a cozy, inviting atmosphere. Camera slowly drifts inward. The warmth and aroma feel tangible. Comfort food commercial aesthetic.',
      },
      {
        id: 'burst',
        name: 'Burst',
        description: 'Ingredients explode outward, colorful impact',
        icon: 'Zap',
        framePrompt: 'Product at center with ingredients or flavor elements arranged in an explosion pattern around it. Vibrant colors, dynamic composition suggesting energy and flavor. Clean background. 9:16 vertical. NO text.',
        animationPrompt: 'Ingredients and flavor elements burst outward from the product in a colorful explosion. Dynamic, energetic, fun. Each element is distinct and appetizing. Camera might do a subtle zoom during impact. Bold food advertising energy.',
      },
      {
        id: 'plated',
        name: 'Plated',
        description: 'Styled surface, slow push-in, appetite appeal',
        icon: 'ChefHat',
        framePrompt: 'Product beautifully styled on a surface with complementary food styling elements. Professional food photography composition. Warm directional lighting. Appetizing, editorial quality. 9:16 vertical. NO text.',
        animationPrompt: 'Camera slowly pushes in toward the beautifully styled product. Light subtly shifts revealing texture and detail. Elegant, refined food editorial motion. The slow pace builds appetite appeal. Restaurant commercial quality.',
      },
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Gadgets',
    icon: 'Smartphone',
    description: 'Phones, earbuds, chargers, smart devices',
    styles: [
      {
        id: 'orbit',
        name: 'Orbit',
        description: 'Clean 360 rotation on minimal background',
        icon: 'RotateCw',
        framePrompt: 'Product floating on clean minimal white/grey gradient background. Sharp product photography with controlled studio lighting. Product perfectly centered, slight angle showing dimension. 9:16 vertical. NO text.',
        animationPrompt: 'Smooth 360-degree rotation of the product on a clean minimal background. Even, professional lighting maintains consistency throughout the rotation. Slow, steady orbit revealing every angle. Apple-style product commercial aesthetic.',
      },
      {
        id: 'neon',
        name: 'Neon',
        description: 'Dark environment, edge-lit with neon glow',
        icon: 'Lightbulb',
        framePrompt: 'Product in dark environment with vivid neon edge lighting. Cyan and magenta rim lights creating dramatic tech aesthetic. Product surfaces glow with reflected neon. Futuristic, dark, premium. 9:16 vertical. NO text.',
        animationPrompt: 'Neon lights pulse and shift around the product in a dark environment. Edge lighting creates dramatic rim highlights that move across surfaces. Camera slowly orbits. Futuristic tech reveal with cyberpunk commercial energy.',
      },
      {
        id: 'unbox-tech',
        name: 'Unbox',
        description: 'Product emerges from packaging, reveal moment',
        icon: 'Package',
        framePrompt: 'Product partially emerging from premium packaging. The box is opened revealing the product inside. Clean, minimal setting. Anticipation and premium unboxing feel. 9:16 vertical. NO text.',
        animationPrompt: 'Product rises or slides out of its packaging in a satisfying reveal. Slow, deliberate motion emphasizing the premium unboxing experience. Clean background, focused lighting on the reveal moment. Apple keynote product reveal energy.',
      },
      {
        id: 'feature',
        name: 'Feature',
        description: 'Camera zooms into detail, then pulls back',
        icon: 'Search',
        framePrompt: 'Extreme close-up macro shot of the product showing a key detail, texture, or feature. Sharp focus on the detail, soft bokeh around edges. Technical, precise lighting. 9:16 vertical. NO text.',
        animationPrompt: 'Camera starts with extreme close-up on a key product detail or feature, then smoothly pulls back to reveal the full product. The zoom-out creates a dramatic reveal. Technical product showcase with precision.',
      },
    ],
  },
  {
    id: 'home',
    name: 'Home & Lifestyle',
    icon: 'Home',
    description: 'Candles, decor, kitchen tools, organizers',
    styles: [
      {
        id: 'cozy',
        name: 'Cozy',
        description: 'Warm ambient scene, golden hour lighting',
        icon: 'Flame',
        framePrompt: 'Product in a warm, cozy setting. Golden hour or candlelit ambiance. Soft warm tones, inviting atmosphere. Product naturally placed in a lifestyle context. Homey, comfort-forward. 9:16 vertical. NO text.',
        animationPrompt: 'Warm, golden light flickers and shifts gently across the product in a cozy setting. Subtle ambient movement — perhaps a candle flame or curtain drift. Camera slowly drifts. Hygge-inspired comfort commercial.',
      },
      {
        id: 'in-context',
        name: 'In Context',
        description: 'Product in real room setting, slow drift',
        icon: 'Armchair',
        framePrompt: 'Product beautifully placed in a real, styled room setting. Interior design quality composition. The product naturally belongs in the space. Warm, editorial home photography. 9:16 vertical. NO text.',
        animationPrompt: 'Camera slowly drifts through a styled room space, arriving at and settling on the product. The movement reveals the product in its natural context. Interior design magazine quality. Slow, calming, aspirational.',
      },
      {
        id: 'clean',
        name: 'Clean',
        description: 'Minimal background, product floats elegantly',
        icon: 'Minimize',
        framePrompt: 'Product on pure white or soft light background. Minimal, airy composition. Product seems to float with soft shadow beneath. Clean, Scandinavian design aesthetic. 9:16 vertical. NO text.',
        animationPrompt: 'Product gently floats or hovers with subtle rotation on a clean minimal background. Soft shadow moves beneath. Light, airy, effortless. Minimal motion design with premium simplicity. Scandinavian brand aesthetic.',
      },
      {
        id: 'before-after',
        name: 'Transform',
        description: 'Empty space, product appears and transforms scene',
        icon: 'Wand2',
        framePrompt: 'Split composition: one half shows a bare, undecorated space; the other half shows the same space transformed with the product. Before/after visual concept. Clean execution. 9:16 vertical. NO text.',
        animationPrompt: 'Scene starts empty or bare, then the product appears or drops in and the space around it transforms — light changes, colors shift, the space feels complete. The product is the transformative element. Satisfying before/after reveal.',
      },
    ],
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Watches',
    icon: 'Gem',
    description: 'Rings, necklaces, watches, earrings',
    styles: [
      {
        id: 'sparkle',
        name: 'Sparkle',
        description: 'Light catches facets, prismatic reflections',
        icon: 'Sparkles',
        framePrompt: 'Jewelry/watch with light catching its surfaces creating brilliant sparkle and prismatic reflections. Dark background with a single focused light source. Macro-level detail visible. Luxury jewelry photography. 9:16 vertical. NO text.',
        animationPrompt: 'Light slowly moves across the jewelry creating dancing sparkles and prismatic reflections. Each facet catches light at different moments. Slow, mesmerizing, luxurious. High-end jewelry brand commercial with hypnotic light play.',
      },
      {
        id: 'macro',
        name: 'Macro',
        description: 'Extreme close-up showing craftsmanship',
        icon: 'Search',
        framePrompt: 'Extreme macro close-up of the jewelry showing incredible craftsmanship detail. Every texture, setting, and surface detail visible. Professional macro jewelry photography with precise lighting. 9:16 vertical. NO text.',
        animationPrompt: 'Ultra close-up macro view slowly reveals the intricate details and craftsmanship of the piece. Camera glides across surfaces showing texture, settings, and finishing. Then gradually pulls back to show the full piece. Master jeweler inspection quality.',
      },
      {
        id: 'velvet',
        name: 'Velvet',
        description: 'Dark velvet backdrop, dramatic side lighting',
        icon: 'Moon',
        framePrompt: 'Jewelry/watch resting on rich dark velvet or satin. Dramatic side lighting creating strong highlights and deep shadows. Opulent, luxurious presentation. Gallery-quality jewelry photography. 9:16 vertical. NO text.',
        animationPrompt: 'Camera slowly orbits the piece resting on luxurious dark velvet. Dramatic side lighting shifts revealing different facets and creating moving highlights. Opulent, gallery-level presentation. Slow, reverent pacing.',
      },
      {
        id: 'worn',
        name: 'Lifestyle',
        description: 'Simulated on wrist/neck, lifestyle feel',
        icon: 'Heart',
        framePrompt: 'Jewelry/watch styled as if being worn — on a velvet hand form, jewelry bust, or styled lifestyle context. Soft natural lighting, aspirational setting. Shows how the piece looks in real life. 9:16 vertical. NO text.',
        animationPrompt: 'Lifestyle showcase of the jewelry piece in an aspirational context. Gentle movement suggests it being worn — light catches it naturally. Camera slowly drifts to show the piece from different angles. Warm, personal, aspirational brand film quality.',
      },
    ],
  },
];

// Helper to find category and style by IDs
export function getSpotlightCategory(categoryId: SpotlightCategory): SpotlightCategoryConfig | undefined {
  return SPOTLIGHT_CATEGORIES.find(c => c.id === categoryId);
}

export function getSpotlightStyle(categoryId: SpotlightCategory, styleId: string): SpotlightStyle | undefined {
  const category = getSpotlightCategory(categoryId);
  return category?.styles.find(s => s.id === styleId);
}

// All category IDs for validation
export const SPOTLIGHT_CATEGORY_IDS: SpotlightCategory[] = ['beauty', 'fashion', 'food', 'tech', 'home', 'jewelry'];
