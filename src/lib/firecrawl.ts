/**
 * Firecrawl Product Extraction Service
 *
 * Extracts product data from e-commerce URLs (Shopify, AliExpress, Amazon, etc.)
 * using Firecrawl's web scraping API.
 *
 * API Documentation: https://docs.firecrawl.dev
 */

// ============================================
// CONFIGURATION
// ============================================

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';

if (!FIRECRAWL_API_KEY) {
  console.warn('FIRECRAWL_API_KEY not configured. URL extraction will be disabled.');
}

// ============================================
// TYPES
// ============================================

export interface ExtractedProduct {
  name: string;
  description?: string;
  price?: string;
  images: string[];
  features: string[];
  url: string;
  source: 'firecrawl';
  rawData?: Record<string, unknown>;
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    content?: string;
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      [key: string]: unknown;
    };
    llm_extraction?: {
      product_name?: string;
      description?: string;
      price?: string;
      images?: string[];
      features?: string[];
    };
    // Alternative location for extracted data (Firecrawl v1 format)
    extract?: {
      product_name?: string;
      description?: string;
      price?: string;
      images?: string[];
      features?: string[];
    };
  };
  error?: string;
}

// ============================================
// PRODUCT EXTRACTION SCHEMA
// ============================================

const PRODUCT_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    product_name: {
      type: 'string',
      description: 'The main product name/title',
    },
    description: {
      type: 'string',
      description: 'Product description or summary',
    },
    price: {
      type: 'string',
      description: 'The product price including currency symbol',
    },
    images: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of product image URLs',
    },
    features: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of key product features or bullet points',
    },
  },
  required: ['product_name'],
};

// ============================================
// API CLIENT
// ============================================

/**
 * Extract product data from a URL using Firecrawl
 *
 * @param url - The product page URL to scrape
 * @returns Extracted product data
 */
export async function extractProductFromUrl(url: string): Promise<ExtractedProduct> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not configured. Set FIRECRAWL_API_KEY environment variable.');
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL provided');
  }

  const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'extract'],
      extract: {
        schema: PRODUCT_EXTRACTION_SCHEMA,
        systemPrompt: `You are a product data extractor. Extract accurate product information from e-commerce pages.
Focus on:
- The main product name (not the store name)
- A concise product description
- The current price (including any sale price)
- All product image URLs
- Key features or bullet points that describe the product

Be thorough but accurate. Only extract information that is clearly present on the page.`,
      },
      waitFor: 2000, // Wait for dynamic content
      timeout: 30000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  const data: FirecrawlScrapeResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to extract product data');
  }

  // Parse the extracted data - try multiple locations
  const extraction = data.data.llm_extraction || data.data.extract;
  const metadata = data.data.metadata;
  const markdown = data.data.markdown || '';

  console.log('Firecrawl response keys:', Object.keys(data.data || {}));
  console.log('Has llm_extraction:', !!data.data.llm_extraction);
  console.log('Has extract:', !!data.data.extract);

  // Extract images from markdown content if available
  const markdownImages = extractImagesFromMarkdown(markdown);
  console.log('Extracted images from markdown:', markdownImages.length);

  // Extract features from markdown content
  const markdownFeatures = extractFeaturesFromMarkdown(markdown);

  // Build the product object with fallbacks
  const product: ExtractedProduct = {
    name: extraction?.product_name || cleanTitle(metadata?.title) || 'Unknown Product',
    description: extraction?.description || metadata?.description,
    price: extraction?.price || extractPriceFromMarkdown(markdown),
    images: extraction?.images || markdownImages || [],
    features: extraction?.features || markdownFeatures || [],
    url,
    source: 'firecrawl',
    rawData: data.data,
  };

  // If no images from extraction, try to get from metadata
  if (product.images.length === 0 && metadata?.ogImage) {
    product.images = [metadata.ogImage];
  }

  console.log('Final product data:', {
    name: product.name,
    imagesCount: product.images.length,
    featuresCount: product.features.length,
  });

  // Validate we got at least a name
  if (!product.name || product.name === 'Unknown Product') {
    throw new Error('Could not extract product name from URL');
  }

  return product;
}

