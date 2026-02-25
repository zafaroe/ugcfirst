# UGCFirst Brand & Design Assets

## Brand Identity

**Brand Name:** UGCFirst
**Tagline:** AI-Powered UGC Videos for E-commerce
**Brand Voice:** Confident, direct, approachable. Built for dropshippers and e-commerce brands.

---

## Logo System

### Logo Mark (Icon)
A rounded square with mint gradient background containing a bold lowercase "u"

**SVG Code:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <defs>
    <linearGradient id="mint-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#mint-grad)"/>
  <text x="24" y="32" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-weight="800" font-size="24" fill="white">u</text>
</svg>
```

### Wordmark
All lowercase "ugcfirst" with a mint green dot accent after the text.

**For Dark Backgrounds:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 40" fill="none">
  <text x="0" y="30" font-family="Outfit, system-ui, sans-serif" font-weight="800" font-size="28" letter-spacing="-0.5" fill="#F8FAFC">ugcfirst</text>
  <circle cx="164" cy="28" r="4" fill="#10B981"/>
</svg>
```

**For Light Backgrounds:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 40" fill="none">
  <text x="0" y="30" font-family="Outfit, system-ui, sans-serif" font-weight="800" font-size="28" letter-spacing="-0.5" fill="#0C0A09">ugcfirst</text>
  <circle cx="164" cy="28" r="4" fill="#10B981"/>
</svg>
```

### Available Logo Files

| File | Size | Usage |
|------|------|-------|
| `public/ugcfirst-icon.svg` | Vector | App icon, favicons |
| `public/ugcfirst-wordmark-darkbg.svg` | Vector | Wordmark for dark backgrounds |
| `public/ugcfirst-wordmark-lightbg.svg` | Vector | Wordmark for light backgrounds |
| `public/favicon.ico` | 16x16, 32x32 | Browser favicon |
| `public/favicon-16x16.png` | 16x16 | Small favicon |
| `public/favicon-32x32.png` | 32x32 | Standard favicon |
| `public/apple-touch-icon.png` | 180x180 | iOS home screen |
| `public/android-chrome-192x192.png` | 192x192 | Android home screen |
| `public/android-chrome-512x512.png` | 512x512 | Android splash |
| `public/og-image.png` | 1200x630 | Social media preview |

---

## Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Mint** | `#10B981` | rgb(16, 185, 129) | Primary brand color, CTAs, links |
| **Mint Dark** | `#059669` | rgb(5, 150, 105) | Hover states, gradients |
| **Mint Light** | `#34D399` | rgb(52, 211, 153) | Highlights, accents |

### Accent Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Coral** | `#F43F5E` | rgb(244, 63, 94) | Warnings, important highlights |
| **Coral Light** | `#FB7185` | rgb(251, 113, 133) | Soft accents |
| **Amber** | `#F59E0B` | rgb(245, 158, 11) | Warnings, attention |
| **Amber Light** | `#FCD34D` | rgb(252, 211, 77) | Soft warnings |

### Background Colors (Dark Theme)

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Cream (Base)** | `#0C0A09` | rgb(12, 10, 9) | Main background |
| **Surface** | `#1C1917` | rgb(28, 25, 23) | Card backgrounds |
| **Surface Secondary** | `#292524` | rgb(41, 37, 36) | Elevated surfaces |

### Text Colors (Light on Dark)

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Primary** | `#FAFAF9` | rgb(250, 250, 249) | Main text, headings |
| **Secondary** | `#E7E5E4` | rgb(231, 229, 228) | Subheadings |
| **Muted** | `#D6D3D1` | rgb(214, 211, 209) | Body text |
| **Disabled** | `#78716C` | rgb(120, 113, 108) | Disabled text |

### Border Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Default** | `#44403C` | rgb(68, 64, 60) | Standard borders |
| **Subtle** | `#292524` | rgb(41, 37, 36) | Subtle dividers |

### Status Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Success** | `#10B981` | rgb(16, 185, 129) | Success states |
| **Warning** | `#F59E0B` | rgb(245, 158, 11) | Warning states |
| **Error** | `#EF4444` | rgb(239, 68, 68) | Error states |

