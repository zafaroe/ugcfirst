import { getAdminClient } from '@/lib/supabase';
import {
  UserCredits,
  CreditTransaction,
  CreditBalance,
  CreditCheckResult,
  HoldCreditsResult,
  TransactionHistoryItem,
  CreditTransactionType,
} from '@/types/credits';

// ============================================
// CREDIT BALANCE OPERATIONS
// ============================================

/**
 * Get user's credit balance
 * @param userId - User ID
 * @returns Credit balance with available calculation
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no record exists, return zero balance
    if (error.code === 'PGRST116') {
      return {
        balance: 0,
        held: 0,
        available: 0,
        lifetime: {
          purchased: 0,
          used: 0,
          refunded: 0,
        },
      };
    }
    throw new Error(`Failed to get balance: ${error.message}`);
  }

  const credits = data as UserCredits;

  return {
    balance: credits.balance,
    held: credits.held,
    available: credits.balance - credits.held,
    lifetime: {
      purchased: credits.lifetime_purchased,
      used: credits.lifetime_used,
      refunded: credits.lifetime_refunded,
    },
  };
}

/**
 * Check if user has sufficient credits
 * @param userId - User ID
 * @param required - Required credit amount
 * @returns Check result with deficit if insufficient
 */
export async function checkBalance(
  userId: string,
  required: number
): Promise<CreditCheckResult> {
  const balance = await getBalance(userId);

  return {
    hasEnough: balance.available >= required,
    balance: balance.available,
    required,
    deficit: Math.max(0, required - balance.available),
  };
}

// ============================================
// CREDIT HOLD/CONFIRM/REFUND FLOW
// ============================================

/**
 * Hold credits for a pending generation
 * Creates a pending transaction and reduces available balance
 * @param userId - User ID
 * @param amount - Amount to hold
 * @param generationId - Associated generation ID
 * @returns Hold result with transaction ID
 */
