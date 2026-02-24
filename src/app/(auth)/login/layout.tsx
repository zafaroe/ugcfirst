import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Vidnary',
  description:
    'Log in to your Vidnary account to create AI-powered UGC videos.',
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