/**
 * Check if a URL is supported for product extraction
 * (e-commerce platforms we have good extraction for)
 */
export function isSupportedPlatform(url: string): { supported: boolean; platform?: string } {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const platforms: Record<string, string> = {
      'shopify.com': 'Shopify',
      'myshopify.com': 'Shopify',
      'amazon.com': 'Amazon',
      'amazon.co.uk': 'Amazon',
      'aliexpress.com': 'AliExpress',
      'ebay.com': 'eBay',
      'etsy.com': 'Etsy',
      'walmart.com': 'Walmart',
      'target.com': 'Target',
    };

    // Check for direct matches
    for (const [domain, platform] of Object.entries(platforms)) {
      if (hostname.includes(domain)) {
        return { supported: true, platform };
      }
    }

    // Most custom domains running Shopify will work
    // We'll try to extract anyway
    return { supported: true, platform: 'Custom' };
  } catch {
    return { supported: false };
  }
}

/**
 * Get a human-readable error message for common extraction failures
 */
export function getExtractionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';

  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'API key is invalid or expired. Please check your Firecrawl API key.';
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return 'Rate limit exceeded. Please try again in a few moments.';
  }

  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'The page took too long to load. Please try a different URL or try again later.';
  }

  if (message.includes('Could not extract')) {
    return 'Could not find product information on this page. Please check the URL is a product page.';
  }

  return `Failed to extract product: ${message}`;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clean title by removing site name suffixes
 */
function cleanTitle(title?: string): string | undefined {
  if (!title) return undefined;
  // Remove common site suffixes
  return title
    .replace(/\s*[|\-–—:]\s*(Amazon\.com|Amazon|eBay|Etsy|Shopify|Walmart|Target).*$/i, '')
    .replace(/\s*[-–—]\s*[^-–—]+$/, '') // Remove last segment after dash if it's likely a site name
    .trim();
}

/**
 * Extract image URLs from markdown content
 */
function extractImagesFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];

  const images: string[] = [];

  // Match plain image URLs
  const urlRegex = /https?:\/\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>\)]*)?/gi;
  let match;
  while ((match = urlRegex.exec(markdown)) !== null) {
    let url = match[0];
    // Clean URL - remove any trailing characters
    url = url.replace(/[)\]}>]+$/, '');
    if (isProductImageUrl(url) && !images.includes(url)) {
      images.push(url);
    }
  }

  // Prioritize and filter images
  const prioritized = prioritizeProductImages(images);
  return prioritized.slice(0, 10); // Limit to 10 images
}

/**
 * Check if URL is likely a product image (not UI element)
 */
