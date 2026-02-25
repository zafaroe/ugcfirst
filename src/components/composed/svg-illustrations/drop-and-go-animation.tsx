'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/*
 * Drop & Go Animation — Dark Mode, Cinematic 5-Act Loop
 *
 * Acts:
 * 1. DROP    — URL pastes into input field
 * 2. SCAN    — AI extracts product info
 * 3. SCRIPT  — Script auto-generates line by line
 * 4. RENDER  — Video assembles in phone preview
 * 5. READY   — Final video + metrics + export
 */

const ACTS = ['drop', 'scan', 'script', 'render', 'ready'] as const
type Act = typeof ACTS[number]

const ACT_DURATIONS: Record<Act, number> = {
  drop: 2400,
  scan: 3000,
  script: 2800,
  render: 3200,
  ready: 3400,
}
const TOTAL = Object.values(ACT_DURATIONS).reduce((a, b) => a + b, 0)

// Dark palette
const C = {
  bg: '#0C0A09',
  surface: '#1C1917',
  raised: '#292524',
  border: '#44403C',
  borderSubtle: '#292524',
  textPrimary: '#F8FAFC',
  textMuted: '#A8A29E',
  textFaint: '#57534E',
  mint: '#10B981',
  mintDark: '#059669',
  mintGlow: 'rgba(16, 185, 129, 0.15)',
  mintGlowStrong: 'rgba(16, 185, 129, 0.3)',
  coral: '#F43F5E',
  coralGlow: 'rgba(244, 63, 94, 0.15)',
  coralGlowStrong: 'rgba(244, 63, 94, 0.25)',
  amber: '#FBBF24',
  amberGlow: 'rgba(251, 191, 36, 0.12)',
}

// Product URL that types in
const PRODUCT_URL = 'shopify.com/glow-serum'

// Extracted product info
const productInfo = {
  name: 'Glow Serum',
  price: '$34.99',
  features: ['Vitamin C', 'Hydrating'],
}

// Auto-generated script lines
const scriptLines = [
  { label: 'HOOK', color: C.coral, text: 'Your skin deserves better' },
  { label: 'STORY', color: C.amber, text: 'Dull skin no matter what' },
  { label: 'CTA', color: C.mint, text: 'Link in bio — try it today' },
]

// Caption words
const captionWords = ['Your', 'skin', 'deserves', 'better']

// Metrics
const metrics = [
  { icon: '▶', value: '31.2K' },
  { icon: '♥', value: '4.7K' },
]

function usePhaseTimer(enabled: boolean) {
  const [act, setAct] = useState<Act>('drop')
  const [actProgress, setActProgress] = useState(0)
  const startRef = useRef(Date.now())
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setAct('drop')
      setActProgress(0)
      return
    }

    const tick = () => {
      const now = Date.now()
      const total = now - startRef.current
      const cyclePos = total % TOTAL

      let accumulated = 0
      for (const a of ACTS) {
        if (cyclePos < accumulated + ACT_DURATIONS[a]) {
          setAct(a)
          setActProgress((cyclePos - accumulated) / ACT_DURATIONS[a])
          break
        }
        accumulated += ACT_DURATIONS[a]
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [enabled])

  return { act, actProgress }
}

