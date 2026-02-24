# Vidnary 404 Page Implementation

## Overview
Implement a custom 404 "Page Not Found" page for the Vidnary Next.js application. The design follows a **film set / clapperboard theme** that ties directly into Vidnary's AI video generation brand. The page should be memorable, funny, and interactive.

## File Location
Create: `src/app/not-found.tsx`

Next.js 14 App Router automatically uses `not-found.tsx` at the app root for 404 errors.

## Design Concept: "TAKE 404 - Scene Gone Wrong"
A chaotic film set where the "scene" (page) didn't make the final cut. Features an animated clapperboard, rotating funny quotes, and falling film-related objects.

---

## Visual Specifications

### Color Palette (Use existing design system + additions)
```typescript
// Existing from design system
--deep-space: #0F172A (or use #0c0a09 for warmer black)
--electric-indigo: #6366F1
--vibrant-fuchsia: #D946EF
--text-primary: #F8FAFC
--text-muted: #94A3B8

// Additional for this page
--amber: #f59e0b (for clapperboard accent)
--amber-dark: #b45309
--red: #ef4444 (for REC indicator)
--surface: #1c1917
```

### Typography
- **Headings:** Use existing Inter font, weight 800
- **Quotes:** Add italic style for the rotating quotes
- **Clapperboard numbers:** 4rem, weight 900, gradient amber

---

## Component Structure

```
src/app/not-found.tsx (main page component)
```

The page should be a single file with all styles included (Tailwind + custom CSS where needed).

---

## Required Elements

### 1. Header
- Vidnary logo (top-left) — use existing Logo component from `@/components/ui/logo`
- REC indicator (top-right): Red blinking dot + "NOT RECORDING" text
- Fixed position, z-index: 100

### 2. Background Effects

#### Film Grain Overlay
- SVG noise texture with very low opacity (0.04)
- Animated position shift for realistic grain effect
- z-index: 1000, pointer-events: none

#### Stage Spotlights
- 3 large blurred circles (600px diameter, blur: 100px)
- Colors: amber, fuchsia, indigo
- Positioned at corners, opacity: 0.15-0.25
- Subtle scale/opacity animation (3-5s loop)

#### Falling Objects
- 6 film-related emojis: 🎬 💡 🎥 🎞️ 🎭 📽️
- Fall from top to bottom with rotation
- Staggered animation delays
- Low opacity (0.6), pointer-events: none

### 3. Clapperboard (Main Visual)

#### Structure
```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Hinged top (black/white diagonal stripes)
├─────────────────────────────┤
│ PRODUCTION    VIDNARY.COM   │
│ DIRECTOR      AI GONE ROGUE │
│ SCENE         PAGE NOT FOUND│
│                             │
│           404               │ ← Large amber gradient text
│         TAKE ∞              │
└─────────────────────────────┘
```

#### Animations
- **Idle:** Subtle clapper snap animation every 3 seconds
- **On Click:** Immediate snap animation + rotate quotes
- Hover: scale(1.02) transform

#### Click Hint
- Below clapperboard: "Click to reshoot" with cursor icon
- Small bouncing animation on the icon

### 4. Message Section

#### Headline
```
The director yelled "CUT!"
on this page
```
- "CUT!" in amber accent color
- Font size: clamp(1.5rem, 5vw, 2rem)

#### Subtext
```
Looks like this scene didn't survive the editing room.
Our AI must have gone completely off-script again.
```
- "completely off-script" in italic fuchsia

### 5. Rotating Director Quotes

A styled blockquote box with left amber border that cycles through funny quotes:

```typescript
const quotes = [
  {
    text: "I asked for a landing page, not a crash landing.",
    author: "The Algorithm"
  },
  {
    text: "In my defense, the URL looked suspicious from the start.",
    author: "The Server"
  },
  {
    text: "404 takes and counting. This page is a method actor.",
    author: "The Database"
  },
  {
    text: "We'll fix it in post... any decade now.",
    author: "The Dev Team"
  },
  {
    text: "The page you seek has been recast. Permanently.",
    author: "HR"
  }
];
```

- Fade in/out animation on quote change
- Auto-rotate every 6 seconds
- Also rotates on clapperboard click

### 6. Action Buttons

Two buttons, centered:

1. **Primary:** "Back to Main Set"
   - Play icon (▶️ triangle)
   - Gradient background (indigo → fuchsia)
   - Links to `/`

2. **Secondary:** "My Projects"  
   - Film frame icon
   - Outline style with surface background
   - Links to `/dashboard`

### 7. Footer
- Fixed bottom center
- `ERR_SCENE_NOT_FOUND` in code tag (indigo background)
- "The show must go on" text
- Low opacity (0.5)

---

## Animations Summary

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| Film grain | Position shift | 0.5s steps | Infinite loop |
| Spotlights | Scale + opacity pulse | 3-5s | Infinite loop |
| Falling objects | Fall + rotate | 8s | Infinite, staggered |
| REC dot | Opacity blink | 1s | Infinite loop |
| Clapper top | Snap motion | 0.5s | Every 3s + on click |
| Click hint icon | Bounce | 1.5s | Infinite loop |
| Quote change | Fade in + translateY | 0.5s | On change |
| Buttons | translateY(-3px) | 0.2s | Hover |

---

## Responsive Behavior

### Mobile (< 600px)
- Clapperboard: 240px width (vs 280px desktop)
- Take number: 3rem (vs 4rem)
- Buttons: Stack vertically, full width
- Header: Smaller padding, hide "NOT RECORDING" text (keep dot)
- Falling objects: Smaller size (1.5rem vs 2rem)

---

## Implementation Notes

### State Management
```typescript
const [currentQuote, setCurrentQuote] = useState(0);

// Auto-rotate quotes
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentQuote((prev) => (prev + 1) % quotes.length);
  }, 6000);
  return () => clearInterval(interval);
}, []);

// Click handler for clapperboard
const handleReshoot = () => {
  setCurrentQuote((prev) => (prev + 1) % quotes.length);
  // Trigger clapper animation via ref or state
};
```

### Framer Motion
Use Framer Motion for:
- Quote fade transitions (AnimatePresence)
- Button hover animations
- Clapperboard snap animation

### Accessibility
- Include `aria-live="polite"` on quote container for screen readers
- Ensure buttons have proper focus states
- Add `role="img"` and `aria-label` to decorative clapperboard

---

## Reference Implementation

The complete HTML/CSS reference is available at:
`/mnt/user-data/outputs/vidnary-404-final-v2.html`

Convert this to React/Next.js with:
- Tailwind CSS for most styling
- CSS modules or inline styles for complex animations
- Framer Motion for interactive animations

---

## Testing Checklist

- [ ] Page renders at `/any-nonexistent-route`
- [ ] Clapperboard click cycles quotes
- [ ] Auto-rotation works (6s interval)
- [ ] All animations run smoothly (60fps)
- [ ] Mobile responsive layout works
- [ ] Navigation buttons work correctly
- [ ] Logo links to home
- [ ] No console errors
- [ ] Accessible with keyboard navigation

---

## Files to Reference

1. **Design system colors:** `tailwind.config.ts`
2. **Logo component:** `src/components/ui/logo.tsx`
3. **Button component:** `src/components/ui/button.tsx` (for consistent styling)
4. **HTML reference:** `/mnt/user-data/outputs/vidnary-404-final-v2.html`