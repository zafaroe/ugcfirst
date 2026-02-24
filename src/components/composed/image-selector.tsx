'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageSelectorProps {
  images: string[];
  selectedImage: string;
  onSelect: (imageUrl: string) => void;
  className?: string;
  maxImages?: number;
}

export function ImageSelector({
  images,
  selectedImage,
  onSelect,
  className,
  maxImages = 10,
}: ImageSelectorProps) {
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Filter out images that failed to load and limit to maxImages
  const displayImages = images
    .filter((img) => !loadErrors.has(img))
    .slice(0, maxImages);

  const handleImageError = (imageUrl: string) => {
    setLoadErrors((prev) => new Set([...prev, imageUrl]));
  };

  const handleImageLoad = (imageUrl: string) => {
    setLoadedImages((prev) => new Set([...prev, imageUrl]));
  };

  // Don't render if only one image or no images
  if (displayImages.length <= 1) {
    return null;
  }

  return (
    <div className={cn('mt-4', className)}>
      <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
        Select Product Image ({displayImages.length} available)
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {displayImages.map((imageUrl, idx) => {
          const isSelected = imageUrl === selectedImage;
          const isLoaded = loadedImages.has(imageUrl);

          return (
            <motion.button
              key={imageUrl}
              onClick={() => onSelect(imageUrl)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-electric-indigo focus:ring-offset-2 focus:ring-offset-deep-space',
                isSelected
                  ? 'ring-2 ring-electric-indigo shadow-glow'
                  : 'ring-1 ring-border-default hover:ring-electric-indigo/50'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Loading placeholder */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-elevated animate-pulse flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-text-muted" />
                </div>
              )}

              {/* Image */}
              <img
                src={imageUrl}
                alt={`Product image ${idx + 1}`}
                className={cn(
                  'w-full h-full object-cover',
                  !isLoaded && 'opacity-0'
                )}
                onError={() => handleImageError(imageUrl)}
                onLoad={() => handleImageLoad(imageUrl)}
              />

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute inset-0 bg-electric-indigo/20">
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-electric-indigo flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Image number badge */}
              {!isSelected && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-deep-space/80 text-[10px] text-text-muted">
                  {idx + 1}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Show count of hidden images */}
      {images.length > maxImages && (
        <p className="text-xs text-text-muted mt-2">
          +{images.length - maxImages} more images not shown
        </p>
      )}
    </div>
  );
}

// Skeleton loader for ImageSelector
export function ImageSelectorSkeleton() {
  return (
    <div className="mt-4">
      <div className="h-4 w-40 bg-elevated rounded animate-pulse mb-3" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-20 h-20 rounded-lg bg-elevated animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
