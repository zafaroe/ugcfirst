import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

export function WaitlistDay7EarlyAccessEmail() {
  return (
    <BaseLayout preview="Platform is in final testing — here's what you're getting.">
      <Heading style={heading}>
        Early access is almost here
      </Heading>

      <Text style={paragraph}>
        Quick update — we're getting close to launch and I wanted you to hear it first.
      </Text>

      <Text style={paragraph}>
        The platform is in final testing. As a waitlist member, here's what you'll get:
      </Text>

      <Text style={listItem}>
        <strong style={highlight}>Priority access</strong> — before the public launch
      </Text>
      <Text style={listItem}>
        <strong style={highlight}>Special launch discount</strong> — exclusive to early supporters
      </Text>
      <Text style={listItem}>
        <strong style={highlight}>Free credits</strong> — test the platform risk-free
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>Here's how it works:</strong>
      </Text>

      {/* Step 1 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>1</Text>
        <div>
          <Text style={stepTitle}>Paste any product URL</Text>
          <Text style={stepDescription}>
            Amazon, Shopify, AliExpress, anywhere. AI extracts product details automatically.
          </Text>
        </div>
      </Section>

      {/* Step 2 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>2</Text>
        <div>
          <Text style={stepTitle}>Pick a template</Text>
          <Text style={stepDescription}>
            PAS (hook → problem → solution), Unboxing, or Testimonial. Each proven to convert.
          </Text>
        </div>
      </Section>

      {/* Step 3 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>3</Text>
        <div>
          <Text style={stepTitle}>Get your video</Text>
          <Text style={stepDescription}>
            AI avatar, natural voiceover, word-by-word captions. Ready for TikTok, Reels, Shorts.
          </Text>
        </div>
      </Section>

      <Text style={comparison}>
        <strong>The math:</strong> Traditional UGC creator: $150-300/video, 3-7 day turnaround.{' '}
        <strong style={highlight}>UGCFirst: under $5/video, ready in minutes.</strong>
      </Text>

      <Button
        href="https://ugcfirst.com"
        style={button}
      >
        Visit UGCFirst
      </Button>

      <Text style={signoff}>
        Can't wait to get this in your hands.
      </Text>

      <Text style={signature}>
        — Austin, Founder of UGCFirst
      </Text>

      <Text style={ps}>
        P.S. Know other sellers who struggle with content? Forward this email to them —
        they can join the waitlist at ugcfirst.com
      </Text>
    </BaseLayout>
  )
}

export const subject = "Early access is almost here (+ what you're getting)"

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

const stepContainer = {
  display: 'flex',
  marginBottom: '20px',
  padding: '16px',
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
}

const stepNumber = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#10B981',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  lineHeight: '32px',
  marginRight: '16px',
  flexShrink: 0,
}

const stepTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#111827',
  margin: '0 0 4px 0',
}

const stepDescription = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6B7280',
  margin: '0',
}

const comparison = {
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

export default WaitlistDay7EarlyAccessEmail
