import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | UGCFirst - AI UGC Video Plans',
  description:
    'Choose your UGCFirst plan. Create viral UGC videos with AI avatars starting at $29/month. Simple, transparent pricing.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing | UGCFirst - AI UGC Video Plans',
    description:
      'Choose your UGCFirst plan. Create viral UGC videos with AI avatars starting at $29/month.',
    url: 'https://ugcfirst.com/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
