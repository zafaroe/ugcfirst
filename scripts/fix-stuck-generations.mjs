import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixStuckGenerations() {
  console.log('\n🔍 Finding stuck generations (queued > 1 hour)...\n')

  // Find generations stuck in queued/processing for more than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: stuckGens, error } = await supabase
    .from('generations')
    .select('id, user_id, status, created_at, product_name, credit_transaction_id')
    .in('status', ['queued', 'processing'])
    .lt('created_at', oneHourAgo)

  if (error) {
    console.error('Error fetching stuck generations:', error)
    return
  }

  if (!stuckGens || stuckGens.length === 0) {
    console.log('✅ No stuck generations found')
    return
  }

  console.log(`Found ${stuckGens.length} stuck generations:\n`)

  for (const gen of stuckGens) {
    const createdDate = new Date(gen.created_at)
    const hoursAgo = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60))
    console.log(`  - ${gen.id.substring(0, 8)}... | Status: ${gen.status} | ${hoursAgo}h ago | Product: ${gen.product_name}`)
  }

  console.log('\n🔧 Marking them as failed and releasing credits...\n')

  for (const gen of stuckGens) {
    // Mark generation as failed
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Generation timed out (stuck in queue)',
      })
      .eq('id', gen.id)

    // Release held credits if there's a transaction
    if (gen.credit_transaction_id) {
      // Get the pending transaction
      const { data: txn } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('id', gen.credit_transaction_id)
        .single()

      if (txn && txn.status === 'pending') {
        const amount = Math.abs(txn.amount)

        // Get current user credits
        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', gen.user_id)
          .single()

        if (userCredits) {
          // Release held credits
          await supabase
            .from('user_credits')
            .update({
              held: Math.max(0, userCredits.held - amount),
              lifetime_refunded: (userCredits.lifetime_refunded || 0) + amount,
            })
            .eq('user_id', gen.user_id)

          // Mark transaction as cancelled
          await supabase
            .from('credit_transactions')
            .update({ status: 'cancelled' })
            .eq('id', gen.credit_transaction_id)

          // Create refund transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: gen.user_id,
              type: 'refund',
              amount: amount,
              balance_before: userCredits.balance,
              balance_after: userCredits.balance,
              held_before: userCredits.held,
              held_after: Math.max(0, userCredits.held - amount),
              generation_id: gen.id,
              description: 'Generation timed out - credits refunded',
              status: 'completed',
            })

          console.log(`  ✅ ${gen.id.substring(0, 8)}... - Marked failed + released ${amount} credits`)
        }
      }
    } else {
      console.log(`  ⚠️ ${gen.id.substring(0, 8)}... - Marked failed (no transaction to refund)`)
    }
  }

  console.log('\n✅ Done!')

  // Show final credit status
  console.log('\n📊 Updated credit status for affected users:\n')
  const affectedUserIds = [...new Set(stuckGens.map(g => g.user_id))]
  for (const userId of affectedUserIds) {
    const { data: credits } = await supabase
      .from('user_credits')
      .select('balance, held')
      .eq('user_id', userId)
      .single()

    if (credits) {
      console.log(`  User ${userId.substring(0, 8)}...: Balance=${credits.balance}, Held=${credits.held}, Available=${credits.balance - credits.held}`)
    }
  }
}

fixStuckGenerations().catch(console.error)
