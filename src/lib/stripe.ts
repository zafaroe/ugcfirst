/**
 * Server-side Stripe client and helpers
 *
 * Use these functions in API routes only - never import on the client side.
 */

import Stripe from 'stripe'
import { getAdminClient } from './supabase'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Import price IDs from generated config
import stripePrices from './stripe-prices.json'

export { stripePrices }

// Plan ID → credits per month mapping (used in webhook)
// Updated March 2026 - Final pricing
export const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  starter: 30,
  pro: 100,
  plus: 220,
  agency: 450,
}

// Plan ID → monthly video limit mapping
// 10 credits = 1 standard video
export const PLAN_VIDEO_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 10,
  plus: 22,
  agency: 45,
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  const supabase = getAdminClient()

  // Check if user already has a Stripe customer ID
  const { data: credits } = await supabase
    .from('user_credits')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (credits?.stripe_customer_id) {
    return credits.stripe_customer_id
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
    },
  })

  // Save the customer ID to the database
  await supabase
    .from('user_credits')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId)

  return customer.id
}

/**
 * Get price ID for a plan + billing interval
 */
export function getSubscriptionPriceId(planId: string, interval: 'monthly' | 'annual'): string | null {
  const plan = stripePrices.subscriptions[planId as keyof typeof stripePrices.subscriptions]
  if (!plan) return null
  return interval === 'monthly' ? plan.monthly : plan.annual
}

/**
 * Get price ID for a credit pack
 */
export function getCreditPackPriceId(packId: string): string | null {
  const pack = stripePrices.credit_packs[packId as keyof typeof stripePrices.credit_packs]
  return pack?.price || null
}

/**
 * Get credits for a credit pack
 */
export function getCreditPackCredits(packId: string): number | null {
  const pack = stripePrices.credit_packs[packId as keyof typeof stripePrices.credit_packs]
  return pack?.credits || null
}

/**
 * Create a checkout session for a subscription
 */
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata || {}, // Session-level metadata for webhook
    subscription_data: {
      metadata: metadata || {}, // Also store on subscription for reference
    },
    allow_promotion_codes: true,
  })
}

/**
 * Create a checkout session for a one-time credit pack purchase
 */
export async function createCreditPackCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata || {}, // Session-level metadata for webhook
    payment_intent_data: {
      metadata: metadata || {}, // Also store on payment intent for reference
    },
  })
}

/**
 * Create a billing portal session for subscription management
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Cancel a subscription immediately or at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  } else {
    return stripe.subscriptions.cancel(subscriptionId)
  }
}

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  })
}

/**
 * Get customer details with subscriptions
 */
export async function getCustomerWithSubscriptions(
  customerId: string
): Promise<Stripe.Customer> {
  return stripe.customers.retrieve(customerId, {
    expand: ['subscriptions'],
  }) as Promise<Stripe.Customer>
}

/**
 * Construct and verify a webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

/**
 * Get the plan ID from a Stripe price
 */
export function getPlanIdFromPrice(priceId: string): string | null {
  for (const [planId, prices] of Object.entries(stripePrices.subscriptions)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return planId
    }
  }
  return null
}

/**
 * Get the credit pack ID from a Stripe price
 */
export function getCreditPackIdFromPrice(priceId: string): string | null {
  for (const [packId, prices] of Object.entries(stripePrices.credit_packs)) {
    if (prices.price === priceId) {
      return packId
    }
  }
  return null
}

/**
 * Check if a price is for a subscription or one-time purchase
 */
export function isSubscriptionPrice(priceId: string): boolean {
  return getPlanIdFromPrice(priceId) !== null
}
