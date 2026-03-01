import * as React from 'react'
import {
  Button,
  Heading,
  Link,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

export function WaitlistDay3BehindScenesEmail() {
  return (
    <BaseLayout preview="The real story behind UGCFirst — and why I'm building it.">
      <Heading style={heading}>
        I spent $10K and 4 months building this. Here's why.
      </Heading>

      <Text style={paragraph}>
        I want to tell you why UGCFirst exists, because it's not the usual
        "we saw a gap in the market" startup story.
      </Text>

      <Text style={paragraph}>
        I work in e-commerce — I'm the Head of CX at a dropshipping company. Every day
        I see sellers stuck in the same loop: they need content to sell, but they can't
        afford $150-300 per video for UGC creators. They try DIY, get bad results, and
        give up.
      </Text>

      <Text style={paragraph}>
        So I started building on nights and weekends.{' '}
        <strong style={highlight}>$10K of my own money. 4+ months of development.</strong>{' '}
        No investors, no co-founders — just me trying to solve a problem I see every day.
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>What UGCFirst actually does:</strong>
      </Text>

      <Text style={listItem}>
        Paste any product URL — Amazon, Shopify, AliExpress, anywhere
      </Text>
      <Text style={listItem}>
        AI writes converting scripts (PAS, Unboxing, Testimonial templates)
      </Text>
      <Text style={listItem}>
        Generate video with realistic AI avatar and natural voiceover
      </Text>
      <Text style={listItem}>
        Auto-generated word-by-word captions, ready for TikTok/Reels/Shorts
      </Text>
      <Text style={listItem}>
        Production cost under $0.50/video
      </Text>

      <Text style={paragraph}>
        I'm building this in public on Twitter. Every win, every setback, every lesson.
        If you want to follow along:
      </Text>

      <Button
        href="https://twitter.com/AustinZBuilds"
        style={button}
      >
        Follow the Journey
      </Button>

      <Text style={signoff}>
        You're not just on a waitlist. You're getting in early on something I'm staking
        my career on.
      </Text>

      <Text style={signature}>
        — Austin, Founder of UGCFirst
      </Text>

      <Text style={ps}>
        P.S. Reply to this email anytime. I read every message personally.
      </Text>
    </BaseLayout>
  )
}

export const subject = "I spent $10K and 4 months building this. Here's why."

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

export default WaitlistDay3BehindScenesEmail
