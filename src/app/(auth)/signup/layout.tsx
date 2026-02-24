import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Vidnary - Start Creating UGC Videos',
  description:
    'Create your Vidnary account and start making viral UGC videos with AI in minutes. Get 10 free credits.',
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
