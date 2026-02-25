// Mock data for landing page testimonials and FAQ

import type { Testimonial } from '@/components/composed/testimonial-card'
import type { AccordionItem } from '@/components/ui/accordion'

// Testimonials
export const mockTestimonials: Testimonial[] = [
  {
    id: 'test_1',
    name: 'Sarah Chen',
    role: 'Dropshipper, 6-figure store',
    avatar: '', // Will use initials fallback
    quote: 'I went from posting 2 videos a week to 2 per day. My engagement tripled and sales followed. UGCFirst paid for itself in the first week.',
    rating: 5,
  },
  {
    id: 'test_2',
    name: 'Marcus Johnson',
    role: 'E-commerce Brand Owner',
    avatar: '',
    quote: 'Used to spend $300 per video with UGC creators. Now I create 10x the content for a fraction of the cost. Game changer.',
    rating: 5,
  },
  {
    id: 'test_3',
    name: 'Emily Rodriguez',
    role: 'TikTok Shop Seller',
    avatar: '',
    quote: 'The AI avatars look so natural, my customers thought I hired real influencers. Best investment I made for my store.',
    rating: 5,
  },
]

// FAQ Items for Landing Page - Punchy, benefit-focused with competitor positioning
export const mockLandingFAQ: AccordionItem[] = [
  {
    id: 'faq_1',
    question: 'How fast can I create a video?',
    answer: 'Under 5 minutes. Paste your product link, pick an avatar, and our AI handles the script, voice, and editing. While competitors like MakeUGC take 10+ minutes and Creatify requires manual tweaking, UGCFirst is truly hands-off.',
  },
  {
    id: 'faq_2',
    question: 'Will these videos actually convert?',
    answer: 'Our AI is trained on viral TikTok and Reels patterns. Early users report 2-3x higher engagement than their previous content. Videos are optimized for hooks, pacing, and calls-to-action that drive sales.',
  },
  {
    id: 'faq_3',
    question: 'Do I need video editing skills?',
    answer: 'Zero. Unlike Creatify where most users need post-production editing, UGCFirst outputs polished, ready-to-post videos. Just upload and watch your engagement grow.',
  },
  {
    id: 'faq_4',
    question: 'What makes your AI avatars different?',
    answer: 'Natural lip-sync that doesn\'t look robotic. Many MakeUGC and Creatify users report lip-sync issues requiring manual fixes. Our avatars are specifically trained for UGC-style authenticity that builds trust.',
  },
  {
    id: 'faq_5',
    question: 'What if I need changes?',
    answer: 'Instant regeneration at a fraction of the cost. Change avatars, tweak scripts, or try new hooks—all without starting over. Most edits take under 2 minutes.',
  },
  {
    id: 'faq_6',
    question: 'Is there a free plan?',
    answer: 'Yes! Get 1 video completely free on signup. No credit card required. Just sign up and start creating — upgrade when you need more.',
  },
  {
    id: 'faq_7',
    question: 'What platforms do you support?',
    answer: 'TikTok, Instagram Reels, YouTube Shorts, and Facebook. All videos are optimized for vertical 9:16 format with captions, hooks, and CTAs that drive engagement on each platform.',
  },
]

// Use case personas for landing page
export const mockPersonas = [
  {
    id: 'dropshippers',
    title: 'Dropshippers',
    icon: 'Package',
    description: 'Test products faster with instant video ads. No need to wait for samples or hire creators.',
    stat: '3.1x avg. ROAS',
    benefits: ['Test 10 products/week', 'No product samples needed', 'TikTok Shop optimized'],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Brands',
    icon: 'Store',
    description: 'Scale your content library. Create 20+ unique videos per month from your existing product catalog.',
    stat: '20+ videos/month',
    benefits: ['Paste any product URL', 'Bulk video creation', 'A/B test creatives'],
  },
  {
    id: 'agencies',
    title: 'Agencies',
    icon: 'Building2',
    description: 'Deliver UGC videos to clients in hours, not weeks. Scale across multiple brands.',
    stat: '90% cost savings',
    benefits: ['Multi-brand support', 'Client-ready exports', 'White-label options'],
  },
  {
    id: 'creators',
    title: 'Content Creators',
    icon: 'Camera',
    description: 'Monetize your audience with product review videos. Auto-generated scripts from viral hooks.',
    stat: '50x faster output',
    benefits: ['Viral hook library', 'Multiple avatar styles', 'Cross-platform ready'],
  },
]

