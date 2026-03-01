import * as React from 'react'
import {
  Button,
  Heading,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

export function WaitlistLaunchDayEmail() {
  return (
    <BaseLayout preview="UGCFirst is LIVE — your early access and exclusive discount inside.">
      <Heading style={heading}>
        UGCFirst is LIVE
      </Heading>

      <Text style={paragraph}>
        The wait is over. UGCFirst is officially live, and you're one of the first to get access.
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>As a waitlist member, you get:</strong>
      </Text>

      <Text style={listItem}>
        <strong style={highlight}>Early access</strong> — live right now, ahead of everyone else
      </Text>
      <Text style={listItem}>
        <strong style={highlight}>50% off your first 3 months</strong> — use code{' '}
        <span style={codeStyle}>WAITLIST50</span> at checkout
      </Text>
      <Text style={listItem}>
        <strong style={highlight}>3 free videos</strong> — no credit card required
      </Text>

      <Text style={paragraph}>
        UGCFirst turns any product URL into scroll-stopping UGC videos. AI avatars,
        natural voiceover, word-by-word captions — ready for TikTok, Reels, and Shorts
        in minutes, not days.
      </Text>

      <Text style={ctaIntro}>
        Your 3 free videos are waiting. No credit card. No commitment. Just paste a
        product URL and see what comes out.
      </Text>

      <Button
        href="https://ugcfirst.com/signup"
        style={button}
      >
        Start Creating Videos →
      </Button>

      <Text style={signoff}>
        This is the moment. Let's make some videos.
      </Text>

      <Text style={signature}>
        — Austin, Founder of UGCFirst
      </Text>

      <Text style={ps}>
        P.S. Hit reply if you have ANY questions. I'm personally onboarding every early
        user this week.
      </Text>
    </BaseLayout>
  )
}

export const subject = "UGCFirst is LIVE — your early access is inside"

// Styles
const heading = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#111827',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px 0',
}

const highlight = {
  color: '#10B981',
}

const listItem = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '0 0 8px 0',
  paddingLeft: '16px',
}

const codeStyle = {
  backgroundColor: '#F0FDF4',
  color: '#059669',
  padding: '2px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontWeight: '600' as const,
}

const ctaIntro = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '24px 0 16px 0',
  padding: '16px',
  backgroundColor: '#F0FDF4',
  borderRadius: '8px',
  border: '1px solid #10B981',
}

const button = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '600' as const,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const signoff = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '32px 0 8px 0',
}

const signature = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#111827',
  margin: '0 0 24px 0',
}

const ps = {
  fontSize: '14px',
  fontStyle: 'italic' as const,
  color: '#6B7280',
  margin: '24px 0 0 0',
  paddingTop: '24px',
  borderTop: '1px solid #E5E7EB',
}

export default WaitlistLaunchDayEmail
