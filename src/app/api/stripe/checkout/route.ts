import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '@/lib/supabase'
import {
  getOrCreateCustomer,
  createSubscriptionCheckout,
  createCreditPackCheckout,
  stripePrices,
  isSubscriptionPrice,
} from '@/lib/stripe'

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for subscriptions or credit packs.
 *
 * Body:
 * - priceId: string (Stripe price ID)
 * - successUrl?: string (optional, defaults to /dashboard?checkout=success)
 * - cancelUrl?: string (optional, defaults to /pricing)
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { priceId, successUrl, cancelUrl } = body

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      authResult.user.id,
      authResult.user.email!
    )

    // Determine the base URL
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Default URLs
    const defaultSuccessUrl = `${origin}/dashboard?checkout=success`
    const defaultCancelUrl = `${origin}/pricing`

    // Create the appropriate checkout session
    let session
    if (isSubscriptionPrice(priceId)) {
      session = await createSubscriptionCheckout(
        customerId,
        priceId,
        successUrl || defaultSuccessUrl,
        cancelUrl || defaultCancelUrl,
        {
          user_id: authResult.user.id,
        }
      )
    } else {
      session = await createCreditPackCheckout(
        customerId,
        priceId,
        successUrl || defaultSuccessUrl,
        cancelUrl || defaultCancelUrl,
        {
          user_id: authResult.user.id,
        }
      )
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stripe/checkout/prices
 *
 * Returns the available price IDs for the frontend.
 */
export async function GET() {
  return NextResponse.json(stripePrices)
}
