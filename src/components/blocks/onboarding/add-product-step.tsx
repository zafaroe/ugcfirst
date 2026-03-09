'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, PenLine, Check, Package } from 'lucide-react'
import { Button, Input, GradientCard, SPRING } from '@/components/ui'
import { ManualProductForm, isManualProductValid, ProductPreview } from '@/components/composed'
import type { ManualProductData } from '@/components/composed'
import type { FetchedProduct } from '@/types/generation'
import { getBrowserClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface AddProductStepProps {
  onNext: () => void
  onBack: () => void
}

type InputMode = 'url' | 'manual'

export function AddProductStep({ onNext, onBack }: AddProductStepProps) {
  const [inputMode, setInputMode] = useState<InputMode>('url')
  const [productUrl, setProductUrl] = useState('')
  const [manualProduct, setManualProduct] = useState<ManualProductData | null>(null)
  const [fetchedProduct, setFetchedProduct] = useState<FetchedProduct | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const canStartManual = manualProduct ? isManualProductValid(manualProduct) : false

  // Auto-save product to library
  const saveProduct = async (product: FetchedProduct, source: 'url' | 'manual', sourceUrl?: string) => {
    try {
      const supabase = getBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setIsSaved(true)
        return
      }

      await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          imageUrl: product.image,
          images: product.images || [],
          price: product.price,
          features: product.features,
          source,
          sourceUrl,
        }),
      })
      setIsSaved(true)
    } catch (e) {
      console.error('Failed to save product:', e)
      // Don't block onboarding if save fails
      setIsSaved(true)
    }
  }

  const fetchProductFromUrl = async () => {
    if (!isValidUrl(productUrl)) return
    setIsFetching(true)
    setFetchError(null)

    try {
      const response = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to extract product')

      setFetchedProduct(data.product)
      await saveProduct(data.product, 'url', productUrl)
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch product')
    } finally {
      setIsFetching(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualProduct || !isManualProductValid(manualProduct)) return

    setIsFetching(true)
    const product: FetchedProduct = {
      name: manualProduct.name,
      description: manualProduct.description || '',
      price: manualProduct.price || '',
      image: manualProduct.imagePreview || '',
      features: manualProduct.features.filter((f: string) => f.trim()),
      source: 'manual',
    }
    setFetchedProduct(product)
    await saveProduct(product, 'manual')
    setIsFetching(false)
  }

  const handleReset = () => {
    setFetchedProduct(null)
    setIsSaved(false)
    setProductUrl('')
    setManualProduct(null)
    setFetchError(null)
  }

  return (
    <div className="text-center">
      {/* Title */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint to-mint-dark flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mint/30">
          <Package className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <motion.h1
        className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Add Your First Product
      </motion.h1>

      <motion.p
        className="text-text-muted mb-8 max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Import a product to create your first video. You can always add more later.
      </motion.p>

      {/* Success state - show when product is saved */}
      {fetchedProduct && isSaved ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING.bouncy}
          className="space-y-6"
        >
          {/* Success message */}
          <div className="flex items-center justify-center gap-2 text-status-success mb-4">
            <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span className="font-medium">Product saved to your library</span>
          </div>

          {/* Product Preview */}
          <GradientCard padding="lg" className="max-w-md mx-auto">
            <ProductPreview
              product={fetchedProduct}
              onEdit={handleReset}
            />
          </GradientCard>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={onNext}
              className="min-w-[200px] shadow-lg shadow-mint/25"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-1 p-1 bg-cream rounded-lg w-fit mx-auto">
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

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-4"
            >
              <GradientCard padding="lg">
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
                      onClick={fetchProductFromUrl}
                      disabled={!isValidUrl(productUrl) || isFetching}
                      isLoading={isFetching}
                    >
                      Extract
                    </Button>
                  </div>
                  {fetchError && (
                    <p className="text-sm text-status-error">{fetchError}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    Paste any product URL from Shopify, Amazon, AliExpress, or any other store
                  </p>
                </div>
              </GradientCard>
            </motion.div>
          )}

          {/* Manual Entry Mode */}
          {inputMode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto space-y-4"
            >
              <GradientCard padding="lg">
                <ManualProductForm onChange={setManualProduct} />
                <div className="mt-4">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!canStartManual || isFetching}
                    isLoading={isFetching}
                    className="w-full"
                  >
                    Use This Product
                  </Button>
                </div>
              </GradientCard>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Skip option */}
      {!isSaved && (
        <motion.button
          className="mt-6 text-sm text-text-muted hover:text-mint transition-colors duration-200"
          onClick={onNext}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          I'll do this later
        </motion.button>
      )}
    </div>
  )
}
