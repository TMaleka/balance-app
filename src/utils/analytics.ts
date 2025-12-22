/**
 * User Analytics and Usage Tracking System
 * Privacy-focused analytics for understanding user behavior
 */

import { logInfo, logUserAction } from './errorLogging';

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  event: string;
  category: 'user_action' | 'system_event' | 'performance' | 'error';
  properties?: Record<string, any>;
  page?: string;
  referrer?: string;
  userAgent?: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: number;
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

class Analytics {
  private static instance: Analytics;
  private sessionId: string;
  private userId?: string;
  private sessionStart: number;
  private eventQueue: AnalyticsEvent[] = [];
  private currentSession: UserSession;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.currentSession = this.initializeSession();
    this.setupEventListeners();
    this.startSessionTracking();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): UserSession {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: new Date().toISOString(),
      pageViews: 1,
      events: 0,
      device: this.getDeviceInfo()
    };
  }

  private getDeviceInfo(): UserSession['device'] {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Mobile|Android|iPhone|iPod/.test(userAgent)) {
      type = 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      type = 'tablet';
    }

    // Detect OS
    let os = 'Unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iOS|iPhone|iPad/.test(userAgent)) os = 'iOS';

    // Detect browser
    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    return { type, os, browser };
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', 'system_event');
      } else {
        this.track('page_visible', 'system_event');
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button?.textContent?.trim() || 'Unknown';
        
        this.track('button_click', 'user_action', {
          buttonText,
          buttonId: button?.id,
          buttonClass: button?.className
        });
      }

      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = (link as HTMLAnchorElement)?.href;
        
        this.track('link_click', 'user_action', {
          href,
          linkText: link?.textContent?.trim(),
          isExternal: href && !href.startsWith(window.location.origin)
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      
      this.track('form_submit', 'user_action', {
        formId: form.id,
        formClass: form.className,
        formAction: form.action,
        formMethod: form.method
      });
    });
  }

  private startSessionTracking(): void {
    // Update session every 30 seconds
    setInterval(() => {
      this.updateSession();
    }, 30000);

    // Track initial page load
    this.track('page_load', 'system_event', {
      url: window.location.href,
      referrer: document.referrer,
      loadTime: performance.now()
    });
  }

  private updateSession(): void {
    this.currentSession.duration = Date.now() - this.sessionStart;
    this.currentSession.events = this.eventQueue.length;
    
    // Store session data locally
    this.storeSessionData();
  }

  private endSession(): void {
    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.duration = Date.now() - this.sessionStart;
    
    this.track('session_end', 'system_event', {
      duration: this.currentSession.duration,
      pageViews: this.currentSession.pageViews,
      events: this.currentSession.events
    });

    this.storeSessionData();
    this.flushEvents(true);
  }

  private storeSessionData(): void {
    try {
      const sessions = this.getStoredSessions();
      const existingIndex = sessions.findIndex(s => s.sessionId === this.sessionId);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = this.currentSession;
      } else {
        sessions.push(this.currentSession);
      }

      // Keep only last 10 sessions
      if (sessions.length > 10) {
        sessions.splice(0, sessions.length - 10);
      }

      localStorage.setItem('balance_app_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.currentSession.userId = userId;
    
    this.track('user_identified', 'system_event', {
      userId
    });
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (enabled) {
      logInfo('Analytics enabled');
    } else {
      logInfo('Analytics disabled');
    }
  }

  track(event: string, category: AnalyticsEvent['category'], properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      event,
      category,
      properties,
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };

    this.eventQueue.push(analyticsEvent);
    
    // Log user actions for debugging
    if (category === 'user_action') {
      logUserAction(event, properties);
    }

    // Auto-flush events every 50 events or every 5 minutes
    if (this.eventQueue.length >= 50) {
      this.flushEvents();
    }
  }

  // Convenience methods for common events
  trackPageView(page?: string): void {
    this.currentSession.pageViews++;
    this.track('page_view', 'system_event', {
      page: page || window.location.pathname,
      title: document.title
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track(action, 'user_action', properties);
  }

  trackError(error: string, properties?: Record<string, any>): void {
    this.track('error_occurred', 'error', {
      error,
      ...properties
    });
  }

  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    this.track('performance_metric', 'performance', {
      metric,
      value,
      ...properties
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>): void {
    this.track(`feature_${feature}_${action}`, 'user_action', {
      feature,
      action,
      ...properties
    });
  }

  // Business metrics
  trackBusinessEvent(event: string, properties?: Record<string, any>): void {
    this.track(event, 'user_action', {
      businessEvent: true,
      ...properties
    });
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private flushEvents(synchronous: boolean = false): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      events,
      session: this.currentSession
    };

    try {
      if (synchronous && navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
      } else {
        // For now, store locally since we don't have an analytics endpoint
        this.storeEventsLocally(payload);
      }
    } catch (error) {
      // Restore events to queue if sending failed
      this.eventQueue.unshift(...events);
      console.error('Failed to send analytics:', error);
    }
  }

  private storeEventsLocally(payload: any): void {
    try {
      const existingEvents = localStorage.getItem('balance_app_analytics');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      
      events.push(payload);
      
      // Keep only last 100 event batches
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('balance_app_analytics', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store analytics locally:', error);
    }
  }

  // Data retrieval methods
  getStoredEvents(): any[] {
    try {
      const events = localStorage.getItem('balance_app_analytics');
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Failed to retrieve stored events:', error);
      return [];
    }
  }

  getStoredSessions(): UserSession[] {
    try {
      const sessions = localStorage.getItem('balance_app_sessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Failed to retrieve stored sessions:', error);
      return [];
    }
  }

  getCurrentSession(): UserSession {
    return { ...this.currentSession };
  }

  getAnalyticsSummary(): any {
    const events = this.getStoredEvents();
    const sessions = this.getStoredSessions();
    
    const totalEvents = events.reduce((count, batch) => count + batch.events.length, 0);
    const totalSessions = sessions.length;
    const avgSessionDuration = sessions.reduce((sum, session) => 
      sum + (session.duration || 0), 0) / totalSessions;
    
    const eventsByCategory = events.reduce((acc, batch) => {
      batch.events.forEach((event: AnalyticsEvent) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration),
      eventsByCategory,
      currentSession: this.currentSession,
      deviceInfo: this.currentSession.device
    };
  }

  clearStoredData(): void {
    try {
      localStorage.removeItem('balance_app_analytics');
      localStorage.removeItem('balance_app_sessions');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Utility functions
export const trackEvent = (event: string, category: AnalyticsEvent['category'], properties?: Record<string, any>) => {
  analytics.track(event, category, properties);
};

export const trackPageView = (page?: string) => {
  analytics.trackPageView(page);
};

export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  analytics.trackUserAction(action, properties);
};

export const trackFeatureUsage = (feature: string, action: string, properties?: Record<string, any>) => {
  analytics.trackFeatureUsage(feature, action, properties);
};

export const trackBusinessEvent = (event: string, properties?: Record<string, any>) => {
  analytics.trackBusinessEvent(event, properties);
};

export const setAnalyticsUserId = (userId: string) => {
  analytics.setUserId(userId);
};

export const setAnalyticsEnabled = (enabled: boolean) => {
  analytics.setEnabled(enabled);
};
