import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastProvider } from '@/components/ui'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['700', '800'], // Only bold weights for headings
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500'], // Only regular & medium for body
})

export const metadata: Metadata = {
  metadataBase: new URL('https://vidnary.com'),
  alternates: {
    canonical: '/',
  },
  title: 'Vidnary | AI-Powered UGC Videos for E-commerce',
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
    title: 'Vidnary | AI-Powered UGC Videos',
    description: 'Turn product images into viral UGC videos in minutes. No actors. No editors. No $200 invoices.',
    url: 'https://vidnary.com',
    siteName: 'Vidnary',
    images: [
      {
        url: 'https://vidnary.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vidnary - AI UGC Videos',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vidnary | AI-Powered UGC Videos',
    description: 'Turn product images into viral UGC videos in minutes.',
    images: ['https://vidnary.com/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${syne.variable} ${dmSans.variable}`}>
      <body className="font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
