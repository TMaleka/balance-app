export interface Budget {
  id: number | string; // Allow string for temporary client-side IDs
  name: string;
  budget: number;
  spent: number;
  user_id: string;
}

export interface Expense {
  id: number;
  merchant: string;
  amount: number;
  categoryId: number;
  timestamp: Date;
  user_id?: string;
  loyalty_transaction_id?: string; // Link to loyalty transaction if created from card scan
  is_loyalty_purchase?: boolean; // Flag to indicate this came from loyalty system
}

// Loyalty System Types
export interface LoyaltyUser {
  id: string;
  email: string;
  cardId: string;
  pointsBalance: number;
  loyaltyActivated: boolean;
  loyaltyCreatedAt?: string;
  phoneNumber?: string;
}

export interface LoyaltyCard {
  cardId: string;
  pointsBalance: number;
  loyaltyActivated: boolean;
  loyaltyCreatedAt?: string;
  phoneNumber?: string;
}
