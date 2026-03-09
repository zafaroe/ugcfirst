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

async function checkCredits() {
  console.log('\n📊 Checking all user credits...\n')

  // Get all user credits
  const { data: credits, error } = await supabase
    .from('user_credits')
    .select('user_id, balance, held, lifetime_purchased, lifetime_used, lifetime_refunded')
    .gt('held', 0)

  if (error) {
    console.error('Error fetching credits:', error)
    return
  }

  if (!credits || credits.length === 0) {
    console.log('✅ No users have held credits')
    return
  }

  console.log(`Found ${credits.length} users with held credits:\n`)

  for (const userCredit of credits) {
    const available = userCredit.balance - userCredit.held
    console.log(`User: ${userCredit.user_id}`)
    console.log(`  Balance: ${userCredit.balance}`)
    console.log(`  Held: ${userCredit.held}`)
    console.log(`  Available: ${available}`)
    console.log('')

    // Check for pending transactions
    const { data: pendingTxns } = await supabase
      .from('credit_transactions')
      .select('id, amount, status, generation_id, created_at')
      .eq('user_id', userCredit.user_id)
      .eq('status', 'pending')

    if (pendingTxns && pendingTxns.length > 0) {
      console.log(`  ⚠️ Pending transactions:`)
      for (const txn of pendingTxns) {
        // Check generation status
        const { data: gen } = await supabase
          .from('generations')
          .select('id, status, created_at')
          .eq('id', txn.generation_id)
          .single()

        const genStatus = gen ? gen.status : 'NOT FOUND'
        console.log(`    - TxnID: ${txn.id.substring(0, 8)}... | ${Math.abs(txn.amount)} credits | GenStatus: ${genStatus} | Created: ${txn.created_at}`)
      }
    }
    console.log('')
  }
}

async function releaseStuckCredits() {
  console.log('\n🔧 Releasing stuck held credits...\n')

  // Find all pending transactions
  const { data: pendingTxns, error } = await supabase
    .from('credit_transactions')
    .select('id, user_id, amount, generation_id, created_at')
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending transactions:', error)
    return
  }

  if (!pendingTxns || pendingTxns.length === 0) {
    console.log('✅ No pending transactions found')
    return
  }

  console.log(`Found ${pendingTxns.length} pending transactions`)

  for (const txn of pendingTxns) {
    // Check if the generation exists and its status
    const { data: gen } = await supabase
      .from('generations')
      .select('id, status')
      .eq('id', txn.generation_id)
      .single()

    // If generation doesn't exist, failed, or completed (but transaction not confirmed)
    const shouldRelease = !gen || gen.status === 'failed' || gen.status === 'completed'

    if (shouldRelease) {
      const amount = Math.abs(txn.amount)
      console.log(`\n🔓 Releasing ${amount} credits for user ${txn.user_id.substring(0, 8)}... (gen status: ${gen?.status || 'NOT FOUND'})`)

      // Get current balance
      const { data: userCredits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', txn.user_id)
        .single()

      if (userCredits) {
        // Release held credits
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            held: Math.max(0, userCredits.held - amount),
            lifetime_refunded: (userCredits.lifetime_refunded || 0) + amount,
          })
          .eq('user_id', txn.user_id)

        if (updateError) {
          console.error(`  ❌ Failed to update user credits: ${updateError.message}`)
          continue
        }

        // Mark transaction as cancelled
        await supabase
          .from('credit_transactions')
          .update({ status: 'cancelled' })
          .eq('id', txn.id)

        // Create refund transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: txn.user_id,
            type: 'refund',
            amount: amount,
            balance_before: userCredits.balance,
            balance_after: userCredits.balance,
            held_before: userCredits.held,
            held_after: Math.max(0, userCredits.held - amount),
            generation_id: txn.generation_id,
            description: 'Auto-released stuck held credits',
            status: 'completed',
          })

        console.log(`  ✅ Released ${amount} credits`)
      }
    } else {
      console.log(`\n⏳ Keeping hold for gen (status: ${gen?.status}) - still in progress`)
    }
  }

  console.log('\n✅ Done releasing stuck credits!')
}

// Run both
async function main() {
  console.log('========================================')
  console.log('   Credit Status & Cleanup Script')
  console.log('========================================')

  await checkCredits()

  console.log('\n---\n🔧 Releasing stuck credits...\n')
  await releaseStuckCredits()

  console.log('\n---\n📊 Final credit status:\n')
  await checkCredits()
}

main().catch(console.error)
