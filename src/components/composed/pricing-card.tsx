import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { cn, formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { PricingPlan } from '@/types'

export interface PricingCardProps {
  plan: PricingPlan
  isCurrentPlan?: boolean
  onSelect?: (plan: PricingPlan) => void
  className?: string
}

export function PricingCard({ plan, isCurrentPlan = false, onSelect, className }: PricingCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col',
        plan.isPopular && 'ring-2 ring-electric-indigo shadow-glow',
        className
      )}
      padding="lg"
    >
      {/* Popular badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-electric-indigo to-vibrant-fuchsia text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            Popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">
          {plan.name}
        </h3>
      </div>

      {/* Price */}
      <div className="mb-6">
        <span className="text-5xl font-bold text-text-primary">
          {formatCurrency(plan.price)}
        </span>
        <span className="text-text-muted">/month</span>
      </div>

      {/* Credits info */}
      <div className="mb-6 pb-6 border-b border-border-default">
        <div className="text-lg text-text-primary mb-1">
          {plan.credits} Credits
        </div>
        <div className="text-sm text-text-muted">
          {plan.videoCount} videos • {formatCurrency(plan.costPerVideo)}/video
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-4 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-electric-indigo flex-shrink-0 mt-0.5" />
            <span className="text-text-primary text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Limitations */}
      {plan.limitations && plan.limitations.length > 0 && (
        <ul className="space-y-2 mb-8 pt-4 border-t border-border-default">
          {plan.limitations.map((limitation, index) => (
            <li key={index} className="flex items-start gap-3">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <span className="text-text-muted text-sm">{limitation}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <Button
        variant={plan.isPopular ? 'primary' : 'secondary'}
        className="w-full"
        onClick={() => onSelect?.(plan)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
      </Button>
    </Card>
  )
}
