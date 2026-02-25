import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/types'

export interface ProductCardProps {
  product: Product
  isSelected?: boolean
  onSelect?: (product: Product) => void
  className?: string
}

const sourceLabels = {
  url: 'Imported',
  manual: 'Manual',
}

export function ProductCard({ product, isSelected = false, onSelect, className }: ProductCardProps) {
  return (
    <Card
      hoverable
      selected={isSelected}
      padding="none"
      className={cn('overflow-hidden cursor-pointer', className)}
      onClick={() => onSelect?.(product)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-cream">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute inset-0 bg-mint/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-mint flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="default" size="sm">
            {sourceLabels[product.source]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-text-primary text-sm truncate">
          {product.name}
        </h3>
      </div>
    </Card>
  )
}

// Add Manual product card
export function AddProductCard({ onClick }: { onClick?: () => void }) {
  return (
    <Card
      hoverable
      padding="none"
      className="overflow-hidden cursor-pointer border-2 border-dashed border-border-default hover:border-mint"
      onClick={onClick}
    >
      <div className="aspect-square flex flex-col items-center justify-center gap-2 text-text-muted hover:text-text-primary transition-colors">
        <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
          <span className="text-2xl">+</span>
        </div>
        <span className="text-sm font-medium">Add Manually</span>
      </div>
    </Card>
  )
}
