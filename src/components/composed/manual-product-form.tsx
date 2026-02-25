'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, DollarSign, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, Textarea, FileUpload, Button, SPRING } from '@/components/ui'

export interface ManualProductData {
  name: string
  image: File | null
  imagePreview: string | null
  description: string
  features: string[]
  price: string
}

export interface ManualProductFormProps {
  onChange: (data: ManualProductData) => void
  className?: string
}

const initialData: ManualProductData = {
  name: '',
  image: null,
  imagePreview: null,
  description: '',
  features: [''],
  price: '',
}

export function ManualProductForm({ onChange, className }: ManualProductFormProps) {
  const [data, setData] = useState<ManualProductData>(initialData)
  const [imageError, setImageError] = useState<string | null>(null)

  const updateField = useCallback(
    <K extends keyof ManualProductData>(field: K, value: ManualProductData[K]) => {
      const newData = { ...data, [field]: value }
      setData(newData)
      onChange(newData)
    },
    [data, onChange]
  )

  const handleImageUpload = useCallback(
    (file: File) => {
      setImageError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        const newData = { ...data, image: file, imagePreview: preview }
        setData(newData)
        onChange(newData)
      }
      reader.readAsDataURL(file)
    },
    [data, onChange]
  )

  const handleImageRemove = useCallback(() => {
    const newData = { ...data, image: null, imagePreview: null }
    setData(newData)
    onChange(newData)
  }, [data, onChange])

  const handleImageError = useCallback((error: string) => {
    setImageError(error)
  }, [])

  const addFeature = useCallback(() => {
    const newFeatures = [...data.features, '']
    updateField('features', newFeatures)
  }, [data.features, updateField])

  const removeFeature = useCallback(
    (index: number) => {
      if (data.features.length <= 1) return
      const newFeatures = data.features.filter((_, i) => i !== index)
      updateField('features', newFeatures)
    },
    [data.features, updateField]
  )

  const updateFeature = useCallback(
    (index: number, value: string) => {
      const newFeatures = [...data.features]
      newFeatures[index] = value
      updateField('features', newFeatures)
    },
    [data.features, updateField]
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Product Name */}
      <Input
        label="Product Name"
        placeholder="Enter your product name"
        value={data.name}
        onChange={(e) => updateField('name', e.target.value)}
        required
      />

      {/* Product Image */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Product Image <span className="text-status-error">*</span>
        </label>
        <FileUpload
          accept="image/*"
          maxSize={5 * 1024 * 1024}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
          onError={handleImageError}
          previewUrl={data.imagePreview}
          preview
        />
        {imageError && (
          <p className="mt-1.5 text-sm text-status-error">{imageError}</p>
        )}
      </div>

      {/* Product Features */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-mint" />
          Product Features <span className="text-status-error">*</span>
        </label>
        <p className="text-xs text-text-muted mb-3">
          Add key features or benefits of your product (at least 1 required)
        </p>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {data.features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={SPRING.bouncy}
              >
                <Input
                  placeholder={`Feature ${index + 1} (e.g., "Waterproof design")`}
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1"
                />
                {data.features.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="px-3 text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <Button
            variant="secondary"
            size="sm"
            onClick={addFeature}
            className="w-full hover:border-mint/50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* Product Description (Optional) */}
      <Textarea
        label="Product Description (Optional)"
        placeholder="Describe your product in more detail..."
        value={data.description}
        onChange={(e) => updateField('description', e.target.value)}
        showCount
        maxLength={500}
        helperText="Optional: Add more context about your product"
      />

      {/* Price (Optional) */}
      <Input
        label="Price (Optional)"
        placeholder="29.99"
        value={data.price}
        onChange={(e) => {
          // Only allow numbers and decimal point
          const value = e.target.value.replace(/[^0-9.]/g, '')
          updateField('price', value)
        }}
        leftIcon={<DollarSign className="w-4 h-4" />}
        helperText="Optional: Display price in the video"
      />
    </div>
  )
}

// Validation helper
export function isManualProductValid(data: ManualProductData): boolean {
  return (
    data.name.trim().length > 0 &&
    data.image !== null &&
    data.features.some((f) => f.trim().length > 0)
  )
}
