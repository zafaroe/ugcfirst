'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSubmitted(true)
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent password reset instructions"
      >
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-status-success/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-status-success" />
          </div>

          <p className="text-text-muted mb-6">
            We&apos;ve sent a password reset link to{' '}
            <span className="text-text-primary font-medium">{email}</span>
          </p>

          <p className="text-sm text-text-muted mb-6">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-mint hover:text-coral transition-colors"
            >
              try again
            </button>
          </p>

          <Link href="/login">
            <Button variant="secondary" className="w-full">
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you reset instructions"
    >
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-text-muted mt-6">
        <Link
          href="/login"
          className="text-mint hover:text-coral transition-colors font-medium inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