function isProductImageUrl(url: string): boolean {
  const lower = url.toLowerCase();

  // Exclude patterns that are NOT product images
  const excludePatterns = [
    'sprite', 'icon', 'logo', '1x1', 'pixel', 'tracking',
    'button', 'arrow', 'nav-', 'menu', 'badge', 'star',
    'checkmark', 'close', 'search', 'cart', 'share',
    'gno/', 'sprites/', '_CB', // Amazon UI elements
    'transparent', 'placeholder', 'loading',
  ];

  for (const pattern of excludePatterns) {
    if (lower.includes(pattern)) return false;
  }

  // Must have image extension
  if (!/\.(jpg|jpeg|png|webp|gif)/i.test(url)) return false;

  // Must be from a CDN or image host
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Prioritize product images over other images
 */
function prioritizeProductImages(images: string[]): string[] {
  // Patterns that indicate product images (Amazon, AliExpress, etc.)
  const productPatterns = [
    '/images/I/', // Amazon product images
    '/images/P/', // Amazon product images
    'cdn.shopify.com/s/files', // Shopify
    'ae01.alicdn.com', // AliExpress
    'i.ebayimg.com', // eBay
    'target.scene7.com', // Target
    'i5.walmartimages.com', // Walmart
  ];

  const priority: string[] = [];
  const others: string[] = [];

  for (const img of images) {
    const isProduct = productPatterns.some(p => img.includes(p));
    if (isProduct) {
      priority.push(img);
    } else {
      others.push(img);
    }
  }

  // Return prioritized first, then others
  return [...priority, ...others];
}

/**
 * Extract features/bullet points from markdown content
 * Looks for patterns that indicate product features
 */
function extractFeaturesFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];

  const features: string[] = [];
  const seenTexts = new Set<string>();

  // Skip patterns that are not features
  const skipPatterns = [
    /^try /i, /^click /i, /^select/i, /^descriptions? off/i,
    /^captions? off/i, /^audio/i, /^video/i, /^settings/i,
    /^sign in/i, /^log in/i, /^add to/i, /^buy now/i,
    /^see more/i, /^learn more/i, /^read more/i,
  ];

  // Match bullet points (- or * followed by text)
  const bulletRegex = /^[\s]*[-*•]\s+(.+)$/gm;
  let match;
  while ((match = bulletRegex.exec(markdown)) !== null) {
    const text = match[1].trim();

    // Skip if it matches exclude patterns
    const shouldSkip = skipPatterns.some(p => p.test(text));
    if (shouldSkip) continue;

    // Filter criteria for valid features
    if (
      text.length >= 20 &&
      text.length <= 300 &&
      !text.includes('http') &&
      !text.includes('javascript') &&
      !seenTexts.has(text.toLowerCase()) &&
      // Must start with letter or number
      /^[A-Za-z0-9]/.test(text)
    ) {
      seenTexts.add(text.toLowerCase());
      features.push(text);
    }
  }

  return features.slice(0, 8); // Limit to 8 features
}

/**
 * Extract price from markdown content
 */
function extractPriceFromMarkdown(markdown: string): string | undefined {
  if (!markdown) return undefined;

  // Match price patterns like $19.99, $19, £19.99, €19.99
  const priceRegex = /[\$£€]\s*\d+(?:\.\d{2})?/;
  const match = markdown.match(priceRegex);
  return match ? match[0] : undefined;
}

/**
 * Clean up a product URL by removing tracking parameters
 */
export function cleanProductUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);

    // List of tracking parameters to remove
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'fbclid',
      'gclid',
      'ref',
      'source',
      'spm',
      '_ga',
    ];

    trackingParams.forEach((param) => {
      parsedUrl.searchParams.delete(param);
    });

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

/**
 * Supported image formats for OpenAI Vision API
 */
const OPENAI_SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Check if an image URL has a format supported by OpenAI Vision
 */
function isOpenAISupportedFormat(url: string): boolean {
  const lower = url.toLowerCase();
  // Check path portion (before query string)
  const pathPart = lower.split('?')[0];
  return OPENAI_SUPPORTED_FORMATS.some(fmt => pathPart.endsWith(fmt));
}

/**
 * Extract the main product image from an array of images
 * (usually the first one, but with some cleaning)
 * Prioritizes images that are compatible with OpenAI Vision API
 */
export function getPrimaryImage(images: string[]): string | undefined {
  if (images.length === 0) return undefined;

  // Filter out small/icon images, tracking pixels, and unsupported formats (SVG, etc.)
  const validImages = images.filter((img) => {
    const lower = img.toLowerCase();

    // Exclude UI elements and tracking
    if (
      lower.includes('icon') ||
      lower.includes('pixel') ||
      lower.includes('tracking') ||
      lower.includes('1x1') ||
      lower.includes('size-chart') ||
      lower.includes('logo') ||
      lower.includes('sprite')
    ) {
      return false;
    }

    // Must be a supported format (not SVG, BMP, TIFF, etc.)
    if (!isOpenAISupportedFormat(img)) {
      return false;
    }

    return true;
  });

  // Return first valid image, or first image if no valid ones found
  return validImages[0] || images[0];
}

// ============================================
// EXPORTS
// ============================================

export const FirecrawlService = {
  extractProductFromUrl,
  isSupportedPlatform,
  getExtractionErrorMessage,
  cleanProductUrl,
  getPrimaryImage,
};
