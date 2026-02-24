/**
 * High-Voltage Animation Tokens
 * Physics-based animation curves for the "Deep Space" aesthetic
 */

export const ANIMATION_TOKENS = {
  // Physics: Snappy & Elastic (for Entrances)
  // Use for: Modals, Popups, Icon appearances
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
  // Sharp attack, slow decay.
  easePulse: [0.4, 0, 0.2, 1] as const,

  // Easing: Cinematic Snap (for Exits/Transitions)
  // Fast acceleration, sudden stop.
  easeSnappy: [0.2, 0.8, 0.2, 1] as const,

  // Easing: Standard easeOut
  easeOut: [0, 0, 0.2, 1] as const,

  // Easing: Standard easeIn
  easeIn: [0.4, 0, 1, 1] as const,

  // Brand Colors for inline styles
  colors: {
    indigo: "#6366F1",
    fuchsia: "#D946EF",
    success: "#10B981",
    white: "#F8FAFC",
    slate700: "#334155",
    slate800: "#1E293B"
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
