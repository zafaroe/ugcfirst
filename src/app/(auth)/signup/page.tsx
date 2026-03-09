'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faEye, faEyeSlash, faUser, faGift, faCheck, faExclamationCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase'

// Free credits badge component with animation
function FreeCreditsButton() {
  return (
    <motion.div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-mint to-mint-dark text-white text-sm font-semibold shadow-glow"
      animate={{
        boxShadow: [
          '0 0 20px rgba(16, 185, 129, 0.3)',
          '0 0 30px rgba(16, 185, 129, 0.5)',
          '0 0 20px rgba(16, 185, 129, 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FontAwesomeIcon icon={faGift} className="w-4 h-4" />
      </motion.div>
      <span>10 Free Credits</span>
    </motion.div>
  )
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const getStrengthLabel = () => {
    if (password.length === 0) return ''
    if (strength <= 1) return 'Weak'
    if (strength <= 2) return 'Fair'
    if (strength <= 3) return 'Good'
    return 'Strong'
  }

  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-status-error'
    if (strength <= 2) return 'bg-amber'
    if (strength <= 3) return 'bg-mint'
    return 'bg-mint-dark'
  }

  if (password.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={`h-1 flex-1 rounded-full ${level <= strength ? getStrengthColor() : 'bg-border-default'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level <= strength ? 1 : 1 }}
            transition={{ delay: level * 0.05, type: 'spring' }}
          />
        ))}
      </div>
      <p className={`text-xs ${strength <= 1 ? 'text-status-error' : strength <= 2 ? 'text-amber' : 'text-mint'}`}>
        Password strength: {getStrengthLabel()}
      </p>
    </motion.div>
  )
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planFromUrl = searchParams.get('plan')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

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
      let supabase
      try {
        supabase = getBrowserClient()
      } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError)
        setError('Service configuration error. Please contact support.')
        setIsLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (authError) {
        // User-friendly error messages
        if (authError.message.includes('User already registered')) {
          setError('An account with this email already exists. Try signing in instead.')
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Check if email confirmation is needed
        if (data.user.identities?.length === 0) {
          // Email already exists (duplicate signup attempt)
          setError('An account with this email already exists. Try signing in instead.')
          setIsLoading(false)
          return
        }

        // If session exists, user is immediately authenticated (email confirmation disabled)
        if (data.session) {
          const redirectUrl = planFromUrl ? `/onboarding?plan=${planFromUrl}` : '/onboarding'
          router.push(redirectUrl)
          return
        }

        // No session = email confirmation required
        setSignupEmail(formData.email)
        setSignupComplete(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Signup error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage.includes('Supabase') ? 'Service temporarily unavailable. Please try again.' : errorMessage)
      setIsLoading(false)
    }
  }

  // Show confirmation screen after successful signup (email confirmation required)
  if (signupComplete) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a confirmation link"
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Email icon with animation */}
          <motion.div
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center mb-6"
            animate={{
              boxShadow: [
                '0 0 20px rgba(16, 185, 129, 0.3)',
                '0 0 40px rgba(16, 185, 129, 0.5)',
                '0 0 20px rgba(16, 185, 129, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FontAwesomeIcon icon={faPaperPlane} className="w-8 h-8 text-white" />
          </motion.div>

          <motion.p
            className="text-text-muted mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            We sent a confirmation link to
          </motion.p>

          <motion.p
            className="text-text-primary font-semibold mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {signupEmail}
          </motion.p>

          <motion.p
            className="text-sm text-text-muted mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Click the link in your email to activate your account, then sign in to get started.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.p
            className="text-center text-sm text-text-muted mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Didn't receive the email?{' '}
            <button
              onClick={() => {
                setSignupComplete(false)
                setError('')
              }}
              className="text-mint hover:text-mint-dark transition-colors font-medium"
            >
              Try again
            </button>
          </motion.p>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start creating viral videos in minutes"
      badge={<FreeCreditsButton />}
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
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            leftIcon={<FontAwesomeIcon icon={faUser} className="w-4 h-4" />}
            success={formData.name.length >= 2}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            leftIcon={<FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
            success={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          <PasswordStrength password={formData.password} />
        </motion.div>

        <motion.div
          className="flex items-start gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <input
            type="checkbox"
            id="terms"
            className="mt-1 rounded border-border-default bg-cream text-mint focus:ring-mint cursor-pointer"
            required
          />
          <label htmlFor="terms" className="text-sm text-text-muted">
            I agree to the{' '}
            <Link href="/terms" className="text-mint hover:text-mint-dark transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-mint hover:text-mint-dark transition-colors">
              Privacy Policy
            </Link>
          </label>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div
        className="relative my-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-surface text-text-muted">Or continue with</span>
        </div>
      </motion.div>

      {/* Social signup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
        transition={{ delay: 0.45 }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-mint hover:text-mint-dark transition-colors font-medium"
        >
          Sign in
        </Link>
      </motion.p>
    </AuthLayout>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
