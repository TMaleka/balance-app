/**
 * Points Redemption API
 * Handle cashback conversions and redemption processing
 */

import { supabase } from '../supabaseClient';

// Redemption configuration
export const REDEMPTION_CONFIG = {
  POINTS_PER_RAND: 100, // 100 points = R1.00
  MIN_REDEMPTION_POINTS: 500, // Minimum 500 points (R5.00)
  MAX_REDEMPTION_POINTS: 50000, // Maximum 50,000 points (R500.00) per transaction
  PROCESSING_FEE_PERCENTAGE: 0, // No processing fee for now
};

// Types
export interface RedemptionRequest {
  userId: string;
  pointsToRedeem: number;
  redemptionType: 'cashback' | 'discount' | 'reward';
  partnerId?: string;
  metadata?: Record<string, any>;
}

export interface RedemptionResponse {
  success: boolean;
  redemptionId?: string;
  pointsRedeemed?: number;
  cashValue?: number;
  newBalance?: number;
  error?: string;
  details?: string;
}

export interface RedemptionHistory {
  id: string;
  pointsRedeemed: number;
  redemptionValue: number;
  redemptionType: string;
  status: string;
  createdAt: string;
  partnerName?: string;
}

/**
 * Calculate cash value from points
 */
export function calculateCashValue(points: number): number {
  return Math.floor(points / REDEMPTION_CONFIG.POINTS_PER_RAND * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate points needed for cash amount
 */
export function calculatePointsNeeded(cashAmount: number): number {
  return Math.ceil(cashAmount * REDEMPTION_CONFIG.POINTS_PER_RAND);
}

/**
 * Validate redemption request
 */
function validateRedemption(pointsToRedeem: number, userBalance: number): { valid: boolean; error?: string } {
  if (pointsToRedeem < REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS) {
    return {
      valid: false,
      error: `Minimum redemption is ${REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS} points (R${calculateCashValue(REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS)})`
    };
  }

  if (pointsToRedeem > REDEMPTION_CONFIG.MAX_REDEMPTION_POINTS) {
    return {
      valid: false,
      error: `Maximum redemption is ${REDEMPTION_CONFIG.MAX_REDEMPTION_POINTS} points (R${calculateCashValue(REDEMPTION_CONFIG.MAX_REDEMPTION_POINTS)}) per transaction`
    };
  }

  if (pointsToRedeem > userBalance) {
    return {
      valid: false,
      error: `Insufficient points. You have ${userBalance} points available.`
    };
  }

  if (pointsToRedeem <= 0) {
    return {
      valid: false,
      error: 'Points to redeem must be greater than 0'
    };
  }

  return { valid: true };
}

/**
 * Process points redemption
 */
export async function processRedemption(request: RedemptionRequest): Promise<RedemptionResponse> {
  try {
    // 1. Get user's current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points_balance, card_id')
      .eq('id', request.userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found or not activated' };
    }

    // 2. Validate redemption
    const validation = validateRedemption(request.pointsToRedeem, user.points_balance);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 3. Calculate cash value
    const cashValue = calculateCashValue(request.pointsToRedeem);
    const newBalance = user.points_balance - request.pointsToRedeem;

    // 4. Create redemption record
    const redemptionData = {
      user_id: request.userId,
      points_redeemed: request.pointsToRedeem,
      redemption_type: request.redemptionType,
      redemption_value: cashValue,
      partner_id: request.partnerId || null,
      status: 'completed',
      metadata: request.metadata || {}
    };

    const { data: redemption, error: redemptionError } = await supabase
      .from('points_redemptions')
      .insert(redemptionData)
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      return { success: false, error: 'Failed to process redemption' };
    }

    // 5. Update user points balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ points_balance: newBalance })
      .eq('id', request.userId);

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      // Try to rollback redemption
      await supabase.from('points_redemptions').delete().eq('id', redemption.id);
      return { success: false, error: 'Failed to update points balance' };
    }

    // 6. Create audit log entry
    await supabase.from('points_audit_log').insert({
      user_id: request.userId,
      card_id: user.card_id,
      points_change: -request.pointsToRedeem, // Negative for redemption
      points_balance_before: user.points_balance,
      points_balance_after: newBalance,
      transaction_type: 'redemption',
      reference_id: redemption.id.toString(),
      partner_id: request.partnerId || null
    });

    return {
      success: true,
      redemptionId: redemption.id.toString(),
      pointsRedeemed: request.pointsToRedeem,
      cashValue,
      newBalance,
      details: `Redeemed ${request.pointsToRedeem} points for R${cashValue.toFixed(2)} cashback`
    };

  } catch (error: any) {
    console.error('Error processing redemption:', error);
    return { success: false, error: 'Redemption processing failed' };
  }
}

/**
 * Get user's redemption history
 */
export async function getUserRedemptionHistory(userId: string): Promise<RedemptionHistory[]> {
  try {
    const { data, error } = await supabase
      .from('points_redemptions')
      .select(`
        id,
        points_redeemed,
        redemption_value,
        redemption_type,
        status,
        created_at,
        partners(display_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching redemption history:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id.toString(),
      pointsRedeemed: item.points_redeemed,
      redemptionValue: item.redemption_value,
      redemptionType: item.redemption_type,
      status: item.status,
      createdAt: item.created_at,
      partnerName: item.partners?.display_name
    }));

  } catch (error) {
    console.error('Error in getUserRedemptionHistory:', error);
    return [];
  }
}

/**
 * Get available redemption options
 */
export function getRedemptionOptions(userPoints: number) {
  const options = [];

  // Cashback options
  const cashbackAmounts = [5, 10, 20, 50, 100, 200];
  
  for (const amount of cashbackAmounts) {
    const pointsNeeded = calculatePointsNeeded(amount);
    if (pointsNeeded <= userPoints && pointsNeeded >= REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS) {
      options.push({
        type: 'cashback',
        title: `R${amount} Cashback`,
        description: `Redeem ${pointsNeeded} points`,
        pointsRequired: pointsNeeded,
        value: amount,
        available: true
      });
    }
  }

  // Custom amount option
  if (userPoints >= REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS) {
    const maxCashback = calculateCashValue(Math.min(userPoints, REDEMPTION_CONFIG.MAX_REDEMPTION_POINTS));
    options.push({
      type: 'custom',
      title: 'Custom Amount',
      description: `Up to R${maxCashback.toFixed(2)} available`,
      pointsRequired: 0,
      value: 0,
      available: true
    });
  }

  return options;
}
