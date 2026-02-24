'use client'

import { useState, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faXmark, faImage } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface FileUploadProps {
  accept?: string
  maxSize?: number // in bytes
  onUpload: (file: File) => void
  onError?: (error: string) => void
  onRemove?: () => void
  preview?: boolean
  previewUrl?: string | null
  className?: string
  disabled?: boolean
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  onUpload,
  onError,
  onRemove,
  preview = true,
  previewUrl,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayPreview = previewUrl || localPreview

  const handleFile = useCallback(
    (file: File) => {
      // Validate file type
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        onError?.('Invalid file type. Please upload an image.')
        return
      }

      // Validate file size
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        onError?.(`File too large. Maximum size is ${maxSizeMB}MB.`)
        return
      }

      // Create preview if it's an image
      if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setLocalPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }

      onUpload(file)
    },
    [accept, maxSize, preview, onUpload, onError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    setLocalPreview(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onRemove?.()
  }, [onRemove])

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  // Show preview if available
  if (displayPreview) {
    return (
      <div className={cn('relative', className)}>
        <div className="relative rounded-lg overflow-hidden border border-border-default">
          <img
            src={displayPreview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
            onClick={handleRemove}
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-muted text-center">
          Click the X to remove and upload a different image
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center text-center',
          isDragging
            ? 'border-electric-indigo bg-electric-indigo/10'
            : 'border-border-default hover:border-electric-indigo/50 hover:bg-surface/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors',
            isDragging ? 'bg-electric-indigo/20' : 'bg-surface'
          )}
        >
          {isDragging ? (
            <FontAwesomeIcon icon={faUpload} className="w-6 h-6 text-electric-indigo" />
          ) : (
            <FontAwesomeIcon icon={faImage} className="w-6 h-6 text-text-muted" />
          )}
        </div>

        <p className="text-sm font-medium text-text-primary mb-1">
          {isDragging ? 'Drop your image here' : 'Drag & drop your image here'}
        </p>
        <p className="text-xs text-text-muted mb-3">or click to browse</p>
        <p className="text-xs text-text-muted">
          PNG, JPG, GIF up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
        </p>
      </div>
    </div>
  )
}
