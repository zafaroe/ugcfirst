'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight, faBox, faFileLines, faWandMagicSparkles, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { Sparkles, Lightbulb, Link2, PenLine, RotateCcw, Package } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { GradientCard, FadeIn, EASINGS } from '@/components/ui'
import {
  CreditBadge,
  GenerationView,
  EmptyState,
  emptyStatePresets,
  ManualProductForm,
  isManualProductValid,
  ProductPreview,
  StrategyResults,
  ScheduleUpgradeCard,
  InsufficientCreditsModal,
  LowCreditsBanner,
  VideoLimitModal,
  RegenerateModal,
} from '@/components/composed'
import { ScheduleModal } from '@/components/composed/schedule-modal'
import { VisibilityToggle } from '@/components/composed/visibility-toggle'
import type { GenerationStage } from '@/components/composed'
import { TemplateSelector } from '@/components/blocks/create/template-selector'
import { TemplatePreview } from '@/components/blocks/create/template-preview'
import { CaptionToggle } from '@/components/blocks/create/caption-toggle'
import { EndScreenToggle, type EndScreenData } from '@/components/blocks/create/end-screen-toggle'
import { calculateCreditCost } from '@/types/credits'
import { useTemplateStore } from '@/hooks/use-template'
import { getTemplateById, personalizeHook } from '@/data/templates'
import { generateSocialCopy } from '@/config/social-copy'
import { cn } from '@/lib/utils'
import type { CreditBalance } from '@/types/credits'
import type { ManualProductData } from '@/components/composed'
import type {
  FetchedProduct,
  GenerationStatus,
  SocialPostCopy,
  VideoVisibility,
} from '@/types/generation'
import type { PlanType } from '@/types'

// Map backend GenerationStatus to frontend GenerationStage
const mapStatusToStage = (status: GenerationStatus): GenerationStage => {
  const mapping: Record<GenerationStatus, GenerationStage> = {
    queued: 'analyzing',
    analyzing: 'analyzing',
    scripting: 'writing',
    framing: 'casting',
    generating: 'voiceover',
    trimming: 'assembling',
    captioning: 'assembling',
    uploading: 'rendering',
    completed: 'complete',
    failed: 'analyzing',
  }
  return mapping[status] || 'analyzing'
}

// DIY generation stages (6-stage loading)
const diyStages: GenerationStage[] = ['writing', 'casting', 'voiceover', 'assembling', 'rendering', 'complete']

type Step = 'product' | 'template' | 'script' | 'review' | 'results'
type InputMode = 'url' | 'manual' | 'saved'

// Saved product from database
interface SavedProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  images: string[];
  price: string | null;
  features: string[];
  source: 'url' | 'manual';
  source_url: string | null;
  generation_count: number;
  last_used_at: string | null;
  created_at: string;
}

