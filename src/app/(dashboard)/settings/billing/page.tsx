'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faPlus, faArrowTurnUp, faArrowTurnDown, faRotate, faCreditCard } from '@fortawesome/free-solid-svg-icons'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard, GradientCard, StaggerContainer, StaggerItem, EASINGS } from '@/components/ui'
import { EmptyState, emptyStatePresets } from '@/components/composed'
import { mockPricingPlans, mockCreditPacks } from '@/mocks/data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getBrowserClient } from '@/lib/supabase'

interface CreditBalance {
  balance: number
  held: number
  available: number
  lifetime?: {
    purchased: number
    used: number
    refunded: number
  }
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  createdAt: string
}

export default function BillingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userPlan, setUserPlan] = useState<string>('free')

  // Reusable function to fetch credits
  const fetchCredits = async () => {
    try {
      const { data: { session } } = await getBrowserClient().auth.getSession()
      if (!session?.access_token) return

      const creditsResponse = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (creditsResponse.ok) {
        const creditsResult = await creditsResponse.json()
        if (creditsResult.success) {
          setCredits(creditsResult.data)
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const { data: { session } } = await getBrowserClient().auth.getSession()

        if (!session?.user) {
          setIsLoading(false)
          return
        }

        // Fetch credits
        await fetchCredits()

        // Fetch transaction history
        const historyResponse = await fetch('/api/credits/history', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (historyResponse.ok) {
          const historyResult = await historyResponse.json()
          if (historyResult.success && historyResult.data?.transactions) {
            setTransactions(historyResult.data.transactions)
          }
        }

        // Get user plan from metadata (for now, default to free)
        setUserPlan(session.user.user_metadata?.plan || 'free')
      } catch (error) {
        console.error('Error fetching billing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillingData()
  }, [])

  // Listen for credit updates from other pages
  useEffect(() => {
    const handleCreditsUpdated = () => {
      fetchCredits()
    }

    window.addEventListener('credits-updated', handleCreditsUpdated)
    return () => window.removeEventListener('credits-updated', handleCreditsUpdated)
  }, [])

  const currentPlan = mockPricingPlans.find(p => p.id === userPlan)
  // Calculate usage percent based on lifetime purchased (not plan credits)
  const creditUsagePercent = credits?.lifetime?.purchased && credits.lifetime.purchased > 0
    ? Math.min((credits.lifetime.used / credits.lifetime.purchased) * 100, 100)
    : 0
  // Mock: set to false to test empty state
  const hasPaymentMethod = true

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <FontAwesomeIcon icon={faRotate} className="w-4 h-4 text-mint" />
      case 'purchase':
        return <FontAwesomeIcon icon={faPlus} className="w-4 h-4 text-status-success" />
      case 'usage':
        return <FontAwesomeIcon icon={faArrowTurnDown} className="w-4 h-4 text-status-warning" />
      case 'refund':
        return <FontAwesomeIcon icon={faArrowTurnUp} className="w-4 h-4 text-status-success" />
      default:
        return <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Credit Overview */}
      <motion.div
        className="grid md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GradientCard variant="default" padding="lg" className="md:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <CardTitle>Credit Balance</CardTitle>
              <CardDescription>Your current credit balance and usage</CardDescription>
            </div>
            <Button size="sm">
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <motion.div
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-mint/30 to-coral/30 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FontAwesomeIcon icon={faBolt} className="w-8 h-8 text-mint" />
            </motion.div>
            <div>
              {isLoading ? (
                <Skeleton className="w-32 h-10" />
              ) : (
                <>
                  <span className="text-4xl font-bold text-text-primary">{credits?.balance ?? 0}</span>
                  <span className="text-text-muted ml-2">Credits Available</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Credits Used</span>
              {isLoading ? (
                <Skeleton className="w-20 h-4" />
              ) : (
                <span className="text-text-primary">
                  {credits?.lifetime?.used ?? 0} / {credits?.lifetime?.purchased ?? 0} purchased
                </span>
              )}
            </div>
            <Progress value={creditUsagePercent} size="md" />
          </div>
        </GradientCard>

        <GlassCard>
          <CardTitle className="mb-4">Current Plan</CardTitle>
          <div className="space-y-4">
            <div>
              <Badge variant="purple" size="md">{currentPlan?.name || 'Free'}</Badge>
              <p className="text-2xl font-bold text-text-primary mt-2">
                {formatCurrency(currentPlan?.price || 0)}
                <span className="text-sm font-normal text-text-muted">/month</span>
              </p>
            </div>
            <p className="text-sm text-text-muted">
              {currentPlan?.credits} credits • {currentPlan?.videoCount} videos/month
            </p>
            <Button variant="secondary" className="w-full">
              Manage Subscription
            </Button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Credit Packs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <CardTitle className="mb-4">Buy Credit Packs</CardTitle>
          <CardDescription className="mb-6">
            Top up your credits anytime. Purchased credits never expire.
          </CardDescription>
          <StaggerContainer className="grid sm:grid-cols-3 gap-4" staggerDelay={0.1}>
            {mockCreditPacks.map(pack => (
              <StaggerItem key={pack.id}>
                <motion.div
                  className="p-5 rounded-xl border border-border-default bg-surface/50 backdrop-blur-sm hover:border-mint/50 transition-all cursor-pointer"
                  whileHover={{ y: -4, boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
                >
                  <h4 className="font-medium text-text-primary mb-1">{pack.name}</h4>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatCurrency(pack.price)}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {pack.credits} credits • {formatCurrency(pack.costPerVideo)}/video
                  </p>
                  <Button variant="secondary" size="sm" className="w-full mt-4">
                    Buy Now
                  </Button>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </GlassCard>
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <CardTitle className="mb-4">Transaction History</CardTitle>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div>
                      <Skeleton className="w-40 h-4 mb-2" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-20 h-4" />
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <StaggerContainer className="space-y-4" staggerDelay={0.05}>
              {transactions.map(transaction => (
                <StaggerItem key={transaction.id}>
                  <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface/80 flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${
                      transaction.amount > 0 ? 'text-status-success' : 'text-text-primary'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <EmptyState
              {...emptyStatePresets.noBillingHistory}
              size="sm"
            />
          )}
        </GlassCard>
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Payment Method</CardTitle>
            {hasPaymentMethod && (
              <Button variant="ghost" size="sm">
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                Add New
              </Button>
            )}
          </div>
          {hasPaymentMethod ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border-default bg-surface/30">
              <div className="w-12 h-8 rounded bg-surface/80 flex items-center justify-center">
                <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">•••• •••• •••• 4242</p>
                <p className="text-xs text-text-muted">Expires 12/25</p>
              </div>
              <Badge variant="success" size="sm">Default</Badge>
            </div>
          ) : (
            <EmptyState
              {...emptyStatePresets.noPaymentMethod}
              size="sm"
              action={{
                label: 'Add Payment Method',
                onClick: () => console.log('Add payment method'),
                icon: <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />,
              }}
            />
          )}
        </GlassCard>
      </motion.div>
    </div>
  )
}
