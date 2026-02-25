'use client';

import { motion } from 'framer-motion';
import { Package, ExternalLink, Check, Pencil, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FetchedProduct } from '@/types/generation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageSelector } from './image-selector';

export interface ProductPreviewProps {
  product: FetchedProduct;
  onEdit?: () => void;
  onImageSelect?: (imageUrl: string) => void;
  className?: string;
  compact?: boolean;
}

export function ProductPreview({
  product,
  onEdit,
  onImageSelect,
  className,
  compact = false,
}: ProductPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={cn('bg-surface border border-border-default', compact ? 'p-4' : 'p-6')}>
        <div className={cn('flex gap-5', compact ? 'flex-row items-start' : 'flex-col md:flex-row')}>
          {/* Product Image */}
          <div
            className={cn(
              'relative rounded-lg overflow-hidden bg-surface-raised flex-shrink-0',
              compact ? 'w-20 h-20' : 'w-full md:w-48 h-48'
            )}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-text-muted" />
              </div>
            )}
            {/* Source badge */}
            <div className="absolute top-2 left-2">
              <Badge variant="purple" size="sm" className="flex items-center gap-1">
                {product.source === 'url' ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>URL Import</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" />
                    <span>Manual</span>
                  </>
                )}
              </Badge>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className={cn('font-semibold text-text-primary', compact ? 'text-base' : 'text-lg')}>
                  {product.name}
                </h3>
                {product.price && (
                  <p className="text-mint font-medium mt-1">{product.price}</p>
                )}
              </div>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit} className="flex-shrink-0">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {/* Description - only show if not compact */}
            {!compact && product.description && (
              <p className="text-text-muted text-sm mb-4 line-clamp-2">{product.description}</p>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className={cn(compact ? 'mt-2' : '')}>
                {!compact && (
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                    Key Features
                  </p>
                )}
                <ul className={cn('space-y-1.5', compact && 'flex flex-wrap gap-2')}>
                  {(compact ? product.features.slice(0, 3) : product.features).map((feature, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        compact ? 'text-text-muted' : 'text-text-primary'
                      )}
                    >
                      {!compact && (
                        <Check className="w-4 h-4 text-status-success flex-shrink-0 mt-0.5" />
                      )}
                      <span className={compact ? 'text-xs' : ''}>{feature}</span>
                    </li>
                  ))}
                  {compact && product.features.length > 3 && (
                    <li className="text-xs text-text-muted">
                      +{product.features.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* URL Link - only for URL imports and not compact */}
            {!compact && product.source === 'url' && product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-mint hover:text-coral transition-colors mt-4"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View original product</span>
              </a>
            )}

            {/* Image Selector - show when multiple images available */}
            {!compact && product.images && product.images.length > 1 && onImageSelect && (
              <ImageSelector
                images={product.images}
                selectedImage={product.image}
                onSelect={onImageSelect}
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Skeleton loader for ProductPreview
export function ProductPreviewSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cn('bg-surface border border-border-default', compact ? 'p-4' : 'p-6')}>
      <div className={cn('flex gap-5', compact ? 'flex-row items-start' : 'flex-col md:flex-row')}>
        <div
          className={cn(
            'rounded-lg bg-surface-raised animate-pulse flex-shrink-0',
            compact ? 'w-20 h-20' : 'w-full md:w-48 h-48'
          )}
        />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-surface-raised rounded animate-pulse w-3/4" />
          <div className="h-4 bg-surface-raised rounded animate-pulse w-1/4" />
          {!compact && (
            <>
              <div className="h-4 bg-surface-raised rounded animate-pulse w-full" />
              <div className="h-4 bg-surface-raised rounded animate-pulse w-2/3" />
            </>
          )}
          <div className="space-y-2 mt-4">
            <div className="h-4 bg-surface-raised rounded animate-pulse w-1/2" />
            <div className="h-4 bg-surface-raised rounded animate-pulse w-2/3" />
            <div className="h-4 bg-surface-raised rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
    </Card>
  );
}
