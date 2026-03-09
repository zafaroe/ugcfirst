/**
 * Browser-side Stripe helpers
 *
 * Use these functions in React components for checkout flows.
 */

import { getBrowserClient } from '@/lib/supabase'

/**
 * Redirect to Stripe Checkout for a subscription or credit pack
 * @param priceId - The Stripe price ID
 * @param planId - Optional plan ID for redirect context if not authenticated
 * @param successUrl - Optional custom success URL (defaults to /dashboard?checkout=success)
 */
export async function redirectToCheckout(
  priceId: string,
  planId?: string,
  successUrl?: string
): Promise<void> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    // Not authenticated - redirect to signup with plan context
    const redirectUrl = planId ? `/signup?plan=${planId}` : '/signup'
    window.location.href = redirectUrl
    return
  }

  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ priceId, successUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const { url } = await response.json()

  // Redirect to Stripe Checkout
  window.location.href = url
}

/**
 * Redirect to Stripe Customer Portal for subscription management
 */
export async function redirectToPortal(returnUrl?: string): Promise<void> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please sign in.')
  }

  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ returnUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create portal session')
  }

  const { url } = await response.json()

  // Redirect to Stripe Customer Portal
  window.location.href = url
}

/**
 * Fetch available price IDs from the server
 */
export async function fetchPriceIds(): Promise<{
  subscriptions: Record<string, { product: string; monthly: string; annual: string }>
  credit_packs: Record<string, { product: string; price: string; credits: number }>
}> {
  const { data: { session } } = await getBrowserClient().auth.getSession()

  const headers: HeadersInit = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch('/api/stripe/checkout', {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch price IDs')
  }

  return response.json()
}

/**
 * Preview proration for plan change
 */
export interface ProrationPreview {
  currentPlan: string
  newPlan: string
  prorationAmount: number
  nextBillingAmount: number
  nextBillingDate: string
  isUpgrade: boolean
  creditsDifference: number
  immediateCharge: number
  credit: number
}

export async function previewPlanChange(
  newPlanId: string,
  interval: 'monthly' | 'annual' = 'monthly'
): Promise<ProrationPreview> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/stripe/subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'preview', newPlanId, interval }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to preview plan change')
  }

  const data = await response.json()
  return data.preview
}

/**
 * Change subscription plan
 */
export async function changePlan(
  newPlanId: string,
  interval: 'monthly' | 'annual' = 'monthly'
): Promise<{ success: boolean; creditsAdded: number }> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/stripe/subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'change', newPlanId, interval }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to change plan')
  }

  return response.json()
}

/**
 * Fetch payment methods
 */
export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    return []
  }

  const response = await fetch('/api/stripe/payment-methods', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods')
  }

  const data = await response.json()
  return data.paymentMethods
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/stripe/payment-methods', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ paymentMethodId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove payment method')
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
  const { data: { session } } = await getBrowserClient().auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/stripe/payment-methods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ paymentMethodId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to set default payment method')
  }
}
