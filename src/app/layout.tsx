import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/ui'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['600', '700', '800'],
})

const satoshi = localFont({
  src: [
    { path: '../fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://ugcfirst.com'),
  title: {
    default: 'UGCFirst | AI-Powered UGC Video Generator for E-Commerce',
    template: '%s | UGCFirst',
  },
  description: 'Generate AI-powered UGC video ads for your e-commerce store in 2 minutes. Auto captions, AI scripts, natural avatars. 60% cheaper than MakeUGC. Try your first video free.',
  keywords: [
    'AI UGC video generator',
    'UGC ads',
    'AI video ads',
    'dropshipping video ads',
    'e-commerce UGC',
    'TikTok ad maker',
    'AI avatars',
    'UGC video maker',
    'cheap UGC videos',
    'MakeUGC alternative',
    'auto captions video',
    'product video generator',
  ],
  authors: [{ name: 'UGCFirst', url: 'https://ugcfirst.com' }],
  creator: 'UGCFirst',
  publisher: 'AZ Foundry LLC',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ugcfirst.com',
    siteName: 'UGCFirst',
    title: 'UGCFirst — AI UGC Video Ads for E-Commerce Sellers',
    description: 'Turn product images into viral UGC videos in minutes. AI avatars, auto captions, viral scripts. Built for dropshippers. 60% cheaper than competitors.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UGCFirst — AI-Powered UGC Video Generator',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AustinZBuilds',
    creator: '@AustinZBuilds',
    title: 'UGCFirst — AI UGC Video Ads for E-Commerce',
    description: 'Generate UGC video ads in 2 minutes. Auto captions, AI scripts, natural avatars. Try free.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://ugcfirst.com',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${satoshi.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
