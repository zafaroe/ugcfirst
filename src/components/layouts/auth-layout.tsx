'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo, GradientOrb, CornerStar, EASINGS } from '@/components/ui'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  badge?: React.ReactNode
}

export function AuthLayout({ children, title, subtitle, badge }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-deep-space bg-grid bg-grid-animated flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb
          color="indigo"
          size="xl"
          position={{ top: '-20%', right: '-15%' }}
          animated
        />
        <GradientOrb
          color="fuchsia"
          size="lg"
          position={{ bottom: '-10%', left: '-10%' }}
          animated
        />
      </div>

      {/* Corner stars */}
      <CornerStar position="bottom-right" />

      {/* Header */}
      <motion.header
        className="p-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASINGS.easeOut }}
      >
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Logo variant="light" size="sm" />
          </motion.div>
        </Link>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASINGS.easeOut }}
        >
          {/* Badge (e.g., "10 Free Credits") */}
          {badge && (
            <motion.div
              className="flex justify-center mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {badge}
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-text-primary mb-2">{title}</h1>
            {subtitle && (
              <p className="text-text-muted">{subtitle}</p>
            )}
          </motion.div>

          {/* Content card with gradient border */}
          <motion.div
            className="gradient-border-glow p-6 sm:p-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="p-6 text-center text-sm text-text-muted relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <p>&copy; {new Date().getFullYear()} Vidnary. All rights reserved.</p>
      </motion.footer>
    </div>
  )
}