---

## Brand Gradient

The primary brand gradient goes from Mint Light to Mint Dark:

```css
background: linear-gradient(135deg, #34D399, #10B981, #059669);
```

For the logo icon specifically:
```css
background: linear-gradient(135deg, #10B981, #059669);
```

---

## Typography

### Primary Font: Outfit
- **Usage:** Headlines, logo, display text
- **Weights:** 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Source:** Google Fonts

### Secondary Font: Satoshi
- **Usage:** Body text, UI elements
- **Weights:** 400 (Regular), 500 (Medium)
- **Source:** Custom font files

### Font Pairing Examples

**Headlines:**
```css
font-family: 'Outfit', system-ui, sans-serif;
font-weight: 800;
letter-spacing: -0.02em;
```

**Body Text:**
```css
font-family: 'Satoshi', system-ui, sans-serif;
font-weight: 400;
```

---

## Glow & Shadow Effects

### Mint Glow (for CTAs, buttons)
```css
box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
```

### Strong Mint Glow
```css
box-shadow: 0 8px 30px rgba(16, 185, 129, 0.35);
```

### Coral Glow
```css
box-shadow: 0 4px 20px rgba(244, 63, 94, 0.25);
```

---

## Social Media Templates

### Recommended Dimensions

| Platform | Post | Story/Reel | Profile |
|----------|------|------------|---------|
| Instagram | 1080x1080 | 1080x1920 | 320x320 |
| TikTok | 1080x1920 | 1080x1920 | 200x200 |
| Twitter/X | 1200x675 | - | 400x400 |
| LinkedIn | 1200x627 | - | 400x400 |
| YouTube | 1280x720 | 1080x1920 | 800x800 |

### Color Usage Guidelines

1. **Dark backgrounds preferred** - Use #0C0A09 or #1C1917
2. **Mint for emphasis** - CTAs, highlights, key messages
3. **White text on dark** - Use #FAFAF9 for primary text
4. **Coral sparingly** - For urgent or attention-grabbing elements

### Logo Placement

- Minimum clear space around logo: 1x the height of the "u" icon
- On dark backgrounds: Use white wordmark + mint dot
- On images: Use mint gradient icon for visibility

---

## Quick Reference CSS Variables

```css
:root {
  /* Brand Colors */
  --color-mint: #10B981;
  --color-mint-dark: #059669;
  --color-mint-light: #34D399;
  --color-coral: #F43F5E;
  --color-amber: #F59E0B;

  /* Backgrounds (Dark Theme) */
  --color-bg-primary: #0C0A09;
  --color-bg-secondary: #1C1917;
  --color-bg-elevated: #292524;

  /* Text (Light on Dark) */
  --color-text-primary: #FAFAF9;
  --color-text-secondary: #E7E5E4;
  --color-text-muted: #D6D3D1;

  /* Borders */
  --color-border: #44403C;

  /* Fonts */
  --font-heading: 'Outfit', system-ui, sans-serif;
  --font-body: 'Satoshi', system-ui, sans-serif;
}
```

---

## Brand Do's and Don'ts

### Do
- Use the mint gradient for primary actions
- Keep backgrounds dark for the signature look
- Maintain high contrast for readability
- Use the logo with adequate clear space

### Don't
- Use light backgrounds as primary surfaces
- Stretch or distort the logo
- Use colors outside the defined palette
- Mix too many accent colors in one design

---

## File Locations

All assets are located in the `/public` folder of the UGCFirst project:

```
public/
├── ugcfirst-icon.svg           # Logo icon (vector)
├── ugcfirst-wordmark-darkbg.svg # Wordmark for dark backgrounds
├── ugcfirst-wordmark-lightbg.svg # Wordmark for light backgrounds
├── favicon.ico                  # Browser favicon
├── favicon-16x16.png           # Small favicon
├── favicon-32x32.png           # Standard favicon
├── apple-touch-icon.png        # iOS icon
├── android-chrome-192x192.png  # Android icon
├── android-chrome-512x512.png  # Android splash
└── og-image.png                # Social media preview
```

---

*Last updated: February 2026*
