'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/*
 * Studio Animation — Dark Mode, Cinematic 5-Act Loop
 *
 * Acts:
 * 1. SELECT   — Template cards fan, one chosen
 * 2. WRITE    — Script types out with section markers
 * 3. CAST     — Avatar thumbnails, one selected with ring
 * 4. COMPOSE  — Scenes stack in phone preview, frames assemble
 * 5. DELIVER  — Captions burn in, render bar, metrics float up
 */

const ACTS = ['select', 'write', 'cast', 'compose', 'deliver'] as const
type Act = typeof ACTS[number]

const ACT_DURATIONS: Record<Act, number> = {
  select: 2800,
  write: 3200,
  cast: 2400,
  compose: 3000,
  deliver: 3400,
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
  amber: '#FBBF24',
  amberGlow: 'rgba(251, 191, 36, 0.12)',
}

// Template cards data
const templates = [
  { name: 'PAS', color: C.mint, sections: 5 },
  { name: 'Unbox', color: C.coral, sections: 4 },
  { name: 'Review', color: C.amber, sections: 5 },
]

// Script lines data
const scriptLines = [
  { section: 'Hook', color: C.coral, text: 'Stop scrolling — this changes everything' },
  { section: 'Story', color: C.mint, text: 'I was skeptical too, until I tried it' },
  { section: 'CTA', color: C.amber, text: 'Link in bio — 40% off ends tonight' },
]

// Avatar data
const avatars = [
  { name: 'Sofia', tone: '#E8B4B8', initials: 'SF' },
  { name: 'Marcus', tone: '#C4A882', initials: 'MK' },
  { name: 'Aisha', tone: '#D4A574', initials: 'AS' },
  { name: 'Jake', tone: '#E0C4A8', initials: 'JK' },
]

// Caption words for Hormozi-style burn
const captionWords = ['Stop', 'scrolling', '—', 'this', 'changes', 'everything']

// Metrics
const metrics = [
  { icon: '▶', value: '24.1K', label: 'views' },
  { icon: '♥', value: '3.2K', label: 'likes' },
  { icon: '↗', value: '847', label: 'shares' },
]

