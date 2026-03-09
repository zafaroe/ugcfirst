import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase'
import { createPortalSession } from '@/lib/stripe'

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 *
 * Body:
 * - returnUrl?: string (optional, defaults to /settings/billing)
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { returnUrl } = body

    const supabase = getAdminClient()

    // Get user's Stripe customer ID
    const { data: credits, error } = await supabase
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', authResult.user.id)
      .single()

    if (error || !credits?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 400 }
      )
    }

    // Determine the return URL
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const defaultReturnUrl = `${origin}/settings/billing`

    // Create portal session
    const session = await createPortalSession(
      credits.stripe_customer_id,
      returnUrl || defaultReturnUrl
    )

    return NextResponse.json({
      url: session.url,
    })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
