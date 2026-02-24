# Vidnary Design System

> Reference guide for maintaining visual consistency across the application.

---

## Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Shadows & Glows](#shadows--glows)
4. [Animations](#animations)
5. [Background Effects](#background-effects)
6. [Component Patterns](#component-patterns)
7. [CSS Utilities](#css-utilities)

---

## Color Palette

### Background Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `deep-space` | `#0F172A` | Main background, page base |
| `surface` | `#1E293B` | Cards, elevated containers |
| `elevated` | `#334155` | Hover states, tertiary elements |

### Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `electric-indigo` | `#6366F1` | Primary brand, CTAs, links |
| `vibrant-fuchsia` | `#D946EF` | Secondary brand, accents, gradients |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F8FAFC` | Headings, important text |
| `text-muted` | `#94A3B8` | Body text, descriptions |
| `text-disabled` | `#64748B` | Disabled states |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `status-success` | `#10B981` | Success states, positive indicators |
| `status-warning` | `#F59E0B` | Warnings, caution states |
| `status-error` | `#EF4444` | Errors, destructive actions |

### Border Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#374151` | Card borders, dividers |

---

## Typography

### Font Families

```css
/* Headings - Geometric, bold, modern */
font-family: 'Syne', system-ui, sans-serif;

/* Body - Clean, readable, professional */
font-family: 'DM Sans', system-ui, sans-serif;
```

### Font Weights
- **Headings**: 700-800 (Bold to Extra Bold)
- **Body**: 400-500 (Regular to Medium)
- **Buttons/Labels**: 500-600 (Medium to Semi-Bold)

### Heading Styles
All headings (h1-h6) automatically use:
- Font: Syne
- Weight: 700
- Letter-spacing: -0.02em

### Recommended Sizes
| Element | Desktop | Mobile |
|---------|---------|--------|
| Hero H1 | `text-5xl` (3rem) | `text-3xl` (1.875rem) |
| Section H2 | `text-4xl` (2.25rem) | `text-2xl` (1.5rem) |
| Card H3 | `text-xl` (1.25rem) | `text-lg` (1.125rem) |
| Body | `text-base` (1rem) | `text-base` (1rem) |
| Small | `text-sm` (0.875rem) | `text-sm` (0.875rem) |

---

## Shadows & Glows

### Shadow Tokens

```css
/* Subtle glow */
shadow-glow-sm: 0 0 10px rgba(99, 102, 241, 0.2);

/* Standard glow */
shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);

/* Large glow */
shadow-glow-lg: 0 0 30px rgba(99, 102, 241, 0.4);

/* Elevated shadow */
shadow-elevated: 0 25px 50px -12px rgba(99, 102, 241, 0.25);

/* Strong glow (for focus states) */
shadow-glow-strong: 0 0 60px rgba(99, 102, 241, 0.4);
```

### Glow Utilities
- `.glow-indigo` - Indigo glow (20px)
- `.glow-indigo-lg` - Large indigo glow (40px)
- `.glow-fuchsia` - Fuchsia glow (20px)
- `.glow-fuchsia-lg` - Large fuchsia glow (40px)
- `.glow-brand` - Combined indigo + fuchsia glow

---

## Animations

### Floating Animation
```css
.animate-float        /* 6s gentle float */
.animate-float-delayed /* 6s float with 2s delay */
.animate-float-slow   /* 8s slow float */
```

### Interactive Animations
```css
.animate-sparkle      /* Twinkle/sparkle effect */
.animate-pulse-glow   /* Pulsing glow effect */
.animate-shimmer      /* Loading shimmer */
```

### Hover Effects
```css
.card-hover-lift      /* Lift -6px on hover */
.btn-press           /* Scale 0.97 on active */
.link-underline      /* Animated gradient underline */
```

### Framer Motion Presets
```tsx
// Stagger container
staggerDelay={0.1}

// Fade in from bottom
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Scale on hover
whileHover={{ scale: 1.05, y: -8 }}
transition={{ type: 'spring', stiffness: 300, damping: 20 }}
```

---

## Background Effects

### Grid Pattern
```tsx
<div className="bg-grid bg-grid-animated">
  {/* Content */}
</div>
```
- 60px grid squares
- Indigo color at 3% opacity
- Radial mask fading to transparent
- Optional animation (30s shift)

### Noise Overlay
```tsx
<div className="noise-overlay" />
```
- Fixed position, covers viewport
- 3% opacity film grain texture
- z-index: 9999 (always on top)
- Pointer-events disabled

### Gradient Mesh
```tsx
<div className="gradient-mesh" />
```
- Animated floating gradient blobs
- Indigo blob (top-right)
- Fuchsia blob (bottom-left)
- 15-20s animation cycle

### Spotlight Effect
```tsx
<div className="spotlight" />
```
- Radial gradient from top center
- Subtle indigo illumination

### Vignette
```tsx
<div className="vignette" />
```
- Edge darkening effect
- Subtle cinematic feel

---

## Component Patterns

### Cards

**Standard Card:**
```tsx
<div className="bg-surface rounded-xl p-6 border border-border-default">
```

**Gradient Border Card:**
```tsx
<div className="gradient-border">
  {/* Content */}
</div>
```

**Glow Card (hover effect):**
```tsx
<div className="gradient-border-glow">
  {/* Glows on hover */}
</div>
```

**Animated Border Card:**
```tsx
<div className="gradient-border-animated">
  {/* Rotating gradient border */}
</div>
```

### Buttons

**Primary (Gradient):**
```tsx
<Button variant="primary">
  {/* bg-gradient-brand */}
</Button>
```

**Secondary (Outline):**
```tsx
<Button variant="secondary">
  {/* border-electric-indigo */}
</Button>
```

**Ghost:**
```tsx
<Button variant="ghost">
  {/* transparent, hover:bg-surface */}
</Button>
```

### Text Effects

**Gradient Text:**
```tsx
<span className="gradient-text">Highlighted Text</span>
```

### Badges

**Popular/Featured:**
```tsx
<span className="px-4 py-1.5 text-sm font-bold bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white rounded-full">
  MOST POPULAR
</span>
```

### Trust Indicators
```tsx
import { TrustBar, TrustBarCompact } from '@/components/ui'

// Full version (after hero)
<TrustBar />

// Compact version (inline)
<TrustBarCompact />
```

---

## CSS Utilities

### Layout
```css
.scrollbar-hide       /* Hide scrollbars */
```

### Backgrounds
```css
.bg-deep-space        /* Main background */
.bg-surface           /* Card background */
.bg-gradient-brand    /* Primary gradient */
.bg-grid              /* Grid pattern */
```

### Text
```css
.text-text-primary    /* Primary text color */
.text-text-muted      /* Muted text color */
.gradient-text        /* Gradient text effect */
.font-heading         /* Syne font */
```

### Borders
```css
.border-border-default /* Standard border */
.gradient-border       /* Gradient border */
.gradient-border-glow  /* Gradient + hover glow */
```

### Focus States
```css
.focus-ring           /* Indigo focus ring */
```

---

## Page Structure Template

```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-deep-space bg-grid bg-grid-animated relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb color="indigo" size="xl" position={{ top: '-15%', right: '-10%' }} />
        <GradientOrb color="fuchsia" size="lg" position={{ bottom: '5%', left: '-5%' }} />
        <FloatingStars count={6} />
      </div>

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Gradient mesh */}
      <div className="gradient-mesh" />

      {/* Header */}
      <header className="relative z-10">
        {/* Navigation */}
      </header>

      {/* Main content */}
      <main className="relative z-10">
        {/* Page content */}
      </main>

      {/* Footer */}
      <footer className="relative z-10">
        {/* Footer content */}
      </footer>
    </div>
  )
}
```

---

## File References

| File | Description |
|------|-------------|
| `src/app/globals.css` | All CSS variables, utilities, animations |
| `src/app/layout.tsx` | Font imports (Syne, DM Sans) |
| `src/components/ui/` | Reusable UI components |
| `src/components/ui/background-effects.tsx` | Decorative elements |
| `src/components/ui/gradient-card.tsx` | Card variants |
| `src/components/ui/trust-bar.tsx` | Social proof components |

---

*Last updated: January 2026*
