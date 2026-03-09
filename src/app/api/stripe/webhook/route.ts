import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminClient } from '@/lib/supabase'
import { stripe, constructWebhookEvent, getPlanIdFromPrice, getCreditPackIdFromPrice, PLAN_CREDITS, getCreditPackCredits } from '@/lib/stripe'
import { CreditService } from '@/services/credits'
import { sendSubscriptionConfirmed, sendCreditPackPurchased, sendSubscriptionCanceled, sendPaymentFailed } from '@/lib/email'
import { getPlanById, getCreditPackById } from '@/config/pricing'

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events for:
 * - checkout.session.completed: Process new subscriptions and one-time purchases
 * - invoice.payment_succeeded: Add monthly credits for subscription renewals
 * - customer.subscription.updated: Handle plan changes
 * - customer.subscription.deleted: Handle cancellations
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const body = await request.text()
    event = constructWebhookEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          await handleSubscriptionCheckout(session, supabase)
        } else if (session.mode === 'payment') {
          await handleCreditPackCheckout(session, supabase)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Only process subscription renewals (not the first invoice)
        if (invoice.billing_reason === 'subscription_cycle') {
          await handleSubscriptionRenewal(invoice, supabase)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle new subscription from checkout
 */
async function handleSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getAdminClient>
) {
  const subscriptionId = session.subscription as string
  const customerId = session.customer as string
  // User ID is passed in session metadata
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  // Get subscription details to find the plan
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanIdFromPrice(priceId)

  if (!planId) {
    console.error('Unknown price ID:', priceId)
    return
  }

  const credits = PLAN_CREDITS[planId] || 0

  // Get current period end from subscription
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // Update user_credits with subscription info
  const { error: updateError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: planId,
      subscription_status: 'active',
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      credits_reset_date: new Date(currentPeriodEnd * 1000).toISOString(),
      has_paid: true,
    }, { onConflict: 'user_id' })

  if (updateError) {
    console.error('Failed to update subscription info:', updateError)
  }

  // Add initial credits
  await CreditService.addCredits(userId, credits, 'subscription', {
    stripeSubscriptionId: subscriptionId,
    description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan - Initial credits`,
  })

  console.log(`Subscription created for user ${userId}: ${planId} plan, ${credits} credits`)

  // Send subscription confirmed email
  const { data: userData } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  // Get user email from auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  if (authUser?.user?.email) {
    const plan = getPlanById(planId)
    if (plan) {
      await sendSubscriptionConfirmed(authUser.user.email, {
        name: authUser.user.user_metadata?.name,
        planName: plan.name,
        credits: plan.credits,
        videoCount: plan.videoCount,
      })
    }
  }
}

/**
 * Handle one-time credit pack purchase
 */
async function handleCreditPackCheckout(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId = session.customer as string
  const paymentIntentId = session.payment_intent as string
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  // Get line items to find the pack
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
  const priceId = lineItems.data[0]?.price?.id

  if (!priceId) {
    console.error('No price ID in checkout session')
    return
  }

  const packId = getCreditPackIdFromPrice(priceId)
  if (!packId) {
    console.error('Unknown pack price ID:', priceId)
    return
  }

  const credits = getCreditPackCredits(packId) || 0

  // Ensure stripe_customer_id is saved and mark as paid user
  await supabase
    .from('user_credits')
    .update({ stripe_customer_id: customerId, has_paid: true })
    .eq('user_id', userId)

  // Add credits
  await CreditService.addCredits(userId, credits, 'purchase', {
    stripePaymentId: paymentIntentId,
    description: `Credit pack purchase: ${packId} (${credits} credits)`,
  })

  console.log(`Credit pack purchased for user ${userId}: ${packId} pack, ${credits} credits`)

  // Send credit pack purchased email
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  if (authUser?.user?.email) {
    const pack = getCreditPackById(packId)
    // Get new balance
    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (pack) {
      await sendCreditPackPurchased(authUser.user.email, {
        name: authUser.user.user_metadata?.name,
        packName: pack.name,
        credits: pack.credits,
        price: pack.price,
        newBalance: creditsData?.balance || credits,
      })
    }
  }
}

/**
 * Handle subscription renewal (monthly credit refresh)
 */
async function handleSubscriptionRenewal(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getAdminClient>
) {
  // Get subscription ID from parent (invoice.parent.subscription_details.subscription)
  const subscriptionId = typeof invoice.parent === 'object' && invoice.parent?.subscription_details?.subscription
    ? (typeof invoice.parent.subscription_details.subscription === 'string'
      ? invoice.parent.subscription_details.subscription
      : invoice.parent.subscription_details.subscription.id)
    : null

  if (!subscriptionId) {
    console.error('No subscription ID found in invoice')
    return
  }

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  if (!customerId) {
    console.error('No customer ID found in invoice')
    return
  }

  // Find user by customer ID
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('user_id, subscription_tier')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userCredits) {
    console.error('User not found for customer:', customerId)
    return
  }

  const planId = userCredits.subscription_tier
  const credits = PLAN_CREDITS[planId] || 0

  // Get subscription for period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // Update period end
  await supabase
    .from('user_credits')
    .update({
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      credits_reset_date: new Date(currentPeriodEnd * 1000).toISOString(),
    })
    .eq('user_id', userCredits.user_id)

  // Add monthly credits
  await CreditService.addCredits(userCredits.user_id, credits, 'subscription', {
    stripeSubscriptionId: subscriptionId,
    description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan - Monthly credits`,
  })

  console.log(`Subscription renewed for user ${userCredits.user_id}: ${credits} credits`)
}

