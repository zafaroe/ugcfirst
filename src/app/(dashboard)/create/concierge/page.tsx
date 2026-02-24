'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Link2, Wand2, PenLine, Sparkles, Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlassCard, GradientCard, FadeIn, EASINGS } from '@/components/ui'
import {
  CreditBadge,
  GenerationView,
  ManualProductForm,
  isManualProductValid,
  ProductPreview,
  ScriptPreview,
  StrategyResults,
  ScheduleUpgradeCard,
  InsufficientCreditsModal,
  LowCreditsBanner,
} from '@/components/composed'
import type { CreditBalance } from '@/types/credits'
import { VisibilityToggle } from '@/components/composed/visibility-toggle'
import type { ManualProductData } from '@/components/composed'
import { CaptionToggle } from '@/components/blocks/create/caption-toggle'
import type {
  FetchedProduct,
  GeneratedScript,
  SocialPostCopy,
  StrategyBrief,
  GenerationStage,
  GenerationStatus,
  ReelItInStep,
  VideoVisibility,
} from '@/types/generation'
import {
  getMockSocialCopy,
  getMockStrategyBrief
} from '@/mocks/data'
import type { PersonaProfile } from '@/types/generation'
import type { PlanType } from '@/types'
import { cn } from '@/lib/utils'

// Map backend GenerationStatus to frontend GenerationStage
const mapStatusToStage = (status: GenerationStatus): GenerationStage => {
  const mapping: Record<GenerationStatus, GenerationStage> = {
    queued: 'analyzing',
    analyzing: 'analyzing',
    scripting: 'writing',
    framing: 'casting',
    generating: 'voiceover',
    trimming: 'assembling',
    captioning: 'assembling', // DB value is 'captioning' for subtitle burning step
    uploading: 'rendering',
    completed: 'complete',
    failed: 'analyzing', // will show error state
  }
  return mapping[status] || 'analyzing'
}

type InputMode = 'url' | 'manual'

// Reel It In generation stages
const reelItInStages: GenerationStage[] = [
  'analyzing',
  'writing',
  'casting',
  'voiceover',
  'assembling',
  'rendering',
  'complete'
]

// Manual product stages (skip analyzing)
const manualStages: GenerationStage[] = [
  'writing',
  'casting',
  'voiceover',
  'assembling',
  'rendering',
  'complete'
]

