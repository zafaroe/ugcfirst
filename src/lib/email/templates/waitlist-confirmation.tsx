import * as React from 'react'
import {
  Button,
  Heading,
  Link,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface WaitlistConfirmationEmailProps {
  email?: string
}

export function WaitlistConfirmationEmail({ email }: WaitlistConfirmationEmailProps) {
  return (
    <BaseLayout preview="You're on the UGCFirst waitlist! We'll notify you when we launch.">
      <Heading style={heading}>
        You're on the list!
      </Heading>

      <Text style={paragraph}>
        Thanks for joining the UGCFirst waitlist. We're building something special for
        dropshippers and e-commerce brands who want to create viral UGC videos without
        the hassle.
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>What you'll get:</strong>
      </Text>

      <Text style={listItem}>
        AI-powered UGC videos in under 5 minutes
      </Text>
      <Text style={listItem}>
        No actors or expensive equipment needed
      </Text>
      <Text style={listItem}>
        Natural lip-sync that actually looks real
      </Text>
      <Text style={listItem}>
        Videos optimized for TikTok, Reels, and Shorts
      </Text>

      <Text style={paragraph}>
        <strong style={highlight}>What's next:</strong>
      </Text>

      <Text style={paragraph}>
        We'll send you an email as soon as we're ready to launch. Early waitlist members
        will get priority access and a special launch discount.
      </Text>

      <Button
        href="https://twitter.com/AustinZBuilds"
        style={button}
      >
        Follow for Updates
      </Button>

      <Text style={signoff}>
        Thanks for believing in what we're building.
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

export const subject = "You're on the UGCFirst waitlist!"

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

export default WaitlistConfirmationEmail
