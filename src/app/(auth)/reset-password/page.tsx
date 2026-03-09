'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faEye, faEyeSlash, faExclamationCircle, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getBrowserClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const supabase = getBrowserClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      setIsSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your password has been successfully changed"
      >
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-status-success/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-status-success" />
          </div>
          <p className="text-text-muted mb-4">
            Redirecting you to the dashboard...
          </p>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Enter your new password below"
    >
      <Card padding="lg">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-4 text-sm text-status-error bg-status-error/10 rounded-lg border border-status-error/20 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faLock} className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-text-primary transition-colors"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
              </button>
            }
            required
          />

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<FontAwesomeIcon icon={faLock} className="w-4 h-4" />}
            required
          />

          <p className="text-xs text-text-muted">
            Password must be at least 8 characters
          </p>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Update Password
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
