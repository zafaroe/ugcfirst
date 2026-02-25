# UGCFirst Design System

> Light-mode default, mint green + coral accent, warm neutrals. Designed to stand out from every dark-purple competitor in the UGC space.

---

## Color Palette

### Brand Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Mint | `#10B981` | `bg-mint` / `text-mint` | Primary CTAs, links, active states |
| Mint Dark | `#059669` | `bg-mint-dark` | Hover states, pressed buttons, CTA gradient end |
| Mint Light | `#34D399` | `bg-mint-light` | Highlights, dark mode accents |
| Coral | `#F43F5E` | `bg-coral` / `text-coral` | Urgency CTAs, errors, destructive actions |
| Coral Light | `#FB7185` | `bg-coral-light` | Hover on coral elements |

### Backgrounds
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Surface | `#FAFAF9` | `bg-surface` | Default page background (stone-50) |
| Surface Raised | `#FFFFFF` | `bg-surface-raised` | Cards, modals, elevated elements |
| Cream | `#FFF7ED` | `bg-cream` | Warm section backgrounds, auth pages |
| Cream Warm | `#FFFBEB` | `bg-cream-warm` | Featured/highlighted areas |

### Text Colors
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Ink | `#0C0A09` | `text-ink` | Primary text (warm black, not cold) |
| Ink Soft | `#1C1917` | `text-ink-soft` | Slightly softer headings |
| Ink Muted | `#78716C` | `text-ink-muted` / `text-text-muted` | Body text, descriptions |
| Ink Faint | `#A8A29E` | `text-ink-faint` / `text-text-disabled` | Disabled, placeholder text |

### Borders
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Border Default | `#E7E5E4` | `border-border-default` | Card borders, dividers (stone-300) |
| Border Subtle | `#F5F5F4` | `border-border-subtle` | Very light separators (stone-100) |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Success | `#10B981` | Success states (same as mint) |
| Warning | `#F59E0B` | Warning states |
| Error | `#EF4444` | Error states |

---

## Typography

### Fonts
- **Headings**: Outfit (600, 700, 800) — Geometric, bold, modern
- **Body**: Satoshi (400, 500) — Clean, warm, readable (self-hosted from Fontshare)

### Heading Styles
All headings use `font-heading` (Outfit), `font-weight: 700`, `letter-spacing: -0.02em`.

---

## Gradients

| Name | CSS | Usage |
|------|-----|-------|
| CTA Gradient | `linear-gradient(135deg, #10B981, #059669)` | Primary buttons, CTAs |
| CTA Hover | `linear-gradient(135deg, #34D399, #10B981)` | Button hover state |
| Brand Text | `.gradient-text` | Gradient text from mint to mint-dark |
| Feature Gradient | `linear-gradient(135deg, #10B981, #34D399, #FFF7ED)` | Feature highlights |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-glow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Subtle card shadow |
| `shadow-glow` | `0 4px 14px rgba(16,185,129,0.15)` | Default mint glow |
| `shadow-glow-lg` | `0 10px 30px rgba(16,185,129,0.2)` | Large mint glow |
| `shadow-elevated` | `0 25px 50px -12px rgba(0,0,0,0.12)` | Elevated elements |

---

## Background Effects

### Adapted (from cosmic → warm)
- **Grid**: Subtle mint dot pattern at 3% opacity
- **Gradient Mesh**: Floating mint + coral radial gradients (very subtle)
- **Spotlight**: Mint-tinted radial at 5% opacity at top of page

### Removed
- Noise overlay, vignette, star decorations, animated grid lines

---

## Component Patterns

### Buttons
```
Primary:     from-mint to-mint-dark text-white (CTA gradient with mint shadow)
Secondary:   border-mint text-ink hover:bg-mint/10
Destructive: bg-status-error text-white
Ghost:       text-ink-muted hover:text-text-primary hover:bg-surface-raised
```

### Cards
- Background: `bg-surface-raised` (white)
- Border: `border-border-default`
- Hover lift: `translateY(-4px)` with warm shadow
- Gradient border: mint gradient via `gradient-border-glow`

### Logo
- Text wordmark: "UGC" in ink, "First" in mint
- Font: Outfit, weight 800
- No icon — the name IS the brand

---

## Dark Mode

Dark mode available via `.dark` class on `<html>`. Key overrides:
- Surface: `#1C1917`
- Surface Raised: `#292524`
- Text Primary: `#F8FAFC`
- Text Muted: `#A8A29E`
- Borders: `#44403C`
- Body background: `#0C0A09`

---

## File References

| File | Purpose |
|------|---------|
| `src/app/globals.css` | All design tokens (@theme), CSS effects, dark mode overrides |
| `src/app/layout.tsx` | Font loading (Outfit + Satoshi), root metadata |
| `src/fonts/` | Self-hosted Satoshi WOFF2 files |
| `src/lib/animation-tokens.ts` | Framer Motion animation constants and brand colors |
| `src/components/ui/motion.tsx` | Motion presets, spring configs, hover effects |
| `src/components/ui/background-effects.tsx` | GridBackground, GradientOrb, SparkleBurst, WaveDecoration |
| `src/components/ui/logo.tsx` | UGCFirst wordmark component |
| `src/components/ui/button.tsx` | Button variants with CTA gradient |
| `ugcfirstbrandguide.html` | Full brand identity guide with competitive analysis |
