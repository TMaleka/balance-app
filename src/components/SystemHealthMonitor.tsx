/**
 * System Health Monitor Component
 * Real-time system status and health checks
 */

import React, { useState, useEffect } from 'react';
import { Activity, Wifi, Database, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { errorLogger } from '../utils/errorLogging';
import { performanceMonitor, getPerformanceReport } from '../utils/performanceMonitoring';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    authentication: boolean;
    localStorage: boolean;
    network: boolean;
    performance: boolean;
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
    uptime: number;
  };
  lastChecked: string;
}

interface SystemHealthMonitorProps {
  onStatusChange?: (status: HealthStatus) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SystemHealthMonitor({ 
  onStatusChange, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: SystemHealthMonitorProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    overall: 'healthy',
    checks: {
      database: false,
      authentication: false,
      localStorage: false,
      network: false,
      performance: false
    },
    metrics: {
      responseTime: 0,
      memoryUsage: 0,
      errorRate: 0,
      uptime: 0
    },
    lastChecked: new Date().toISOString()
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkSystemHealth();

    if (autoRefresh) {
      const interval = setInterval(checkSystemHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(healthStatus);
    }
  }, [healthStatus, onStatusChange]);

  const checkSystemHealth = async (): Promise<void> => {
    const startTime = performance.now();
    
    try {
      const checks = await Promise.allSettled([
        checkDatabase(),
        checkAuthentication(),
        checkLocalStorage(),
        checkNetwork(),
        checkPerformance()
      ]);

      const healthChecks = {
        database: checks[0].status === 'fulfilled' && checks[0].value,
        authentication: checks[1].status === 'fulfilled' && checks[1].value,
        localStorage: checks[2].status === 'fulfilled' && checks[2].value,
        network: checks[3].status === 'fulfilled' && checks[3].value,
        performance: checks[4].status === 'fulfilled' && checks[4].value
      };

      const responseTime = performance.now() - startTime;
      const memoryUsage = getMemoryUsage();
      const errorRate = getErrorRate();
      const uptime = getUptime();

      const healthyCount = Object.values(healthChecks).filter(Boolean).length;
      const totalChecks = Object.keys(healthChecks).length;
      
      let overall: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === totalChecks) {
        overall = 'healthy';
      } else if (healthyCount >= totalChecks * 0.7) {
        overall = 'degraded';
      } else {
        overall = 'unhealthy';
      }

      const newStatus: HealthStatus = {
        overall,
        checks: healthChecks,
        metrics: {
          responseTime,
          memoryUsage,
          errorRate,
          uptime
        },
        lastChecked: new Date().toISOString()
      };

      setHealthStatus(newStatus);

    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const checkDatabase = async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  };

  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return !error;
    } catch (error) {
      return false;
    }
  };

  const checkLocalStorage = (): boolean => {
    try {
      const test = 'health_check_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  };

  const checkNetwork = (): boolean => {
    return navigator.onLine;
  };

  const checkPerformance = (): boolean => {
    const memory = getMemoryUsage();
    const errorRate = getErrorRate();
    
    return memory < 80 && errorRate < 5;
  };

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  };

  const getErrorRate = (): number => {
    const logs = errorLogger.getStoredLogs();
    if (logs.length === 0) return 0;
    
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp).getTime() > Date.now() - 3600000
    );
    
    const errorCount = recentLogs.reduce((count, log) => 
      count + (log.errors?.filter((error: any) => error.level === 'error').length || 0), 0
    );
    
    const totalEvents = recentLogs.reduce((count, log) => 
      count + (log.errors?.length || 0) + (log.performance?.length || 0), 0
    );
    
    return totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;
  };

  const getUptime = (): number => {
    const startTime = sessionStorage.getItem('app_start_time');
    if (!startTime) {
      const now = Date.now().toString();
      sessionStorage.setItem('app_start_time', now);
      return 0;
    }
    
    return Date.now() - parseInt(startTime);
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'unhealthy':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-3rounded-full shadow-lgborder-gray-200 hover:shadow-xl transition-shadow z-50"
        title="System Health"
      >
        <Activity className={`w-5 h-5 ${getOverallStatusColor(healthStatus.overall).split(' ')[0]}`} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80shadow-xlborder-gray-200 z-50">
      {/* Header */}
      <div className="-b">
        <div className="">
          <div className="space-x-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-semibold">System Health</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:"
          >
            ×
          </button>
        </div>
        
        <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium border ${getOverallStatusColor(healthStatus.overall)}`}>
          {healthStatus.overall.charAt(0).toUpperCase() + healthStatus.overall.slice(1)}
        </div>
      </div>

      {/* Health Checks */}
      <div className="space-y-3">
        <div className="">
          <div className="space-x-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Database</span>
          </div>
          {getStatusIcon(healthStatus.checks.database)}
        </div>

        <div className="">
          <div className="space-x-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Authentication</span>
          </div>
          {getStatusIcon(healthStatus.checks.authentication)}
        </div>

        <div className="">
          <div className="space-x-2">
            <Wifi className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Network</span>
          </div>
          {getStatusIcon(healthStatus.checks.network)}
        </div>

        <div className="">
          <div className="space-x-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Performance</span>
          </div>
          {getStatusIcon(healthStatus.checks.performance)}
        </div>
      </div>

      {/* Metrics */}
      <div className="-tspace-y-2">
        <div className="text-sm">
          <span className="">Response Time</span>
          <span className="font-medium">{Math.round(healthStatus.metrics.responseTime)}ms</span>
        </div>

        <div className="text-sm">
          <span className="">Memory Usage</span>
          <span className="font-medium">{Math.round(healthStatus.metrics.memoryUsage)}%</span>
        </div>

        <div className="text-sm">
          <span className="">Error Rate</span>
          <span className="font-medium">{Math.round(healthStatus.metrics.errorRate * 100) / 100}%</span>
        </div>

        <div className="text-sm">
          <span className="">Uptime</span>
          <span className="font-medium">{formatUptime(healthStatus.metrics.uptime)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="-t">
        <button
          onClick={checkSystemHealth}
          className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-600hover:bg-blue-100 transition-colors"
        >
          Refresh Status
        </button>
        
        <div className="mt-2 nedbank-text-small text-center">
          Last checked: {new Date(healthStatus.lastChecked).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

