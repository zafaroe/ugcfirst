import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        {/* Header */}
        <Section style={header}>
          <Container style={container}>
            <Text style={logoText}>
              ugcfirst<span style={logoDot}>.</span>
            </Text>
          </Container>
        </Section>

        {/* Content */}
        <Section style={content}>
          <Container style={container}>
            {children}
          </Container>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Container style={container}>
            <Text style={footerText}>
              UGCFirst by AZ Foundry LLC
            </Text>
            <Text style={footerLinks}>
              <Link href="https://twitter.com/AustinZBuilds" style={footerLink}>
                Twitter @AustinZBuilds
              </Link>
              {' | '}
              <Link href="https://ugcfirst.com" style={footerLink}>
                ugcfirst.com
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              You received this email because you signed up for UGCFirst.
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}

// Brand colors
const colors = {
  mint: '#10B981',
  mintDark: '#059669',
  darkBg: '#0C0A09',
  bodyBg: '#FFFFFF',
  textPrimary: '#374151',
  textMuted: '#6B7280',
  border: '#E5E7EB',
}

// Styles
const main = {
  backgroundColor: colors.bodyBg,
  fontFamily: 'Inter, Arial, sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 20px',
}

const header = {
  backgroundColor: colors.darkBg,
  padding: '24px 0',
}

const logoText = {
  fontSize: '28px',
  fontWeight: '800' as const,
  color: '#FAFAF9',
  letterSpacing: '-1px',
  margin: '0',
  textAlign: 'center' as const,
}

const logoDot = {
  color: colors.mint,
}

const content = {
  backgroundColor: colors.bodyBg,
  padding: '40px 0',
}

const footer = {
  backgroundColor: colors.darkBg,
  padding: '32px 0',
}

const footerText = {
  fontSize: '14px',
  color: '#A1A1AA',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const footerLinks = {
  fontSize: '14px',
  color: '#A1A1AA',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
}

const footerLink = {
  color: colors.mint,
  textDecoration: 'none',
}

const footerDisclaimer = {
  fontSize: '12px',
  color: '#71717A',
  margin: '16px 0 0 0',
  textAlign: 'center' as const,
}
