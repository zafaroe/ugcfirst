'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faEye, faEyeSlash, faUser, faGift } from '@fortawesome/free-solid-svg-icons'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Free credits badge component
function FreeCreditsButton() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white text-sm font-semibold animate-pulse-glow">
      <FontAwesomeIcon icon={faGift} className="w-4 h-4" />
      <span>10 Free Credits</span>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate signup delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Navigate to onboarding
    router.push('/onboarding')
  }

  return (
    <AuthLayout
      title="Create Account"
      badge={<FreeCreditsButton />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          leftIcon={<FontAwesomeIcon icon={faUser} className="w-4 h-4" />}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          leftIcon={<FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
          required
        />

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
          helperText="Must be at least 8 characters"
          required
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 rounded border-border-default bg-deep-space text-electric-indigo focus:ring-electric-indigo"
            required
          />
          <label htmlFor="terms" className="text-sm text-text-muted">
            I agree to the{' '}
            <Link href="/terms" className="text-electric-indigo hover:text-vibrant-fuchsia transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-electric-indigo hover:text-vibrant-fuchsia transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Create Account
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-text-muted">Or continue with</span>
        </div>
      </div>

      {/* Social signup */}
      <Button variant="secondary" className="w-full">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-electric-indigo hover:text-vibrant-fuchsia transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
