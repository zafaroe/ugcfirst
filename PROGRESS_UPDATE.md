# Vidnary Development Progress - February 5, 2026

## Summary
Today's session focused on implementing product image selection for the Concierge flow and debugging Firecrawl product extraction issues.

---

## Completed Tasks

### 1. Product Image Selection Feature
**Status: Implemented (UI Complete)**

- **Updated `FetchedProduct` type** (`src/types/generation.ts`)
  - Added `images?: string[]` field to store all available images from extraction
  - Maintains backward compatibility with existing `image` field for primary/selected image

- **Updated Product Extract API** (`src/app/api/product/extract/route.ts`)
  - Now returns all extracted images in the `images` array
  - Added debug logging for extraction results

- **Created `ImageSelector` component** (`src/components/composed/image-selector.tsx`)
  - Horizontal scrollable grid of image thumbnails
  - Selected image highlighted with gradient border + checkmark
  - Handles image loading states and errors gracefully
  - Limits display to 10 images maximum
  - Shows image count badge

- **Updated `ProductPreview` component** (`src/components/composed/product-preview.tsx`)
  - Added `onImageSelect` callback prop
  - Renders `ImageSelector` when multiple images are available
  - Shows selected image in the main preview area

- **Updated Concierge Page** (`src/app/(dashboard)/create/concierge/page.tsx`)
  - Added `handleImageSelect` function that updates `fetchedProduct.image` when user selects different image
  - Regenerate button works with selected image (uses current `fetchedProduct` state)

---

### 2. Firecrawl Product Extraction Improvements
**Status: In Progress (Debugging)**

**Problem Identified:**
- Firecrawl API v1 is not returning `llm_extraction` data as expected
- The `extract` format with schema is not populating the expected response fields
- Only `markdown` and `metadata` are being returned

**Fixes Applied:**
- Updated `src/lib/firecrawl.ts` with fallback extraction from markdown content:
  - `extractImagesFromMarkdown()` - Parses image URLs from markdown
  - `extractFeaturesFromMarkdown()` - Extracts bullet points as features
  - `extractPriceFromMarkdown()` - Finds price patterns
  - `cleanTitle()` - Removes site name suffixes from titles
  - `isProductImageUrl()` - Filters out UI elements, icons, sprites
  - `prioritizeProductImages()` - Prioritizes actual product images from known CDNs (Amazon, Shopify, AliExpress, etc.)

**Current Issue:**
- Image extraction from markdown finds many images but needs better filtering
- Features extraction picking up UI text instead of product features
- Need to test with actual product URLs to verify filtering works

---

### 3. Script Generation (Previously Completed - Working)
**Status: Working**

- Gemini 2.0 Flash generating scripts successfully
- Returns 200 status with proper UGC script format
- Three approaches generated: excited_discovery, casual_recommendation, in_the_moment_demo

---

## Files Modified Today

| File | Changes |
|------|---------|
| `src/types/generation.ts` | Added `images?: string[]` to FetchedProduct |
| `src/app/api/product/extract/route.ts` | Return all images, added logging |
| `src/components/composed/image-selector.tsx` | **NEW** - Image selection component |
| `src/components/composed/product-preview.tsx` | Added onImageSelect prop, renders ImageSelector |
| `src/app/(dashboard)/create/concierge/page.tsx` | Added handleImageSelect handler |
| `src/lib/firecrawl.ts` | Added markdown parsing fallbacks for images/features |
| `src/lib/ai/gemini.ts` | Added debug logging for responses |

---

## Pending / Next Steps

1. **Test Firecrawl extraction** with various product URLs to verify image/feature extraction
2. **Verify end-to-end flow**: URL input → Product preview with images → Image selection → Script generation
3. **Consider alternative**: If Firecrawl extraction continues to fail, may need to use OpenAI to analyze markdown content instead

---

## Technical Notes

### Firecrawl API Issue
The Firecrawl v1 API `/scrape` endpoint with `formats: ['markdown', 'extract']` is returning:
```json
{
  "success": true,
  "data": {
    "markdown": "...",
    "metadata": { "title": "...", "description": "..." }
  }
}
```

Expected but NOT receiving:
```json
{
  "data": {
    "llm_extraction": {
      "product_name": "...",
      "images": [...],
      "features": [...]
    }
  }
}
```

### Workaround Implemented
Parsing images and features directly from markdown content using regex patterns, with filtering to exclude:
- UI elements (sprites, icons, logos)
- Navigation items
- Tracking pixels
- Non-product text

---

## ClickUp Task Updates

### Task: Product Image Selection for Concierge Flow
- **Status**: In Progress → Code Complete, Testing
- **Subtasks**:
  - [x] Update FetchedProduct type
  - [x] Update API to return all images
  - [x] Create ImageSelector component
  - [x] Integrate with ProductPreview
  - [x] Update Concierge page state handling
  - [ ] End-to-end testing

### Task: Fix Firecrawl Product Extraction
- **Status**: In Progress
- **Blocker**: Firecrawl API not returning extracted data
- **Workaround**: Implemented markdown parsing fallback
- **Next**: Test with live URLs

---

*Generated: February 5, 2026*
