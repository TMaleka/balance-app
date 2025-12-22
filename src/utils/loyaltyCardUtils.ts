/**
 * Loyalty Card Utilities
 * Handles card ID generation, validation, and formatting
 */

import { supabase } from '../supabaseClient';

export interface LoyaltyCard {
  cardId: string;
  pointsBalance: number;
  loyaltyActivated: boolean;
  loyaltyCreatedAt?: string;
  phoneNumber?: string;
}

export interface LoyaltyTransaction {
  id: number;
  transactionId: string;
  partnerName: string;
  saleAmount: number;
  pointsEarned: number;
  transactionTimestamp: string;
  status: string;
}

export interface Partner {
  partnerId: string;
  name: string;
  displayName: string;
  pointsRate: number;
  logoUrl?: string;
  category: string;
  isActive: boolean;
}

/**
 * Generate a unique card ID with format: bal_usr_XXXXXXXX
 * Uses crypto.getRandomValues for secure random generation
 */
export function generateCardId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  
  let result = 'bal_usr_';
  for (let i = 0; i < 8; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Validate card ID format
 */
export function isValidCardId(cardId: string): boolean {
  const cardIdRegex = /^bal_usr_[A-Z0-9]{8}$/;
  return cardIdRegex.test(cardId);
}

/**
 * Format card ID for display (add spaces for readability)
 */
export function formatCardIdForDisplay(cardId: string): string {
  if (!isValidCardId(cardId)) return cardId;
  
  // bal_usr_ABCD1234 -> bal usr ABCD 1234
  const parts = cardId.split('_');
  if (parts.length === 3) {
    const suffix = parts[2];
    return `${parts[0]} ${parts[1]} ${suffix.substring(0, 4)} ${suffix.substring(4)}`;
  }
  
  return cardId;
}

/**
 * Activate loyalty card for a user
 */
export async function activateLoyaltyCard(
  userId: string, 
  phoneNumber?: string
): Promise<{ success: boolean; cardId?: string; error?: string }> {
  try {
    // Generate a unique card ID
    let cardId = generateCardId();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure uniqueness (though collision is extremely unlikely)
    while (attempts < maxAttempts) {
      const { data: existingCard } = await supabase
        .from('users')
        .select('card_id')
        .eq('card_id', cardId)
        .single();
      
      if (!existingCard) break;
      
      cardId = generateCardId();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return { success: false, error: 'Failed to generate unique card ID' };
    }
    
    // First, check if user exists, if not create them
    const { error: userCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist, create them first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }
      
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.email || '',
          loyalty_activated: true,
          card_id: cardId,
          loyalty_created_at: new Date().toISOString(),
          points_balance: 0,
          phone_number: phoneNumber || null
        });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return { success: false, error: createError.message };
      }
    } else if (userCheckError) {
      console.error('Error checking user:', userCheckError);
      return { success: false, error: userCheckError.message };
    } else {
      // User exists, update them
      const updateData: any = {
        loyalty_activated: true,
        card_id: cardId,
        loyalty_created_at: new Date().toISOString(),
        points_balance: 0
      };
      
      if (phoneNumber) {
        updateData.phone_number = phoneNumber;
      }
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      
      if (error) {
        console.error('Error activating loyalty card:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: true, cardId };
  } catch (error: any) {
    console.error('Error in activateLoyaltyCard:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's loyalty card information
 */
export async function getUserLoyaltyCard(userId: string): Promise<LoyaltyCard | null> {
  try {
    console.log('Fetching loyalty card for user:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('card_id, points_balance, loyalty_activated, loyalty_created_at, phone_number')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching loyalty card:', error);
      
      // If user doesn't exist, return a default state
      if (error.code === 'PGRST116') {
        console.log('User not found in users table, returning default state');
        return {
          cardId: '',
          pointsBalance: 0,
          loyaltyActivated: false,
          loyaltyCreatedAt: undefined,
          phoneNumber: undefined
        };
      }
      
      return null;
    }
    
    if (!data) {
      console.log('No data returned for user');
      return null;
    }
    
    const result = {
      cardId: data.card_id || '',
      pointsBalance: data.points_balance || 0,
      loyaltyActivated: data.loyalty_activated || false,
      loyaltyCreatedAt: data.loyalty_created_at,
      phoneNumber: data.phone_number
    };
    
    console.log('Loyalty card data:', result);
    return result;
  } catch (error) {
    console.error('Error in getUserLoyaltyCard:', error);
    return null;
  }
}

/**
 * Get user's loyalty transaction history
 */
export async function getUserTransactionHistory(
  userId: string, 
  limit: number = 50
): Promise<LoyaltyTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select(`
        id,
        transaction_id,
        sale_amount,
        points_earned,
        transaction_timestamp,
        status,
        partners!inner(display_name)
      `)
      .eq('user_id', userId)
      .order('transaction_timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
    
    return (data || []).map(transaction => ({
      id: transaction.id,
      transactionId: transaction.transaction_id,
      partnerName: transaction.partners.display_name,
      saleAmount: transaction.sale_amount,
      pointsEarned: transaction.points_earned,
      transactionTimestamp: transaction.transaction_timestamp,
      status: transaction.status
    }));
  } catch (error) {
    console.error('Error in getUserTransactionHistory:', error);
    return [];
  }
}

/**
 * Get all active partners
 */
export async function getActivePartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) {
      console.error('Error fetching partners:', error);
      return [];
    }
    
    return (data || []).map(partner => ({
      partnerId: partner.partner_id,
      name: partner.name,
      displayName: partner.display_name,
      pointsRate: partner.points_rate,
      logoUrl: partner.logo_url,
      category: partner.category,
      isActive: partner.is_active
    }));
  } catch (error) {
    console.error('Error in getActivePartners:', error);
    return [];
  }
}

/**
 * Calculate points for a given sale amount and partner
 */
export function calculatePoints(saleAmount: number, pointsRate: number): number {
  return Math.floor(saleAmount * pointsRate);
}

/**
 * Calculate points earned based on sale amount and partner rate (alias for API)
 */
export function calculatePointsEarned(saleAmount: number, pointsRate: number): number {
  return calculatePoints(saleAmount, pointsRate);
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

/**
 * Validate phone number format (South African)
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // South African phone number patterns
  const patterns = [
    /^0[6-8][0-9]{8}$/, // Mobile: 0XX XXXX XXXX
    /^0[1-5][0-9]{8}$/, // Landline: 0XX XXXX XXXX
    /^\+27[6-8][0-9]{8}$/, // International mobile: +27XX XXXX XXXX
    /^\+27[1-5][0-9]{8}$/ // International landline: +27XX XXXX XXXX
  ];
  
  const cleaned = phoneNumber.replace(/\s+/g, '');
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  
  // Format as XXX XXX XXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  // Format international numbers
  if (cleaned.startsWith('+27') && cleaned.length === 12) {
    return `+27 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  }
  
  return phoneNumber;
}
