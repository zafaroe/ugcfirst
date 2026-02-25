import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | UGCFirst',
  description:
    'Log in to your UGCFirst account to create AI-powered UGC videos.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
