'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight, faBox, faUser, faFileLines, faWandMagicSparkles, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { Sparkles, Lightbulb } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { GradientCard, FadeIn, EASINGS } from '@/components/ui'
import { CreditBadge, ProductCard, AddProductCard, AvatarCard, GenerationView, EmptyState, emptyStatePresets } from '@/components/composed'
import type { GenerationStage } from '@/components/composed'
import { TemplateSelector } from '@/components/blocks/create/template-selector'
import { TemplatePreview } from '@/components/blocks/create/template-preview'
import { CaptionToggle } from '@/components/blocks/create/caption-toggle'
import { useTemplateStore } from '@/hooks/use-template'
import { getTemplateById, personalizeHook } from '@/data/templates'
import { mockProducts, mockAvatars } from '@/mocks/data'
import { cn } from '@/lib/utils'

// DIY generation stages (6-stage loading)
const diyStages: GenerationStage[] = ['writing', 'casting', 'voiceover', 'assembling', 'rendering', 'complete']

type Step = 'product' | 'template' | 'avatar' | 'script' | 'review'

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'product', label: 'Product', icon: <FontAwesomeIcon icon={faBox} className="w-5 h-5" /> },
  { id: 'template', label: 'Template', icon: <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5" /> },
  { id: 'avatar', label: 'Avatar', icon: <FontAwesomeIcon icon={faUser} className="w-5 h-5" /> },
  { id: 'script', label: 'Script', icon: <FontAwesomeIcon icon={faFileLines} className="w-5 h-5" /> },
  { id: 'review', label: 'Generate', icon: <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5" /> },
]

export default function DIYCreatePage() {
  const [currentStep, setCurrentStep] = useState<Step>('product')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [freeformScript, setFreeformScript] = useState('')
  const [captionsEnabled, setCaptionsEnabled] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<GenerationStage>('writing')

  // Template store
  const {
    selectedTemplate,
    script,
    activeSection,
    selectTemplate,
    updateSectionContent,
    setActiveSection,
    useHookExample,
    isScriptComplete,
    getTotalWordCount,
    getTotalDuration,
  } = useTemplateStore()

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const progressValue = ((currentStepIndex + 1) / steps.length) * 100

  // Calculate credit cost
  const baseCreditCost = 10
  const totalCreditCost = baseCreditCost + (captionsEnabled ? 1 : 0)

  const canProceed = () => {
    switch (currentStep) {
      case 'product':
        return selectedProduct !== null
      case 'template':
        return selectedTemplate !== null
      case 'avatar':
        return selectedAvatar !== null
      case 'script':
        // If template selected, check template script completion
        if (selectedTemplate) {
          return isScriptComplete() || getTotalWordCount() >= 20
        }
        // Fallback to freeform script
        return freeformScript.trim().length >= 20
      case 'review':
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

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationStage('writing')

    // Simulate progression through stages
    for (const stage of diyStages) {
      setGenerationStage(stage)
      if (stage !== 'complete') {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    // Stay on complete for a moment then could redirect
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsGenerating(false)
  }

  const handleCancelGeneration = () => {
    setIsGenerating(false)
    setGenerationStage('writing')
  }

  // Get product info for personalized hooks
  const selectedProductData = mockProducts.find(p => p.id === selectedProduct)
  const productContext = selectedProductData ? {
    problem: selectedProductData.description?.split('.')[0] || 'common issues',
    product: selectedProductData.name,
    oldSolution: 'other products',
  } : undefined

  // Show generation view when generating
  if (isGenerating) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card padding="none">
            <GenerationView
              stage={generationStage}
              stages={diyStages}
              estimatedTime="~30 seconds"
              onCancel={handleCancelGeneration}
            />
          </Card>
        </div>
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
          {/* Step 1: Product Selection */}
          {currentStep === 'product' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Select Your Product</CardTitle>
                <CardDescription>
                  Choose a product from your connected stores or add one manually
                </CardDescription>
              </div>
              {mockProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mockProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={selectedProduct === product.id}
                      onSelect={() => setSelectedProduct(product.id)}
                    />
                  ))}
                  <AddProductCard onClick={() => console.log('Add product')} />
                </div>
              ) : (
                <EmptyState
                  {...emptyStatePresets.noProduct}
                  size="md"
                  action={{
                    label: 'Add Product',
                    onClick: () => console.log('Add product'),
                    icon: <FontAwesomeIcon icon={faBox} className="w-4 h-4" />,
                  }}
                />
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

          {/* Step 3: Avatar Selection */}
          {currentStep === 'avatar' && (
            <div className="space-y-6">
              <div>
                <CardTitle>Choose Your Avatar</CardTitle>
                <CardDescription>
                  Select an AI presenter for your video
                </CardDescription>
              </div>
              {mockAvatars.length > 0 ? (
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {mockAvatars.map(avatar => (
                    <AvatarCard
                      key={avatar.id}
                      avatar={avatar}
                      isSelected={selectedAvatar === avatar.id}
                      onSelect={() => setSelectedAvatar(avatar.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  {...emptyStatePresets.avatarsError}
                  size="md"
                  action={{
                    label: 'Retry',
                    onClick: () => window.location.reload(),
                    variant: 'secondary',
                  }}
                />
              )}
            </div>
          )}

          {/* Step 4: Script Writing */}
          {currentStep === 'script' && (
            <div className="space-y-6">
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
                // Fallback to freeform editor if no template selected
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
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 mr-2" />
                      Generate with AI
                    </Button>
                  </div>
                </div>
              )}

              {/* Caption Toggle */}
              <CaptionToggle
                enabled={captionsEnabled}
                onToggle={setCaptionsEnabled}
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
                    {mockProducts.find(p => p.id === selectedProduct)?.name || 'No product selected'}
                  </p>
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Template</h4>
                  <p className="text-text-primary">
                    {selectedTemplate?.name || 'No template selected'}
                  </p>
                  {selectedTemplate && (
                    <p className="text-xs text-text-muted mt-1">
                      {selectedTemplate.duration.min}-{selectedTemplate.duration.max}s • {selectedTemplate.sections.length} sections
                    </p>
                  )}
                </div>
                <div className="p-4 bg-cream rounded-lg">
                  <h4 className="text-sm font-medium text-text-muted mb-2">Avatar</h4>
                  <p className="text-text-primary">
                    {mockAvatars.find(a => a.id === selectedAvatar)?.name || 'No avatar selected'}
                  </p>
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
                        {getTotalWordCount()} words • ~{getTotalDuration()}s
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
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn(
                      'w-4 h-4',
                      captionsEnabled ? 'text-mint' : 'text-text-muted'
                    )} />
                    <span className="text-text-primary">
                      Auto Captions: {captionsEnabled ? 'Enabled (+1 credit)' : 'Disabled'}
                    </span>
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
    </DashboardLayout>
  )
}
