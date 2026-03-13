import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your UGCFirst account to create AI-powered UGC video ads.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://ugcfirst.com/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
