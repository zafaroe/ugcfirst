'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera } from '@fortawesome/free-solid-svg-icons'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard, SPRING, EASINGS } from '@/components/ui'
import { ConnectedAccounts } from '@/components/composed'
import { getBrowserClient } from '@/lib/supabase'

interface UserData {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export default function ProfileSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [user, setUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await getBrowserClient().auth.getSession()

        if (!session?.user) {
          setIsPageLoading(false)
          return
        }

        const userData: UserData = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
        }

        setUser(userData)
        setFormData({
          name: userData.name,
          email: userData.email,
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsPageLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <div className="flex items-center gap-6">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={SPRING.gentle}
            >
              {isPageLoading ? (
                <Skeleton className="w-16 h-16 rounded-full" />
              ) : (
                <Avatar
                  src={user?.avatar}
                  fallback={user?.name || 'User'}
                  size="xl"
                />
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-mint flex items-center justify-center hover:bg-mint/80 transition-colors"
              >
                <FontAwesomeIcon icon={faCamera} className="w-4 h-4 text-white" />
              </motion.button>
            </motion.div>
            <div>
              {isPageLoading ? (
                <>
                  <Skeleton className="w-32 h-6 mb-2" />
                  <Skeleton className="w-48 h-4 mb-2" />
                  <Skeleton className="w-24 h-4" />
                </>
              ) : (
                <>
                  <CardTitle className="mb-1">{user?.name || 'User'}</CardTitle>
                  <CardDescription>{user?.email || ''}</CardDescription>
                  <p className="text-sm text-text-muted mt-2">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    }) : 'Unknown'}
                  </p>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <CardTitle className="mb-4">Profile Information</CardTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              helperText="Changing email will require verification"
            />
            <div className="pt-4">
              <Button type="submit" isLoading={isLoading}>
                Save Changes
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>

      {/* Connected Accounts */}
      <ConnectedAccounts />

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <CardTitle className="mb-4">Change Password</CardTitle>
          <form className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              helperText="Minimum 8 characters"
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
            />
            <div className="pt-4">
              <Button type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
        whileHover={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}
        className="rounded-xl"
      >
        <GlassCard className="border border-status-error/30 hover:border-status-error/50 transition-colors">
          <CardTitle className="text-status-error mb-2">Danger Zone</CardTitle>
          <CardDescription className="mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
          <Button variant="destructive">
            Delete Account
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  )
}
