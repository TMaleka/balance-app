/**
 * Partner Transaction API
 * Secure endpoints for partners to submit transactions and award points
 */

import { supabase } from '../supabaseClient';
import { calculatePointsEarned } from '../utils/loyaltyCardUtils';
import { findMatchingBudgetCategory } from '../config/partnerCategoryMapping';
import { PartnerCategory } from '../types/loyalty';

// API Response types
export interface TransactionResponse {
  success: boolean;
  transactionId?: string;
  pointsEarned?: number;
  newBalance?: number;
  error?: string;
  details?: string;
}

export interface BatchTransactionResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: TransactionResponse[];
  error?: string;
}

// Transaction request types
export interface PartnerTransactionRequest {
  partnerId: string;
  apiKey: string;
  cardId?: string;
  phoneNumber?: string;
  saleAmount: number;
  transactionId: string; // Partner's unique transaction ID
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface BatchTransactionRequest {
  partnerId: string;
  apiKey: string;
  transactions: Omit<PartnerTransactionRequest, 'partnerId' | 'apiKey'>[];
}

/**
 * Validate partner API key and get partner information
 */
async function validatePartnerApiKey(partnerId: string, apiKey: string) {
  try {
    const { data, error } = await supabase
      .from('partner_api_keys')
      .select(`
        id,
        partner_id,
        is_active,
        expires_at,
        partners!inner(
          partner_id,
          name,
          display_name,
          points_rate,
          is_active
        )
      `)
      .eq('partner_id', partnerId)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid API key or partner ID' };
    }

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check if partner is active
    if (!data.partners.is_active) {
      return { valid: false, error: 'Partner account is inactive' };
    }

    return {
      valid: true,
      partner: data.partners,
      keyId: data.id
    };
  } catch (error: any) {
    console.error('Error validating API key:', error);
    return { valid: false, error: 'API key validation failed' };
  }
}

/**
 * Create an expense record from a loyalty transaction
 * This links the loyalty purchase to the user's expense tracking
 */