/**
 * Handle subscription updates (plan changes)
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  const priceId = subscription.items.data[0]?.price.id
  const planId = getPlanIdFromPrice(priceId)

  if (!customerId) {
    console.error('No customer ID found in subscription')
    return
  }

  // Find user by customer ID
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userCredits) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Determine subscription status
  let status: string = 'active'
  if (subscription.cancel_at_period_end) {
    status = 'active' // Still active until period end; Stripe tracks cancel_at_period_end
  } else if (subscription.status === 'past_due') {
    status = 'past_due'
  } else if (subscription.status === 'canceled') {
    status = 'canceled'
  }

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60

  // Update subscription info
  await supabase
    .from('user_credits')
    .update({
      subscription_tier: planId || 'free',
      subscription_status: status,
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    })
    .eq('user_id', userCredits.user_id)

  console.log(`Subscription updated for user ${userCredits.user_id}: ${planId}, status: ${status}`)
}

/**
 * Handle subscription deletion (cancellation completed)
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  if (!customerId) {
    console.error('No customer ID found in subscription')
    return
  }

  // Find user by customer ID
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('user_id, balance')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userCredits) {
    console.error('User not found for customer:', customerId)
    return
  }

  // Downgrade to free tier
  await supabase
    .from('user_credits')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
    })
    .eq('user_id', userCredits.user_id)

  console.log(`Subscription canceled for user ${userCredits.user_id}`)

  // Send subscription canceled email
  const { data: authUser } = await supabase.auth.admin.getUserById(userCredits.user_id)
  if (authUser?.user?.email) {
    await sendSubscriptionCanceled(authUser.user.email, {
      name: authUser.user.user_metadata?.name,
      remainingCredits: userCredits.balance,
    })
  }
}

/**
 * Handle payment failed (subscription payment failed)
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getAdminClient>
) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

  if (!customerId) {
    console.error('No customer ID found in invoice')
    return
  }

  // Find user by customer ID
  const { data: userCredits } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userCredits) {
    console.error('User not found for customer:', customerId)
    return
  }

  console.log(`Payment failed for user ${userCredits.user_id}`)

  // Send payment failed email
  const { data: authUser } = await supabase.auth.admin.getUserById(userCredits.user_id)
  if (authUser?.user?.email) {
    await sendPaymentFailed(authUser.user.email, {
      name: authUser.user.user_metadata?.name,
    })
  }
}
