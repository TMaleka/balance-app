/**
 * Performance Monitoring System
 * Real-time performance tracking and optimization insights
 */

import { logPerformance, logWarning, logInfo } from './errorLogging';

export interface PerformanceThresholds {
  pageLoad: number;
  apiCall: number;
  componentRender: number;
  interaction: number;
  memory: number;
}

export interface VitalMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observer?: PerformanceObserver;
  private thresholds: PerformanceThresholds = {
    pageLoad: 3000,
    apiCall: 2000,
    componentRender: 100,
    interaction: 100,
    memory: 50 * 1024 * 1024 // 50MB
  };

  constructor() {
    this.setupPerformanceObserver();
    this.monitorVitals();
    this.monitorMemory();
    this.monitorNetworkConditions();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      logWarning('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] });
    } catch (error) {
      logWarning('Failed to setup PerformanceObserver', { error: error.message });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.handleResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'measure':
        this.handleMeasureEntry(entry);
        break;
      case 'paint':
        this.handlePaintEntry(entry);
        break;
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart
    };

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value > 0) {
        logPerformance(`navigation_${metric}`, value, 'ms');
      }
    });

    // Check against thresholds
    if (metrics.total > this.thresholds.pageLoad) {
      logWarning(`Slow page load: ${metrics.total}ms`, { threshold: this.thresholds.pageLoad });
    }
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const resourceType = this.getResourceType(entry.name);
    
    logPerformance(`resource_${resourceType}`, duration, 'ms', {
      url: entry.name,
      size: entry.transferSize,
      cached: entry.transferSize === 0
    });

    // Monitor slow resources
    if (duration > 1000) {
      logWarning(`Slow resource load: ${entry.name}`, {
        duration,
        size: entry.transferSize,
        type: resourceType
      });
    }
  }

  private handleMeasureEntry(entry: PerformanceEntry): void {
    logPerformance(`custom_${entry.name}`, entry.duration, 'ms');
  }

  private handlePaintEntry(entry: PerformanceEntry): void {
    logPerformance(`paint_${entry.name.replace('-', '_')}`, entry.startTime, 'ms');
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private monitorVitals(): void {
    // Monitor Core Web Vitals
    if ('web-vitals' in window || typeof window !== 'undefined') {
      this.measureFCP();
      this.measureLCP();
      this.measureFID();
      this.measureCLS();
    }
  }

  private measureFCP(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          logPerformance('vital_fcp', entry.startTime, 'ms');
          observer.disconnect();
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  private measureLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      logPerformance('vital_lcp', lastEntry.startTime, 'ms');
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private measureFID(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logPerformance('vital_fid', entry.processingStart - entry.startTime, 'ms');
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private measureCLS(): void {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      logPerformance('vital_cls', clsValue, 'score');
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private monitorMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const limit = memory.jsHeapSizeLimit;

        logPerformance('memory_used', used, 'bytes');
        logPerformance('memory_total', total, 'bytes');
        logPerformance('memory_usage_percent', (used / limit) * 100, '%');

        if (used > this.thresholds.memory) {
          logWarning(`High memory usage: ${Math.round(used / 1024 / 1024)}MB`, {
            used,
            total,
            limit,
            percentage: (used / limit) * 100
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private monitorNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      logInfo('Network conditions', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });

      connection.addEventListener('change', () => {
        logInfo('Network conditions changed', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      });
    }
  }

  // Public methods for manual performance tracking
  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure ? measure.duration : 0;
    
    // Clean up marks
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  measureFunction<T>(name: string, fn: () => T): T {
    this.startMeasure(name);
    const result = fn();
    const duration = this.endMeasure(name);
    
    logPerformance(`function_${name}`, duration, 'ms');
    
    return result;
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    const result = await fn();
    const duration = this.endMeasure(name);
    
    logPerformance(`async_function_${name}`, duration, 'ms');
    
    return result;
  }

  measureApiCall(url: string, method: string, startTime: number, endTime: number, status: number): void {
    const duration = endTime - startTime;
    logPerformance(`api_${method.toLowerCase()}`, duration, 'ms', {
      url,
      status,
      endpoint: this.extractEndpoint(url)
    });

    if (duration > this.thresholds.apiCall) {
      logWarning(`Slow API call: ${method} ${url}`, {
        duration,
        threshold: this.thresholds.apiCall,
        status
      });
    }
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  getPerformanceReport(): any {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      timestamp: new Date().toISOString(),
      navigation: navigation ? {
        type: navigation.type,
        redirectCount: navigation.redirectCount,
        timing: {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
          total: navigation.loadEventEnd - navigation.navigationStart
        }
      } : null,
      paint: paint.reduce((acc, entry) => {
        acc[entry.name.replace('-', '_')] = entry.startTime;
        return acc;
      }, {} as Record<string, number>),
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export const startMeasure = (name: string) => performanceMonitor.startMeasure(name);
export const endMeasure = (name: string) => performanceMonitor.endMeasure(name);
export const measureFunction = <T>(name: string, fn: () => T) => performanceMonitor.measureFunction(name, fn);
export const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>) => performanceMonitor.measureAsyncFunction(name, fn);
export const measureApiCall = (url: string, method: string, startTime: number, endTime: number, status: number) => 
  performanceMonitor.measureApiCall(url, method, startTime, endTime, status);
export const getPerformanceReport = () => performanceMonitor.getPerformanceReport();
