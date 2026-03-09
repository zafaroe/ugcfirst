import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface PaymentFailedEmailProps {
  name?: string
}

export function PaymentFailedEmail({ name }: PaymentFailedEmailProps) {
  const greeting = name ? `Hey ${name},` : 'Hey there,'

  return (
    <BaseLayout preview="Action needed: Payment failed for your UGCFirst subscription">
      <Heading style={heading}>
        Payment Failed
      </Heading>

      <Text style={paragraph}>
        {greeting}
      </Text>

      <Text style={paragraph}>
        We tried to process your subscription payment, but it didn't go through.
        This could happen due to an expired card, insufficient funds, or a
        temporary issue with your bank.
      </Text>

      {/* Alert box */}
      <Section style={alertBox}>
        <Text style={alertIcon}>!</Text>
        <Text style={alertText}>
          <strong>Action Required:</strong> Please update your payment method to
          avoid interruption to your service.
        </Text>
      </Section>

      <Button
        href="https://ugcfirst.com/settings/billing"
        style={button}
      >
        Update Payment Method
      </Button>

      <Text style={paragraph}>
        <strong>What happens next?</strong>
      </Text>

      <Text style={paragraph}>
        We'll automatically retry the payment in a few days. If it continues to
        fail, your subscription may be paused until the payment is resolved.
      </Text>

      <Text style={paragraph}>
        Need help? Just reply to this email and we'll sort it out together.
      </Text>

      <Text style={signoff}>
        Thanks,
      </Text>

      <Text style={signature}>
        — The UGCFirst Team
      </Text>
    </BaseLayout>
  )
}

export const subject = 'Action needed: Payment failed for your UGCFirst subscription'

// Styles
const heading = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#DC2626',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px 0',
}

const alertBox = {
  backgroundColor: '#FEF2F2',
  borderRadius: '12px',
  border: '1px solid #FECACA',
  padding: '20px',
  margin: '24px 0',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}

const alertIcon = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: '#DC2626',
  color: '#FFFFFF',
  fontSize: '14px',
  fontWeight: '700' as const,
  textAlign: 'center' as const,
  lineHeight: '24px',
  flexShrink: 0,
  margin: '0',
}

const alertText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#991B1B',
  margin: '0',
}

const button = {
  display: 'inline-block',
  background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
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

export default PaymentFailedEmail
