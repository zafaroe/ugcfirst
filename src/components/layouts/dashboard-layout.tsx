'use client'

import { TopNav } from '@/components/blocks/navigation/top-nav'
import { GradientOrb } from '@/components/ui'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Single subtle gradient orb - top right */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GradientOrb
          color="mint"
          size="xl"
          position={{ top: '-20%', right: '-15%' }}
          animated={false}
        />
      </div>

      {/* Very subtle dot pattern - uses CSS class for theme support */}
      <div
        className="fixed inset-0 pointer-events-none dot-pattern"
        aria-hidden="true"
      />

      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex-1 w-full">
        {children}
      </main>
      <footer className="py-6 text-center text-sm relative z-10 border-t border-border-subtle">
        <span className="text-text-muted">&copy; {new Date().getFullYear()} UGCFirst. All rights reserved.</span>
      </footer>
    </div>
  )
}
