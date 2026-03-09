import * as React from 'react'
import {
  Button,
  Heading,
  Section,
  Text,
} from '@react-email/components'
import { BaseLayout } from './base-layout'

interface SubscriptionCanceledEmailProps {
  name?: string
  remainingCredits?: number
}

export function SubscriptionCanceledEmail({
  name,
  remainingCredits = 0,
}: SubscriptionCanceledEmailProps) {
  const greeting = name ? `Hey ${name},` : 'Hey there,'

  return (
    <BaseLayout preview="Your UGCFirst subscription has been canceled">
      <Heading style={heading}>
        Subscription Canceled
      </Heading>

      <Text style={paragraph}>
        {greeting}
      </Text>

      <Text style={paragraph}>
        We've canceled your UGCFirst subscription as requested. We're sorry to
        see you go!
      </Text>

      {remainingCredits > 0 && (
        <Section style={infoBox}>
          <Text style={infoTitle}>Your Remaining Credits</Text>
          <Text style={creditCount}>{remainingCredits}</Text>
          <Text style={infoNote}>
            You can still use your remaining credits until they expire (12 months
            from purchase). Don't let them go to waste!
          </Text>
        </Section>
      )}

      <Text style={paragraph}>
        If you change your mind, you can resubscribe anytime. Your account and
        any remaining credits will still be here.
      </Text>

      <Button
        href="https://ugcfirst.com/pricing"
        style={button}
      >
        View Plans
      </Button>

      <Text style={paragraph}>
        <strong>Quick question:</strong> We'd love to know why you left. Just reply
        to this email with any feedback — it helps us improve!
      </Text>

      <Text style={signoff}>
        Thanks for trying UGCFirst,
      </Text>

      <Text style={signature}>
        — The UGCFirst Team
      </Text>
    </BaseLayout>
  )
}

export const subject = 'Your UGCFirst subscription has been canceled'

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

const infoBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  border: '1px solid #FCD34D',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const infoTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#92400E',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const creditCount = {
  fontSize: '36px',
  fontWeight: '700' as const,
  color: '#92400E',
  margin: '0 0 8px 0',
}

const infoNote = {
  fontSize: '14px',
  color: '#92400E',
  margin: '0',
}

const button = {
  display: 'inline-block',
  backgroundColor: '#6B7280',
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

export default SubscriptionCanceledEmail
