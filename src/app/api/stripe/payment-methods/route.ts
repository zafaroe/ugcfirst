import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse, getAdminClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

/**
 * GET /api/stripe/payment-methods
 *
 * Lists all payment methods for the current user
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
      .select('stripe_customer_id')
      .eq('user_id', authResult.user.id)
      .single()

    if (!userCredits?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userCredits.stripe_customer_id,
      type: 'card',
    })

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(userCredits.stripe_customer_id)
    const defaultPaymentMethodId = typeof customer !== 'string' && !customer.deleted
      ? customer.invoice_settings?.default_payment_method
      : null

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      })),
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stripe/payment-methods
 *
 * Removes a payment method
 *
 * Body:
 * - paymentMethodId: string
 */
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentMethodId is required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', authResult.user.id)
      .single()

    if (!userCredits?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (paymentMethod.customer !== userCredits.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if this is the only payment method and there's an active subscription
    if (userCredits.stripe_subscription_id) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userCredits.stripe_customer_id,
        type: 'card',
      })

      if (paymentMethods.data.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only payment method while you have an active subscription' },
          { status: 400 }
        )
      }
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing payment method:', error)
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stripe/payment-methods
 *
 * Sets a payment method as default
 *
 * Body:
 * - paymentMethodId: string
 */
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.user) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentMethodId is required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', authResult.user.id)
      .single()

    if (!userCredits?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (paymentMethod.customer !== userCredits.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Set as default payment method
    await stripe.customers.update(userCredits.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting default payment method:', error)
    return NextResponse.json(
      { error: 'Failed to set default payment method' },
      { status: 500 }
    )
  }
}
