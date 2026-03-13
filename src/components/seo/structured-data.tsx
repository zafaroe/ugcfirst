/**
 * JSON-LD Structured Data Components for SEO
 * 
 * These components inject schema.org structured data into pages
 * for better search engine understanding and rich snippets.
 */

import { LANDING_FAQ } from '@/config/landing'

// ============================================
// WEBSITE STRUCTURED DATA
// ============================================

interface WebsiteStructuredDataProps {
  url?: string
  name?: string
  description?: string
}

export function WebsiteStructuredData({
  url = 'https://ugcfirst.com',
  name = 'UGCFirst',
  description = 'AI-powered UGC video generator for e-commerce. Create viral TikTok and Instagram ads in minutes.',
}: WebsiteStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ============================================
// ORGANIZATION STRUCTURED DATA
// ============================================

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UGCFirst',
    url: 'https://ugcfirst.com',
    logo: 'https://ugcfirst.com/logo.png',
    description: 'AI-powered UGC video generator for e-commerce sellers, dropshippers, and agencies.',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/AustinZBuilds',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@ugcfirst.com',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ============================================
// FAQ STRUCTURED DATA
// ============================================

interface FAQItem {
  question: string
  answer: string
}

interface FAQStructuredDataProps {
  faqs?: FAQItem[]
}

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  // Use provided FAQs or default to landing FAQs
  const faqItems = faqs || LANDING_FAQ.map(item => ({
    question: item.question,
    answer: item.answer,
  }))

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ============================================
// SOFTWARE APPLICATION STRUCTURED DATA
// ============================================

export function SoftwareApplicationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'UGCFirst',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'AI-powered UGC video generator. Create viral TikTok and Instagram video ads in minutes with AI avatars, auto captions, and viral scripts.',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '179',
      priceCurrency: 'USD',
      offerCount: '5',
    },
    featureList: [
      'AI Avatar Video Generation',
      'Auto Captions',
      'Viral Script Writing',
      'TikTok Shop Integration',
      'Instagram Reels Optimization',
      'Product URL Import',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ============================================
// BREADCRUMB STRUCTURED DATA
// ============================================

interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// ============================================
// COMBINED HOMEPAGE STRUCTURED DATA
// ============================================

export function HomepageStructuredData() {
  return (
    <>
      <WebsiteStructuredData />
      <OrganizationStructuredData />
      <SoftwareApplicationStructuredData />
      <FAQStructuredData />
    </>
  )
}
