import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Vidnary - AI UGC Video Plans',
  description:
    'Choose your Vidnary plan. Create viral UGC videos with AI avatars starting at $29/month. Simple, transparent pricing.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing | Vidnary - AI UGC Video Plans',
    description:
      'Choose your Vidnary plan. Create viral UGC videos with AI avatars starting at $29/month.',
    url: 'https://vidnary.com/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