export async function holdCredits(
  userId: string,
  amount: number,
  generationId: string
): Promise<HoldCreditsResult> {
  const supabase = getAdminClient();

  // Get current balance
  const balance = await getBalance(userId);

  if (balance.available < amount) {
    throw new Error(
      `Insufficient credits. Available: ${balance.available}, Required: ${amount}`
    );
  }

  // Start a transaction
  const newHeld = balance.held + amount;

  // Update user credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      held: newHeld,
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to hold credits: ${updateError.message}`);
  }

  // Create pending transaction
  const { data: txnData, error: txnError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'hold' as CreditTransactionType,
      amount: -amount,
      balance_before: balance.balance,
      balance_after: balance.balance, // Balance unchanged, only held changes
      held_before: balance.held,
      held_after: newHeld,
      generation_id: generationId,
      description: `Credits held for generation ${generationId}`,
      status: 'pending',
    })
    .select('id')
    .single();

  if (txnError) {
    // Rollback the hold
    await supabase
      .from('user_credits')
      .update({ held: balance.held })
      .eq('user_id', userId);

    throw new Error(`Failed to create hold transaction: ${txnError.message}`);
  }

  return {
    success: true,
    transactionId: txnData.id,
    newBalance: balance.balance,
    newHeld,
  };
}

/**
 * Confirm credits after successful generation
 * Converts held credits to used credits
 * @param transactionId - The hold transaction ID
 */
export async function confirmCredits(transactionId: string): Promise<void> {
  const supabase = getAdminClient();

  // Get the hold transaction (without status filter for idempotency check)
  const { data: txn, error: txnError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txnError || !txn) {
    throw new Error(`Hold transaction not found: ${transactionId}`);
  }

  // Idempotency: if already completed, return early (safe to call multiple times)
  if (txn.status === 'completed') {
    console.log(`[Credits] Transaction ${transactionId} already confirmed (idempotent)`);
    return;
  }

  // If not pending, something is wrong (e.g., cancelled)
  if (txn.status !== 'pending') {
    throw new Error(`Transaction ${transactionId} has status '${txn.status}', expected 'pending'`);
  }

  const transaction = txn as CreditTransaction;
  const amount = Math.abs(transaction.amount);

  // Get current balance
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', transaction.user_id)
    .single();

  if (creditsError || !credits) {
    throw new Error('User credits not found');
  }

  const userCredits = credits as UserCredits;

  // Update user credits: move from held to used
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: userCredits.balance - amount,
      held: userCredits.held - amount,
      lifetime_used: userCredits.lifetime_used + amount,
    })
    .eq('user_id', transaction.user_id);

  if (updateError) {
    throw new Error(`Failed to confirm credits: ${updateError.message}`);
  }

  // Update the hold transaction to completed
  await supabase
    .from('credit_transactions')
    .update({
      status: 'completed',
      balance_after: userCredits.balance - amount,
      held_after: userCredits.held - amount,
    })
    .eq('id', transactionId);

  // Create a usage transaction for audit trail
  await supabase.from('credit_transactions').insert({
    user_id: transaction.user_id,
    type: 'usage' as CreditTransactionType,
    amount: -amount,
    balance_before: userCredits.balance,
    balance_after: userCredits.balance - amount,
    held_before: userCredits.held,
    held_after: userCredits.held - amount,
    generation_id: transaction.generation_id,
    description: `Video generation completed`,
    status: 'completed',
  });
}

/**
 * Refund credits after failed generation
 * Releases held credits back to available
 * @param transactionId - The hold transaction ID
 * @param reason - Reason for refund (optional)
 */
export async function refundCredits(
  transactionId: string,
  reason?: string
): Promise<void> {
  const supabase = getAdminClient();

  // Get the hold transaction (without status filter for idempotency check)
  const { data: txn, error: txnError } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (txnError || !txn) {
    throw new Error(`Hold transaction not found: ${transactionId}`);
  }

  // Idempotency: if already cancelled (refunded), return early
  if (txn.status === 'cancelled') {
    console.log(`[Credits] Transaction ${transactionId} already refunded (idempotent)`);
    return;
  }

  // If not pending, something is wrong (e.g., already completed)
  if (txn.status !== 'pending') {
    throw new Error(`Transaction ${transactionId} has status '${txn.status}', expected 'pending'`);
  }

  const transaction = txn as CreditTransaction;
  const amount = Math.abs(transaction.amount);

  // Get current balance
  const { data: credits, error: creditsError } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', transaction.user_id)
    .single();

  if (creditsError || !credits) {
    throw new Error('User credits not found');
  }

  const userCredits = credits as UserCredits;

  // Update user credits: release held credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      held: userCredits.held - amount,
      lifetime_refunded: userCredits.lifetime_refunded + amount,
    })
    .eq('user_id', transaction.user_id);

  if (updateError) {
    throw new Error(`Failed to refund credits: ${updateError.message}`);
  }

  // Update the hold transaction to cancelled
  await supabase
    .from('credit_transactions')
    .update({
      status: 'cancelled',
      held_after: userCredits.held - amount,
    })
    .eq('id', transactionId);

  // Create a refund transaction for audit trail
  await supabase.from('credit_transactions').insert({
    user_id: transaction.user_id,
    type: 'refund' as CreditTransactionType,
    amount: amount,
    balance_before: userCredits.balance,
    balance_after: userCredits.balance, // Balance unchanged
    held_before: userCredits.held,
    held_after: userCredits.held - amount,
    generation_id: transaction.generation_id,
    description: reason || 'Generation failed - credits refunded',
    status: 'completed',
  });
}

// ============================================
// DIRECT CREDIT DEDUCTION (for instant operations)
// ============================================

/**
 * Directly deduct credits for instant operations (no hold/confirm pattern)
 * Use this for operations that are completed immediately, like scheduling posts
 * @param userId - User ID
 * @param amount - Amount to deduct
 * @param description - Description for the transaction
 * @param metadata - Additional metadata
 * @returns Result with new balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = getAdminClient();

  // Get current balance
  const balance = await getBalance(userId);

  if (balance.available < amount) {
    throw new Error(
      `Insufficient credits. Available: ${balance.available}, Required: ${amount}`
    );
  }

  const newBalance = balance.balance - amount;

  // Update user credits
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      balance: newBalance,
      lifetime_used: (balance.lifetime.used || 0) + amount,
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to deduct credits: ${updateError.message}`);
  }

  // Create usage transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'usage' as CreditTransactionType,
    amount: -amount,
    balance_before: balance.balance,
    balance_after: newBalance,
    held_before: balance.held,
    held_after: balance.held,
    description,
    status: 'completed',
    metadata,
  });

  return { success: true, newBalance };
}

