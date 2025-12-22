/**
 * Database Optimization Utilities
 * Provides optimized database queries and batch operations
 */

import { supabase } from '../supabaseClient';
import { cacheManager } from './caching';

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  batchSize?: number;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryQueue = new Map<string, Promise<any>>();

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Optimized user data fetching with caching
   */
  async getUserData(userId: string, options: QueryOptions = {}): Promise<any> {
    const { useCache = true, cacheTTL = 10 * 60 * 1000 } = options;
    const cacheKey = `user_data:${userId}`;

    // Check cache first
    if (useCache) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('🚀 Using cached user data');
        return cached;
      }
    }

    // Prevent duplicate queries
    if (this.queryQueue.has(cacheKey)) {
      return this.queryQueue.get(cacheKey);
    }

    const queryPromise = this.fetchUserData(userId);
    this.queryQueue.set(cacheKey, queryPromise);

    try {
      const result = await queryPromise;
      
      // Cache the result
      if (useCache && result) {
        cacheManager.set(cacheKey, result, { ttl: cacheTTL });
      }

      return result;
    } finally {
      this.queryQueue.delete(cacheKey);
    }
  }

  private async fetchUserData(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone_number,
        card_id,
        points_balance,
        loyalty_activated,
        loyalty_created_at,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }

    return data;
  }

  /**
   * Optimized partner data fetching with caching
   */
  async getPartnerData(options: QueryOptions = {}): Promise<any[]> {
    const { useCache = true, cacheTTL = 30 * 60 * 1000 } = options;
    const cacheKey = 'partners_data';

    // Check cache first
    if (useCache) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('🚀 Using cached partner data');
        return cached;
      }
    }

    // Prevent duplicate queries
    if (this.queryQueue.has(cacheKey)) {
      return this.queryQueue.get(cacheKey);
    }

    const queryPromise = this.fetchPartnerData();
    this.queryQueue.set(cacheKey, queryPromise);

    try {
      const result = await queryPromise;
      
      // Cache the result
      if (useCache && result) {
        cacheManager.set(cacheKey, result, { ttl: cacheTTL });
      }

      return result;
    } finally {
      this.queryQueue.delete(cacheKey);
    }
  }

  private async fetchPartnerData() {
    const { data, error } = await supabase
      .from('partners')
      .select(`
        partner_id,
        display_name,
        logo_url,
        points_rate,
        category,
        description,
        is_active
      `)
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      throw new Error(`Failed to fetch partner data: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Batch transaction fetching for analytics
   */
  async getTransactionHistory(
    userId: string, 
    limit: number = 50,
    options: QueryOptions = {}
  ): Promise<any[]> {
    const { useCache = true, cacheTTL = 5 * 60 * 1000 } = options;
    const cacheKey = `transactions:${userId}:${limit}`;

    // Check cache first
    if (useCache) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('🚀 Using cached transaction data');
        return cached;
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        partner_id,
        amount,
        points_earned,
        created_at,
        partners!inner(display_name, logo_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    const result = data || [];
    
    // Cache the result
    if (useCache) {
      cacheManager.set(cacheKey, result, { ttl: cacheTTL });
    }

    return result;
  }

  /**
   * Optimized analytics data fetching
   */
  async getAnalyticsData(userId: string, options: QueryOptions = {}): Promise<any> {
    const { useCache = true, cacheTTL = 15 * 60 * 1000 } = options;
    const cacheKey = `analytics:${userId}`;

    // Check cache first
    if (useCache) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('🚀 Using cached analytics data');
        return cached;
      }
    }

    // Batch multiple queries for efficiency
    const [transactionStats, monthlyStats, partnerStats] = await Promise.all([
      this.getTransactionStats(userId),
      this.getMonthlyStats(userId),
      this.getPartnerStats(userId)
    ]);

    const result = {
      transactionStats,
      monthlyStats,
      partnerStats,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    if (useCache) {
      cacheManager.set(cacheKey, result, { ttl: cacheTTL });
    }

    return result;
  }

  private async getTransactionStats(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, points_earned')
      .eq('user_id', userId);

    if (error) return { totalSpent: 0, totalPoints: 0, transactionCount: 0 };

    const totalSpent = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const totalPoints = data?.reduce((sum, t) => sum + (t.points_earned || 0), 0) || 0;

    return {
      totalSpent,
      totalPoints,
      transactionCount: data?.length || 0
    };
  }

  private async getMonthlyStats(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, points_earned, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) return { monthlySpent: 0, monthlyPoints: 0, monthlyTransactions: 0 };

    const monthlySpent = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const monthlyPoints = data?.reduce((sum, t) => sum + (t.points_earned || 0), 0) || 0;

    return {
      monthlySpent,
      monthlyPoints,
      monthlyTransactions: data?.length || 0
    };
  }

  private async getPartnerStats(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        partner_id,
        amount,
        points_earned,
        partners!inner(display_name)
      `)
      .eq('user_id', userId);

    if (error) return [];

    // Group by partner
    const partnerMap = new Map();
    data?.forEach(transaction => {
      const partnerId = transaction.partner_id;
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName: transaction.partners.display_name,
          totalSpent: 0,
          totalPoints: 0,
          transactionCount: 0
        });
      }
      
      const stats = partnerMap.get(partnerId);
      stats.totalSpent += transaction.amount || 0;
      stats.totalPoints += transaction.points_earned || 0;
      stats.transactionCount += 1;
    });

    return Array.from(partnerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10); // Top 10 partners
  }

  /**
   * Clear all cached data for a user
   */
  invalidateUserData(userId: string): void {
    const keysToDelete = [
      `user_data:${userId}`,
      `analytics:${userId}`,
      `transactions:${userId}:50`,
      `loyalty:${userId}`
    ];

    keysToDelete.forEach(key => cacheManager.delete(key));
  }

  /**
   * Clear partner cache
   */
  invalidatePartnerData(): void {
    cacheManager.delete('partners_data');
  }
}

// Export singleton instance
export const dbOptimizer = DatabaseOptimizer.getInstance();

// Utility functions
export const getUserData = (userId: string, options?: QueryOptions) => 
  dbOptimizer.getUserData(userId, options);

export const getPartnerData = (options?: QueryOptions) => 
  dbOptimizer.getPartnerData(options);

export const getTransactionHistory = (userId: string, limit?: number, options?: QueryOptions) => 
  dbOptimizer.getTransactionHistory(userId, limit, options);

export const getAnalyticsData = (userId: string, options?: QueryOptions) => 
  dbOptimizer.getAnalyticsData(userId, options);

export const invalidateUserData = (userId: string) => 
  dbOptimizer.invalidateUserData(userId);

export const invalidatePartnerData = () => 
  dbOptimizer.invalidatePartnerData();
