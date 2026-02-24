'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faBolt, faChevronDown, faRightFromBracket, faGear, faUser } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getBrowserClient } from '@/lib/supabase'
import { Avatar, Logo, DURATIONS, EASINGS, SPRING, Skeleton } from '@/components/ui'

interface UserData {
  id: string
  email: string
  name: string
  avatar?: string
}

interface CreditBalance {
  balance: number
  held: number
  available: number
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Explore', href: '/explore' },
  { label: 'Templates', href: '/templates' },
  { label: 'Settings', href: '/settings' },
]

// Animation variants
const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeOut,
      staggerChildren: 0.05,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    },
  },
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to fetch credits - reusable for both mount and updates
  const fetchCredits = async () => {
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) return

      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCredits(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  // Fetch user and credits on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          setIsLoading(false)
          return
        }

        // Set user data from session
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url,
        })

        // Fetch credits from API
        await fetchCredits()
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()

    // Listen for auth changes
    const { data: { subscription } } = getBrowserClient().auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setCredits(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Listen for credit updates from other pages (e.g., after generation)
  useEffect(() => {
    const handleCreditsUpdated = () => {
      fetchCredits()
    }

    window.addEventListener('credits-updated', handleCreditsUpdated)
    return () => window.removeEventListener('credits-updated', handleCreditsUpdated)
  }, [])

  // Handle sign out
  const handleSignOut = async () => {
    await getBrowserClient().auth.signOut()
    setUser(null)
    setCredits(null)
    setIsUserMenuOpen(false)
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING.bouncy}
          >
            <Logo variant="light" size="sm" />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'text-text-primary bg-surface'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
                  )}
                >
                  {item.label}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Credits - Enhanced gradient badge */}
          <Link href="/settings/billing">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="relative flex items-center gap-2 bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white px-4 py-2 rounded-full shadow-lg overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
              />

              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
                className="relative z-10"
              >
                <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
              </motion.div>
              {isLoading ? (
                <Skeleton className="w-16 h-4" />
              ) : (
                <span className="font-bold relative z-10">{credits?.balance ?? 0} Credits</span>
              )}
            </motion.div>
          </Link>

          {/* User menu */}
          <div className="relative">
            <motion.button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 transition-opacity"
            >
              <Avatar
                src={user?.avatar}
                fallback={user?.name || 'User'}
                size="sm"
              />
              <motion.div
                animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                transition={{ duration: DURATIONS.fast, ease: EASINGS.easeOut }}
                className="hidden sm:block"
              >
                <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-text-muted" />
              </motion.div>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <motion.div
                    className="absolute right-0 mt-2 w-56 bg-surface/80 backdrop-blur-lg rounded-xl shadow-xl border border-white/10 py-1 z-50 origin-top-right"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <motion.div
                      className="px-4 py-3 border-b border-white/10"
                      variants={menuItemVariants}
                    >
                      <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
                      <p className="text-xs text-text-muted">{user?.email || ''}</p>
                    </motion.div>
                    <motion.div variants={menuItemVariants}>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-deep-space transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                        Profile
                      </Link>
                    </motion.div>
                    <motion.div variants={menuItemVariants}>
                      <Link
                        href="/settings/billing"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-deep-space transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                        Settings
                      </Link>
                    </motion.div>
                    <motion.div
                      className="border-t border-white/10 mt-1 pt-1"
                      variants={menuItemVariants}
                    >
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-status-error hover:bg-deep-space transition-colors w-full text-left"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faBars} className="w-5 h-5 text-text-primary" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}
