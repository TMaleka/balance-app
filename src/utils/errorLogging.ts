/**
 * Error Logging and Monitoring System
 * Comprehensive error tracking, logging, and reporting for production
 */

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  sessionId?: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorLog[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupOnlineStatusMonitoring();
    this.startPeriodicFlush();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error'
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          type: 'promise_rejection',
          reason: event.reason
        }
      });
    });

    // Catch React errors (if using error boundaries)
    if (typeof window !== 'undefined') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('React') || message.includes('Warning:')) {
          this.logError({
            level: 'warning',
            message,
            context: {
              type: 'react_warning',
              args
            }
          });
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  private setupOnlineStatusMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logInfo('Connection restored', { type: 'connectivity' });
      this.flushLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logWarning('Connection lost', { type: 'connectivity' });
    });
  }

  private startPeriodicFlush(): void {
    // Flush logs every 30 seconds
    setInterval(() => {
      this.flushLogs();
    }, 30000);

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true);
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  logError(error: Partial<ErrorLog>): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level: error.level || 'error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: error.context,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      component: error.component,
      action: error.action,
      sessionId: this.sessionId
    };

    this.errorQueue.push(errorLog);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // Immediate flush for critical errors
    if (error.level === 'error') {
      this.flushLogs();
    }
  }

  logWarning(message: string, context?: Record<string, any>): void {
    this.logError({
      level: 'warning',
      message,
      context
    });
  }

  logInfo(message: string, context?: Record<string, any>): void {
    this.logError({
      level: 'info',
      message,
      context
    });
  }

  logDebug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.logError({
        level: 'debug',
        message,
        context
      });
    }
  }

  logPerformance(metric: string, value: number, unit: string = 'ms', context?: Record<string, any>): void {
    const performanceMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      context,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.performanceQueue.push(performanceMetric);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${metric} = ${value}${unit}`, context);
    }
  }

  logUserAction(action: string, context?: Record<string, any>): void {
    this.logInfo(`User action: ${action}`, {
      type: 'user_action',
      action,
      ...context
    });
  }

  logApiCall(endpoint: string, method: string, duration: number, status: number, context?: Record<string, any>): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'info';
    
    this.logError({
      level,
      message: `API ${method} ${endpoint} - ${status} (${duration}ms)`,
      context: {
        type: 'api_call',
        endpoint,
        method,
        duration,
        status,
        ...context
      }
    });

    this.logPerformance(`api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, duration, 'ms', {
      endpoint,
      method,
      status
    });
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async flushLogs(synchronous: boolean = false): Promise<void> {
    if (!this.isOnline || (this.errorQueue.length === 0 && this.performanceQueue.length === 0)) {
      return;
    }

    const errors = [...this.errorQueue];
    const performance = [...this.performanceQueue];
    
    this.errorQueue = [];
    this.performanceQueue = [];

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      errors,
      performance,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : null
      }
    };

    try {
      const method = synchronous ? 'sendBeacon' : 'fetch';
      
      if (synchronous && navigator.sendBeacon) {
        navigator.sendBeacon('/api/logs', JSON.stringify(payload));
      } else {
        // For now, log to console since we don't have a logging endpoint
        // In production, this would send to your logging service
        console.log('Logs to send:', payload);
        
        // Store in localStorage as backup
        this.storeLogsLocally(payload);
      }
    } catch (error) {
      // Restore logs to queue if sending failed
      this.errorQueue.unshift(...errors);
      this.performanceQueue.unshift(...performance);
      
      console.error('Failed to send logs:', error);
    }
  }

  private storeLogsLocally(payload: any): void {
    try {
      const existingLogs = localStorage.getItem('balance_app_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(payload);
      
      // Keep only last 50 log entries
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('balance_app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store logs locally:', error);
    }
  }

  getStoredLogs(): any[] {
    try {
      const logs = localStorage.getItem('balance_app_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  clearStoredLogs(): void {
    try {
      localStorage.removeItem('balance_app_logs');
    } catch (error) {
      console.error('Failed to clear stored logs:', error);
    }
  }

  // Health check methods
  checkHealth(): { status: 'healthy' | 'degraded' | 'unhealthy'; checks: Record<string, boolean> } {
    const checks = {
      online: this.isOnline,
      localStorage: this.testLocalStorage(),
      console: typeof console !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      performance: typeof performance !== 'undefined'
    };

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) {
      status = 'healthy';
    } else if (healthyCount >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, checks };
  }

  private testLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Utility functions
export const logError = (message: string, error?: Error, context?: Record<string, any>) => {
  errorLogger.logError({
    level: 'error',
    message,
    stack: error?.stack,
    context: {
      ...context,
      errorName: error?.name,
      errorMessage: error?.message
    }
  });
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  errorLogger.logWarning(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  errorLogger.logInfo(message, context);
};

export const logPerformance = (metric: string, value: number, unit?: string, context?: Record<string, any>) => {
  errorLogger.logPerformance(metric, value, unit, context);
};

export const logUserAction = (action: string, context?: Record<string, any>) => {
  errorLogger.logUserAction(action, context);
};

export const logApiCall = (endpoint: string, method: string, duration: number, status: number, context?: Record<string, any>) => {
  errorLogger.logApiCall(endpoint, method, duration, status, context);
};

export const setUserId = (userId: string) => {
  errorLogger.setUserId(userId);
};
