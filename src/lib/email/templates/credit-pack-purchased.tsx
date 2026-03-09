import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface CreditPackPurchasedEmailProps {
  name?: string
  packName: string
  credits: number
  price: number
  newBalance: number
}

export function CreditPackPurchasedEmail({
  name,
  packName,
  credits,
  price,
  newBalance,
}: CreditPackPurchasedEmailProps) {
  const greeting = name ? `Hey ${name}!` : 'Hey there!'

  return (
    <BaseLayout preview={`${credits} credits added to your account`}>
      <Heading style={heading}>
        Credits Added!
      </Heading>

      <Text style={paragraph}>
        {greeting} Your credit pack purchase was successful. Your credits are
        ready to use right now.
      </Text>

      {/* Purchase summary box */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Purchase Summary</Text>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Pack</Text>
          <Text style={summaryValue}>{packName}</Text>
        </div>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Credits Added</Text>
          <Text style={summaryValueHighlight}>+{credits} credits</Text>
        </div>
        <div style={summaryRow}>
          <Text style={summaryLabel}>Amount Paid</Text>
          <Text style={summaryValue}>${price.toFixed(2)}</Text>
        </div>
        <div style={divider} />
        <div style={summaryRow}>
          <Text style={summaryLabel}>New Balance</Text>
          <Text style={summaryValueLarge}>{newBalance} credits</Text>
        </div>
      </Section>

      <Button
        href="https://ugcfirst.com/create/concierge"
        style={button}
      >
        Create a Video
      </Button>

      <Text style={paragraph}>
        Your credits never expire for 12 months — use them whenever you're ready!
      </Text>

      <Text style={signoff}>
        Happy creating,
      </Text>

      <Text style={signature}>
        — The UGCFirst Team
      </Text>
    </BaseLayout>
  )
}

export const subject = 'Credits Added — {credits} credits ready to use'

// Styles
const heading = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#10B981',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px 0',
}

const summaryBox = {
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
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

const summaryValueHighlight = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#10B981',
  margin: '0',
}

const summaryValueLarge = {
  fontSize: '18px',
  fontWeight: '700' as const,
  color: '#111827',
  margin: '0',
}

const divider = {
  height: '1px',
  backgroundColor: '#E5E7EB',
  margin: '12px 0',
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

export default CreditPackPurchasedEmail
