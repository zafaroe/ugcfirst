'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faCreditCard, faLink, faBell } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { cn } from '@/lib/utils'
import { FadeIn, SPRING } from '@/components/ui'

const settingsTabs: { label: string; href: string; icon: IconDefinition }[] = [
  { label: 'Profile', href: '/settings', icon: faUser },
  { label: 'Billing', href: '/settings/billing', icon: faCreditCard },
  { label: 'Integrations', href: '/settings/integrations', icon: faLink },
  { label: 'Notifications', href: '/settings/notifications', icon: faBell },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-muted mt-1">
            Manage your account settings and preferences
          </p>
        </FadeIn>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <nav className="flex gap-1 -mb-px">
            {settingsTabs.map((tab) => {
              const isActive = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <FontAwesomeIcon
                    icon={tab.icon}
                    className={cn(
                      'w-4 h-4 transition-all',
                      isActive && 'text-electric-indigo drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                    )}
                  />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="settings-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia"
                      transition={SPRING.bouncy}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </DashboardLayout>
  )
}
