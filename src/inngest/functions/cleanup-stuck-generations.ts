import { inngest } from '../client';
import { getAdminClient } from '@/lib/supabase';

/**
 * Cleanup Stuck Generations
 *
 * Runs every hour to find generations stuck in 'queued' or 'processing'
 * status for more than 2 hours and:
 * 1. Mark them as failed
 * 2. Release any held credits back to the user
 *
 * This prevents users from having credits stuck indefinitely.
 */

export const cleanupStuckGenerations = inngest.createFunction(
  {
    id: 'cleanup-stuck-generations',
    name: 'Cleanup Stuck Generations',
  },
  // Run every hour
  { cron: '0 * * * *' },
  async ({ step, logger }) => {
    const supabase = getAdminClient();

    // Find generations stuck for more than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const stuckGenerations = await step.run('find-stuck-generations', async () => {
      const { data, error } = await supabase
        .from('generations')
        .select('id, user_id, status, created_at, product_name, credit_transaction_id')
        .in('status', ['queued', 'processing'])
        .lt('created_at', twoHoursAgo);

      if (error) {
        throw new Error(`Failed to query stuck generations: ${error.message}`);
      }

      return data || [];
    });

    if (stuckGenerations.length === 0) {
      logger.info('No stuck generations found');
      return { cleaned: 0 };
    }

    logger.info(`Found ${stuckGenerations.length} stuck generations`);

    let cleaned = 0;

    for (const gen of stuckGenerations) {
      await step.run(`cleanup-${gen.id}`, async () => {
        // 1. Mark generation as failed
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            error_message: 'Generation timed out - automatically cleaned up',
          })
          .eq('id', gen.id);

        // 2. Release held credits if there's a transaction
        if (gen.credit_transaction_id) {
          const { data: txn } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('id', gen.credit_transaction_id)
            .single();

          if (txn && txn.status === 'pending') {
            const amount = Math.abs(txn.amount);

            const { data: userCredits } = await supabase
              .from('user_credits')
              .select('*')
              .eq('user_id', gen.user_id)
              .single();

            if (userCredits) {
              // Release held credits
              await supabase
                .from('user_credits')
                .update({
                  held: Math.max(0, userCredits.held - amount),
                  lifetime_refunded: (userCredits.lifetime_refunded || 0) + amount,
                })
                .eq('user_id', gen.user_id);

              // Cancel the pending transaction
              await supabase
                .from('credit_transactions')
                .update({ status: 'cancelled' })
                .eq('id', gen.credit_transaction_id);

              // Create refund transaction for audit trail
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
                  description: 'Generation timed out - auto-refund',
                  status: 'completed',
                });

              logger.info(`Released ${amount} credits for user ${gen.user_id}`);
            }
          }
        }

        cleaned++;
      });
    }

    logger.info(`Cleaned up ${cleaned} stuck generations`);
    return { cleaned };
  }
);

// Export for registration
export const cleanupFunctions = [cleanupStuckGenerations];
