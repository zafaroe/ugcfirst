/**
 * Stripe Price Migration Script
 *
 * Migrates to new March 2026 pricing:
 * - Archives old prices
 * - Creates new prices with updated amounts
 * - Updates stripe-prices.json
 *
 * Run with: node scripts/stripe-price-migration.mjs
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
})

// NEW PRICING - March 2026 Final
const NEW_SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: '3 videos per month - Your first real UGC ad creatives',
    monthlyPrice: 1900,   // $19.00
    annualPrice: 18000,   // $180.00 ($15/mo)
    credits: 30,
    videoCount: 3,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '10 videos per month - Social scheduling included',
    monthlyPrice: 4900,   // $49.00
    annualPrice: 46800,   // $468.00 ($39/mo)
    credits: 100,
    videoCount: 10,
  },
  {
    id: 'plus',
    name: 'Plus',
    description: '22 videos per month - For teams running repeat content',
    monthlyPrice: 9900,   // $99.00
    annualPrice: 94800,   // $948.00 ($79/mo)
    credits: 220,
    videoCount: 22,
  },
  {
    id: 'agency',
    name: 'Agency',
    description: '45 videos per month - Premium scale with API & dedicated support',
    monthlyPrice: 19900,  // $199.00
    annualPrice: 190800,  // $1908.00 ($159/mo)
    credits: 450,
    videoCount: 45,
  },
]

const NEW_CREDIT_PACKS = [
  {
    id: 'pack-starter',
    name: 'Starter Pack',
    description: '30 credits for 3 videos',
    credits: 30,
    price: 1499,  // $14.99
  },
  {
    id: 'pack-growth',
    name: 'Growth Pack',
    description: '80 credits for 8 videos',
    credits: 80,
    price: 3499,  // $34.99
  },
  {
    id: 'pack-scale',
    name: 'Scale Pack',
    description: '200 credits for 20 videos',
    credits: 200,
    price: 6499,  // $64.99
  },
  {
    id: 'pack-bulk',
    name: 'Bulk Pack',
    description: '400 credits for 40 videos',
    credits: 400,
    price: 10999, // $109.99
  },
]

// Load current stripe-prices.json
const currentPricesPath = path.join(__dirname, '../src/lib/stripe-prices.json')
const currentPrices = JSON.parse(fs.readFileSync(currentPricesPath, 'utf8'))

async function archivePrice(priceId) {
  try {
    await stripe.prices.update(priceId, { active: false })
    console.log(`    📦 Archived old price: ${priceId}`)
  } catch (error) {
    console.log(`    ⚠️  Could not archive price ${priceId}: ${error.message}`)
  }
}

async function migrateSubscriptions(newPriceMap) {
  console.log('\n📦 Migrating subscription prices...\n')

  for (const plan of NEW_SUBSCRIPTION_PLANS) {
    console.log(`  Processing ${plan.name}...`)

    const existing = currentPrices.subscriptions[plan.id]
    if (!existing) {
      console.log(`    ⚠️  No existing product found for ${plan.id}, skipping...`)
      continue
    }

    const productId = existing.product

    // Update product metadata
    await stripe.products.update(productId, {
      description: plan.description,
      metadata: {
        plan_id: plan.id,
        credits: plan.credits.toString(),
        video_count: plan.videoCount.toString(),
        pricing_version: 'march_2026',
      },
    })
    console.log(`    ✏️  Updated product metadata`)

    // Archive old prices
    await archivePrice(existing.monthly)
    await archivePrice(existing.annual)

    // Create new monthly price
    const monthlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: plan.monthlyPrice,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        plan_id: plan.id,
        billing_period: 'monthly',
        pricing_version: 'march_2026',
      },
    })
    console.log(`    ✅ Created new monthly price: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`)

    // Create new annual price
    const annualPrice = await stripe.prices.create({
      product: productId,
      unit_amount: plan.annualPrice,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        plan_id: plan.id,
        billing_period: 'annual',
        pricing_version: 'march_2026',
      },
    })
    console.log(`    ✅ Created new annual price: ${annualPrice.id} ($${plan.annualPrice / 100}/yr)`)

    newPriceMap.subscriptions[plan.id] = {
      product: productId,
      monthly: monthlyPrice.id,
      annual: annualPrice.id,
    }
  }
}

async function migrateCreditPacks(newPriceMap) {
  console.log('\n🎁 Migrating credit pack prices...\n')

  for (const pack of NEW_CREDIT_PACKS) {
    console.log(`  Processing ${pack.name}...`)

    const existing = currentPrices.credit_packs[pack.id]
    if (!existing) {
      console.log(`    ⚠️  No existing product found for ${pack.id}, skipping...`)
      continue
    }

    const productId = existing.product

    // Update product metadata
    await stripe.products.update(productId, {
      description: pack.description,
      metadata: {
        pack_id: pack.id,
        credits: pack.credits.toString(),
        pricing_version: 'march_2026',
      },
    })
    console.log(`    ✏️  Updated product metadata`)

    // Archive old price
    await archivePrice(existing.price)

    // Create new price
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: pack.price,
      currency: 'usd',
      metadata: {
        pack_id: pack.id,
        credits: pack.credits.toString(),
        pricing_version: 'march_2026',
      },
    })
    console.log(`    ✅ Created new price: ${newPrice.id} ($${pack.price / 100})`)

    newPriceMap.credit_packs[pack.id] = {
      product: productId,
      price: newPrice.id,
      credits: pack.credits,
    }
  }
}

async function main() {
  console.log('🚀 UGCFirst Stripe Price Migration')
  console.log('===================================\n')

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment')
    process.exit(1)
  }

  const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')
  console.log(`Mode: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`)

  console.log('\nNew Pricing:')
  console.log('  Subscriptions:')
  NEW_SUBSCRIPTION_PLANS.forEach(p => {
    console.log(`    ${p.name}: $${p.monthlyPrice/100}/mo, $${p.annualPrice/100}/yr, ${p.credits} credits`)
  })
  console.log('  Credit Packs:')
  NEW_CREDIT_PACKS.forEach(p => {
    console.log(`    ${p.name}: $${p.price/100}, ${p.credits} credits`)
  })

  const newPriceMap = {
    subscriptions: {},
    credit_packs: {},
  }

  try {
    await migrateSubscriptions(newPriceMap)
    await migrateCreditPacks(newPriceMap)

    // Write the new price map
    fs.writeFileSync(currentPricesPath, JSON.stringify(newPriceMap, null, 2))

    console.log('\n===================================')
    console.log('✅ Migration complete!')
    console.log(`📄 Updated: src/lib/stripe-prices.json`)
    console.log('\n📋 New price map:')
    console.log(JSON.stringify(newPriceMap, null, 2))

  } catch (error) {
    console.error('\n❌ Error during migration:', error)
    process.exit(1)
  }
}

main()
