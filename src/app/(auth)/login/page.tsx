'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faEye, faEyeSlash, faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleAuth = async () => {
    const supabase = getBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = getBrowserClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        // Use router.refresh() to update the server-side session state,
        // then full-page redirect to ensure cookies are sent properly.
        // This is critical for production (Vercel) where soft navigation
        // races with cookie propagation.
        router.refresh()

        // Check onboarding via user_metadata (same source as middleware)
        const isOnboarded = data.session.user.user_metadata?.onboarded === true
        if (!isOnboarded) {
          window.location.href = '/onboarding'
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue creating amazing videos"
    >
      {/* Animated error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="p-3 mb-4 text-sm text-status-error bg-status-error/10 rounded-lg border border-status-error/20 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faLock} className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-text-primary transition-colors"
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEyeSlash} className="w-4 h-4" />
                ) : (
                  <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                )}
              </button>
            }
            required
          />
        </motion.div>

        <motion.div
          className="flex items-center justify-between text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="rounded border-border-default bg-cream text-mint focus:ring-mint transition-colors"
            />
            <span className="text-text-muted group-hover:text-text-primary transition-colors">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-mint hover:text-mint-dark transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        className="relative my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-surface text-text-muted">Or continue with</span>
        </div>
      </motion.div>

      {/* Social login */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button variant="secondary" className="w-full group" onClick={handleGoogleAuth}>
          <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      <motion.p
        className="text-center text-sm text-text-muted mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-mint hover:text-mint-dark transition-colors font-medium"
        >
          Sign up for free
        </Link>
      </motion.p>
    </AuthLayout>
  )
}