// Helper for fetch with timeout (90s default for script generation which can be slow)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 90000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'product', label: 'Product', icon: <FontAwesomeIcon icon={faBox} className="w-5 h-5" /> },
  { id: 'template', label: 'Template', icon: <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5" /> },
  { id: 'script', label: 'Script', icon: <FontAwesomeIcon icon={faFileLines} className="w-5 h-5" /> },
  { id: 'review', label: 'Generate', icon: <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5" /> },
]

export default function DIYCreatePage() {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>('product')

  // Product input state
  const [inputMode, setInputMode] = useState<InputMode>('url')
  const [productUrl, setProductUrl] = useState('')
  const [manualProduct, setManualProduct] = useState<ManualProductData | null>(null)
  const [fetchedProduct, setFetchedProduct] = useState<FetchedProduct | null>(null)
  const [isFetchingProduct, setIsFetchingProduct] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Saved products state
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([])
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)

  // Selection state
  const [freeformScript, setFreeformScript] = useState('')
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [endScreenEnabled, setEndScreenEnabled] = useState(false)
  const [endScreenData, setEndScreenData] = useState<EndScreenData>({
    ctaText: 'Shop Now',
    brandText: '',
  })
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<GenerationStage>('writing')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Results state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoSubtitledUrl, setVideoSubtitledUrl] = useState<string | null>(null)
  const [showSubtitledVideo, setShowSubtitledVideo] = useState(true)
  const [socialCopy, setSocialCopy] = useState<SocialPostCopy | null>(null)
  const [isRegeneratingSocialCopy, setIsRegeneratingSocialCopy] = useState(false)
  const [visibility, setVisibility] = useState<VideoVisibility>('private')
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanType>('free')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)

  // Credit state
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false)
  const [showVideoLimitModal, setShowVideoLimitModal] = useState(false)
  const [videoLimitData, setVideoLimitData] = useState<{ limit: number; used: number } | null>(null)

  // Template store
  const {
    selectedTemplate,
    script,
    activeSection,
    selectTemplate,
    clearTemplate,
    updateSectionContent,
    setActiveSection,
    useHookExample,
    isScriptComplete,
    getTotalWordCount,
    getTotalDuration,
  } = useTemplateStore()

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100

  // Calculate credit cost (10 base + 1 captions + 2 end screen = max 13)
  const totalCreditCost = calculateCreditCost({ mode: 'diy', captionsEnabled, endScreenEnabled })

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

  // Fetch credit balance on mount
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
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      }
    }
    fetchCredits()
  }, [])

  // Fetch saved products on mount
  useEffect(() => {
    const fetchSavedProducts = async () => {
      try {
        setIsLoadingSaved(true)
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const data = await response.json()
        if (data.success) {
          setSavedProducts(data.products || [])
        }
      } catch (error) {
        console.error('Failed to fetch saved products:', error)
      } finally {
        setIsLoadingSaved(false)
      }
    }
    fetchSavedProducts()
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  // Fetch product from URL
  const fetchProductFromUrl = useCallback(async (url: string) => {
    setIsFetchingProduct(true)
    setFetchError(null)

    try {
      const response = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract product')
      }

      setFetchedProduct(data.product)

      // Auto-save to product library
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: data.product.name,
              description: data.product.description,
              imageUrl: data.product.image,
              images: data.product.images || [],
              price: data.product.price,
              features: data.product.features,
              source: 'url',
              sourceUrl: url,
            }),
          })
          // Refresh saved products list
          const productsRes = await fetch('/api/products', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          })
          const productsData = await productsRes.json()
          if (productsData.success) setSavedProducts(productsData.products || [])
        }
      } catch (e) {
        // Don't block the flow if auto-save fails
        console.error('Auto-save product failed:', e)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch product'
      setFetchError(message)
    } finally {
      setIsFetchingProduct(false)
    }
  }, [])

  // Handle manual product submission
  const handleManualSubmit = useCallback(async () => {
    if (!manualProduct || !isManualProductValid(manualProduct)) return

    const productData: FetchedProduct = {
      name: manualProduct.name,
      description: manualProduct.description || '',
      price: manualProduct.price || '',
      image: manualProduct.imagePreview || '',
      features: manualProduct.features.filter((f: string) => f.trim()),
      source: 'manual',
    }

    setFetchedProduct(productData)

    // Auto-save to product library
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: manualProduct.name,
            description: manualProduct.description,
            imageUrl: manualProduct.imagePreview,
            images: [],
            price: manualProduct.price,
            features: manualProduct.features.filter((f: string) => f.trim()),
            source: 'manual',
          }),
        })
        const productsRes = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
        const productsData = await productsRes.json()
        if (productsData.success) setSavedProducts(productsData.products || [])
      }
    } catch (e) {
      console.error('Auto-save product failed:', e)
    }
  }, [manualProduct])

  // Generate script using AI (with timeout)
  const generateScriptForMe = useCallback(async () => {
    if (!fetchedProduct) return

    setIsGeneratingScript(true)

    try {
      const response = await fetchWithTimeout('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: fetchedProduct,
          templateId: selectedTemplate?.id || null,
        }),
      }, 45000)

      const data = await response.json()

      if (!data.success || !data.scripts?.length) {
        throw new Error(data.error || 'Failed to generate script')
      }

      const generatedScript = data.scripts[0]
      const dialogue = generatedScript.dialogue || []
      const fullScript = generatedScript.fullScript || generatedScript.content || ''

      // If template is selected, populate template sections with dialogue
      if (selectedTemplate && script) {
        selectedTemplate.sections.forEach((section, idx) => {
          if (idx < dialogue.length) {
            // Map dialogue entry to section
            updateSectionContent(section.id, dialogue[idx].text || '')
          } else if (idx === selectedTemplate.sections.length - 1 && dialogue.length > selectedTemplate.sections.length) {
            // If more dialogue than sections, concatenate remaining into last section
            const remainingText = dialogue.slice(idx).map((d: { text?: string }) => d.text).join(' ')
            updateSectionContent(section.id, remainingText)
          }
        })
        // Also set freeform as fallback
        if (fullScript) {
          setFreeformScript(fullScript)
        }
      } else {
        // No template selected - use freeform mode
        setFreeformScript(fullScript)
      }
    } catch (error) {
      console.error('Script generation error:', error)
      // Could add error toast here
    } finally {
      setIsGeneratingScript(false)
    }
  }, [fetchedProduct, selectedTemplate, script, updateSectionContent])

  const canProceed = () => {
    switch (currentStep) {
      case 'product':
        return fetchedProduct !== null
      case 'template':
        return selectedTemplate !== null
      case 'script':
        if (selectedTemplate) {
          return isScriptComplete() || getTotalWordCount() >= 20
        }
        return freeformScript.trim().length >= 20
      case 'review':
        return true
      case 'results':
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const goPrevious = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  // Real generation with API
  const handleGenerate = async () => {
    if (!fetchedProduct) return

    setIsGenerating(true)
    setGenerationStage('writing')
    setGenerationError(null)

    // Set up timeout for the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Please log in to generate videos')
      }

      // Validate CTA text if end screen is enabled
      if (endScreenEnabled && !endScreenData.ctaText.trim()) {
        setGenerationError('Please enter a CTA text for the end screen')
        setIsGenerating(false)
        return
      }

      // Build script from template sections or freeform
      let fullScript = ''
      if (selectedTemplate && script) {
        fullScript = script.sections.map(s => s.content).filter(Boolean).join(' ')
      } else {
        fullScript = freeformScript
      }

      // Call the real API with timeout
      const response = await fetch('/api/generate/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: fetchedProduct.name,
          productImageUrl: fetchedProduct.image,
          avatarId: null,
          templateId: selectedTemplate?.id,
          customScript: fullScript,
          captionsEnabled,
          endScreenEnabled,
          endScreenCtaText: endScreenEnabled ? endScreenData.ctaText : undefined,
          endScreenBrandText: endScreenEnabled ? endScreenData.brandText : undefined,
          mode: 'diy',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Handle insufficient credits (402)
        if (response.status === 402 || data.error === 'Insufficient credits') {
          if (data.available !== undefined) {
            setCreditBalance(prev => prev ? { ...prev, available: data.available } : null)
          }
          setShowInsufficientCreditsModal(true)
          setIsGenerating(false)
          return
        }
        // Handle video limit (429)
        if (response.status === 429) {
          setVideoLimitData({
            limit: data.limit || 1,
            used: data.used || 1,
          })
          setShowVideoLimitModal(true)
          setIsGenerating(false)
          return
        }
        throw new Error(data.error || 'Failed to start generation')
      }

      const genId = data.data.generationId
      setGenerationId(genId)

      // Track product usage (fire and forget)
      const matchedProduct = savedProducts.find(p => p.name === fetchedProduct.name)
      if (matchedProduct) {
        fetch(`/api/products/${matchedProduct.id}/use`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {}) // Don't block on failure
      }

      // Start polling for status
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

          const { data: statusInfo } = statusData

          // Update UI stage
          setGenerationStage(mapStatusToStage(statusInfo.status))

          // Check if complete
          if (statusInfo.status === 'completed') {
            if (statusInfo.videos && statusInfo.videos.length > 0) {
              setVideoUrl(statusInfo.videos[0].videoUrl)
              const subtitledUrl = statusInfo.videos[0].videoSubtitledUrl || statusInfo.videos[0].videoCaptionedUrl
              setVideoSubtitledUrl(subtitledUrl || null)
              setShowSubtitledVideo(!!subtitledUrl)
            }
            if (statusInfo.visibility) {
              setVisibility(statusInfo.visibility)
            }
            if (fetchedProduct) {
              setSocialCopy(generateSocialCopy(fetchedProduct, 'tiktok'))
            }

            // Dispatch credits update
            window.dispatchEvent(new CustomEvent('credits-updated'))

            await new Promise(resolve => setTimeout(resolve, 1000))
            setIsGenerating(false)
            setCurrentStep('results')
            return
          }

          // Check if failed
          if (statusInfo.status === 'failed') {
            let userMessage = 'Generation failed. Please try again.'
            const rawError = statusInfo.errorMessage || ''

            if (rawError.toLowerCase().includes('heavy load') || rawError.toLowerCase().includes('not responding')) {
              userMessage = 'Our video service is currently experiencing high demand. Please try again in a few minutes.'
            } else if (rawError.toLowerCase().includes('timeout')) {
              userMessage = 'The video generation timed out. Please try again.'
            } else if (rawError.toLowerCase().includes('rate limit')) {
              userMessage = 'Too many requests. Please wait a moment and try again.'
            }

            throw new Error(userMessage)
          }

          // Continue polling
          pollingRef.current = setTimeout(pollStatus, 3000)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Polling error'
          console.error('Status polling error:', error)
          setGenerationError(message)
          setIsGenerating(false)
        }
      }

      // Start polling
      pollStatus()
    } catch (error) {
      let userMessage = 'Generation failed. Please try again.'

      if (error instanceof Error) {
        // Handle specific error types
        if (error.name === 'AbortError') {
          userMessage = 'Request timed out. Please check your connection and try again.'
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          userMessage = 'Could not reach our servers. Please check your internet connection and try again.'
        } else if (error.message.includes('authenticated') || error.message.includes('log in')) {
          userMessage = error.message
        } else if (error.message.includes('credits')) {
          userMessage = error.message
        } else {
          userMessage = error.message
        }
      }

      // Check if browser is offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        userMessage = 'No internet connection. Please check your network and try again.'
      }

      console.error('Generation error:', error)
      setGenerationError(userMessage)
      setIsGenerating(false)
    }
  }

  const handleCancelGeneration = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    setIsGenerating(false)
    setGenerationStage('writing')
  }

  // Handle regeneration
  const handleRegenerated = async (newGenerationId: string) => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }

    setVideoUrl(null)
    setVideoSubtitledUrl(null)
    setShowSubtitledVideo(true)
    setSocialCopy(null)
    setVisibility('private')
    setGenerationError(null)
    setGenerationId(newGenerationId)
    setGenerationStage('analyzing')
    setIsGenerating(true)
    setCurrentStep('review')

    // Start polling
    const pollStatus = async () => {
      try {
        const supabase = getBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        if (!token) {
          throw new Error('Session expired')
        }

        const response = await fetch(`/api/generate/status?id=${newGenerationId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to get status')
        }

        setGenerationStage(mapStatusToStage(data.data.status))

        if (data.data.status === 'completed') {
          if (data.data.videos && data.data.videos.length > 0) {
            setVideoUrl(data.data.videos[0].videoUrl)
            const subtitledUrl = data.data.videos[0].videoSubtitledUrl || data.data.videos[0].videoCaptionedUrl
            setVideoSubtitledUrl(subtitledUrl || null)
            setShowSubtitledVideo(!!subtitledUrl)
          }
          if (data.data.visibility) {
            setVisibility(data.data.visibility)
          }
          if (fetchedProduct) {
            setSocialCopy(generateSocialCopy(fetchedProduct, 'tiktok'))
          }

          window.dispatchEvent(new CustomEvent('credits-updated'))
          await new Promise(resolve => setTimeout(resolve, 1000))
          setIsGenerating(false)
          setCurrentStep('results')
          return
        }

        if (data.data.status === 'failed') {
          throw new Error('Regeneration failed. Please try again.')
        }

        pollingRef.current = setTimeout(pollStatus, 3000)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Polling error'
        setGenerationError(message)
        setIsGenerating(false)
      }
    }

    pollStatus()
  }

  // Handle visibility change
  const handleVisibilityChange = async (newVisibility: VideoVisibility) => {
    if (!generationId || isUpdatingVisibility) return

    setIsUpdatingVisibility(true)

    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) return

      const response = await fetch(`/api/generations/${generationId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (response.ok) {
        setVisibility(newVisibility)
      }
    } catch (error) {
      console.error('Failed to update visibility:', error)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  // Create another video
  const handleCreateAnother = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
    setCurrentStep('product')
    setProductUrl('')
    setManualProduct(null)
    setFetchedProduct(null)
    setFreeformScript('')
    setCaptionsEnabled(true)
    setEndScreenEnabled(false)
    setEndScreenData({ ctaText: 'Shop Now', brandText: '' })
    setVideoUrl(null)
    setVideoSubtitledUrl(null)
    setShowSubtitledVideo(true)
    setSocialCopy(null)
    setVisibility('private')
    setGenerationStage('writing')
    setGenerationId(null)
    setGenerationError(null)
  }

  // Get product info for personalized hooks
  const productContext = fetchedProduct ? {
    problem: fetchedProduct.description?.split('.')[0] || 'common issues',
    product: fetchedProduct.name,
    oldSolution: 'other products',
  } : undefined

  // Get display video URL
  const displayVideoUrl = showSubtitledVideo && videoSubtitledUrl ? videoSubtitledUrl : videoUrl

  // Show generation view when generating
  if (isGenerating) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card padding="none">
            <GenerationView
              stage={generationStage}
              stages={diyStages}
              estimatedTime="~4 minutes"
              onCancel={handleCancelGeneration}
                          />
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Results step
  if (currentStep === 'results') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">Your Video is Ready!</h1>
              <p className="text-text-muted">Download, share, or schedule your video</p>
            </div>
          </div>

          {/* Video Subtitle Toggle */}
          {videoSubtitledUrl && (
            <Card className="p-4 bg-surface border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-text-primary">Video Version</h4>
                  <p className="text-xs text-text-muted">Choose which version to preview</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-lg">
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

          {/* Video Player + Social Copy */}
          {videoUrl && (
            <StrategyResults
              videoUrl={displayVideoUrl || undefined}
              socialCopy={socialCopy || undefined}
              generationId={generationId || undefined}
              userPlan={userPlan}
              onDownload={() => {
                if (displayVideoUrl) {
                  const link = document.createElement('a')
                  link.href = displayVideoUrl
                  link.download = `ugcfirst-video${showSubtitledVideo ? '-subtitled' : ''}.mp4`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }
              }}
              onSchedule={() => setShowScheduleModal(true)}
              onCreateAnother={handleCreateAnother}
              onRegenerateSocialCopy={async () => {
                if (!fetchedProduct) return
                setIsRegeneratingSocialCopy(true)
                try {
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  setSocialCopy(generateSocialCopy(fetchedProduct, 'tiktok'))
                } finally {
                  setIsRegeneratingSocialCopy(false)
                }
              }}
              isRegeneratingSocialCopy={isRegeneratingSocialCopy}
            />
          )}

          {/* Visibility Settings */}
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

          {/* Schedule Teaser */}
          {!canSchedule && videoUrl && (
            <ScheduleUpgradeCard variant="full" />
          )}

          {/* Regenerate Card */}
          {videoUrl && generationId && (
            <Card className="p-5 bg-surface border border-border-default">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">Not quite right?</h4>
                  <p className="text-xs text-text-muted">Regenerate with feedback at half the cost</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRegenerateModal(true)}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Regenerate (5 Credits)
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Schedule Modal */}
        {displayVideoUrl && (
          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            videoUrl={displayVideoUrl}
            defaultCaption={socialCopy?.text || ''}
            generationId={generationId || undefined}
            onScheduled={(scheduledPostId) => {
              console.log('Post scheduled:', scheduledPostId)
            }}
          />
        )}

        {/* Regenerate Modal */}
        {generationId && (
          <RegenerateModal
            isOpen={showRegenerateModal}
            onClose={() => setShowRegenerateModal(false)}
            generationId={generationId}
            captionsEnabled={captionsEnabled}
            onRegenerated={handleRegenerated}
          />
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">Studio</h1>
            <p className="text-text-muted">Direct your video, step by step</p>
          </div>
          <CreditBadge amount={totalCreditCost} size="lg" />
        </div>

        {/* Low Credits Banner */}
        {creditBalance && (
          <LowCreditsBanner balance={creditBalance.available} />
        )}

        {/* Generation Error Banner */}
        {generationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-status-error/10 border border-status-error/20 text-status-error"
          >
            <p className="text-sm font-medium">{generationError}</p>
            <button
              onClick={() => setGenerationError(null)}
              className="text-xs underline mt-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Progress */}
        <FadeIn delay={0.1}>
          <div className="space-y-4">
            <Progress value={progressValue} size="sm" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <motion.button
                  key={step.id}
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  className={cn(
                    'flex items-center gap-2 text-sm transition-colors',
                    index <= currentStepIndex ? 'text-text-primary' : 'text-text-muted',
                    index < currentStepIndex && 'cursor-pointer'
                  )}
                  disabled={index > currentStepIndex}
                  whileHover={index < currentStepIndex ? { scale: 1.02 } : undefined}
                  whileTap={index < currentStepIndex ? { scale: 0.98 } : undefined}
                >
                  <span className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    index < currentStepIndex
                      ? 'bg-gradient-to-r from-mint to-mint-dark text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : index === currentStepIndex
                      ? 'bg-mint/20 text-mint ring-2 ring-mint/50'
                      : 'bg-surface text-text-muted'
                  )}>
                    {step.icon}
                  </span>
                  <span className="hidden sm:block">{step.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASINGS.easeOut }}
        >
        <GradientCard padding="lg">
          {/* Step 1: Product Input */}
          {currentStep === 'product' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Add Your Product</CardTitle>
                <CardDescription>
                  Paste a product URL or enter details manually
                </CardDescription>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-cream rounded-lg w-fit">
                <button
                  onClick={() => setInputMode('saved')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                    inputMode === 'saved'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <Package className="w-4 h-4" />
                  My Products
                  {savedProducts.length > 0 && (
                    <span className="text-xs bg-mint/20 text-mint px-1.5 py-0.5 rounded-full">
                      {savedProducts.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setInputMode('url')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                    inputMode === 'url'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <Link2 className="w-4 h-4" />
                  Paste URL
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
                    inputMode === 'manual'
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <PenLine className="w-4 h-4" />
                  Manual Entry
                </button>
              </div>

              {inputMode === 'saved' && (
                <div className="space-y-4">
                  {isLoadingSaved ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square skeleton rounded-lg" />
                      ))}
                    </div>
                  ) : savedProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-8 h-8 text-text-muted mx-auto mb-2" />
                      <p className="text-sm text-text-muted">No saved products yet</p>
                      <p className="text-xs text-text-muted mt-1">
                        Products are saved automatically when you import them
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {savedProducts.map((product) => (
                        <motion.button
                          key={product.id}
                          onClick={() => {
                            setFetchedProduct({
                              name: product.name,
                              image: product.image_url,
                              images: product.images,
                              price: product.price || undefined,
                              description: product.description || undefined,
                              features: product.features,
                              source: product.source,
                              url: product.source_url || undefined,
                            })
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-left rounded-xl border border-border-default bg-surface overflow-hidden hover:border-mint/50 transition-colors"
                        >
                          <div className="aspect-square bg-cream overflow-hidden">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-medium text-text-primary truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-text-muted mt-1">
                              {product.generation_count > 0
                                ? `${product.generation_count} video${product.generation_count > 1 ? 's' : ''} created`
                                : 'Never used'}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'url' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="https://your-store.com/product/awesome-product"
                      value={productUrl}
                      onChange={(e) => {
                        setProductUrl(e.target.value)
                        setFetchError(null)
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => fetchProductFromUrl(productUrl)}
                      disabled={!isValidUrl(productUrl) || isFetchingProduct}
                      isLoading={isFetchingProduct}
                    >
                      Extract
                    </Button>
                  </div>
                  {fetchError && (
                    <p className="text-sm text-status-error">{fetchError}</p>
                  )}
                </div>
              )}

              {inputMode === 'manual' && (
                <div className="space-y-4">
                  <ManualProductForm
                    onChange={setManualProduct}
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!canStartManual}
                  >
                    Use This Product
                  </Button>
                </div>
              )}

              {/* Product Preview */}
              {fetchedProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ProductPreview
                    product={fetchedProduct}
                    onEdit={() => {
                      setFetchedProduct(null)
                      setProductUrl('')
                      setManualProduct(null)
                    }}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 'template' && (
            <TemplateSelector
              selectedTemplateId={selectedTemplate?.id || null}
              onSelect={selectTemplate}
            />
          )}

          {/* Step 3: Script Writing */}
          {currentStep === 'script' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    {selectedTemplate ? `Write Your ${selectedTemplate.name} Script` : 'Write Your Script'}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate
                      ? 'Fill in each section following the template structure'
                      : 'Write what you want the avatar to say in your video'}
                  </CardDescription>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateScriptForMe}
                  disabled={isGeneratingScript || !fetchedProduct}
                  className="gap-2 shrink-0"
                >
                  {isGeneratingScript ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate for me
                    </>
                  )}
                </Button>
              </div>

              {selectedTemplate && script ? (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Script Editor */}
                  <div className="lg:col-span-2 space-y-4">
                    {selectedTemplate.sections.map((section) => {
                      const scriptSection = script.sections.find(s => s.sectionId === section.id)
                      const isActive = activeSection === section.id

                      return (
                        <div
                          key={section.id}
                          className={cn(
                            'rounded-xl border transition-all duration-200',
                            isActive
                              ? 'border-mint/50 bg-mint/5'
                              : 'border-border-default bg-cream'
                          )}
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => setActiveSection(section.id)}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={cn('w-2 h-2 rounded-full', section.color)} />
                              <h4 className="text-sm font-medium text-text-primary">
                                {section.name}
                              </h4>
                              <span className="text-xs text-text-muted ml-auto">
                                {section.startTime}s - {section.endTime}s
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mb-3">
                              {section.description}
                            </p>
                            <Textarea
                              placeholder={section.placeholder}
                              value={scriptSection?.content || ''}
                              onChange={(e) => updateSectionContent(section.id, e.target.value)}
                              onFocus={() => setActiveSection(section.id)}
                              className="min-h-[80px] bg-surface"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className={cn(
                                'text-xs',
                                scriptSection?.isValid ? 'text-status-success' : 'text-text-muted'
                              )}>
                                {scriptSection?.wordCount || 0} / {section.wordCount.recommended} words
                              </span>
                              {scriptSection?.validationMessage && (
                                <span className="text-xs text-status-warning">
                                  {scriptSection.validationMessage}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Hook Examples */}
                    {activeSection && (
                      <div className="p-4 rounded-xl bg-surface-raised/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-text-primary">
                            Quick-fill Hook Examples
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.hookExamples.slice(0, 4).map((hook, i) => {
                            const personalizedHook = productContext
                              ? personalizeHook(hook, productContext)
                              : hook
                            return (
                              <button
                                key={i}
                                onClick={() => useHookExample(personalizedHook)}
                                className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-mint/50 transition-colors"
                              >
                                {personalizedHook.substring(0, 40)}...
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline Preview */}
                  <div className="lg:col-span-1">
                    <TemplatePreview
                      template={selectedTemplate}
                      scriptSections={script.sections}
                      activeSectionId={activeSection}
                      onSectionClick={setActiveSection}
                    />
                  </div>
                </div>
              ) : (
                // Freeform editor
                <div className="space-y-4">
                  <Textarea
                    label="Video Script"
                    placeholder="Start writing your script here... Example: Are you tired of uncomfortable shoes? The Nike Air Max is here to change the game..."
                    value={freeformScript}
                    onChange={(e) => setFreeformScript(e.target.value)}
                    showCount
                    maxLength={500}
                    className="min-h-[200px]"
                  />
                </div>
              )}

              {/* Caption Toggle */}
              <CaptionToggle
                enabled={captionsEnabled}
                onToggle={setCaptionsEnabled}
              />

              {/* End Screen Toggle */}
              <EndScreenToggle
                enabled={endScreenEnabled}
                onToggle={setEndScreenEnabled}
                data={endScreenData}
                onDataChange={setEndScreenData}
              />
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Review & Generate</CardTitle>
                <CardDescription>
                  Review your selections before generating
                </CardDescription>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Product</h4>
                  <p className="text-text-primary">
                    {fetchedProduct?.name || 'No product selected'}
                  </p>
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Template</h4>
                  <p className="text-text-primary">
                    {selectedTemplate?.name || 'No template selected'}
                  </p>
                  {selectedTemplate && (
                    <p className="text-xs text-text-muted mt-1">
                      {selectedTemplate.duration.min}-{selectedTemplate.duration.max}s  {selectedTemplate.sections.length} sections
                    </p>
                  )}
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Script</h4>
                  {selectedTemplate && script ? (
                    <div className="space-y-2">
                      {script.sections.map((section) => {
                        const templateSection = selectedTemplate.sections.find(s => s.id === section.sectionId)
                        return (
                          <div key={section.sectionId} className="text-sm">
                            <span className="text-text-muted">{templateSection?.name}: </span>
                            <span className="text-text-primary">
                              {section.content || '(empty)'}
                            </span>
                          </div>
                        )
                      })}
                      <p className="text-xs text-text-muted mt-2">
                        {getTotalWordCount()} words  ~{getTotalDuration()}s
                      </p>
                    </div>
                  ) : (
                    <p className="text-text-primary whitespace-pre-wrap">
                      {freeformScript || 'No script written'}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className={cn(
                        'w-4 h-4',
                        captionsEnabled ? 'text-mint' : 'text-text-muted'
                      )} />
                      <span className="text-text-primary">
                        Auto Subtitles: {captionsEnabled ? 'Enabled (+1 credit)' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className={cn(
                        'w-4 h-4',
                        endScreenEnabled ? 'text-purple-400' : 'text-text-muted'
                      )} />
                      <span className="text-text-primary">
                        End Screen: {endScreenEnabled
                          ? `Enabled (+2 credits) — "${endScreenData.ctaText}"${endScreenData.brandText ? ` · ${endScreenData.brandText}` : ''}`
                          : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </GradientCard>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={goPrevious}
            disabled={currentStepIndex === 0}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === 'review' ? (
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!canProceed()}
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 mr-2" />
              Generate Video ({totalCreditCost} Credits)
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
            >
              Next
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        required={totalCreditCost}
        available={creditBalance?.available ?? 0}
        mode="diy"
        captionsEnabled={captionsEnabled}
      />

      {/* Video Limit Modal */}
      <VideoLimitModal
        isOpen={showVideoLimitModal}
        onClose={() => setShowVideoLimitModal(false)}
        limit={videoLimitData?.limit ?? 1}
        used={videoLimitData?.used ?? 1}
      />
    </DashboardLayout>
  )
}
