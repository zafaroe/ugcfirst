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
        'relative flex flex-col h-full',
        plan.isPopular && 'ring-2 ring-mint shadow-glow',
        className
      )}
      padding="lg"
    >
      {/* Popular badge */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-mint to-mint-dark text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
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
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-text-primary tracking-tight">
            {formatCurrency(plan.price)}
          </span>
          <span className="text-text-muted text-sm">/month</span>
        </div>
      </div>

      {/* Credits info */}
      <div className="mb-6 pb-6 border-b border-border-default">
        <div className="text-sm font-semibold text-text-primary mb-1">
          {plan.credits} Credits · {plan.videoCount} videos
        </div>
        <div className="text-sm text-mint font-medium">
          {plan.costPerVideo > 0 ? `${formatCurrency(plan.costPerVideo)}/video` : 'Free'}
        </div>
      </div>

      {/* Features & Limitations Container - grows to fill space */}
      <div className="flex-grow flex flex-col">
        {/* Features */}
        <ul className="space-y-3 mb-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-mint flex-shrink-0 mt-0.5" />
              <span className="text-text-primary text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Limitations */}
        {plan.limitations && plan.limitations.length > 0 && (
          <ul className="space-y-2 pt-4 border-t border-border-default">
            {plan.limitations.map((limitation, index) => (
              <li key={index} className="flex items-start gap-3">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <span className="text-text-muted text-sm">{limitation}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA - always at bottom */}
      <Button
        variant={plan.isPopular ? 'primary' : 'secondary'}
        className="w-full mt-6"
        onClick={() => onSelect?.(plan)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
      </Button>
    </Card>
  )
}