// Typing text component
function TypedText({ text, progress }: { text: string; progress: number }) {
  const chars = Math.floor(text.length * Math.min(progress, 1))
  return (
    <span style={{ color: C.textMuted, fontSize: 6, fontFamily: 'monospace' }}>
      <span>{text.slice(0, chars)}</span>
      {progress > 0 && progress < 1 && (
        <span
          style={{
            display: 'inline-block',
            width: 1,
            height: '0.9em',
            background: C.coral,
            marginLeft: 1,
            animation: 'cursorBlink 0.6s step-end infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  )
}

// Scanning line animation
function ScanLine({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${C.coral}, transparent)`,
        animation: 'scanMove 1.2s ease-in-out infinite',
        boxShadow: `0 0 6px ${C.coralGlowStrong}`,
        zIndex: 5,
      }}
    />
  )
}

interface DropAndGoAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

export function DropAndGoAnimation({ size = 'lg', animated = true, className }: DropAndGoAnimationProps) {
  const { width, height } = sizes[size]
  const { act, actProgress: p } = usePhaseTimer(animated)

  const isAct = (a: Act) => act === a
  const pastAct = (a: Act) => ACTS.indexOf(act) > ACTS.indexOf(a)
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)

  return (
    <div className={cn('relative', className)} style={{ width, height }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
          boxShadow: `0 0 0 1px ${C.borderSubtle}, 0 10px 30px -6px rgba(0,0,0,0.4)`,
          fontFamily: "'Outfit', 'SF Pro Display', -apple-system, sans-serif",
        }}
      >
        {/* Ambient glow — coral-tinted */}
        <div
          style={{
            position: 'absolute',
            width: 90,
            height: 90,
            borderRadius: '50%',
            filter: 'blur(35px)',
            opacity: 0.35,
            transition: 'all 1s ease',
            background: isAct('drop')
              ? C.coralGlow
              : isAct('scan')
              ? C.coralGlowStrong
              : isAct('script')
              ? C.amberGlow
              : isAct('render')
              ? C.mintGlow
              : C.mintGlowStrong,
            left: isAct('scan') ? '30%' : isAct('ready') ? '60%' : '50%',
            top: isAct('drop') ? '20%' : isAct('render') ? '60%' : '40%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            opacity: 0.25,
            pointerEvents: 'none',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            height: 18,
            background: C.raised,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            gap: 4,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F43F5E', opacity: 0.7 }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#FBBF24', opacity: 0.7 }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', opacity: 0.7 }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 6, fontWeight: 600, color: C.textFaint, letterSpacing: '0.04em' }}>
              DROP & GO
            </span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {ACTS.map((a, i) => (
              <div
                key={a}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: ACTS.indexOf(act) >= i ? C.coral : C.border,
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ position: 'relative', height: 'calc(100% - 18px)' }}>

          {/* ===== ACT 1: DROP — URL Input ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              gap: 10,
              opacity: isAct('drop') ? 1 : 0,
              visibility: isAct('drop') ? 'visible' : 'hidden',
              transition: isAct('drop')
                ? 'opacity 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('drop') ? 5 : 1,
            }}
          >
            {/* Link icon */}
            <div
              style={{
                opacity: ease(p / 0.3),
                transform: `translateY(${(1 - ease(p / 0.3)) * -15}px)`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${C.coral}, #FB7185)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${C.coralGlowStrong}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Instruction */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 7, fontWeight: 600, color: C.textPrimary }}>
                Paste product URL
              </div>
              <div style={{ fontSize: 5, color: C.textFaint }}>AI handles the rest</div>
            </div>

            {/* Input field */}
            <div
              style={{
                width: '100%',
                maxWidth: 140,
                height: 22,
                borderRadius: 6,
                background: C.raised,
                border: `1px solid ${p > 0.3 ? C.coral + '60' : C.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                gap: 5,
                boxShadow: p > 0.3 ? `0 0 8px ${C.coralGlow}` : 'none',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={C.textFaint} strokeWidth="2" strokeLinecap="round" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={C.textFaint} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <TypedText text={PRODUCT_URL} progress={Math.max(0, (p - 0.25) / 0.55)} />
            </div>

            {/* Go button */}
            {p > 0.82 && (
              <div
                style={{
                  padding: '4px 14px',
                  borderRadius: 5,
                  background: `linear-gradient(135deg, ${C.coral}, #FB7185)`,
                  fontSize: 6,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '0.03em',
                  boxShadow: `0 2px 8px ${C.coralGlowStrong}`,
                  animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                ✦ GENERATE
              </div>
            )}
          </div>

          {/* ===== ACT 2: SCAN — Product Extraction ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: 10,
              display: 'flex',
              gap: 8,
              opacity: isAct('scan') ? 1 : 0,
              visibility: isAct('scan') ? 'visible' : 'hidden',
              transition: isAct('scan')
                ? 'opacity 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('scan') ? 5 : 1,
            }}
          >
            {/* Left: Product mockup */}
            <div
              style={{
                width: 70,
                height: '100%',
                borderRadius: 6,
                background: C.raised,
                border: `1px solid ${C.border}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Browser bar */}
              <div
                style={{
                  height: 12,
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                  gap: 2,
                }}
              >
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.coral, opacity: 0.5 }} />
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.amber, opacity: 0.5 }} />
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.mint, opacity: 0.5 }} />
              </div>

              {/* Product content */}
              <div style={{ padding: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    height: 40,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${C.coral}15, ${C.amber}10)`,
                    border: `1px solid ${C.coral}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  ✦
                </div>
                <div style={{ width: '80%', height: 4, borderRadius: 2, background: C.border }} />
                <div style={{ width: '50%', height: 3, borderRadius: 2, background: C.borderSubtle }} />
                <div style={{ width: '35%', height: 5, borderRadius: 2, background: `${C.mint}20`, marginTop: 2 }} />
              </div>

              <ScanLine active={isAct('scan') && p < 0.6} />
            </div>

            {/* Right: Extracted data */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 5, fontWeight: 600, color: C.textFaint, letterSpacing: '0.05em' }}>
                EXTRACTING...
              </div>

              {/* Name */}
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: 4,
                  background: C.raised,
                  border: `1px solid ${p > 0.2 ? C.coral + '30' : C.border}`,
                  opacity: ease(Math.max(0, (p - 0.15) / 0.2)),
                  transform: `translateX(${(1 - ease(Math.max(0, (p - 0.15) / 0.2))) * 8}px)`,
                }}
              >
                <div style={{ fontSize: 4, color: C.textFaint, fontWeight: 600 }}>NAME</div>
                <div style={{ fontSize: 7, fontWeight: 700, color: C.textPrimary }}>{productInfo.name}</div>
              </div>

              {/* Price */}
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: 4,
                  background: C.raised,
                  border: `1px solid ${p > 0.35 ? C.mint + '30' : C.border}`,
                  opacity: ease(Math.max(0, (p - 0.3) / 0.2)),
                  transform: `translateX(${(1 - ease(Math.max(0, (p - 0.3) / 0.2))) * 8}px)`,
                }}
              >
                <div style={{ fontSize: 4, color: C.textFaint, fontWeight: 600 }}>PRICE</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: C.mint }}>{productInfo.price}</div>
              </div>

              {/* Features */}
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: 4,
                  background: C.raised,
                  border: `1px solid ${p > 0.5 ? C.amber + '30' : C.border}`,
                  opacity: ease(Math.max(0, (p - 0.45) / 0.2)),
                  transform: `translateX(${(1 - ease(Math.max(0, (p - 0.45) / 0.2))) * 8}px)`,
                }}
              >
                <div style={{ fontSize: 4, color: C.textFaint, fontWeight: 600 }}>FEATURES</div>
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
                  {productInfo.features.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 5,
                        padding: '1px 4px',
                        borderRadius: 2,
                        background: `${C.amber}15`,
                        color: C.amber,
                        fontWeight: 600,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Done */}
              {p > 0.85 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 'auto', animation: 'fadeSlideUp 0.3s ease' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.mint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 5, fontWeight: 600, color: C.mint }}>Done</span>
                </div>
              )}
            </div>
          </div>

          {/* ===== ACT 3: SCRIPT — Auto-generation ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              opacity: isAct('script') ? 1 : 0,
              visibility: isAct('script') ? 'visible' : 'hidden',
              transition: isAct('script')
                ? 'opacity 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('script') ? 5 : 1,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${C.coral}, ${C.amber})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 5,
                }}
              >
                ✦
              </div>
              <span style={{ fontSize: 5, fontWeight: 600, color: C.textMuted, letterSpacing: '0.04em' }}>
                AI WRITING
              </span>
              <div style={{ flex: 1 }} />
              {p < 0.85 && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: `1px solid ${C.border}`,
                    borderTopColor: C.coral,
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
              {p >= 0.85 && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.mint, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'scaleIn 0.3s ease' }}>
                  <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Script lines */}
            {scriptLines.map((line, i) => {
              const lineStart = i * 0.28
              const lineP = Math.max(0, (p - lineStart) / 0.3)
              const isTyping = lineP > 0 && lineP < 1

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'flex-start',
                    opacity: lineP > 0 ? 1 : 0.2,
                    transform: `translateY(${lineP > 0 ? 0 : 4}px)`,
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }}
                >
                  <div style={{ width: 26, flexShrink: 0, paddingTop: 2 }}>
                    <div
                      style={{
                        fontSize: 4,
                        fontWeight: 700,
                        color: line.color,
                        background: `${line.color}15`,
                        border: `1px solid ${line.color}25`,
                        borderRadius: 3,
                        padding: '1px 3px',
                        textAlign: 'center',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {line.label}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      borderRadius: 4,
                      background: isTyping ? `${line.color}08` : C.raised,
                      border: `1px solid ${isTyping ? line.color + '35' : C.border}`,
                      minHeight: 20,
                      boxShadow: isTyping ? `0 0 6px ${line.color}10` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 6, color: C.textPrimary, lineHeight: 1.4 }}>
                      {line.text.slice(0, Math.floor(line.text.length * Math.min(lineP, 1)))}
                      {isTyping && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 1,
                            height: '0.8em',
                            background: line.color,
                            marginLeft: 1,
                            animation: 'cursorBlink 0.6s step-end infinite',
                            verticalAlign: 'text-bottom',
                          }}
                        />
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ===== ACT 4: RENDER — Video Assembly ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 8,
              opacity: isAct('render') ? 1 : 0,
              visibility: isAct('render') ? 'visible' : 'hidden',
              transition: isAct('render')
                ? 'opacity 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('render') ? 5 : 1,
            }}
          >
            {/* Phone preview */}
            <div
              style={{
                width: 55,
                height: 95,
                borderRadius: 8,
                background: C.bg,
                border: `1px solid ${C.border}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* Notch */}
              <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', width: 18, height: 3, borderRadius: 2, background: C.border, zIndex: 10 }} />

              {/* Scenes */}
              {[
                { y: '0%', h: '35%', gradient: `linear-gradient(180deg, ${C.coral}18, ${C.coral}06)`, delay: 0 },
                { y: '35%', h: '38%', gradient: `linear-gradient(180deg, ${C.amber}12, ${C.amber}05)`, delay: 0.2 },
                { y: '73%', h: '27%', gradient: `linear-gradient(180deg, ${C.mint}15, ${C.mint}06)`, delay: 0.35 },
              ].map((scene, i) => {
                const sp = ease(Math.max(0, (p - scene.delay) / 0.3))
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: scene.y,
                      left: 0,
                      right: 0,
                      height: scene.h,
                      background: scene.gradient,
                      opacity: sp,
                      transform: `translateX(${(1 - sp) * 25}px)`,
                      borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
                    }}
                  />
                )
              })}

              {/* Avatar */}
              {p > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 15,
                    left: 5,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E8B4B8, #E8B4B888)',
                    border: `1px solid ${C.coral}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 5,
                    fontWeight: 700,
                    color: C.bg,
                    animation: 'scaleIn 0.3s ease',
                  }}
                >
                  SF
                </div>
              )}

              {/* Progress */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: C.raised }}>
                <div style={{ width: `${p * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.coral}, ${C.mint})`, borderRadius: 1 }} />
              </div>
            </div>

            {/* Pipeline steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 65 }}>
              <span style={{ fontSize: 5, fontWeight: 600, color: C.textFaint, letterSpacing: '0.05em' }}>PIPELINE</span>
              {[
                { label: 'Frames', at: 0 },
                { label: 'Voice', at: 0.25 },
                { label: 'Cuts', at: 0.5 },
                { label: 'Captions', at: 0.7 },
                { label: 'Render', at: 0.85 },
              ].map((step, i) => {
                const isDone = p > step.at + 0.2
                const isActive = p >= step.at && !isDone
                const sp = ease(Math.max(0, (p - step.at) / 0.15))

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 5px',
                      borderRadius: 4,
                      background: isActive ? `${C.coral}10` : C.raised,
                      border: `1px solid ${isActive ? C.coral + '30' : C.border}`,
                      opacity: sp,
                      transform: `translateX(${(1 - sp) * 6}px)`,
                    }}
                  >
                    <span style={{ fontSize: 5, color: isActive ? C.textPrimary : C.textMuted, flex: 1 }}>{step.label}</span>
                    {isDone && (
                      <svg width="6" height="6" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke={C.mint} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {isActive && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', border: `1px solid ${C.border}`, borderTopColor: C.coral, animation: 'spin 0.6s linear infinite' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== ACT 5: READY — Final Video ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 8,
              opacity: isAct('ready') ? 1 : 0,
              visibility: isAct('ready') ? 'visible' : 'hidden',
              transition: isAct('ready')
                ? 'opacity 0.4s ease, visibility 0s linear 0s'
                : 'opacity 0.4s ease, visibility 0s linear 0.4s',
              pointerEvents: 'none',
              zIndex: isAct('ready') ? 5 : 1,
            }}
          >
            {/* Final phone */}
            <div
              style={{
                width: 55,
                height: 95,
                borderRadius: 8,
                background: C.bg,
                border: `1px solid ${p > 0.3 ? C.mint : C.border}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: p > 0.3
                  ? `0 0 15px ${C.mintGlowStrong}, 0 6px 20px rgba(0,0,0,0.3)`
                  : '0 6px 20px rgba(0,0,0,0.3)',
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              {/* Gradient bg */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(180deg, ${C.coral}10 0%, ${C.amber}08 50%, ${C.mint}10 100%)`,
                }}
              />

              {/* Avatar */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E8B4B8, #E8B4B888)',
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 5,
                  fontWeight: 700,
                  color: C.bg,
                }}
              >
                SF
              </div>

              {/* Checkmark */}
              {p > 0.2 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: C.mint,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 1px 4px ${C.mintGlowStrong}`,
                    animation: 'scaleIn 0.3s ease',
                  }}
                >
                  <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Captions */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: 4,
                  right: 4,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  justifyContent: 'center',
                }}
              >
                {captionWords.map((word, i) => {
                  const wordP = Math.max(0, (p * 0.5 - i * 0.06) / 0.06)
                  const isHighlighted = wordP > 0 && wordP < 2
                  const isRevealed = wordP >= 1

                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 5,
                        fontWeight: 800,
                        color: isHighlighted && !isRevealed ? C.bg : isRevealed ? C.textPrimary : 'transparent',
                        background: isHighlighted && !isRevealed ? C.coral : 'transparent',
                        padding: '0px 2px',
                        borderRadius: 1,
                        transition: 'all 0.1s ease',
                        textTransform: 'uppercase',
                      }}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Metrics + Export */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 50 }}>
              {/* Product */}
              {p > 0.15 && (
                <div
                  style={{
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: C.raised,
                    border: `1px solid ${C.border}`,
                    animation: 'fadeSlideUp 0.3s ease',
                  }}
                >
                  <div style={{ fontSize: 4, color: C.textFaint, fontWeight: 600 }}>VIDEO FOR</div>
                  <div style={{ fontSize: 6, fontWeight: 700, color: C.textPrimary, marginTop: 1 }}>{productInfo.name}</div>
                  <div style={{ fontSize: 5, color: C.mint }}>{productInfo.price}</div>
                </div>
              )}

              {/* Metrics */}
              {p > 0.4 && metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: C.raised,
                    border: `1px solid ${C.border}`,
                    animation: `fadeSlideUp 0.3s ease ${i * 0.1}s both`,
                  }}
                >
                  <span style={{ fontSize: 8 }}>{m.icon}</span>
                  <span style={{ fontSize: 7, fontWeight: 700, color: C.textPrimary }}>{m.value}</span>
                </div>
              ))}

              {/* Export */}
              {p > 0.7 && (
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${C.coral}, #FB7185)`,
                    textAlign: 'center',
                    fontSize: 5,
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: `0 2px 8px ${C.coralGlowStrong}`,
                    animation: 'fadeSlideUp 0.3s ease both',
                  }}
                >
                  ↓ EXPORT
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom progress bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: C.border,
          }}
        >
          <div
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${C.coral}, ${C.mint})`,
              width: `${(ACTS.indexOf(act) / ACTS.length + p / ACTS.length) * 100}%`,
              borderRadius: '0 1px 1px 0',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanMove {
          0% { top: 12px; }
          50% { top: calc(100% - 1px); }
          100% { top: 12px; }
        }
      `}</style>
    </div>
  )
}
