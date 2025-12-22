/**
 * Loyalty System Type Definitions
 */

export interface LoyaltyUser {
  id: string;
  email: string;
  cardId: string;
  pointsBalance: number;
  loyaltyActivated: boolean;
  loyaltyCreatedAt?: string;
  phoneNumber?: string;
}

export interface Partner {
  id: number;
  partnerId: string;
  name: string;
  displayName: string;
  pointsRate: number; // Points per ZAR 1
  logoUrl?: string;
  category: PartnerCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PartnerCategory = 
  | 'grocery' 
  | 'fuel' 
  | 'restaurant' 
  | 'retail' 
  | 'pharmacy' 
  | 'entertainment' 
  | 'other';

export interface PartnerApiKey {
  id: number;
  partnerId: string;
  apiKey: string;
  keyName: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: number;
  transactionId: string;
  userId: string;
  partnerId: string;
  cardId: string;
  saleAmount: number;
  pointsEarned: number;
  transactionTimestamp: string;
  processedAt: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  
  // Joined data
  partnerName?: string;
  partnerDisplayName?: string;
  partnerCategory?: PartnerCategory;
}

export type TransactionStatus = 
  | 'completed' 
  | 'pending' 
  | 'failed' 
  | 'reversed';

export interface PointsRedemption {
  id: number;
  userId: string;
  pointsRedeemed: number;
  redemptionType: RedemptionType;
  redemptionValue: number;
  partnerId?: string;
  status: RedemptionStatus;
  createdAt: string;
}

export type RedemptionType = 
  | 'discount' 
  | 'cashback' 
  | 'reward' 
  | 'voucher' 
  | 'donation';

export type RedemptionStatus = 
  | 'completed' 
  | 'pending' 
  | 'failed' 
  | 'cancelled';

export interface PointsAuditLog {
  id: number;
  userId: string;
  cardId: string;
  pointsChange: number;
  pointsBalanceBefore: number;
  pointsBalanceAfter: number;
  transactionType: AuditTransactionType;
  referenceId?: string;
  partnerId?: string;
  createdAt: string;
}

export type AuditTransactionType = 
  | 'earned' 
  | 'redeemed' 
  | 'adjusted' 
  | 'expired' 
  | 'bonus' 
  | 'refund';

// API Request/Response Types

export interface PartnerTransactionRequest {
  partnerId: string;
  transactions: PartnerTransaction[];
}

export interface PartnerTransaction {
  cardId: string;
  saleAmount: number;
  timestamp: string;
  transactionId?: string; // Partner's internal transaction ID
  metadata?: Record<string, any>;
}

export interface PartnerTransactionResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors?: TransactionError[];
  message?: string;
}

export interface TransactionError {
  cardId: string;
  error: string;
  transactionId?: string;
}

export interface CardValidationRequest {
  cardId: string;
  partnerId: string;
}

export interface CardValidationResponse {
  valid: boolean;
  userId?: string;
  pointsBalance?: number;
  error?: string;
}

export interface ManualTransactionRequest {
  cardId: string;
  saleAmount: number;
  partnerId: string;
  transactionId?: string;
  metadata?: Record<string, any>;
}

export interface ManualTransactionResponse {
  success: boolean;
  pointsEarned?: number;
  newBalance?: number;
  transactionId?: string;
  error?: string;
}

// UI Component Props

export interface LoyaltyCardProps {
  cardId: string;
  pointsBalance: number;
  phoneNumber?: string;
  showQRCode?: boolean;
  showBarcode?: boolean;
}

export interface TransactionHistoryProps {
  transactions: LoyaltyTransaction[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface PartnerListProps {
  partners: Partner[];
  onPartnerSelect?: (partner: Partner) => void;
  selectedCategory?: PartnerCategory;
}

export interface PointsBalanceProps {
  points: number;
  showAnimation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Notification Types

export interface LoyaltyNotification {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
  createdAt: string;
}

export type NotificationType = 
  | 'points_earned' 
  | 'points_milestone' 
  | 'partner_offer' 
  | 'account_security' 
  | 'system_update';

// Analytics Types

export interface UserLoyaltyStats {
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  transactionCount: number;
  favoritePartner?: Partner;
  monthlyEarnings: number;
  yearlyEarnings: number;
  memberSince: string;
}

export interface PartnerStats {
  partnerId: string;
  totalTransactions: number;
  totalPointsIssued: number;
  totalSalesVolume: number;
  activeUsers: number;
  averageTransactionValue: number;
  monthlyGrowth: number;
}

// Error Types

export class LoyaltyError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'LoyaltyError';
  }
}

export class CardNotFoundError extends LoyaltyError {
  constructor(cardId: string) {
    super(`Card not found: ${cardId}`, 'CARD_NOT_FOUND', { cardId });
  }
}

export class InsufficientPointsError extends LoyaltyError {
  constructor(required: number, available: number) {
    super(
      `Insufficient points: required ${required}, available ${available}`,
      'INSUFFICIENT_POINTS',
      { required, available }
    );
  }
}

export class PartnerNotFoundError extends LoyaltyError {
  constructor(partnerId: string) {
    super(`Partner not found: ${partnerId}`, 'PARTNER_NOT_FOUND', { partnerId });
  }
}

export class InvalidApiKeyError extends LoyaltyError {
  constructor() {
    super('Invalid or expired API key', 'INVALID_API_KEY');
  }
}
