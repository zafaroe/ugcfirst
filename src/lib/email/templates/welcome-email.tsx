import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface WelcomeEmailProps {
  name?: string
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  const greeting = name ? `Hey ${name}!` : 'Hey there!'

  return (
    <BaseLayout preview="Welcome to UGCFirst — let's make your first video">
      <Heading style={heading}>
        {greeting}
      </Heading>

      <Text style={paragraph}>
        Welcome to UGCFirst! You're now part of a community of dropshippers and
        e-commerce brands creating viral UGC videos without the headache.
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>Here's how to get started:</strong>
      </Text>

      {/* Step 1 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>1</Text>
        <div>
          <Text style={stepTitle}>Paste your product URL</Text>
          <Text style={stepDescription}>
            Drop a link from Amazon, Shopify, or any product page. We'll automatically
            extract the details.
          </Text>
        </div>
      </Section>

      {/* Step 2 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>2</Text>
        <div>
          <Text style={stepTitle}>Choose your avatar & template</Text>
          <Text style={stepDescription}>
            Pick from our library of realistic AI avatars and proven UGC templates
            that convert.
          </Text>
        </div>
      </Section>

      {/* Step 3 */}
      <Section style={stepContainer}>
        <Text style={stepNumber}>3</Text>
        <div>
          <Text style={stepTitle}>Generate & download</Text>
          <Text style={stepDescription}>
            Hit generate and your video will be ready in minutes. Download and post
            directly to TikTok, Reels, or Shorts.
          </Text>
        </div>
      </Section>

      <Button
        href="https://ugcfirst.com/dashboard"
        style={button}
      >
        Go to Dashboard
      </Button>

      <Text style={paragraph}>
        Your first video is on us. No credit card required.
      </Text>

      <Text style={signoff}>
        Can't wait to see what you create,
      </Text>

      <Text style={signature}>
        — Austin, Founder of UGCFirst
      </Text>

      <Text style={ps}>
        P.S. Questions? Just reply to this email. I personally read and respond to
        every message.
      </Text>
    </BaseLayout>
  )
}

export const subject = "Welcome to UGCFirst — let's make your first video"

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

export default WelcomeEmail
