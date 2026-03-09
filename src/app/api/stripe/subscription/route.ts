import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase'
import { stripe, getSubscriptionPriceId, PLAN_CREDITS } from '@/lib/stripe'
import { CreditService } from '@/services/credits'

/**
 * GET /api/stripe/subscription
 *
 * Gets the current subscription details
 */
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const supabase = getAdminClient()
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('stripe_subscription_id, subscription_tier, subscription_status, current_period_end')
      .eq('user_id', authResult.user.id)
      .single()

    if (!userCredits?.stripe_subscription_id) {
      return NextResponse.json({
        subscription: null,
        currentPlan: userCredits?.subscription_tier || 'free',
      })
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(userCredits.stripe_subscription_id)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      currentPlan: userCredits.subscription_tier,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stripe/subscription/preview
 *
 * Preview proration for changing subscription plan
 *
 * Body:
 * - newPlanId: string (e.g., 'pro', 'plus')
 * - interval: 'monthly' | 'annual' (optional, defaults to current)
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { newPlanId, interval = 'monthly', action } = body

    if (action === 'preview') {
      return handlePreview(authResult.user.id, newPlanId, interval)
    } else if (action === 'change') {
      return handleChange(authResult.user.id, newPlanId, interval)
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "preview" or "change"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Subscription action error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    )
  }
}

async function handlePreview(userId: string, newPlanId: string, interval: 'monthly' | 'annual') {
  const supabase = getAdminClient()
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('stripe_subscription_id, subscription_tier')
    .eq('user_id', userId)
    .single()

  if (!userCredits?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    )
  }

  const newPriceId = getSubscriptionPriceId(newPlanId, interval)
  if (!newPriceId) {
    return NextResponse.json(
      { error: 'Invalid plan ID' },
      { status: 400 }
    )
  }

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(userCredits.stripe_subscription_id)
  const currentItemId = subscription.items.data[0].id

  // Preview the proration using upcoming invoice
  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: subscription.customer as string,
    subscription: subscription.id,
    subscription_details: {
      items: [
        {
          id: currentItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    },
  })

  // Calculate proration details (proration items have proration in parent details)
  const prorationAmount = upcomingInvoice.lines.data
    .filter((line) =>
      line.parent?.invoice_item_details?.proration ||
      line.parent?.subscription_item_details?.proration
    )
    .reduce((sum, line) => sum + line.amount, 0)

  const isUpgrade = prorationAmount > 0
  const currentPlan = userCredits.subscription_tier
  const currentCredits = PLAN_CREDITS[currentPlan] || 0
  const newCredits = PLAN_CREDITS[newPlanId] || 0
  const creditsDifference = newCredits - currentCredits

  return NextResponse.json({
    preview: {
      currentPlan,
      newPlan: newPlanId,
      prorationAmount: prorationAmount / 100, // Convert from cents
      nextBillingAmount: upcomingInvoice.total / 100,
      nextBillingDate: new Date(upcomingInvoice.next_payment_attempt! * 1000).toISOString(),
      isUpgrade,
      creditsDifference,
      immediateCharge: isUpgrade ? prorationAmount / 100 : 0,
      credit: !isUpgrade ? Math.abs(prorationAmount / 100) : 0,
    },
  })
}

async function handleChange(userId: string, newPlanId: string, interval: 'monthly' | 'annual') {
  const supabase = getAdminClient()
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('stripe_subscription_id, subscription_tier')
    .eq('user_id', userId)
    .single()

  if (!userCredits?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    )
  }

  const newPriceId = getSubscriptionPriceId(newPlanId, interval)
  if (!newPriceId) {
    return NextResponse.json(
      { error: 'Invalid plan ID' },
      { status: 400 }
    )
  }

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(userCredits.stripe_subscription_id)
  const currentItemId = subscription.items.data[0].id
  const currentPlan = userCredits.subscription_tier

  // Determine if upgrade or downgrade
  const currentCredits = PLAN_CREDITS[currentPlan] || 0
  const newCredits = PLAN_CREDITS[newPlanId] || 0
  const isUpgrade = newCredits > currentCredits

  // Update the subscription
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    items: [
      {
        id: currentItemId,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    // For downgrades, apply at period end; for upgrades, apply immediately
    // Actually, we'll apply immediately for both but proration handles the billing
  })

  // Get current period end from subscription items
  const currentPeriodEnd = updatedSubscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // Update user_credits with new plan
  await supabase
    .from('user_credits')
    .update({
      subscription_tier: newPlanId,
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    })
    .eq('user_id', userId)

  // If upgrading, add the difference in credits immediately
  if (isUpgrade) {
    const creditsDifference = newCredits - currentCredits
    await CreditService.addCredits(userId, creditsDifference, 'subscription', {
      stripeSubscriptionId: subscription.id,
      description: `Upgrade to ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} plan - Bonus credits`,
    })
  }

  return NextResponse.json({
    success: true,
    subscription: {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      newPlan: newPlanId,
    },
    creditsAdded: isUpgrade ? newCredits - currentCredits : 0,
  })
}
