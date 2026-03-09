import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface SubscriptionConfirmedEmailProps {
  name?: string
  planName: string
  credits: number
  videoCount: number
}

export function SubscriptionConfirmedEmail({
  name,
  planName,
  credits,
  videoCount,
}: SubscriptionConfirmedEmailProps) {
  const greeting = name ? `Hey ${name}!` : 'Hey there!'

  return (
    <BaseLayout preview={`Welcome to UGCFirst ${planName} — you're all set!`}>
      <Heading style={heading}>
        {greeting}
      </Heading>

      <Text style={paragraph}>
        Your <strong style={highlight}>{planName}</strong> subscription is now active!
        You're ready to start creating viral UGC videos.
      </Text>

      {/* Plan summary box */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Your Plan Includes:</Text>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Plan</Text>
          <Text style={summaryValue}>{planName}</Text>
        </div>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Monthly Credits</Text>
          <Text style={summaryValue}>{credits} credits</Text>
        </div>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Videos per Month</Text>
          <Text style={summaryValue}>~{videoCount} videos</Text>
        </div>
        <Text style={summaryNote}>
          Credits rollover for 12 months — use them anytime!
        </Text>
      </Section>

      <Button
        href="https://ugcfirst.com/dashboard"
        style={button}
      >
        Start Creating
      </Button>

      <Text style={paragraph}>
        Need help getting started? Check out our quick start guide or just reply
        to this email — we're here to help!
      </Text>

      <Text style={signoff}>
        Thanks for choosing UGCFirst,
      </Text>

      <Text style={signature}>
        — The UGCFirst Team
      </Text>
    </BaseLayout>
  )
}

export const subject = 'Welcome to UGCFirst {planName}!'

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

const summaryBox = {
  backgroundColor: '#F0FDF4',
  borderRadius: '12px',
  border: '1px solid #86EFAC',
  padding: '24px',
  margin: '24px 0',
}

const summaryTitle = {
  fontSize: '18px',
  fontWeight: '700' as const,
  color: '#111827',
  margin: '0 0 16px 0',
}

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
  paddingBottom: '8px',
  borderBottom: '1px solid #D1FAE5',
}

const summaryLabel = {
  fontSize: '14px',
  color: '#6B7280',
  margin: '0',
}

const summaryValue = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#111827',
  margin: '0',
}

const summaryNote = {
  fontSize: '12px',
  color: '#059669',
  margin: '16px 0 0 0',
  fontStyle: 'italic' as const,
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
  margin: '0',
}

export default SubscriptionConfirmedEmail
