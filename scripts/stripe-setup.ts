/**
 * Stripe Setup Script
 *
 * Creates all products and prices in Stripe via the API, then outputs a JSON config map.
 * Run with: npx tsx scripts/stripe-setup.ts
 *
 * This script is idempotent - it checks for existing products via metadata
 * before creating new ones.
 *
 * Source of truth: src/mocks/data/pricing.ts
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Subscription plans configuration (matching src/mocks/data/pricing.ts)
// Free plan has NO Stripe product - handled entirely in-app
const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: '7 videos per month with UGC templates',
    monthlyPrice: 1900, // $19.00 in cents
    annualPrice: 19000, // $190.00 in cents
    credits: 70,
    videoCount: 7,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '23 videos per month with social scheduling',
    monthlyPrice: 5900, // $59.00
    annualPrice: 59000, // $590.00
    credits: 230,
    videoCount: 23,
  },
  {
    id: 'plus',
    name: 'Plus',
    description: '39 videos per month with all caption styles',
    monthlyPrice: 9900, // $99.00
    annualPrice: 99000, // $990.00
    credits: 390,
    videoCount: 39,
  },
  {
    id: 'agency',
    name: 'Agency',
    description: '71 videos per month for teams and agencies',
    monthlyPrice: 17900, // $179.00
    annualPrice: 179000, // $1,790.00
    credits: 710,
    videoCount: 71,
  },
]

// Credit packs configuration (matching src/mocks/data/pricing.ts)
const CREDIT_PACKS = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    description: '30 credits for 3 videos',
    credits: 30,
    price: 900, // $9.00
  },
  {
    id: 'pack-growth',
    name: 'Growth Pack',
    description: '90 credits for 9 videos',
    credits: 90,
    price: 2500, // $25.00
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    description: '190 credits for 19 videos',
    credits: 190,
    price: 5000, // $50.00
  },
  {
    id: 'pack-bulk',
    name: 'Bulk Pack',
    description: '400 credits for 40 videos',
    credits: 400,
    price: 10000, // $100.00
  },
]

interface PriceMap {
  subscriptions: {
    [planId: string]: {
      product: string
      monthly: string
      annual: string
    }
  }
  credit_packs: {
    [packId: string]: {
      product: string
      price: string
      credits: number
    }
  }
}

async function findExistingProduct(metadataKey: string, metadataValue: string): Promise<Stripe.Product | null> {
  const products = await stripe.products.list({ limit: 100, active: true })
  return products.data.find(p => p.metadata[metadataKey] === metadataValue) || null
}

async function findExistingPrice(productId: string, interval?: string): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })

  if (interval) {
    // Subscription price
    return prices.data.find(p => p.recurring?.interval === interval) || null
  } else {
    // One-time price
    return prices.data.find(p => p.type === 'one_time') || null
  }
}

async function createSubscriptionProducts(priceMap: PriceMap) {
  console.log('\n📦 Creating subscription products...\n')

  for (const plan of SUBSCRIPTION_PLANS) {
    console.log(`  Processing ${plan.name}...`)

    // Check for existing product
    let product = await findExistingProduct('plan_id', plan.id)

    if (!product) {
      product = await stripe.products.create({
        name: `UGCFirst ${plan.name}`,
        description: plan.description,
        metadata: {
          plan_id: plan.id,
          credits: plan.credits.toString(),
          video_count: plan.videoCount.toString(),
        },
      })
      console.log(`    ✅ Created product: ${product.id}`)
    } else {
      console.log(`    ⏭️  Product already exists: ${product.id}`)
    }

    // Check/create monthly price
    let monthlyPrice = await findExistingPrice(product.id, 'month')
    if (!monthlyPrice) {
      monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          plan_id: plan.id,
          billing_period: 'monthly',
        },
      })
      console.log(`    ✅ Created monthly price: ${monthlyPrice.id}`)
    } else {
      console.log(`    ⏭️  Monthly price already exists: ${monthlyPrice.id}`)
    }

    // Check/create annual price
    let annualPrice = await findExistingPrice(product.id, 'year')
    if (!annualPrice) {
      annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annualPrice,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: {
          plan_id: plan.id,
          billing_period: 'annual',
        },
      })
      console.log(`    ✅ Created annual price: ${annualPrice.id}`)
    } else {
      console.log(`    ⏭️  Annual price already exists: ${annualPrice.id}`)
    }

    priceMap.subscriptions[plan.id] = {
      product: product.id,
      monthly: monthlyPrice.id,
      annual: annualPrice.id,
    }
  }
}

async function createCreditPackProducts(priceMap: PriceMap) {
  console.log('\n🎁 Creating credit pack products...\n')

  for (const pack of CREDIT_PACKS) {
    console.log(`  Processing ${pack.name}...`)

    // Check for existing product
    let product = await findExistingProduct('pack_id', pack.id)

    if (!product) {
      product = await stripe.products.create({
        name: `UGCFirst ${pack.name}`,
        description: pack.description,
        metadata: {
          pack_id: pack.id,
          credits: pack.credits.toString(),
        },
      })
      console.log(`    ✅ Created product: ${product.id}`)
    } else {
      console.log(`    ⏭️  Product already exists: ${product.id}`)
    }

    // Check/create one-time price
    let price = await findExistingPrice(product.id)
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.price,
        currency: 'usd',
        metadata: {
          pack_id: pack.id,
          credits: pack.credits.toString(),
        },
      })
      console.log(`    ✅ Created price: ${price.id}`)
    } else {
      console.log(`    ⏭️  Price already exists: ${price.id}`)
    }

    priceMap.credit_packs[pack.id] = {
      product: product.id,
      price: price.id,
      credits: pack.credits,
    }
  }
}

async function main() {
  console.log('🚀 UGCFirst Stripe Setup Script')
  console.log('================================\n')

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment')
    process.exit(1)
  }

  const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
  console.log(`Mode: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`)

  const priceMap: PriceMap = {
    subscriptions: {},
    credit_packs: {},
  }

  try {
    await createSubscriptionProducts(priceMap)
    await createCreditPackProducts(priceMap)

    // Write the price map to a JSON file
    const outputPath = path.join(__dirname, '../src/lib/stripe-prices.json')
    fs.writeFileSync(outputPath, JSON.stringify(priceMap, null, 2))

    console.log('\n================================')
    console.log('✅ Setup complete!')
    console.log(`📄 Price map written to: src/lib/stripe-prices.json`)
    console.log('\n📋 Generated config:')
    console.log(JSON.stringify(priceMap, null, 2))
    console.log('\n🔑 Next steps:')
    console.log('1. Add STRIPE_WEBHOOK_SECRET to .env.local')
    console.log('2. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook')
    console.log('3. Copy the webhook signing secret to .env.local')

  } catch (error) {
    console.error('\n❌ Error during setup:', error)
    process.exit(1)
  }
}

main()