function usePhaseTimer(enabled: boolean) {
  const [act, setAct] = useState<Act>('select')
  const [actProgress, setActProgress] = useState(0)
  const startRef = useRef(Date.now())
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setAct('select')
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
function TypedText({ text, progress, color }: { text: string; progress: number; color: string }) {
  const chars = Math.floor(text.length * Math.min(progress, 1))
  return (
    <span style={{ color: C.textPrimary, fontSize: 7, lineHeight: 1.3 }}>
      <span>{text.slice(0, chars)}</span>
      {progress < 1 && progress > 0 && (
        <span
          style={{
            display: 'inline-block',
            width: 1,
            height: '0.8em',
            background: color,
            marginLeft: 1,
            animation: 'cursorBlink 0.6s step-end infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  )
}

interface StudioAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

export function StudioAnimation({ size = 'lg', animated = true, className }: StudioAnimationProps) {
  const { width, height } = sizes[size]
  const { act, actProgress } = usePhaseTimer(animated)

  const isAct = (a: Act) => act === a
  const pastAct = (a: Act) => ACTS.indexOf(act) > ACTS.indexOf(a)

  // Smooth eased progress helper
  const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)
  const p = actProgress

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
        {/* Ambient glow — shifts color per act */}
        <div
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            filter: 'blur(30px)',
            opacity: 0.4,
            transition: 'all 1s ease',
            background: isAct('select')
              ? C.mintGlow
              : isAct('write')
              ? C.coralGlow
              : isAct('cast')
              ? C.amberGlow
              : isAct('compose')
              ? C.mintGlow
              : C.mintGlowStrong,
            left: isAct('write') ? '60%' : isAct('cast') ? '20%' : '50%',
            top: isAct('compose') ? '60%' : '30%',
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
            opacity: 0.3,
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
              STUDIO
            </span>
          </div>
          {/* Act indicator dots */}
          <div style={{ display: 'flex', gap: 2 }}>
            {ACTS.map((a, i) => (
              <div
                key={a}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: ACTS.indexOf(act) >= i ? C.mint : C.border,
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ position: 'relative', height: 'calc(100% - 18px)' }}>

          {/* ===== ACT 1: SELECT — Template Cards ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 10,
              opacity: isAct('select') ? 1 : 0,
              visibility: isAct('select') ? 'visible' : 'hidden',
              transform: pastAct('select') ? 'scale(0.9) translateY(-10px)' : 'none',
              transition: isAct('select')
                ? 'opacity 0.4s ease, transform 0.4s ease, visibility 0s linear 0s'
                : 'opacity 0.4s ease, transform 0.4s ease, visibility 0s linear 0.4s',
              pointerEvents: 'none',
              zIndex: isAct('select') ? 5 : 1,
            }}
          >
            {templates.map((tpl, i) => {
              const isChosen = i === 0
              const fanAngle = (i - 1) * 6
              const isSelecting = p > 0.5
              const cardScale = isSelecting && isChosen ? 1.08 : isSelecting && !isChosen ? 0.92 : 1
              const cardOpacity = isSelecting && !isChosen ? 0.4 : 1
              const cardRotate = isSelecting ? 0 : fanAngle
              const cardY = isSelecting && isChosen ? -4 : isSelecting ? 6 : 0
              const entryDelay = i * 0.12
              const entryProgress = ease(Math.max(0, (p - entryDelay) / 0.4))

              return (
                <div
                  key={i}
                  style={{
                    width: 45,
                    height: 65,
                    borderRadius: 6,
                    background: C.raised,
                    border: `1px solid ${isSelecting && isChosen ? tpl.color : C.border}`,
                    boxShadow: isSelecting && isChosen
                      ? `0 0 10px ${tpl.color}30, 0 4px 16px rgba(0,0,0,0.3)`
                      : '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 5,
                    gap: 4,
                    transform: `
                      translateY(${entryProgress < 1 ? 15 * (1 - entryProgress) : cardY}px)
                      rotate(${cardRotate}deg)
                      scale(${entryProgress < 1 ? 0.8 + 0.2 * entryProgress : cardScale})
                    `,
                    opacity: entryProgress < 1 ? entryProgress : cardOpacity,
                    transition: entryProgress >= 1 ? 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                    position: 'relative',
                  }}
                >
                  {/* Template color bar */}
                  <div
                    style={{
                      height: 2,
                      borderRadius: 1,
                      background: tpl.color,
                      opacity: 0.6,
                    }}
                  />
                  {/* Section lines */}
                  {Array.from({ length: Math.min(tpl.sections, 4) }).map((_, j) => (
                    <div
                      key={j}
                      style={{
                        height: 5,
                        borderRadius: 2,
                        background: `${tpl.color}15`,
                        border: `1px solid ${tpl.color}20`,
                      }}
                    />
                  ))}
                  {/* Label */}
                  <div
                    style={{
                      marginTop: 'auto',
                      fontSize: 5,
                      fontWeight: 700,
                      color: tpl.color,
                      textAlign: 'center',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {tpl.name}
                  </div>
                  {/* Selection checkmark */}
                  {isSelecting && isChosen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: tpl.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 1px 4px ${tpl.color}50`,
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ===== ACT 2: WRITE — Script Editor ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              opacity: isAct('write') ? 1 : 0,
              visibility: isAct('write') ? 'visible' : 'hidden',
              transform: isAct('write') ? 'translateY(0)' : pastAct('write') ? 'translateY(-15px)' : 'translateY(15px)',
              transition: isAct('write')
                ? 'opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('write') ? 5 : 1,
            }}
          >
            {/* Editor header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.coral }} />
              <span style={{ fontSize: 5, fontWeight: 600, color: C.textMuted, letterSpacing: '0.04em' }}>
                SCRIPT
              </span>
            </div>

            {/* Script lines */}
            {scriptLines.map((line, i) => {
              const lineStart = i * 0.3
              const lineProgress = Math.max(0, (p - lineStart) / 0.35)

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'flex-start',
                    opacity: lineProgress > 0 ? 1 : 0.3,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {/* Section marker */}
                  <div style={{ width: 24, flexShrink: 0, paddingTop: 1 }}>
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
                      {line.section.toUpperCase()}
                    </div>
                  </div>
                  {/* Text area */}
                  <div
                    style={{
                      flex: 1,
                      background: C.raised,
                      borderRadius: 4,
                      border: `1px solid ${lineProgress > 0 && lineProgress < 1 ? line.color + '40' : C.border}`,
                      padding: '4px 5px',
                      minHeight: 20,
                      transition: 'border-color 0.3s ease',
                      boxShadow: lineProgress > 0 && lineProgress < 1 ? `0 0 6px ${line.color}15` : 'none',
                    }}
                  >
                    <TypedText
                      text={line.text}
                      progress={isAct('write') ? lineProgress : pastAct('write') ? 1 : 0}
                      color={line.color}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* ===== ACT 3: CAST — Avatar Selection ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isAct('cast') ? 1 : 0,
              visibility: isAct('cast') ? 'visible' : 'hidden',
              transform: isAct('cast') ? 'scale(1)' : pastAct('cast') ? 'scale(0.9)' : 'scale(1.05)',
              transition: isAct('cast')
                ? 'opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, transform 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('cast') ? 5 : 1,
            }}
          >
            <span style={{ fontSize: 5, fontWeight: 600, color: C.textMuted, letterSpacing: '0.04em' }}>
              CHOOSE AVATAR
            </span>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {avatars.map((av, i) => {
                const isChosen = i === 2
                const entryP = ease(Math.max(0, (p - i * 0.08) / 0.3))
                const isSelecting = p > 0.55

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      opacity: entryP * (isSelecting && !isChosen ? 0.35 : 1),
                      transform: `
                        translateY(${(1 - entryP) * 10}px)
                        scale(${isSelecting && isChosen ? 1.12 : isSelecting ? 0.9 : 1})
                      `,
                      transition: entryP >= 1 ? 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                    }}
                  >
                    {/* Avatar circle */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${av.tone}, ${av.tone}88)`,
                        border: isSelecting && isChosen ? `1.5px solid ${C.mint}` : `1px solid ${C.border}`,
                        boxShadow: isSelecting && isChosen
                          ? `0 0 0 2px ${C.mintGlow}, 0 0 10px ${C.mintGlowStrong}`
                          : '0 2px 6px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: '#1C1917',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                      }}
                    >
                      {av.initials}
                      {/* Selection ring pulse */}
                      {isSelecting && isChosen && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            border: `1px solid ${C.mint}`,
                            opacity: 0,
                            animation: 'ringPulse 1s ease-out infinite',
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 5,
                        fontWeight: 600,
                        color: isSelecting && isChosen ? C.mint : C.textMuted,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {av.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== ACT 4: COMPOSE — Video Assembly ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 8,
              opacity: isAct('compose') ? 1 : 0,
              visibility: isAct('compose') ? 'visible' : 'hidden',
              transition: isAct('compose')
                ? 'opacity 0.3s ease, visibility 0s linear 0s'
                : 'opacity 0.3s ease, visibility 0s linear 0.3s',
              pointerEvents: 'none',
              zIndex: isAct('compose') ? 5 : 1,
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
                boxShadow: `0 6px 20px rgba(0,0,0,0.3)`,
              }}
            >
              {/* Notch */}
              <div style={{ position: 'absolute', top: 3, left: '50%', transform: 'translateX(-50%)', width: 18, height: 3, borderRadius: 2, background: C.border, zIndex: 10 }} />

              {/* Scene layers compositing in */}
              {[
                { y: '0%', h: '35%', gradient: `linear-gradient(180deg, ${C.mint}15, ${C.mint}08)`, delay: 0 },
                { y: '35%', h: '40%', gradient: `linear-gradient(180deg, ${C.coral}12, ${C.coral}06)`, delay: 0.2 },
                { y: '75%', h: '25%', gradient: `linear-gradient(180deg, ${C.amber}15, ${C.amber}08)`, delay: 0.4 },
              ].map((scene, i) => {
                const sceneP = ease(Math.max(0, (p - scene.delay) / 0.35))
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
                      opacity: sceneP,
                      transform: `translateX(${(1 - sceneP) * 20}px)`,
                      borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
                    }}
                  />
                )
              })}

              {/* Avatar overlay */}
              {isAct('compose') && p > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 15,
                    left: 5,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, #D4A574, #D4A57488)`,
                    border: `1px solid ${C.mint}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 5,
                    fontWeight: 700,
                    color: C.bg,
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  AS
                </div>
              )}

              {/* Progress shimmer */}
              {isAct('compose') && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: C.raised,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${p * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${C.mint}, ${C.mintDark})`,
                      borderRadius: 1,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Scene list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 60 }}>
              <span style={{ fontSize: 5, fontWeight: 600, color: C.textFaint, letterSpacing: '0.05em' }}>
                SCENES
              </span>
              {['Hook', 'Story', 'CTA'].map((scene, i) => {
                const sp = ease(Math.max(0, (p - i * 0.2) / 0.3))
                const colors = [C.coral, C.mint, C.amber]
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 4px',
                      borderRadius: 4,
                      background: sp > 0.9 ? `${colors[i]}10` : C.raised,
                      border: `1px solid ${sp > 0.9 ? colors[i] + '30' : C.border}`,
                      opacity: sp,
                      transform: `translateX(${(1 - sp) * 8}px)`,
                    }}
                  >
                    <div style={{ width: 10, height: 8, borderRadius: 2, background: `${colors[i]}20`, flexShrink: 0 }} />
                    <span style={{ fontSize: 5, color: C.textMuted }}>{scene}</span>
                    {sp > 0.9 && (
                      <svg width="5" height="5" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto' }}>
                        <path d="M3 7L6 10L11 4" stroke={colors[i]} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== ACT 5: DELIVER — Captions + Metrics ===== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 8,
              opacity: isAct('deliver') ? 1 : 0,
              visibility: isAct('deliver') ? 'visible' : 'hidden',
              transition: isAct('deliver')
                ? 'opacity 0.4s ease, visibility 0s linear 0s'
                : 'opacity 0.4s ease, visibility 0s linear 0.4s',
              pointerEvents: 'none',
              zIndex: isAct('deliver') ? 5 : 1,
            }}
          >
            {/* Final video card */}
            <div
              style={{
                width: 55,
                height: 95,
                borderRadius: 8,
                background: C.bg,
                border: `1px solid ${p > 0.7 ? C.mint : C.border}`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: p > 0.7
                  ? `0 0 15px ${C.mintGlowStrong}, 0 6px 20px rgba(0,0,0,0.3)`
                  : `0 6px 20px rgba(0,0,0,0.3)`,
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              {/* Gradient fill */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(180deg, ${C.mint}08 0%, ${C.coral}06 50%, ${C.amber}08 100%)`,
                }}
              />

              {/* Captions — word-by-word */}
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
                  const wordP = Math.max(0, (p * 0.6 - i * 0.08) / 0.08)
                  const isActive = wordP > 0 && wordP < 2
                  const isRevealed = wordP >= 1

                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 5,
                        fontWeight: 800,
                        color: isActive && !isRevealed ? C.bg : isRevealed ? C.textPrimary : 'transparent',
                        background: isActive && !isRevealed ? C.mint : 'transparent',
                        padding: '0px 2px',
                        borderRadius: 1,
                        transition: 'all 0.1s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>

              {/* Avatar */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4A574, #D4A57488)',
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 5,
                  fontWeight: 700,
                  color: C.bg,
                }}
              >
                AS
              </div>

              {/* Render progress */}
              {p < 0.7 && (
                <div style={{ position: 'absolute', top: '30%', left: 8, right: 8 }}>
                  <div style={{ height: 2, borderRadius: 1, background: C.border, overflow: 'hidden' }}>
                    <div style={{ width: `${(p / 0.7) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.mint}, ${C.coral})`, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 4, color: C.textFaint, display: 'block', textAlign: 'center', marginTop: 2 }}>
                    Rendering...
                  </span>
                </div>
              )}

              {/* Done checkmark */}
              {p > 0.7 && (
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
                    animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <svg width="5" height="5" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 50 }}>
              {p > 0.75 && metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 5px',
                    borderRadius: 4,
                    background: C.raised,
                    border: `1px solid ${C.border}`,
                    animation: `fadeSlideUp 0.3s ease ${i * 0.1}s both`,
                  }}
                >
                  <span style={{ fontSize: 7 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: C.textPrimary }}>{m.value}</div>
                    <div style={{ fontSize: 4, color: C.textFaint }}>{m.label}</div>
                  </div>
                </div>
              ))}

              {/* Export button */}
              {p > 0.88 && (
                <div
                  style={{
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${C.mint}, ${C.mintDark})`,
                    textAlign: 'center',
                    fontSize: 5,
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '0.03em',
                    boxShadow: `0 2px 8px ${C.mintGlowStrong}`,
                    animation: 'fadeSlideUp 0.3s ease both',
                  }}
                >
                  ↓ EXPORT
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom timeline bar */}
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
              background: `linear-gradient(90deg, ${C.mint}, ${C.coral})`,
              width: `${(ACTS.indexOf(act) / ACTS.length + actProgress / ACTS.length) * 100}%`,
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
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