// Step definitions
const steps = [
  { id: 1, name: 'Product', description: 'Add your product' },
  { id: 2, name: 'Review', description: 'Confirm details' },
  { id: 3, name: 'Generate', description: 'Creating video' },
  { id: 4, name: 'Strategy', description: 'Results & tips' },
]

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: ReelItInStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isCurrent = currentStep === step.id
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                  isCompleted
                    ? 'bg-status-success text-white'
                    : isCurrent
                    ? 'bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white shadow-lg shadow-electric-indigo/30'
                    : 'bg-elevated text-text-muted'
                )}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs mt-1.5 hidden sm:block',
                  isCurrent ? 'text-text-primary font-medium' : 'text-text-muted'
                )}
              >
                {step.name}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'w-8 sm:w-12 h-0.5 mx-2 transition-colors',
                  isCompleted ? 'bg-status-success' : 'bg-border-default'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ConciergePage() {
  // Wizard state
  const [step, setStep] = useState<ReelItInStep>(1)
  const [inputMode, setInputMode] = useState<InputMode>('url')

  // Step 1: Input state
  const [productUrl, setProductUrl] = useState('')
  const [manualProduct, setManualProduct] = useState<ManualProductData | null>(null)

  // Step 2: Review state
  const [fetchedProduct, setFetchedProduct] = useState<FetchedProduct | null>(null)
  const [personaProfile, setPersonaProfile] = useState<PersonaProfile | null>(null)
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null)
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)
  const [isRegeneratingScript, setIsRegeneratingScript] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Step 3: Generation state
  const [generationStage, setGenerationStage] = useState<GenerationStage>('analyzing')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [isStartingGeneration, setIsStartingGeneration] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Step 4: Results state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoSubtitledUrl, setVideoSubtitledUrl] = useState<string | null>(null)
  const [showSubtitledVideo, setShowSubtitledVideo] = useState(true) // Default to showing subtitles
  const [socialCopy, setSocialCopy] = useState<SocialPostCopy | null>(null)
  const [strategyBrief, setStrategyBrief] = useState<StrategyBrief | null>(null)
  const [visibility, setVisibility] = useState<VideoVisibility>('private')
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanType>('free')

  // Credit state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [isCheckingCredits, setIsCheckingCredits] = useState(true)

  // Plans that include scheduling
  const canSchedule = ['pro', 'plus', 'agency'].includes(userPlan)

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const canStartManual = manualProduct ? isManualProductValid(manualProduct) : false
  const creditCost = subtitlesEnabled ? 16 : 15

  // Fetch product data from URL using real API
  const fetchProductFromUrl = useCallback(async (url: string) => {
    setIsFetchingProduct(true)
    setFetchError(null)

    try {
      // Extract product from URL
      const extractResponse = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const extractData = await extractResponse.json()

      if (!extractData.success) {
        throw new Error(extractData.error || 'Failed to extract product')
      }

      setFetchedProduct(extractData.product)
      if (extractData.persona) {
        setPersonaProfile(extractData.persona)
      }

      // Generate script using AI
      const scriptResponse = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: extractData.product,
          persona: extractData.persona,
        }),
      })

      const scriptData = await scriptResponse.json()

      if (!scriptData.success) {
        throw new Error(scriptData.error || 'Failed to generate script')
      }

      // Use the first generated script (now returns full GeneratedScript object)
      if (scriptData.scripts && scriptData.scripts.length > 0) {
        setGeneratedScript(scriptData.scripts[0])
      }

      if (scriptData.persona) {
        setPersonaProfile(scriptData.persona)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setFetchError(message)
      console.error('Product fetch error:', error)
    } finally {
      setIsFetchingProduct(false)
    }
  }, [])

  // Convert manual product to fetched product format
  const convertManualToFetched = useCallback((manual: ManualProductData): FetchedProduct => {
    return {
      name: manual.name,
      image: manual.imagePreview || '',
      price: manual.price || undefined,
      description: manual.description || undefined,
      features: manual.features.filter(f => f.trim().length > 0),
      source: 'manual',
    }
  }, [])

  // Generate script for a product
  const generateScriptForProduct = useCallback(async (product: FetchedProduct, persona?: PersonaProfile | null) => {
    try {
      const scriptResponse = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          persona: persona || undefined,
        }),
      })

      const scriptData = await scriptResponse.json()

      if (!scriptData.success) {
        throw new Error(scriptData.error || 'Failed to generate script')
      }

      if (scriptData.scripts && scriptData.scripts.length > 0) {
        setGeneratedScript(scriptData.scripts[0])
      }

      if (scriptData.persona) {
        setPersonaProfile(scriptData.persona)
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate script'
      setFetchError(message)
      return false
    }
  }, [])

  // Handle continuing from Step 1 to Step 2
  const handleContinueToReview = async () => {
    setFetchError(null)

    // Check credits BEFORE making any API call - saves token costs
    if (hasInsufficientCredits) {
      setShowInsufficientCreditsModal(true)
      return // Don't proceed with API call
    }

    if (inputMode === 'url' && isValidUrl(productUrl)) {
      await fetchProductFromUrl(productUrl)
      if (!fetchError) {
        setStep(2)
      }
    } else if (inputMode === 'manual' && canStartManual && manualProduct) {
      setIsFetchingProduct(true)
      const product = convertManualToFetched(manualProduct)
      setFetchedProduct(product)

      const success = await generateScriptForProduct(product)
      setIsFetchingProduct(false)

      if (success) {
        setStep(2)
      }
    }
  }

  // Handle script regeneration
  const handleRegenerateScript = async () => {
    if (!fetchedProduct) return
    setIsRegeneratingScript(true)
    setFetchError(null)

    try {
      const success = await generateScriptForProduct(fetchedProduct, personaProfile)
      if (!success) {
        console.error('Script regeneration failed')
      }
    } catch (error) {
      console.error('Script regeneration error:', error)
    } finally {
      setIsRegeneratingScript(false)
    }
  }

  // Handle script edit
  const handleScriptChange = (content: string) => {
    if (!generatedScript) return
    const wordCount = content.split(/\s+/).filter(Boolean).length
    setGeneratedScript({
      ...generatedScript,
      content,
      wordCount,
      estimatedDuration: Math.ceil(wordCount / 3.5),
    })
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  // Fetch user plan on mount
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single()

        if (profile?.plan) {
          setUserPlan(profile.plan as PlanType)
        }
      } catch (error) {
        console.error('Failed to fetch user plan:', error)
      }
    }

    fetchUserPlan()
  }, []) // Empty - getBrowserClient() is singleton

  // Fetch credit balance ONCE on mount only
  useEffect(() => {
    const fetchCreditBalance = async () => {
      setIsCheckingCredits(true)
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setIsCheckingCredits(false)
          return
        }

        const response = await fetch('/api/credits/balance', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setCreditBalance(result.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch credit balance:', error)
      } finally {
        setIsCheckingCredits(false)
      }
    }

    fetchCreditBalance()
  }, []) // Empty - getBrowserClient() is singleton, fetch once on mount

  // Refresh credits from TopNav/globally using custom event
  useEffect(() => {
    const handleCreditsUpdated = async () => {
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
          if (result.success && result.data) {
            setCreditBalance(result.data)
          }
        }
      } catch (error) {
        console.error('Failed to refresh credit balance:', error)
      }
    }

    window.addEventListener('credits-updated', handleCreditsUpdated)
    return () => window.removeEventListener('credits-updated', handleCreditsUpdated)
  }, []) // Empty - getBrowserClient() is singleton

  // Check if user has sufficient credits
  const hasInsufficientCredits = creditBalance !== null && creditBalance.available < creditCost

  // Run real video generation
  const runGeneration = async () => {
    // Prevent duplicate calls
    if (isStartingGeneration) return
    if (!fetchedProduct) return

    // Check credits first before moving to Step 3
    if (hasInsufficientCredits) {
      setShowInsufficientCreditsModal(true)
      return
    }

    setIsStartingGeneration(true)
    setGenerationStage('analyzing')
    setGenerationError(null)

    try {
      // Get auth token
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('You must be logged in to generate videos')
      }

      // 1. Start generation via API
      const startResponse = await fetch('/api/generate/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: fetchedProduct.name,
          productImageUrl: fetchedProduct.image,
          customScript: generatedScript?.fullScript,
          captionsEnabled: subtitlesEnabled, // API still uses captionsEnabled for backward compat
          mode: 'concierge',
        }),
      })

      const startData = await startResponse.json()

      if (!startResponse.ok || !startData.success) {
        // Handle insufficient credits error (402)
        if (startResponse.status === 402 || startData.error === 'Insufficient credits') {
          // Update credit balance with returned data
          if (startData.available !== undefined) {
            setCreditBalance(prev => prev ? { ...prev, available: startData.available } : null)
          }
          setShowInsufficientCreditsModal(true)
          setIsStartingGeneration(false)
          setStep(2) // Stay on review step
          return
        }
        throw new Error(startData.error || 'Failed to start generation')
      }

      // Only move to Step 3 AFTER API confirms generation started
      setStep(3)

      const genId = startData.data.generationId
      setGenerationId(genId)

      // 2. Poll for status updates
      const pollStatus = async () => {
        try {
          const supabaseClient = getBrowserClient()
          const { data: { session: currentSession } } = await supabaseClient.auth.getSession()
          const currentToken = currentSession?.access_token

          if (!currentToken) {
            throw new Error('Session expired')
          }

          const statusResponse = await fetch(`/api/generate/status?id=${genId}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` },
          })

          const statusData = await statusResponse.json()

          if (!statusResponse.ok || !statusData.success) {
            throw new Error(statusData.error || 'Failed to get status')
          }

          const { data } = statusData

          // Update UI stage based on backend status
          setGenerationStage(mapStatusToStage(data.status))

          // Check if complete
          if (data.status === 'completed') {
            // Set results
            if (data.videos && data.videos.length > 0) {
              setVideoUrl(data.videos[0].videoUrl)
              // Support both new and legacy field names
              const subtitledUrl = data.videos[0].videoSubtitledUrl || data.videos[0].videoCaptionedUrl
              setVideoSubtitledUrl(subtitledUrl || null)
              // Default to subtitled video if available
              setShowSubtitledVideo(!!subtitledUrl)
            }
            if (data.strategyBrief) {
              setStrategyBrief(data.strategyBrief)
            }
            // Get visibility from generation data
            if (data.visibility) {
              setVisibility(data.visibility)
            }
            // Generate social copy from product if available
            if (fetchedProduct) {
              setSocialCopy(getMockSocialCopy(fetchedProduct, 'tiktok'))
            }

            // Dispatch event to refresh credits in TopNav
            window.dispatchEvent(new CustomEvent('credits-updated'))

            // Brief delay then move to results
            await new Promise(resolve => setTimeout(resolve, 1000))
            setStep(4)
            return
          }

          // Check if failed
          if (data.status === 'failed') {
            throw new Error(data.errorMessage || 'Generation failed')
          }

          // Continue polling (every 3 seconds)
          pollingRef.current = setTimeout(pollStatus, 3000)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Polling error'
          console.error('Status polling error:', error)
          setGenerationError(message)
          setStep(2) // Go back to review
        }
      }

      // Start polling
      pollStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      console.error('Generation error:', error)
      setGenerationError(message)
      setIsStartingGeneration(false)
      setStep(2) // Go back to review
    }
  }

  // Handle starting generation from Step 2
  const handleStartGeneration = async () => {
    await runGeneration()
  }

  // Handle cancel generation
  const handleCancelGeneration = () => {
    // Stop polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    setStep(2)
    setGenerationStage('analyzing')
    setGenerationId(null)
    setGenerationError(null)
  }

  // Handle going back to Step 1 to edit
  const handleBackToInput = () => {
    setStep(1)
    setFetchedProduct(null)
    setGeneratedScript(null)
  }

  // Handle creating another video
  const handleCreateAnother = () => {
    // Stop any active polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    setStep(1)
    setProductUrl('')
    setManualProduct(null)
    setFetchedProduct(null)
    setPersonaProfile(null)
    setGeneratedScript(null)
    setSubtitlesEnabled(true)
    setVideoUrl(null)
    setVideoSubtitledUrl(null)
    setShowSubtitledVideo(true)
    setSocialCopy(null)
    setStrategyBrief(null)
    setVisibility('private')
    setGenerationStage('analyzing')
    setFetchError(null)
    setGenerationId(null)
    setGenerationError(null)
  }

  // Handle visibility change
  const handleVisibilityChange = async (newVisibility: VideoVisibility) => {
    if (!generationId || isUpdatingVisibility) return

    setIsUpdatingVisibility(true)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        console.error('No auth token')
        return
      }

      const response = await fetch(`/api/generations/${generationId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update visibility')
      }

      setVisibility(newVisibility)
    } catch (error) {
      console.error('Error updating visibility:', error)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  // Handle image selection - update the selected image in fetchedProduct
  const handleImageSelect = (imageUrl: string) => {
    if (!fetchedProduct) return
    setFetchedProduct({
      ...fetchedProduct,
      image: imageUrl,
    })
  }

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      default:
        return null
    }
  }

  // Step 1: Product Input
  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Input Mode Tabs */}
      <FadeIn delay={0.1}>
        <GlassCard padding="none" className="flex p-1.5 gap-1.5">
          <button
            onClick={() => setInputMode('url')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl text-sm font-medium transition-all duration-300',
              inputMode === 'url'
                ? 'bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white shadow-lg shadow-electric-indigo/25'
                : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
            )}
          >
            <Link2 className="w-4 h-4" />
            URL Import
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl text-sm font-medium transition-all duration-300',
              inputMode === 'manual'
                ? 'bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white shadow-lg shadow-electric-indigo/25'
                : 'text-text-muted hover:text-text-primary hover:bg-surface/50'
            )}
          >
            <PenLine className="w-4 h-4" />
            Manual Entry
          </button>
        </GlassCard>
      </FadeIn>

      {/* Input Form */}
      <motion.div
        key={inputMode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASINGS.easeOut }}
      >
        <GradientCard padding="lg" className="space-y-6">
          {inputMode === 'url' ? (
            <>
              <div className="text-center">
                <motion.div
                  className="relative w-18 h-18 mx-auto mb-5"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-vibrant-fuchsia/30 blur-xl"
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative w-full h-full rounded-2xl bg-gradient-to-br from-vibrant-fuchsia to-pink-500 flex items-center justify-center shadow-lg shadow-vibrant-fuchsia/25"
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Wand2 className="w-9 h-9 text-white" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <CardTitle className="text-xl mb-2">Let AI Do The Work</CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <CardDescription className="max-w-md mx-auto">
                    Just paste a product URL and our AI agents will research the product,
                    write a compelling script, and generate your video automatically.
                  </CardDescription>
                </motion.div>
              </div>

              <div className="space-y-5">
                <Input
                  label="Product URL"
                  placeholder="https://your-store.com/products/..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  leftIcon={<Link2 className="w-4 h-4" />}
                  helperText="Paste any product URL from your store"
                />

                <Button
                  className="w-full shadow-lg shadow-electric-indigo/25"
                  size="lg"
                  onClick={handleContinueToReview}
                  disabled={!isValidUrl(productUrl) || isFetchingProduct || isCheckingCredits || hasInsufficientCredits}
                >
                  {isCheckingCredits ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking credits...
                    </>
                  ) : isFetchingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Product...
                    </>
                  ) : hasInsufficientCredits ? (
                    <>
                      Insufficient Credits
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Show insufficient credits warning */}
                {hasInsufficientCredits && !isCheckingCredits && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20 text-sm"
                  >
                    <p className="text-status-warning font-medium mb-1">Insufficient Credits</p>
                    <p className="text-text-muted">
                      You need at least {creditCost} credits to create a video.{' '}
                      <button
                        onClick={() => setShowInsufficientCreditsModal(true)}
                        className="text-electric-indigo hover:underline"
                      >
                        Buy credits or upgrade your plan
                      </button>
                    </p>
                  </motion.div>
                )}

                {fetchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error text-sm"
                  >
                    {fetchError}
                  </motion.div>
                )}
              </div>

              {/* How it works */}
              <motion.div
                className="pt-6 border-t border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <h4 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-electric-indigo" />
                  How it works
                </h4>
                <div className="space-y-4">
                  {[
                    'Our AI researches your product page for key features and benefits',
                    'A compelling video script is generated based on proven viral formulas',
                    'Your video is rendered with a selected AI avatar and delivered in minutes'
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      className="flex gap-4 items-start group"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.45 + i * 0.1 }}
                    >
                      <motion.div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-indigo to-vibrant-fuchsia text-white text-sm font-semibold flex items-center justify-center flex-shrink-0 shadow-md"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        {i + 1}
                      </motion.div>
                      <p className="text-sm text-text-muted pt-1 group-hover:text-text-primary transition-colors duration-200">
                        {text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <>
              <div className="text-center mb-2">
                <motion.div
                  className="relative w-18 h-18 mx-auto mb-5"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-electric-indigo/30 blur-xl"
                    animate={{ opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative w-full h-full rounded-2xl bg-gradient-to-br from-electric-indigo to-blue-500 flex items-center justify-center shadow-lg shadow-electric-indigo/25"
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <PenLine className="w-9 h-9 text-white" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <CardTitle className="text-xl mb-2">Enter Product Details</CardTitle>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <CardDescription className="max-w-md mx-auto">
                    Manually enter your product information and our AI will create
                    a compelling video script and generate your video.
                  </CardDescription>
                </motion.div>
              </div>

              <ManualProductForm onChange={setManualProduct} />

              <Button
                className="w-full shadow-lg shadow-electric-indigo/25"
                size="lg"
                onClick={handleContinueToReview}
                disabled={!canStartManual || isCheckingCredits || hasInsufficientCredits}
              >
                {isCheckingCredits ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking credits...
                  </>
                ) : hasInsufficientCredits ? (
                  <>
                    Insufficient Credits
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Show insufficient credits warning */}
              {hasInsufficientCredits && !isCheckingCredits && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20 text-sm"
                >
                  <p className="text-status-warning font-medium mb-1">Insufficient Credits</p>
                  <p className="text-text-muted">
                    You need at least {creditCost} credits to create a video.{' '}
                    <button
                      onClick={() => setShowInsufficientCreditsModal(true)}
                      className="text-electric-indigo hover:underline"
                    >
                      Buy credits or upgrade your plan
                    </button>
                  </p>
                </motion.div>
              )}
            </>
          )}
        </GradientCard>
      </motion.div>
    </motion.div>
  )

  // Step 2: Review & Confirm
  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-text-primary mb-1">Review & Confirm</h2>
        <p className="text-text-muted text-sm">Make sure everything looks good before generating</p>
      </div>

      {/* Product Preview */}
      {fetchedProduct && (
        <ProductPreview
          product={fetchedProduct}
          onEdit={handleBackToInput}
          onImageSelect={handleImageSelect}
        />
      )}

      {/* Script Preview */}
      {generatedScript && (
        <ScriptPreview
          script={generatedScript}
          onRegenerate={handleRegenerateScript}
          onScriptChange={handleScriptChange}
          isRegenerating={isRegeneratingScript}
        />
      )}

      {/* Subtitle Toggle */}
      <CaptionToggle
        enabled={subtitlesEnabled}
        onToggle={setSubtitlesEnabled}
      />

      {/* Credit Cost & Actions */}
      <Card className="p-5 bg-surface border border-border-default">
        <div className="flex items-center justify-between mb-4">
          <span className="text-text-muted">Total Cost</span>
          <CreditBadge amount={creditCost} size="lg" />
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBackToInput}
            className="flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            className="flex-1 shadow-lg shadow-electric-indigo/25"
            size="lg"
            onClick={handleStartGeneration}
            isLoading={isStartingGeneration}
            disabled={isStartingGeneration}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Video ({creditCost} Credits)
          </Button>
        </div>
      </Card>
    </motion.div>
  )

  // Step 3: Generation
  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <Card padding="none">
        <GenerationView
          stage={generationStage}
          stages={inputMode === 'url' ? reelItInStages : manualStages}
          estimatedTime="~45 seconds"
          onCancel={handleCancelGeneration}
        />
      </Card>
    </motion.div>
  )

  // Get the current video URL to display (subtitled or raw)
  const displayVideoUrl = showSubtitledVideo && videoSubtitledUrl ? videoSubtitledUrl : videoUrl

  // Step 4: Strategy & Results
  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Video Subtitle Toggle - Only show if subtitled version exists */}
      {videoSubtitledUrl && (
        <Card className="p-4 bg-surface border border-border-default">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-text-primary">Video Version</h4>
              <p className="text-xs text-text-muted">Choose which version to preview</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-elevated rounded-lg">
              <button
                onClick={() => setShowSubtitledVideo(true)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  showSubtitledVideo
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                With Subtitles
              </button>
              <button
                onClick={() => setShowSubtitledVideo(false)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  !showSubtitledVideo
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Without Subtitles
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Video Player + Strategy - only needs videoUrl */}
      {videoUrl && (
        <StrategyResults
          videoUrl={displayVideoUrl || undefined}
          strategy={strategyBrief || undefined}
          socialCopy={socialCopy || undefined}
          generationId={generationId || undefined}
          userPlan={userPlan}
          onDownload={() => {
            // Download the currently displayed video version
            if (displayVideoUrl) {
              const link = document.createElement('a')
              link.href = displayVideoUrl
              link.download = `vidnary-video${showSubtitledVideo ? '-subtitled' : ''}.mp4`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          }}
          onSchedule={() => {
            // Future: Bloatato integration
            console.log('Schedule coming soon...')
          }}
          onCreateAnother={handleCreateAnother}
          onRegenerateSocialCopy={async () => {
            if (!fetchedProduct) return
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSocialCopy(getMockSocialCopy(fetchedProduct, 'tiktok'))
          }}
        />
      )}

      {/* Visibility Settings - only needs videoUrl */}
      {videoUrl && (
        <Card className="p-5 bg-surface border border-border-default">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Video Visibility</h4>
          <VisibilityToggle
            visibility={visibility}
            onChange={handleVisibilityChange}
            disabled={isUpdatingVisibility}
          />
          {visibility === 'public' && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-status-success mt-3"
            >
              Your video will appear in the Explore gallery for other users to discover.
            </motion.p>
          )}
        </Card>
      )}

      {/* Scheduling Teaser for non-Pro users - only needs videoUrl */}
      {!canSchedule && videoUrl && (
        <ScheduleUpgradeCard variant="full" />
      )}
    </motion.div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Reel It In</span>
            </h1>
            <p className="text-text-muted text-sm">AI-powered video creation service</p>
          </div>
          {step < 4 && <CreditBadge amount={creditCost} size="lg" />}
        </div>

        {/* Low Credits Warning Banner */}
        {creditBalance && step < 3 && (
          <LowCreditsBanner balance={creditBalance.available} />
        )}

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        required={creditCost}
        available={creditBalance?.available ?? 0}
        mode="concierge"
        captionsEnabled={subtitlesEnabled}
      />
    </DashboardLayout>
  )
}
