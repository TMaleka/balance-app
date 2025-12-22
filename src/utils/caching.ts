/**
 * Intelligent Caching System
 * Provides smart caching for API calls and data to improve performance
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number = 100;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const timestamp = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
      key
    };

    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Utility functions for common caching patterns
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  cacheManager.set(key, data, options);
  
  return data;
};

// Specialized cache functions for different data types
export const cacheUserData = <T>(userId: string, data: T, ttl: number = 10 * 60 * 1000): void => {
  cacheManager.set(`user:${userId}`, data, { ttl });
};

export const getCachedUserData = <T>(userId: string): T | null => {
  return cacheManager.get<T>(`user:${userId}`);
};

export const cachePartnerData = <T>(data: T, ttl: number = 30 * 60 * 1000): void => {
  cacheManager.set('partners:list', data, { ttl });
};

export const getCachedPartnerData = <T>(): T | null => {
  return cacheManager.get<T>('partners:list');
};

export const cacheLoyaltyData = <T>(userId: string, data: T, ttl: number = 5 * 60 * 1000): void => {
  cacheManager.set(`loyalty:${userId}`, data, { ttl });
};

export const getCachedLoyaltyData = <T>(userId: string): T | null => {
  return cacheManager.get<T>(`loyalty:${userId}`);
};

export const cacheAnalyticsData = <T>(userId: string, data: T, ttl: number = 15 * 60 * 1000): void => {
  cacheManager.set(`analytics:${userId}`, data, { ttl });
};

export const getCachedAnalyticsData = <T>(userId: string): T | null => {
  return cacheManager.get<T>(`analytics:${userId}`);
};

// Cache invalidation helpers
export const invalidateUserCache = (userId: string): void => {
  cacheManager.delete(`user:${userId}`);
  cacheManager.delete(`loyalty:${userId}`);
  cacheManager.delete(`analytics:${userId}`);
};

export const invalidatePartnerCache = (): void => {
  cacheManager.delete('partners:list');
};

// Auto cleanup - run every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);

// React hook for caching
export const useCache = () => {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    has: cacheManager.has.bind(cacheManager),
    delete: cacheManager.delete.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    withCache,
    invalidateUserCache,
    invalidatePartnerCache
  };
};
