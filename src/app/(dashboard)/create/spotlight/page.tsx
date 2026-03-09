'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight, faBox, faPalette, faClock, faWandMagicSparkles, faSpinner, faDownload, faRedo, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import * as LucideIcons from 'lucide-react'
import { Package, Link2, PenLine, RefreshCw } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { FadeIn, EASINGS } from '@/components/ui'
import {
  CreditBadge,
  EmptyState,
  emptyStatePresets,
  ManualProductForm,
  isManualProductValid,
  ProductPreview,
  InsufficientCreditsModal,
  LowCreditsBanner,
  VideoLimitModal,
} from '@/components/composed'
import { VisibilityToggle } from '@/components/composed/visibility-toggle'
import { ScheduleModal } from '@/components/composed/schedule-modal'
import { ScheduleUpgradeCard } from '@/components/composed/schedule-upgrade-card'
import { SPOTLIGHT_CATEGORIES, getSpotlightStyle, type SpotlightCategory, type SpotlightStyle } from '@/data/spotlight-styles'
import { calculateSpotlightCreditCost, type SpotlightDuration, CREDIT_COSTS } from '@/types/credits'
import { cn } from '@/lib/utils'
import type { CreditBalance } from '@/types/credits'
import type { ManualProductData } from '@/components/composed'
import type { FetchedProduct, GenerationStatus, VideoVisibility } from '@/types/generation'

type Step = 'product' | 'style' | 'duration' | 'review' | 'results'
type InputMode = 'saved' | 'url' | 'manual'

// Saved product from database
interface SavedProduct {
  id: string
  name: string
  description: string | null
  image_url: string
  images: string[]
  price: string | null
  features: string[]
  source: 'url' | 'manual'
  source_url: string | null
  generation_count: number
  last_used_at: string | null
  created_at: string
}

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'product', label: 'Product', icon: <FontAwesomeIcon icon={faBox} className="w-5 h-5" /> },
  { id: 'style', label: 'Style', icon: <FontAwesomeIcon icon={faPalette} className="w-5 h-5" /> },
  { id: 'duration', label: 'Duration', icon: <FontAwesomeIcon icon={faClock} className="w-5 h-5" /> },
  { id: 'review', label: 'Generate', icon: <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5" /> },
]

// Map backend GenerationStatus to progress percentage
const statusProgress: Record<GenerationStatus, number> = {
  queued: 10,
  analyzing: 20,
  scripting: 30,
  framing: 50,
  generating: 70,
  trimming: 80,
  captioning: 85,
  uploading: 95,
  completed: 100,
  failed: 0,
}

