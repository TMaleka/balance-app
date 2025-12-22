/**
 * Retry Mechanism Utilities
 * Provides automatic retry functionality for failed operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static instance: RetryManager;
  
  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  /**
   * Execute an operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      maxDelayMs = 10000,
      retryCondition = this.defaultRetryCondition,
      onRetry
    } = options;

    const startTime = Date.now();
    let lastError: any;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt === maxAttempts || !retryCondition(error)) {
          break;
        }

        // Call retry callback
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.delay(Math.min(currentDelay, maxDelayMs));
        currentDelay *= backoffMultiplier;
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: maxAttempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Default retry condition - retry on network errors and server errors
   */
  private defaultRetryCondition(error: any): boolean {
    // Retry on network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return true;
    }

    // Retry on temporary server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Retry on timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    // Retry on connection errors
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Don't retry on client errors (4xx) or authentication errors
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry wrapper for a function
   */
  createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return ((...args: any[]) => {
      return this.withRetry(() => fn(...args), options);
    }) as T;
  }
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();

// Utility functions for common retry scenarios
export const withRetry = <T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<RetryResult<T>> => retryManager.withRetry(operation, options);

export const withNetworkRetry = <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<RetryResult<T>> => 
  retryManager.withRetry(operation, {
    maxAttempts,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryCondition: (error) => {
      // Retry on network-related errors
      return error.message?.includes('fetch') || 
             error.message?.includes('network') ||
             error.message?.includes('Failed to fetch') ||
             error.status >= 500;
    }
  });

export const withDatabaseRetry = <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 2
): Promise<RetryResult<T>> => 
  retryManager.withRetry(operation, {
    maxAttempts,
    delayMs: 500,
    backoffMultiplier: 1.5,
    retryCondition: (error) => {
      // Retry on database connection issues
      return error.message?.includes('connection') ||
             error.message?.includes('timeout') ||
             error.code === 'PGRST301'; // PostgREST connection error
    }
  });

export const withAuthRetry = <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 2
): Promise<RetryResult<T>> => 
  retryManager.withRetry(operation, {
    maxAttempts,
    delayMs: 1000,
    backoffMultiplier: 1,
    retryCondition: (error) => {
      // Only retry on temporary auth issues, not permanent ones
      return error.message?.includes('network') ||
             error.message?.includes('timeout') ||
             (error.status >= 500 && error.status < 600);
    }
  });

// Specialized retry functions
export const retrySupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  maxAttempts: number = 3
): Promise<RetryResult<T>> => {
  return withRetry(async () => {
    const { data, error } = await operation();
    if (error) {
      throw error;
    }
    return data;
  }, {
    maxAttempts,
    delayMs: 1000,
    backoffMultiplier: 1.5,
    retryCondition: (error) => {
      // Don't retry on authentication or permission errors
      if (error.code === 'PGRST301' || error.code === 'PGRST116') {
        return false;
      }
      // Retry on network and server errors
      return error.message?.includes('network') ||
             error.message?.includes('fetch') ||
             error.status >= 500;
    }
  });
};

// Hook for React components
export const useRetry = () => {
  return {
    withRetry,
    withNetworkRetry,
    withDatabaseRetry,
    withAuthRetry,
    retrySupabaseOperation
  };
};