// FAQ Items for Pricing Page - Value-focused with competitor comparison
export const mockPricingFAQ: AccordionItem[] = [
  {
    id: 'pricing_faq_1',
    question: 'How do credits work?',
    answer: '10 credits = 1 full video. Unlike Creatify where unused credits expire monthly, your UGCFirst credits roll over for 12 months. We believe you shouldn\'t lose what you paid for.',
  },
  {
    id: 'pricing_faq_2',
    question: 'How does UGCFirst compare to MakeUGC and Creatify?',
    answer: 'The biggest difference? Your credits don\'t disappear. MakeUGC and Creatify expire unused credits monthly—you lose what you paid for. UGCFirst credits roll over for 12 months. Plus, we\'re built specifically for dropshippers with natural lip-sync and zero post-production needed.',
  },
  {
    id: 'pricing_faq_3',
    question: 'Can I cancel anytime?',
    answer: 'Yes, no contracts or hidden fees. Cancel in one click. Your remaining credits stay active until the billing period ends, and you keep all your videos forever.',
  },
  {
    id: 'pricing_faq_4',
    question: 'Is there a free trial?',
    answer: 'Better—1 free video on signup. No credit card required. MakeUGC and Creatify both require payment upfront. We let you test first.',
  },
  {
    id: 'pricing_faq_5',
    question: 'Why is UGCFirst better for dropshippers?',
    answer: 'Built specifically for e-commerce. Paste any product URL, and our AI creates videos in one click. Trained on what converts on TikTok Shop. Competitors are generic video tools—we\'re laser-focused on helping you sell.',
  },
]

// Comparison data for pricing page - UGCFirst vs alternatives
export interface ComparisonRow {
  feature: string
  ugcfirst: string
  diy: string
  freelancer: string
  agency: string
}

export const mockComparisonData: ComparisonRow[] = [
  {
    feature: 'Cost per video',
    ugcfirst: '$1.67-$2.95',
    diy: '$0 (your time)',
    freelancer: '$150-300',
    agency: '$500-2000',
  },
  {
    feature: 'Time to create',
    ugcfirst: '5 minutes',
    diy: '4-8 hours',
    freelancer: '3-7 days',
    agency: '1-2 weeks',
  },
  {
    feature: 'Videos per month',
    ugcfirst: 'Unlimited*',
    diy: '2-4 (time limited)',
    freelancer: '4-8 (budget limited)',
    agency: '10-20',
  },
  {
    feature: 'Script writing',
    ugcfirst: 'AI-powered',
    diy: 'You write',
    freelancer: 'Extra cost',
    agency: 'Included',
  },
  {
    feature: 'Revisions',
    ugcfirst: 'Instant',
    diy: 'Re-do yourself',
    freelancer: '1-2 included',
    agency: '2-3 included',
  },
  {
    feature: 'Scale quickly',
    ugcfirst: 'Yes',
    diy: 'No',
    freelancer: 'Difficult',
    agency: 'Expensive',
  },
]

// Competitor comparison data - UGCFirst vs MakeUGC vs Creatify
export interface CompetitorComparisonRow {
  feature: string
  ugcfirst: string
  makeugc: string
  creatify: string
  ugcfirstWins?: boolean
}

export const mockCompetitorComparison: CompetitorComparisonRow[] = [
  {
    feature: 'Unused Credits',
    ugcfirst: 'Roll over 12 months',
    makeugc: 'Lost monthly',
    creatify: 'Lost monthly',
    ugcfirstWins: true,
  },
  {
    feature: 'Free Trial',
    ugcfirst: '1 free video',
    makeugc: 'No free trial',
    creatify: 'Watermarked only',
    ugcfirstWins: true,
  },
  {
    feature: 'Video Creation Time',
    ugcfirst: '< 5 minutes',
    makeugc: '2-10 minutes',
    creatify: '5-15 min + editing',
    ugcfirstWins: true,
  },
  {
    feature: 'Lip-Sync Quality',
    ugcfirst: 'Natural',
    makeugc: 'Issues reported',
    creatify: 'Inconsistent',
    ugcfirstWins: true,
  },
  {
    feature: 'Post-Production Needed',
    ugcfirst: 'No',
    makeugc: 'Sometimes',
    creatify: 'Often required',
    ugcfirstWins: true,
  },
  {
    feature: 'Built for Dropshippers',
    ugcfirst: 'Yes',
    makeugc: 'No',
    creatify: 'No',
    ugcfirstWins: true,
  },
]
