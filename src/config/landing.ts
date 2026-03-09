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

// FAQ Items for Landing Page - Punchy, benefit-focused with competitor positioning
export const LANDING_FAQ: AccordionItem[] = [
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
    answer: "Natural lip-sync that doesn't look robotic. Many MakeUGC and Creatify users report lip-sync issues requiring manual fixes. Our avatars are specifically trained for UGC-style authenticity that builds trust.",
  },
  {
    id: 'faq_5',
    question: 'What if I need changes?',
    answer: "Instant regeneration at a fraction of the cost. Change avatars, tweak scripts, or try new hooks—all without starting over. Most edits take under 2 minutes.",
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
export const USE_CASE_PERSONAS = [
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