export default function SpotlightCreatePage() {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>('product')

  // Product input state
  const [inputMode, setInputMode] = useState<InputMode>('saved')
  const [productUrl, setProductUrl] = useState('')
  const [manualProduct, setManualProduct] = useState<ManualProductData | null>(null)
  const [fetchedProduct, setFetchedProduct] = useState<FetchedProduct | null>(null)
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)

  // Style selection
  const [selectedCategory, setSelectedCategory] = useState<SpotlightCategory | null>(null)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)

  // Duration selection
  const [selectedDuration, setSelectedDuration] = useState<SpotlightDuration>('5')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Results state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<VideoVisibility>('private')
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)

  // Credit state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [showVideoLimitModal, setShowVideoLimitModal] = useState(false)
  const [videoLimitData, setVideoLimitData] = useState<{ limit: number; used: number } | null>(null)

  // Schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [userPlan, setUserPlan] = useState<'free' | 'starter' | 'pro' | 'scale'>('free')

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100

  const creditCost = calculateSpotlightCreditCost(selectedDuration)
  const selectedStyle = selectedCategory && selectedStyleId
    ? getSpotlightStyle(selectedCategory, selectedStyleId)
    : null

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const canStartManual = manualProduct ? isManualProductValid(manualProduct) : false

  // Fetch credit balance and saved products on mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch('/api/credits/balance', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        if (data.success) {
          setCreditBalance(data.data)
          if (data.data.subscriptionTier) {
            setUserPlan(data.data.subscriptionTier)
          }
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err)
      }
    }
    fetchCredits()
  }, [])

  // Fetch saved products on mount
  useEffect(() => {
    const fetchSavedProducts = async () => {
      setIsLoadingSaved(true)
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        if (data.success && data.products) {
          setSavedProducts(data.products)
        }
      } catch (err) {
        console.error('Failed to fetch saved products:', err)
      } finally {
        setIsLoadingSaved(false)
      }
    }
    fetchSavedProducts()
  }, [])

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const fetchProductFromUrl = async () => {
    if (!productUrl || !isValidUrl(productUrl)) return

    setIsFetchingProduct(true)
    setFetchError(null)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch product')

      setFetchedProduct(data.data)
      setCurrentStep('style')
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch product')
    } finally {
      setIsFetchingProduct(false)
    }
  }

  const startFromManual = () => {
    if (!manualProduct || !isManualProductValid(manualProduct)) return

    setFetchedProduct({
      name: manualProduct.name,
      image: manualProduct.imagePreview || '',
      description: manualProduct.description || undefined,
      features: manualProduct.features || [],
      source: 'manual',
    })
    setCurrentStep('style')
  }

  const selectSavedProduct = (product: SavedProduct) => {
    setFetchedProduct({
      name: product.name,
      image: product.image_url,
      description: product.description || undefined,
      features: product.features || [],
      source: product.source,
    })
    setCurrentStep('style')
  }

  const startGeneration = async () => {
    if (!fetchedProduct || !selectedCategory || !selectedStyleId) return

    // Check credits
    if (creditBalance && creditBalance.available < creditCost) {
      setShowInsufficientCreditsModal(true)
      return
    }

    setIsGenerating(true)
    setGenerationError(null)
    setGenerationProgress(10)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const response = await fetch('/api/generate/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: fetchedProduct.name,
          productImageUrl: fetchedProduct.image,
          mode: 'spotlight',
          captionsEnabled: false,
          spotlightCategoryId: selectedCategory,
          spotlightStyleId: selectedStyleId,
          spotlightDuration: selectedDuration,
        }),
      })

      const data = await response.json()

      // Handle video limit error
      if (response.status === 429 && data.limit !== undefined) {
        setVideoLimitData({ limit: data.limit, used: data.used })
        setShowVideoLimitModal(true)
        setIsGenerating(false)
        return
      }

      if (!response.ok) throw new Error(data.error || 'Failed to start generation')

      setGenerationId(data.data.generationId)
      setCurrentStep('results')

      // Update credit balance
      if (creditBalance) {
        setCreditBalance({
          ...creditBalance,
          available: creditBalance.available - creditCost,
          balance: creditBalance.balance - creditCost,
        })
      }

      // Start polling for status
      pollGenerationStatus(data.data.generationId, session.access_token)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to start generation')
      setIsGenerating(false)
    }
  }

  const pollGenerationStatus = useCallback((genId: string, accessToken: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)

    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate/status?id=${genId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to fetch status')

        const status = data.data.status as GenerationStatus
        setGenerationProgress(statusProgress[status] || 50)

        if (status === 'completed') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setIsGenerating(false)

          // Get video URL
          const videoData = data.data.videos?.[0]
          if (videoData) {
            setVideoUrl(videoData.videoUrl || null)
          }
        } else if (status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          setIsGenerating(false)
          setGenerationError(data.data.errorMessage || 'Generation failed')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)
  }, [])

  const handleVisibilityChange = async (newVisibility: VideoVisibility) => {
    if (!generationId) return
    setIsUpdatingVisibility(true)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/generations/${generationId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (response.ok) {
        setVisibility(newVisibility)
      }
    } catch (err) {
      console.error('Failed to update visibility:', err)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  const handleDownload = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank')
    }
  }

  const resetWizard = () => {
    setCurrentStep('product')
    setFetchedProduct(null)
    setProductUrl('')
    setManualProduct(null)
    setSelectedCategory(null)
    setSelectedStyleId(null)
    setSelectedDuration('5')
    setIsGenerating(false)
    setGenerationId(null)
    setVideoUrl(null)
    setGenerationError(null)
    if (pollingRef.current) clearInterval(pollingRef.current)
  }

  // Render icon from string name
  const renderIcon = (iconName: string, className?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent ? <IconComponent className={className} /> : null
  }

  return (
    <DashboardLayout>
      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Low credits banner */}
        {creditBalance && creditBalance.available < CREDIT_COSTS.SPOTLIGHT_10S && (
          <LowCreditsBanner balance={creditBalance.available} />
        )}

        {/* Header */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                Spotlight <span className="text-amber-400">Animation</span>
              </h1>
              <p className="text-text-muted text-sm">Create cinematic product animations</p>
            </div>
            <CreditBadge amount={creditBalance?.available || 0} size="lg" />
          </div>
        </FadeIn>

        {/* Progress */}
        {currentStep !== 'results' && (
          <FadeIn delay={0.1}>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-2 transition-colors',
                      i <= currentStepIndex ? 'text-amber-400' : 'text-text-muted'
                    )}
                  >
                    {step.icon}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                ))}
              </div>
              <Progress value={progressValue} className="h-1" />
            </div>
          </FadeIn>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Product Input */}
          {currentStep === 'product' && (
            <motion.div
              key="product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="p-6">
                <CardTitle className="mb-4">Add Your Product</CardTitle>
                <CardDescription className="mb-6">
                  Select a saved product, paste a URL, or add details manually
                </CardDescription>

                {/* Input mode tabs */}
                <div className="flex gap-2 mb-6 border-b border-border-default pb-4">
                  <Button
                    variant={inputMode === 'saved' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('saved')}
                    className={cn(
                      inputMode === 'saved' && 'bg-amber-500 hover:bg-amber-600'
                    )}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    My Products
                  </Button>
                  <Button
                    variant={inputMode === 'url' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('url')}
                    className={cn(
                      inputMode === 'url' && 'bg-amber-500 hover:bg-amber-600'
                    )}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Paste URL
                  </Button>
                  <Button
                    variant={inputMode === 'manual' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('manual')}
                    className={cn(
                      inputMode === 'manual' && 'bg-amber-500 hover:bg-amber-600'
                    )}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>

                {/* Saved Products Grid */}
                {inputMode === 'saved' && (
                  <div className="space-y-4">
                    {isLoadingSaved ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-xl bg-surface-raised animate-pulse"
                          />
                        ))}
                      </div>
                    ) : savedProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {savedProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => selectSavedProduct(product)}
                            className="group relative aspect-square rounded-xl overflow-hidden border-2 border-border-default hover:border-amber-400 transition-all bg-surface-raised"
                          >
                            {/* Product image */}
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-text-muted" />
                              </div>
                            )}
                            {/* Overlay with name */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <p className="text-sm font-medium text-white truncate">
                                {product.name}
                              </p>
                            </div>
                            {/* Hover indicator */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                                Select
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-muted mb-4">No saved products yet</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setInputMode('url')}
                        >
                          Add a product via URL
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* URL Input */}
                {inputMode === 'url' && (
                  <div className="space-y-4">
                    <Input
                      placeholder="https://example.com/product"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                    />
                    {fetchError && (
                      <p className="text-sm text-status-error">{fetchError}</p>
                    )}
                    <Button
                      onClick={fetchProductFromUrl}
                      disabled={!isValidUrl(productUrl) || isFetchingProduct}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                    >
                      {isFetchingProduct ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          Continue
                          <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Manual Entry */}
                {inputMode === 'manual' && (
                  <div className="space-y-4">
                    <ManualProductForm onChange={setManualProduct} />
                    <Button
                      onClick={startFromManual}
                      disabled={!canStartManual}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                    >
                      Continue
                      <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Style Selection */}
          {currentStep === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Product preview */}
              {fetchedProduct && (
                <ProductPreview
                  product={fetchedProduct}
                  onEdit={() => setCurrentStep('product')}
                />
              )}

              <Card className="p-6">
                <CardTitle className="mb-4">Choose Animation Style</CardTitle>

                {!selectedCategory ? (
                  <>
                    <CardDescription className="mb-6">
                      Select a category that matches your product
                    </CardDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {SPOTLIGHT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-left',
                            'hover:border-amber-400 hover:bg-amber-400/5',
                            'border-border-default bg-surface-raised'
                          )}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {renderIcon(cat.icon, 'w-5 h-5 text-amber-400')}
                            <span className="font-medium text-text-primary">{cat.name}</span>
                          </div>
                          <p className="text-xs text-text-muted">{cat.description}</p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <CardDescription>
                        Choose an animation style for {SPOTLIGHT_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                      </CardDescription>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                        Change Category
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {SPOTLIGHT_CATEGORIES.find(c => c.id === selectedCategory)?.styles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyleId(style.id)}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-left',
                            selectedStyleId === style.id
                              ? 'border-amber-400 bg-amber-400/10'
                              : 'border-border-default bg-surface-raised hover:border-amber-400/50'
                          )}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {renderIcon(style.icon, 'w-5 h-5 text-amber-400')}
                            <span className="font-medium text-text-primary">{style.name}</span>
                          </div>
                          <p className="text-xs text-text-muted">{style.description}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep('product')}>
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep('duration')}
                  disabled={!selectedStyleId}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Continue
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Duration Selection */}
          {currentStep === 'duration' && (
            <motion.div
              key="duration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {fetchedProduct && (
                <ProductPreview
                  product={fetchedProduct}
                  onEdit={() => setCurrentStep('product')}
                />
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <CardTitle className="mb-2">Animation Duration</CardTitle>
                    <CardDescription>
                      Choose your preferred animation length
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
                    <LucideIcons.Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">10 credits</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedDuration('5')}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all text-center',
                      selectedDuration === '5'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-border-default bg-surface-raised hover:border-amber-400/50'
                    )}
                  >
                    <div className="text-4xl font-bold text-text-primary mb-2">5s</div>
                    <div className="text-sm text-text-muted">Quick showcase</div>
                  </button>

                  <button
                    onClick={() => setSelectedDuration('10')}
                    className={cn(
                      'p-6 rounded-xl border-2 transition-all text-center',
                      selectedDuration === '10'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-border-default bg-surface-raised hover:border-amber-400/50'
                    )}
                  >
                    <div className="text-4xl font-bold text-text-primary mb-2">10s</div>
                    <div className="text-sm text-text-muted">Extended reveal</div>
                  </button>
                </div>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setCurrentStep('style')}>
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep('review')}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Continue
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review & Generate */}
          {currentStep === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {fetchedProduct && (
                <ProductPreview
                  product={fetchedProduct}
                  onEdit={() => setCurrentStep('product')}
                />
              )}

              <Card className="p-6">
                <CardTitle className="mb-4">Review & Generate</CardTitle>

                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-surface-raised rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Style</span>
                      <span className="text-text-primary font-medium">
                        {selectedStyle?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Category</span>
                      <span className="text-text-primary">
                        {SPOTLIGHT_CATEGORIES.find(c => c.id === selectedCategory)?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Duration</span>
                      <span className="text-text-primary">{selectedDuration} seconds</span>
                    </div>
                    <div className="h-px bg-border-default" />
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Total Cost</span>
                      <div className="flex items-center gap-1 text-amber-400 font-semibold">
                        <LucideIcons.Zap className="w-4 h-4" />
                        {creditCost} credits
                      </div>
                    </div>
                  </div>

                  {/* Generate button */}
                  <Button
                    onClick={startGeneration}
                    disabled={isGenerating}
                    className="w-full bg-amber-500 hover:bg-amber-600 h-12 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5 mr-2" />
                        Generate Animation
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Navigation */}
              <div className="flex justify-start">
                <Button variant="secondary" onClick={() => setCurrentStep('duration')}>
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Results */}
          {currentStep === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {isGenerating ? (
                <Card className="p-8">
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="w-10 h-10 text-amber-400 animate-spin"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary mb-2">
                        Creating Your Animation
                      </h3>
                      <p className="text-text-muted">
                        This usually takes about 2 minutes...
                      </p>
                    </div>
                    <Progress value={generationProgress} className="max-w-md mx-auto" />
                  </div>
                </Card>
              ) : generationError ? (
                <Card className="p-8">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-status-error/20 flex items-center justify-center">
                      <LucideIcons.AlertTriangle className="w-8 h-8 text-status-error" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">
                      Generation Failed
                    </h3>
                    <p className="text-text-muted max-w-md mx-auto">
                      {generationError}
                    </p>
                    <Button onClick={resetWizard} className="bg-amber-500 hover:bg-amber-600">
                      <FontAwesomeIcon icon={faRedo} className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </Card>
              ) : videoUrl ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="aspect-[9/16] max-w-sm mx-auto rounded-xl overflow-hidden bg-black">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </Card>

                  <Card className="p-6 space-y-4">
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleDownload} className="bg-amber-500 hover:bg-amber-600">
                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowScheduleModal(true)}
                        disabled={userPlan === 'free'}
                        className="gap-2"
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4" />
                        Schedule
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={resetWizard}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Create Another
                      </Button>
                    </div>

                    {/* Show upgrade card for free users */}
                    {userPlan === 'free' && (
                      <ScheduleUpgradeCard />
                    )}

                    <div className="pt-4 border-t border-border-default">
                      <h4 className="text-sm font-medium text-text-primary mb-3">Visibility</h4>
                      <VisibilityToggle
                        visibility={visibility}
                        onChange={handleVisibilityChange}
                        disabled={isUpdatingVisibility}
                      />
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-8">
                  <EmptyState {...emptyStatePresets.noProjects} />
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        required={creditCost}
        available={creditBalance?.available || 0}
      />

      <VideoLimitModal
        isOpen={showVideoLimitModal}
        onClose={() => setShowVideoLimitModal(false)}
        limit={videoLimitData?.limit || 1}
        used={videoLimitData?.used || 0}
      />

      {/* Schedule Modal */}
      {videoUrl && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          videoUrl={videoUrl}
          defaultCaption={fetchedProduct?.name ? `Check out ${fetchedProduct.name}!` : ''}
          generationId={generationId || undefined}
          onScheduled={(scheduledPostId) => {
            console.log('Post scheduled:', scheduledPostId)
            setShowScheduleModal(false)
          }}
        />
      )}
    </DashboardLayout>
  )
}
