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
  alternates: {
    canonical: '/',
  },
  title: 'UGCFirst | AI-Powered UGC Videos for E-commerce',
  description: 'Turn product images into viral UGC videos in minutes. AI avatars, viral scripts, no actors needed. Built for dropshippers.',
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
    title: 'UGCFirst | AI-Powered UGC Videos',
    description: 'Turn product images into viral UGC videos in minutes. No actors. No editors. No $200 invoices.',
    url: 'https://ugcfirst.com',
    siteName: 'UGCFirst',
    images: [
      {
        url: 'https://ugcfirst.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UGCFirst - AI UGC Videos',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UGCFirst | AI-Powered UGC Videos',
    description: 'Turn product images into viral UGC videos in minutes.',
    images: ['https://ugcfirst.com/og-image.png'],
  },
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
