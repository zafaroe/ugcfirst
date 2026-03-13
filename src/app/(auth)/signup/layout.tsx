import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — Start Creating AI UGC Videos Free',
  description: 'Create your free UGCFirst account. Get 1 free AI UGC video, then upgrade to Starter ($19/mo) or Pro ($59/mo). No credit card required.',
  keywords: [
    'UGCFirst signup',
    'free UGC video',
    'AI video ads free trial',
    'create UGC account',
  ],
  alternates: {
    canonical: 'https://ugcfirst.com/signup',
  },
  openGraph: {
    title: 'Sign Up — Start Creating AI UGC Videos Free | UGCFirst',
    description: 'Get your first AI UGC video free. No credit card required.',
    url: 'https://ugcfirst.com/signup',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
