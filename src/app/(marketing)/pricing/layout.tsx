import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — AI UGC Videos from $19/month',
  description: 'UGCFirst pricing: Free tier with 1 video, Starter at $19/mo, Pro at $59/mo with social scheduling. 60% cheaper than MakeUGC. No contracts, cancel anytime.',
  keywords: [
    'UGC video pricing',
    'AI video ads cost',
    'cheap UGC videos',
    'MakeUGC alternative pricing',
    'TikTok ad maker price',
    'affordable UGC',
    'e-commerce video pricing',
  ],
  alternates: {
    canonical: 'https://ugcfirst.com/pricing',
  },
  openGraph: {
    title: 'Pricing — AI UGC Videos from $19/month | UGCFirst',
    description: 'UGCFirst pricing: Free tier with 1 video, Starter at $19/mo, Pro at $59/mo. 60% cheaper than competitors.',
    url: 'https://ugcfirst.com/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
