import { NextRequest, NextResponse } from 'next/server';
import {
  FirecrawlService,
  ExtractedProduct,
} from '@/lib/firecrawl';
import { OpenAIService } from '@/lib/ai/openai';
import type { FetchedProduct, PersonaProfile } from '@/types/generation';

// ============================================
// POST /api/product/extract
// Extract product data from URL or analyze image
// ============================================

interface ExtractRequest {
  url?: string;
  imageUrl?: string;
  productName?: string;
}

interface ExtractResponse {
  success: boolean;
  product?: FetchedProduct;
  persona?: PersonaProfile;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const body: ExtractRequest = await request.json();

    // Validate input - need either URL or image
    if (!body.url && !body.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Either url or imageUrl is required' },
        { status: 400 }
      );
    }

    let product: FetchedProduct;
    let persona: PersonaProfile | undefined;

    if (body.url) {
      // Extract product from URL using Firecrawl
      const extracted = await extractFromUrl(body.url);
      console.log('Firecrawl extracted product:', {
        name: extracted.name,
        imagesCount: extracted.images?.length || 0,
        images: extracted.images,
        featuresCount: extracted.features?.length || 0,
        features: extracted.features,
        description: extracted.description?.substring(0, 100),
        price: extracted.price,
      });
      // Use getPrimaryImage to select the best image (filters out SVG, icons, etc.)
      const primaryImage = FirecrawlService.getPrimaryImage(extracted.images) || '';

      product = {
        name: extracted.name,
        image: primaryImage,
        images: extracted.images,           // All available images
        price: extracted.price,
        description: extracted.description,
        features: extracted.features,
        source: 'url',
        url: extracted.url,
      };
      console.log('Product sent to frontend:', {
        name: product.name,
        image: product.image,
        imagesCount: product.images?.length || 0,
      });

      // If we have an image, also analyze with OpenAI for persona
      if (product.image) {
        try {
          persona = await OpenAIService.analyzeProduct(product.image, product.name);
        } catch (error) {
          // Persona analysis is optional, continue without it
          console.warn('Persona analysis failed:', error);
        }
      }
    } else if (body.imageUrl) {
      // Analyze image with OpenAI Vision
      const productName = body.productName || 'Product';

      // Get persona from image analysis
      persona = await OpenAIService.analyzeProduct(body.imageUrl, productName);

      // Build product from persona analysis
      // Use new persona format if available, fall back to legacy fields
      const benefits = persona.benefits || persona.lifestyle?.valuesAndPriorities || [];
      const description = persona.targetAudience || persona.credibility || '';
      product = {
        name: productName,
        image: body.imageUrl,
        description: `${description}. ${benefits[0] || ''}`,
        features: benefits,
        source: 'manual',
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      persona,
    });
  } catch (error) {
    console.error('Product extraction error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Use Firecrawl's error helper if applicable
    const userMessage = FirecrawlService.getExtractionErrorMessage(error);

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}

// Helper to extract from URL with Firecrawl
async function extractFromUrl(url: string): Promise<ExtractedProduct> {
  // Check if Firecrawl is configured
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Product URL extraction is not configured. Please add your Firecrawl API key.');
  }

  // Clean and validate URL
  const cleanedUrl = FirecrawlService.cleanProductUrl(url);

  // Check platform support (informational only)
  const platformInfo = FirecrawlService.isSupportedPlatform(cleanedUrl);
  console.log(`Extracting from ${platformInfo.platform || 'unknown'} platform:`, cleanedUrl);

  // Extract product data
  return await FirecrawlService.extractProductFromUrl(cleanedUrl);
}