// ============================================
// ADD CREDITS (Purchase/Subscription/Bonus)
// ============================================

/**
 * Add credits to user's account
 * @param userId - User ID
 * @param amount - Amount to add
 * @param source - Source of credits
 * @param metadata - Additional metadata
 */
export async function addCredits(
  userId: string,
  amount: number,
  source: 'purchase' | 'subscription' | 'bonus',
  metadata?: {
    stripePaymentId?: string;
    stripeSubscriptionId?: string;
    description?: string;
  }
): Promise<void> {
  const supabase = getAdminClient();

  // Get current balance or create new record
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  const currentBalance = (credits as UserCredits | null)?.balance || 0;
  const currentHeld = (credits as UserCredits | null)?.held || 0;
  const lifetimePurchased =
    (credits as UserCredits | null)?.lifetime_purchased || 0;

  const newBalance = currentBalance + amount;

  // Upsert user credits
  const { error: updateError } = await supabase.from('user_credits').upsert(
    {
      user_id: userId,
      balance: newBalance,
      held: currentHeld,
      lifetime_purchased: lifetimePurchased + amount,
    },
    { onConflict: 'user_id' }
  );

  if (updateError) {
    throw new Error(`Failed to add credits: ${updateError.message}`);
  }

  // Create transaction record
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: source as CreditTransactionType,
    amount: amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    held_before: currentHeld,
    held_after: currentHeld,
    stripe_payment_id: metadata?.stripePaymentId,
    stripe_subscription_id: metadata?.stripeSubscriptionId,
    description:
      metadata?.description ||
      (source === 'purchase'
        ? 'Credit purchase'
        : source === 'subscription'
        ? 'Monthly subscription credits'
        : 'Bonus credits'),
    status: 'completed',
  });
}

// ============================================
// TRANSACTION HISTORY
// ============================================

/**
 * Get user's transaction history
 * @param userId - User ID
 * @param options - Pagination and filter options
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    type?: CreditTransactionType;
  } = {}
): Promise<TransactionHistoryItem[]> {
  const supabase = getAdminClient();
  const { limit = 50, offset = 0, type } = options;

  let query = supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed') // Only show completed transactions
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }

  return (data as CreditTransaction[]).map((txn) => ({
    id: txn.id,
    type: txn.type,
    amount: txn.amount,
    description: txn.description || '',
    status: txn.status,
    createdAt: txn.created_at,
    generationId: txn.generation_id || undefined,
  }));
}

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Admin: Manually adjust user credits
 * @param userId - User ID
 * @param amount - Amount to add (positive) or remove (negative)
 * @param reason - Reason for adjustment
 * @param adminId - Admin user ID for audit
 */
export async function adminAdjustCredits(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<void> {
  const supabase = getAdminClient();

  const balance = await getBalance(userId);
  const newBalance = balance.balance + amount;

  if (newBalance < 0) {
    throw new Error('Cannot reduce balance below zero');
  }

  // Update balance
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to adjust credits: ${updateError.message}`);
  }

  // Create adjustment transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'adjustment' as CreditTransactionType,
    amount: amount,
    balance_before: balance.balance,
    balance_after: newBalance,
    held_before: balance.held,
    held_after: balance.held,
    description: reason,
    status: 'completed',
    metadata: { admin_id: adminId },
  });
}

// ============================================
// EXPORT FOR CONVENIENCE
// ============================================

export const CreditService = {
  getBalance,
  checkBalance,
  holdCredits,
  confirmCredits,
  refundCredits,
  deductCredits,
  addCredits,
  getTransactionHistory,
  adminAdjustCredits,
};
