/**
 * UGCFirst Animation Tokens
 * Physics-based animation curves for the brand aesthetic
 */

export const ANIMATION_TOKENS = {
  // Physics: Snappy & Elastic (for Entrances)
  springBouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8
  },

  // Physics: Smooth & Stable (for UI elements)
  springSmooth: {
    type: "spring" as const,
    stiffness: 120,
    damping: 20
  },

  // Easing: The "Heartbeat" Pulse (for Glows)
  easePulse: [0.4, 0, 0.2, 1] as const,

  // Easing: Cinematic Snap (for Exits/Transitions)
  easeSnappy: [0.2, 0.8, 0.2, 1] as const,

  // Easing: Standard easeOut
  easeOut: [0, 0, 0.2, 1] as const,

  // Easing: Standard easeIn
  easeIn: [0.4, 0, 1, 1] as const,

  // Brand Colors for inline styles
  colors: {
    mint: "#10B981",
    mintDark: "#059669",
    mintLight: "#34D399",
    coral: "#F43F5E",
    success: "#10B981",
    ink: "#0C0A09",
    surface: "#FAFAF9",
    border: "#E7E5E4"
  },

  // Durations
  durations: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    veryFast: 0.1
  }
}

// Type exports
export type AnimationTokens = typeof ANIMATION_TOKENS
