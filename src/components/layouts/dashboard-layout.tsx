import { TopNav } from '@/components/blocks/navigation/top-nav'
import { GradientOrb, FloatingStars } from '@/components/ui'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-deep-space bg-grid bg-grid-animated flex flex-col relative">
      {/* Premium Background Layers */}
      <div className="noise-overlay" aria-hidden="true" />
      <div className="gradient-mesh" aria-hidden="true" />
      <div className="spotlight" aria-hidden="true" />

      {/* Ambient light orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GradientOrb color="indigo" size="xl" position={{ top: '-15%', right: '-10%' }} animated />
        <GradientOrb color="fuchsia" size="lg" position={{ bottom: '10%', left: '-5%' }} animated />
        <FloatingStars count={4} />
      </div>

      <TopNav />
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 flex-1 w-full">
        {children}
      </main>
      <footer className="py-4 text-center text-sm relative z-10">
        <span className="text-text-muted">Built by </span>
        <span className="text-text-primary">Ussama (Austin)</span>
        <span className="text-text-muted"> & </span>
        <span className="text-text-primary">Ammar Khan</span>
        <span className="text-text-muted">, </span>
        <span className="bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia bg-clip-text text-transparent">Co-Founders</span>
      </footer>
    </div>
  )
}
