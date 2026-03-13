/**
 * Landing Page Static Content
 * Real content for the landing page - moved from src/mocks/data/landing.ts
 */

import type { Testimonial } from '@/components/composed/testimonial-card'
import type { AccordionItem } from '@/components/ui/accordion'

// Testimonials
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_1',
    name: 'Sarah Chen',
    role: 'Dropshipper, 6-figure store',
    avatar: '',
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

// FAQ Items for Landing Page - SEO optimized with target keywords
export const LANDING_FAQ: AccordionItem[] = [
  {
    id: 'faq_1',
    question: 'How fast can I create a UGC video ad?',
    answer: 'Under 5 minutes. UGCFirst is an AI UGC video generator that handles everything — paste your product link, pick an avatar, and the AI writes the script, records the voiceover, and edits the video. While MakeUGC takes 10+ minutes and Creatify requires manual tweaking, UGCFirst is truly hands-off.',
  },
  {
    id: 'faq_2',
    question: 'Will these AI-generated UGC videos actually convert?',
    answer: 'Our AI UGC video generator is trained on viral TikTok and Instagram Reels patterns used by top e-commerce sellers. Early dropshippers report 2-3x higher engagement than their previous content. Videos are optimized for hooks, pacing, and calls-to-action that drive sales.',
  },
  {
    id: 'faq_3',
    question: 'Do I need video editing skills to make UGC ads?',
    answer: 'Zero. Unlike Creatify where most users need post-production editing, UGCFirst outputs polished, ready-to-post UGC video ads with captions already burned in. No CapCut, no Premiere — just upload your product and get a finished video. Built specifically for e-commerce sellers and dropshippers who need results, not a learning curve.',
  },
  {
    id: 'faq_4',
    question: 'What makes UGCFirst different from MakeUGC and Creatify?',
    answer: 'Three things no other AI UGC video generator offers: (1) Auto captions burned directly into the video — MakeUGC and Creatify both require you to add captions in CapCut separately. (2) Drop & Go concierge mode — paste one URL and get a finished video with zero input. No competitor has this. (3) Customizable end credits with optional logo branding. Plus, UGCFirst is 60% cheaper per video than MakeUGC.',
  },
  {
    id: 'faq_5',
    question: 'How much does UGCFirst cost compared to other AI UGC tools?',
    answer: 'UGCFirst starts at $19/month for the Starter plan. MakeUGC starts at $39/month. On a per-video basis, UGCFirst videos cost approximately $2-4 each — about 60% cheaper than MakeUGC. There is also a free tier with 1 watermarked video and no credit card required, which MakeUGC does not offer at all.',
  },
  {
    id: 'faq_6',
    question: 'Is there a free AI UGC video generator plan?',
    answer: 'Yes. UGCFirst offers 1 free watermarked UGC video on signup — no credit card required. This lets dropshippers and e-commerce sellers test the AI video quality before committing to a paid plan. Paid plans start at $19/month with full HD output and no watermark.',
  },
  {
    id: 'faq_7',
    question: 'What platforms are the UGC videos optimized for?',
    answer: 'TikTok, Instagram Reels, YouTube Shorts, and Facebook. All videos from the AI UGC video generator are exported in vertical 9:16 format with auto captions, hooks, and CTAs optimized for each platform. Dropshippers using TikTok Shop see the strongest results.',
  },
]

// Use case personas for landing page - SEO optimized with target keywords
export const USE_CASE_PERSONAS = [
  {
    id: 'dropshippers',
    title: 'Dropshippers',
    icon: 'Package',
    description: 'Use the AI UGC video generator to test products faster with instant video ads. No samples needed, no creators to hire — just paste your product URL and get a TikTok-ready ad.',
    stat: '3.1x avg. ROAS',
    benefits: ['Test 10 products/week', 'No product samples needed', 'TikTok Shop optimized'],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Brands',
    icon: 'Store',
    description: 'Scale your UGC video ad library. Create 20+ unique AI-generated videos per month from your existing product catalog at a fraction of what MakeUGC charges.',
    stat: '20+ videos/month',
    benefits: ['Paste any product URL', 'Bulk video creation', 'A/B test creatives'],
  },
  {
    id: 'agencies',
    title: 'Agencies',
    icon: 'Building2',
    description: 'Deliver AI UGC video ads to e-commerce clients in hours, not weeks. Scale across multiple brands without coordinating a dozen creators.',
    stat: '90% cost savings',
    benefits: ['Multi-brand support', 'Client-ready exports', 'White-label options'],
  },
  {
    id: 'creators',
    title: 'Content Creators',
    icon: 'Camera',
    description: 'Monetize your audience with AI-generated product review videos. Auto-generated scripts from viral hooks, ready for TikTok and Instagram Reels.',
    stat: '50x faster output',
    benefits: ['Viral hook library', 'Multiple avatar styles', 'Cross-platform ready'],
  },
]