async function createExpenseFromLoyaltyTransaction(
  userId: string,
  partnerName: string,
  saleAmount: number,
  partnerCategory: PartnerCategory,
  loyaltyTransactionId: string,
  transactionTimestamp: string
): Promise<{ success: boolean; expenseId?: number; error?: string }> {
  try {
    // 1. Get user's budget categories
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('id, name')
      .eq('user_id', userId);

    if (budgetError) {
      console.error('Error fetching budgets:', budgetError);
      return { success: false, error: 'Failed to fetch budget categories' };
    }

    if (!budgets || budgets.length === 0) {
      console.log('User has no budget categories, skipping expense creation');
      return { success: false, error: 'No budget categories found' };
    }

    // 2. Find matching budget category
    const budgetNames = budgets.map(b => b.name);
    const matchedCategoryName = findMatchingBudgetCategory(partnerCategory, budgetNames);

    if (!matchedCategoryName) {
      console.log(`No matching budget category found for partner category: ${partnerCategory}`);
      return { success: false, error: 'No matching budget category' };
    }

    // 3. Get the budget ID for the matched category
    const matchedBudget = budgets.find(b => b.name === matchedCategoryName);
    if (!matchedBudget) {
      return { success: false, error: 'Budget category not found' };
    }

    // 4. Create the expense record
    const expenseData = {
      user_id: userId,
      merchant: partnerName,
      amount: saleAmount,
      categoryId: matchedBudget.id,
      created_at: transactionTimestamp,
      loyalty_transaction_id: loyaltyTransactionId,
      is_loyalty_purchase: true
    };

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return { success: false, error: 'Failed to create expense record' };
    }

    // 5. Update the budget's spent amount
    const { error: updateError } = await supabase.rpc('increment_budget_spent', {
      budget_id: matchedBudget.id,
      amount: saleAmount
    });

    if (updateError) {
      // If the RPC doesn't exist, try direct update
      const { data: currentBudget } = await supabase
        .from('budgets')
        .select('spent')
        .eq('id', matchedBudget.id)
        .single();

      if (currentBudget) {
        await supabase
          .from('budgets')
          .update({ spent: (currentBudget.spent || 0) + saleAmount })
          .eq('id', matchedBudget.id);
      }
    }

    console.log(`✅ Created expense record for ${partnerName}: R${saleAmount} in ${matchedCategoryName}`);
    return { success: true, expenseId: expense.id };

  } catch (error: any) {
    console.error('Error creating expense from loyalty transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Find user by card ID or phone number
 */
async function findUserByIdentifier(cardId?: string, phoneNumber?: string) {
  if (!cardId && !phoneNumber) {
    return { found: false, error: 'Either cardId or phoneNumber is required' };
  }

  try {
    let query = supabase
      .from('users')
      .select('id, card_id, phone_number, points_balance, loyalty_activated');

    if (cardId) {
      query = query.eq('card_id', cardId);
    } else if (phoneNumber) {
      // Normalize phone number for search
      const normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+27/, '0');
      query = query.eq('phone_number', normalizedPhone);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { found: false, error: 'User not found or loyalty not activated' };
    }

    if (!data.loyalty_activated) {
      return { found: false, error: 'User loyalty card not activated' };
    }

    return { found: true, user: data };
  } catch (error: any) {
    console.error('Error finding user:', error);
    return { found: false, error: 'User lookup failed' };
  }
}

/**
 * Process a single partner transaction
 */
export async function processPartnerTransaction(
  request: PartnerTransactionRequest
): Promise<TransactionResponse> {
  try {
    // 1. Validate partner API key
    const validation = await validatePartnerApiKey(request.partnerId, request.apiKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const partner = validation.partner;

    // 2. Find user by card ID or phone number
    const userLookup = await findUserByIdentifier(request.cardId, request.phoneNumber);
    if (!userLookup.found) {
      return { success: false, error: userLookup.error };
    }

    const user = userLookup.user;

    // 3. Check for duplicate transaction
    const { data: existingTransaction } = await supabase
      .from('loyalty_transactions')
      .select('id')
      .eq('transaction_id', request.transactionId)
      .single();

    if (existingTransaction) {
      return { success: false, error: 'Transaction ID already exists' };
    }

    // 4. Calculate points earned
    const pointsEarned = calculatePointsEarned(request.saleAmount, partner.points_rate);

    // 5. Create transaction record
    const transactionData = {
      transaction_id: request.transactionId,
      user_id: user.id,
      partner_id: request.partnerId,
      card_id: user.card_id,
      sale_amount: request.saleAmount,
      points_earned: pointsEarned,
      transaction_timestamp: request.timestamp || new Date().toISOString(),
      status: 'completed',
      metadata: request.metadata || {}
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('loyalty_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return { success: false, error: 'Failed to create transaction record' };
    }

    // 6. Update user points balance
    const newBalance = user.points_balance + pointsEarned;
    const { error: updateError } = await supabase
      .from('users')
      .update({ points_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Try to rollback transaction
      await supabase.from('loyalty_transactions').delete().eq('id', transaction.id);
      return { success: false, error: 'Failed to update user balance' };
    }

    // 7. Create audit log entry
    await supabase.from('points_audit_log').insert({
      user_id: user.id,
      card_id: user.card_id,
      points_change: pointsEarned,
      points_balance_before: user.points_balance,
      points_balance_after: newBalance,
      transaction_type: 'purchase',
      reference_id: request.transactionId,
      partner_id: request.partnerId
    });

    // 8. Create expense record in user's budget tracking
    // This is non-blocking - if it fails, we still consider the transaction successful
    const expenseResult = await createExpenseFromLoyaltyTransaction(
      user.id,
      partner.display_name,
      request.saleAmount,
      partner.category as PartnerCategory,
      transaction.id.toString(),
      transactionData.transaction_timestamp
    );

    if (!expenseResult.success) {
      console.warn('Failed to create expense record:', expenseResult.error);
      // Don't fail the transaction, just log the warning
    }

    // 9. Update API key last used timestamp
    await supabase
      .from('partner_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', validation.keyId);

    return {
      success: true,
      transactionId: transaction.id,
      pointsEarned,
      newBalance,
      details: `Earned ${pointsEarned} points at ${partner.display_name}`
    };

  } catch (error: any) {
    console.error('Error processing partner transaction:', error);
    return { success: false, error: 'Transaction processing failed' };
  }
}

/**
 * Process multiple transactions in batch
 */
export async function processBatchTransactions(
  request: BatchTransactionRequest
): Promise<BatchTransactionResponse> {
  const results: TransactionResponse[] = [];
  let processedCount = 0;
  let failedCount = 0;

  // Validate partner first
  const validation = await validatePartnerApiKey(request.partnerId, request.apiKey);
  if (!validation.valid) {
    return {
      success: false,
      processedCount: 0,
      failedCount: request.transactions.length,
      results: [],
      error: validation.error
    };
  }

  // Process each transaction
  for (const transaction of request.transactions) {
    const result = await processPartnerTransaction({
      ...transaction,
      partnerId: request.partnerId,
      apiKey: request.apiKey
    });

    results.push(result);

    if (result.success) {
      processedCount++;
    } else {
      failedCount++;
    }
  }

  return {
    success: processedCount > 0,
    processedCount,
    failedCount,
    results
  };
}
