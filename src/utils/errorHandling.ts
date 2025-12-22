/**
 * Error Handling Utilities
 * Provides consistent error handling and user-friendly messages
 */

import { APP_CONFIG } from '../config/environment';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  userId?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Log an error for debugging and monitoring
   */
  logError(error: Error | string, context?: any, userId?: string): AppError {
    const appError: AppError = {
      message: typeof error === 'string' ? error : error.message,
      code: typeof error === 'object' && 'code' in error ? error.code : undefined,
      details: {
        context,
        stack: typeof error === 'object' ? error.stack : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: new Date().toISOString(),
      userId
    };

    this.errors.push(appError);
    
    // Log to console in development
    if (APP_CONFIG.isDevelopment) {
      console.error('App Error:', appError);
    }

    // In production, you would send this to a monitoring service
    // Example: Sentry, LogRocket, etc.
    
    return appError;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error | string): string {
    const message = typeof error === 'string' ? error : error.message;
    
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Network Error': 'Unable to connect to the server. Please check your internet connection.',
      'Failed to fetch': 'Unable to connect to the server. Please try again.',
      'Unauthorized': 'Your session has expired. Please sign in again.',
      'Forbidden': 'You do not have permission to perform this action.',
      'Not Found': 'The requested information could not be found.',
      'Internal Server Error': 'Something went wrong on our end. Please try again later.',
      'Bad Request': 'Invalid request. Please check your input and try again.',
      'Validation Error': 'Please check your input and try again.',
      'Database Error': 'Unable to save your changes. Please try again.',
      'Authentication Error': 'Please sign in to continue.',
      'Rate Limit Exceeded': 'Too many requests. Please wait a moment and try again.'
    };

    // Check for exact matches first
    if (errorMappings[message]) {
      return errorMappings[message];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Default user-friendly message
    return 'Something went wrong. Please try again.';
  }

  /**
   * Handle API errors consistently
   */
  handleApiError(error: any, context?: string): never {
    const errorMessage = error?.message || 'Unknown API error';
    const userMessage = this.getUserMessage(errorMessage);
    
    this.logError(error, { context, apiError: true });
    
    throw new Error(userMessage);
  }

  /**
   * Safe async wrapper that catches and handles errors
   */
  async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error as Error, { context, safeAsync: true });
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      return undefined;
    }
  }

  /**
   * Safe sync wrapper that catches and handles errors
   */
  safeSync<T>(
    operation: () => T,
    fallback?: T,
    context?: string
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.logError(error as Error, { context, safeSync: true });
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      return undefined;
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common use cases
export const logError = (error: Error | string, context?: any, userId?: string) => 
  errorHandler.logError(error, context, userId);

export const getUserMessage = (error: Error | string) => 
  errorHandler.getUserMessage(error);

export const handleApiError = (error: any, context?: string) => 
  errorHandler.handleApiError(error, context);

export const safeAsync = <T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: string
) => errorHandler.safeAsync(operation, fallback, context);

export const safeSync = <T>(
  operation: () => T,
  fallback?: T,
  context?: string
) => errorHandler.safeSync(operation, fallback, context);

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorHandler.logError(event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    type: 'unhandled'
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorHandler.logError(event.reason, {
    type: 'unhandledRejection'
  });
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
});
