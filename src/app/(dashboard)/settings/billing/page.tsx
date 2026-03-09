'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faPlus,
  faArrowTurnUp,
  faArrowTurnDown,
  faRotate,
  faCreditCard,
  faExternalLinkAlt,
  faCheck,
  faArrowUp,
  faArrowDown,
  faTimes,
  faTrash,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { faCcVisa, faCcMastercard, faCcAmex, faCcDiscover } from '@fortawesome/free-brands-svg-icons'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassCard, GradientCard, StaggerContainer, StaggerItem, EASINGS } from '@/components/ui'
import { EmptyState, emptyStatePresets } from '@/components/composed'
import { SUBSCRIPTION_PLANS, CREDIT_PACKS, getPlanById } from '@/config/pricing'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getBrowserClient } from '@/lib/supabase'
import {
  redirectToCheckout,
  redirectToPortal,
  fetchPriceIds,
  previewPlanChange,
  changePlan,
  fetchPaymentMethods,
  removePaymentMethod,
  type ProrationPreview,
  type PaymentMethod,
} from '@/lib/stripe-client'

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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active')
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loadingPack, setLoadingPack] = useState<string | null>(null)
  const [stripePrices, setStripePrices] = useState<{
    credit_packs: Record<string, { price: string; credits: number }>
  } | null>(null)

  // Plan change modal state
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [prorationPreview, setProrationPreview] = useState<ProrationPreview | null>(null)
  const [changingPlan, setChangingPlan] = useState(false)
  const [planChangeError, setPlanChangeError] = useState<string | null>(null)

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [removingPaymentMethod, setRemovingPaymentMethod] = useState<string | null>(null)
  const [confirmDeletePaymentMethod, setConfirmDeletePaymentMethod] = useState<PaymentMethod | null>(null)

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

  // Fetch payment methods
  const loadPaymentMethods = async () => {
    try {
      const methods = await fetchPaymentMethods()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  useEffect(() => {
    async function fetchBillingData() {
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()

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

        // Fetch user subscription info from user_credits table
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id')
          .eq('user_id', session.user.id)
          .single()

        if (userCredits) {
          setUserPlan(userCredits.subscription_tier || 'free')
          setSubscriptionStatus(userCredits.subscription_status || 'active')
          setHasStripeCustomer(!!userCredits.stripe_customer_id)
          setHasSubscription(!!userCredits.stripe_subscription_id)
        }

        // Fetch Stripe prices
        const prices = await fetchPriceIds()
        setStripePrices(prices)

        // Fetch payment methods
        await loadPaymentMethods()
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

  const currentPlan = getPlanById(userPlan) || SUBSCRIPTION_PLANS[0]
  // Calculate usage percent based on lifetime purchased (not plan credits)
  const creditUsagePercent = credits?.lifetime?.purchased && credits.lifetime.purchased > 0
    ? Math.min((credits.lifetime.used / credits.lifetime.purchased) * 100, 100)
    : 0

  const handleBuyCreditPack = async (packId: string) => {
    if (!stripePrices?.credit_packs[packId]) {
      console.error('Price not found for pack:', packId)
      return
    }

    setLoadingPack(packId)
    try {
      await redirectToCheckout(stripePrices.credit_packs[packId].price, packId)
    } catch (error) {
      console.error('Checkout error:', error)
      setLoadingPack(null)
    }
  }

  const handleOpenPlanModal = () => {
    setShowPlanModal(true)
    setSelectedPlan(null)
    setProrationPreview(null)
    setPlanChangeError(null)
  }

  const handleSelectPlan = async (planId: string) => {
    if (planId === userPlan) return

    setSelectedPlan(planId)
    setPreviewLoading(true)
    setPlanChangeError(null)

    try {
      const preview = await previewPlanChange(planId)
      setProrationPreview(preview)
    } catch (error) {
      setPlanChangeError(error instanceof Error ? error.message : 'Failed to preview plan change')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return

    setChangingPlan(true)
    setPlanChangeError(null)

    try {
      const result = await changePlan(selectedPlan)
      if (result.success) {
        setUserPlan(selectedPlan)
        setShowPlanModal(false)
        // Refresh credits if credits were added
        if (result.creditsAdded > 0) {
          await fetchCredits()
        }
        // Refresh the page data
        window.location.reload()
      }
    } catch (error) {
      setPlanChangeError(error instanceof Error ? error.message : 'Failed to change plan')
    } finally {
      setChangingPlan(false)
    }
  }

  const handleRemovePaymentMethod = async () => {
    if (!confirmDeletePaymentMethod) return

    const paymentMethodId = confirmDeletePaymentMethod.id
    setRemovingPaymentMethod(paymentMethodId)
    try {
      await removePaymentMethod(paymentMethodId)
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId))
      setConfirmDeletePaymentMethod(null)
    } catch (error) {
      console.error('Error removing payment method:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove payment method')
    } finally {
      setRemovingPaymentMethod(null)
    }
  }

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

  const getCardIcon = (brand: string): typeof faCreditCard => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return faCcVisa as unknown as typeof faCreditCard
      case 'mastercard':
        return faCcMastercard as unknown as typeof faCreditCard
      case 'amex':
        return faCcAmex as unknown as typeof faCreditCard
      case 'discover':
        return faCcDiscover as unknown as typeof faCreditCard
      default:
        return faCreditCard
    }
  }

  // Filter plans for upgrade/downgrade (exclude free and current plan)
  const availablePlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'free')

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
            <Button
              size="sm"
              onClick={() => {
                document.getElementById('credit-packs-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
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
            {hasSubscription ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleOpenPlanModal}
              >
                <FontAwesomeIcon icon={faRotate} className="w-3 h-3 mr-2" />
                Change Plan
              </Button>
            ) : userPlan === 'free' ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/pricing'}
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3 mr-2" />
                Upgrade Now
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => redirectToPortal()}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3 mr-2" />
                Manage in Stripe
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Credit Packs */}
      <motion.div
        id="credit-packs-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <CardTitle className="mb-4">Buy Credit Packs</CardTitle>
          <CardDescription className="mb-6">
            Top up your credits anytime. Purchased credits never expire.
          </CardDescription>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.1}>
            {CREDIT_PACKS.map(pack => (
              <StaggerItem key={pack.id}>
                <motion.div
                  className={`p-5 rounded-xl border border-border-default bg-surface/50 backdrop-blur-sm hover:border-mint/50 transition-all cursor-pointer ${
                    loadingPack === pack.id ? 'opacity-70' : ''
                  }`}
                  whileHover={{ y: -4, boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
                >
                  <h4 className="font-medium text-text-primary mb-1">{pack.name}</h4>
                  <p className="text-2xl font-bold text-text-primary">
                    {formatCurrency(pack.price)}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {pack.credits} credits • {formatCurrency(pack.costPerVideo)}/video
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleBuyCreditPack(pack.id)}
                    isLoading={loadingPack === pack.id}
                    disabled={loadingPack !== null && loadingPack !== pack.id}
                  >
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

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASINGS.easeOut }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Payment Methods</CardTitle>
            {hasStripeCustomer && (
              <Button variant="ghost" size="sm" onClick={() => redirectToPortal()}>
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4 mr-2" />
                Add New
              </Button>
            )}
          </div>
          {loadingPaymentMethods ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border-default">
                  <Skeleton className="w-12 h-8 rounded" />
                  <div className="flex-1">
                    <Skeleton className="w-32 h-4 mb-2" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                  <Skeleton className="w-16 h-8 rounded" />
                </div>
              ))}
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map(pm => (
                <div
                  key={pm.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border-default bg-surface/30"
                >
                  <div className="w-12 h-8 rounded bg-surface/80 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={getCardIcon(pm.brand)}
                      className="w-8 h-5 text-text-muted"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      {pm.brand?.charAt(0).toUpperCase()}{pm.brand?.slice(1)} ending in {pm.last4}
                      {pm.isDefault && (
                        <Badge variant="success" size="sm">Default</Badge>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      Expires {pm.expMonth}/{pm.expYear}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeletePaymentMethod(pm)}
                    disabled={removingPaymentMethod !== null}
                    className="text-status-error hover:text-status-error hover:bg-status-error/10"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : hasStripeCustomer ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border-default bg-surface/30">
              <div className="w-12 h-8 rounded bg-surface/80 flex items-center justify-center">
                <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">No payment methods</p>
                <p className="text-xs text-text-muted">Add a payment method to subscribe</p>
              </div>
            </div>
          ) : (
            <EmptyState
              {...emptyStatePresets.noPaymentMethod}
              size="sm"
              action={{
                label: 'Subscribe to Add Payment',
                onClick: () => window.location.href = '/pricing',
                icon: <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />,
              }}
            />
          )}
        </GlassCard>
      </motion.div>

      {/* Plan Change Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !changingPlan && setShowPlanModal(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-2xl bg-surface-raised border border-border-default rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-default">
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Change Your Plan</h2>
                  <p className="text-sm text-text-muted mt-1">
                    Current plan: <span className="font-medium text-mint">{currentPlan?.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => !changingPlan && setShowPlanModal(false)}
                  className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              {/* Plan Selection */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {availablePlans.map(plan => {
                  const isCurrentPlan = plan.id === userPlan
                  const isSelected = plan.id === selectedPlan
                  const isUpgrade = (plan.credits || 0) > (currentPlan?.credits || 0)

                  return (
                    <motion.div
                      key={plan.id}
                      onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isCurrentPlan
                          ? 'border-border-default bg-surface/30 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-mint bg-mint/10 cursor-pointer'
                          : 'border-border-default hover:border-mint/50 cursor-pointer'
                      }`}
                      whileHover={!isCurrentPlan ? { scale: 1.01 } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-mint text-white' : 'bg-surface/80'
                          }`}>
                            {isSelected ? (
                              <FontAwesomeIcon icon={faCheck} className="w-5 h-5" />
                            ) : (
                              <FontAwesomeIcon
                                icon={isUpgrade ? faArrowUp : faArrowDown}
                                className={`w-5 h-5 ${isUpgrade ? 'text-status-success' : 'text-status-warning'}`}
                              />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                              {plan.isPopular && (
                                <Badge variant="purple" size="sm">
                                  <FontAwesomeIcon icon={faStar} className="w-3 h-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                              {isCurrentPlan && (
                                <Badge variant="default" size="sm">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-text-muted">
                              {plan.credits} credits • {plan.videoCount} videos/month
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-text-primary">
                            {formatCurrency(plan.price)}
                            <span className="text-sm font-normal text-text-muted">/mo</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {/* Proration Preview */}
                {previewLoading && (
                  <div className="p-4 rounded-xl bg-surface/50 border border-border-default">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
                      <span className="text-text-muted">Calculating price adjustment...</span>
                    </div>
                  </div>
                )}

                {prorationPreview && !previewLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-surface/50 border border-mint/30"
                  >
                    <h4 className="font-medium text-text-primary mb-3">Price Adjustment</h4>
                    <div className="space-y-2 text-sm">
                      {prorationPreview.isUpgrade ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Immediate charge (prorated)</span>
                            <span className="font-medium text-text-primary">
                              {formatCurrency(prorationPreview.immediateCharge)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">Bonus credits (upgrade)</span>
                            <span className="font-medium text-status-success">
                              +{prorationPreview.creditsDifference} credits
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Credit applied to next bill</span>
                          <span className="font-medium text-status-success">
                            -{formatCurrency(prorationPreview.credit)}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-border-default flex justify-between">
                        <span className="text-text-muted">Next billing amount</span>
                        <span className="font-semibold text-text-primary">
                          {formatCurrency(prorationPreview.nextBillingAmount)}/mo
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {planChangeError && (
                  <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30">
                    <p className="text-sm text-status-error">{planChangeError}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border-default bg-surface/50">
                <Button
                  variant="secondary"
                  onClick={() => setShowPlanModal(false)}
                  disabled={changingPlan}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmPlanChange}
                  disabled={!selectedPlan || previewLoading || changingPlan}
                  isLoading={changingPlan}
                >
                  {prorationPreview?.isUpgrade ? 'Upgrade Plan' : 'Change Plan'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Payment Method Confirmation Modal */}
      <AnimatePresence>
        {confirmDeletePaymentMethod && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !removingPaymentMethod && setConfirmDeletePaymentMethod(null)}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md bg-surface-raised border border-border-default rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-border-default">
                <h2 className="text-xl font-semibold text-text-primary">Remove Payment Method</h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border-default bg-surface/30 mb-4">
                  <div className="w-12 h-8 rounded bg-surface/80 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={getCardIcon(confirmDeletePaymentMethod.brand)}
                      className="w-8 h-5 text-text-muted"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {confirmDeletePaymentMethod.brand?.charAt(0).toUpperCase()}{confirmDeletePaymentMethod.brand?.slice(1)} ending in {confirmDeletePaymentMethod.last4}
                    </p>
                    <p className="text-xs text-text-muted">
                      Expires {confirmDeletePaymentMethod.expMonth}/{confirmDeletePaymentMethod.expYear}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-text-muted">
                  Are you sure you want to remove this payment method? This action cannot be undone.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border-default bg-surface/50">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDeletePaymentMethod(null)}
                  disabled={removingPaymentMethod !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRemovePaymentMethod}
                  isLoading={removingPaymentMethod === confirmDeletePaymentMethod.id}
                  className="bg-status-error hover:bg-status-error/90"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4 mr-2" />
                  Remove Card
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
