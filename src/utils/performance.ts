/**
 * Performance Optimization Utilities
 * Provides tools for optimizing React components and API calls
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Debounce utility for search inputs and API calls
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle utility for scroll events and frequent updates
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Memoized API call hook
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Optimized state for large lists
export const useOptimizedList = <T>(
  items: T[],
  pageSize: number = 20
) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return items.slice(0, end); // Load progressively
  }, [items, currentPage, pageSize]);

  const hasMore = useMemo(() => {
    return (currentPage + 1) * pageSize < items.length;
  }, [items.length, currentPage, pageSize]);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const reset = useCallback(() => {
    setCurrentPage(0);
  }, []);

  return {
    items: paginatedItems,
    hasMore,
    loadMore,
    reset,
    currentPage,
    totalPages: Math.ceil(items.length / pageSize)
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { elementRef, isIntersecting, entry };
};

// Performance monitoring hook
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>(0);
  
  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }, [name]);

  const measure = useCallback((fn: () => void) => {
    start();
    fn();
    return end();
  }, [start, end]);

  return { start, end, measure };
};

// Memory usage optimization
export const useMemoryOptimization = () => {
  const cleanup = useCallback(() => {
    // Force garbage collection if available (dev mode)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { cleanup };
};

// Optimized image loading
export const useOptimizedImage = (src: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError('Failed to load image');
    img.src = src;
    imgRef.current = img;

    return () => {
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  return { isLoaded, error };
};

// Bundle size optimization helpers
export const lazyImport = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// API call batching
export class APIBatcher {
  private static instance: APIBatcher;
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();

  static getInstance(): APIBatcher {
    if (!APIBatcher.instance) {
      APIBatcher.instance = new APIBatcher();
    }
    return APIBatcher.instance;
  }

  batch<T>(
    key: string,
    request: T,
    batchProcessor: (requests: T[]) => Promise<any>,
    delay: number = 100
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add to batch
      if (!this.batches.has(key)) {
        this.batches.set(key, []);
      }
      
      this.batches.get(key)!.push({ request, resolve, reject });

      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        const batch = this.batches.get(key) || [];
        this.batches.delete(key);
        this.timers.delete(key);

        if (batch.length === 0) return;

        try {
          const requests = batch.map(item => item.request);
          const results = await batchProcessor(requests);
          
          // Resolve all promises
          batch.forEach((item, index) => {
            item.resolve(results[index]);
          });
        } catch (error) {
          // Reject all promises
          batch.forEach(item => {
            item.reject(error);
          });
        }
      }, delay);

      this.timers.set(key, timer);
    });
  }
}

export const apiBatcher = APIBatcher.getInstance();

// Component performance wrapper
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  name: string
) => {
  return React.memo((props: P) => {
    const { measure } = usePerformanceMonitor(name);
    
    return React.useMemo(() => {
      measure(() => {});
      return React.createElement(Component, props);
    }, [props, measure]);
  });
};

// Preload critical resources
export const preloadResource = (url: string, type: 'script' | 'style' | 'image' = 'script') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
  }
  
  document.head.appendChild(link);
};

// Performance metrics collection
export const collectPerformanceMetrics = () => {
  if (!window.performance) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Core Web Vitals approximations
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    
    // Network timing
    dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcpConnection: navigation.connectEnd - navigation.connectStart,
    serverResponse: navigation.responseEnd - navigation.requestStart,
    
    // Resource timing
    totalResources: performance.getEntriesByType('resource').length,
    
    // Memory (if available)
    memory: (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    } : null
  };
};
