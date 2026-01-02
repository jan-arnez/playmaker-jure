"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOptimisticMutations } from './use-optimistic-mutations';

export interface DashboardStats {
  id: string;
  totalFacilities: number;
  totalBookings: number;
  activeBookings: number;
  teamMembers: number;
  monthlyRevenue: number;
  pendingBookings: number;
  occupancyRate?: number;
  averageRating?: number;
  todayBookings?: number;
  weeklyRevenue?: number;
  lastWeekRevenue?: number;
  lastMonthRevenue?: number;
  lastUpdated?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  alerts: DashboardAlert[];
}

export interface OptimisticDashboardOptions {
  onStatsUpdate?: (stats: DashboardStats) => void;
  onAlertUpdate?: (alerts: DashboardAlert[]) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useOptimisticDashboard(
  initialData: DashboardData,
  options: OptimisticDashboardOptions = {}
) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    onStatsUpdate,
    onAlertUpdate
  } = options;

  // Optimistic mutations for stats
  const statsMutations = useOptimisticMutations<DashboardStats>(
    [dashboardData.stats],
    {
      onSuccess: (data) => {
        if (onStatsUpdate) {
          onStatsUpdate(data[0]);
        }
      }
    }
  );

  // Optimistic mutations for alerts
  const alertsMutations = useOptimisticMutations<DashboardAlert>(
    dashboardData.alerts,
    {
      onSuccess: (data) => {
        if (onAlertUpdate) {
          onAlertUpdate(data);
        }
      }
    }
  );

  // Update stats optimistically
  const updateStats = useCallback(async (
    updates: Partial<DashboardStats>,
    apiCall?: (updates: Partial<DashboardStats>) => Promise<DashboardStats>
  ) => {
    const currentStats = statsMutations.data[0];
    if (!currentStats) return;

    // Apply optimistic update
    statsMutations.updateOptimistic(currentStats.id, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });

    // Update local state
    setDashboardData(prev => ({
      ...prev,
      stats: { ...prev.stats, ...updates, lastUpdated: new Date().toISOString() }
    }));

    // If API call provided, execute it
    if (apiCall) {
      try {
        const result = await apiCall(updates);
        // Update with server response
        setDashboardData(prev => ({
          ...prev,
          stats: { ...result, lastUpdated: new Date().toISOString() }
        }));
      } catch (error) {
        // Rollback on error
        statsMutations.rollbackOptimistic(currentStats.id);
        throw error;
      }
    }
  }, [statsMutations]);

  // Add alert optimistically
  const addAlert = useCallback(async (
    alert: Omit<DashboardAlert, 'id' | 'timestamp'>,
    apiCall?: (alert: DashboardAlert) => Promise<DashboardAlert>
  ) => {
    const newAlert: DashboardAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add optimistically
    alertsMutations.addOptimistic(newAlert);

    // Update local state
    setDashboardData(prev => ({
      ...prev,
      alerts: [...prev.alerts, newAlert]
    }));

    // If API call provided, execute it
    if (apiCall) {
      try {
        const result = await apiCall(newAlert);
        // Update with server response
        setDashboardData(prev => ({
          ...prev,
          alerts: prev.alerts.map(a => a.id === newAlert.id ? result : a)
        }));
      } catch (error) {
        // Remove on error
        alertsMutations.removeOptimistic(newAlert.id);
        setDashboardData(prev => ({
          ...prev,
          alerts: prev.alerts.filter(a => a.id !== newAlert.id)
        }));
        throw error;
      }
    }
  }, [alertsMutations]);

  // Remove alert optimistically
  const removeAlert = useCallback(async (
    alertId: string,
    apiCall?: (alertId: string) => Promise<void>
  ) => {
    // Remove optimistically
    alertsMutations.removeOptimistic(alertId);

    // Update local state
    setDashboardData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId)
    }));

    // If API call provided, execute it
    if (apiCall) {
      try {
        await apiCall(alertId);
      } catch (error) {
        // Restore on error
        const originalAlert = dashboardData.alerts.find(a => a.id === alertId);
        if (originalAlert) {
          alertsMutations.addOptimistic(originalAlert);
          setDashboardData(prev => ({
            ...prev,
            alerts: [...prev.alerts, originalAlert]
          }));
        }
        throw error;
      }
    }
  }, [alertsMutations, dashboardData.alerts]);

  // Refresh data from server
  const refreshData = useCallback(async (fetchFunction: () => Promise<DashboardData>) => {
    setIsRefreshing(true);
    try {
      const newData = await fetchFunction();
      setDashboardData(newData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Generate alerts based on current stats
  const generateAlerts = useCallback((stats: DashboardStats): DashboardAlert[] => {
    const alerts: DashboardAlert[] = [];
    
    if (stats.pendingBookings > 0) {
      alerts.push({
        id: `pending-bookings-${Date.now()}`,
        type: 'warning',
        title: 'Pending Bookings',
        message: `${stats.pendingBookings} bookings need your attention`,
        timestamp: new Date(),
        action: {
          label: 'Review',
          onClick: () => console.log('Navigate to bookings')
        }
      });
    }
    
    if (stats.todayBookings && stats.todayBookings > 5) {
      alerts.push({
        id: `high-demand-${Date.now()}`,
        type: 'success',
        title: 'High Demand Today',
        message: `${stats.todayBookings} bookings scheduled for today`,
        timestamp: new Date(),
      });
    }
    
    return alerts;
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not currently refreshing
      if (!isRefreshing) {
        // This would typically call a refresh function
        // For now, we'll just update the timestamp
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            lastUpdated: new Date().toISOString()
          }
        }));
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isRefreshing]);

  // Update alerts when stats change
  useEffect(() => {
    const newAlerts = generateAlerts(dashboardData.stats);
    setDashboardData(prev => ({
      ...prev,
      alerts: newAlerts
    }));
  }, [dashboardData.stats, generateAlerts]);

  return {
    // Data
    data: dashboardData,
    stats: dashboardData.stats,
    alerts: dashboardData.alerts,
    
    // State
    isRefreshing,
    lastRefresh,
    
    // Actions
    updateStats,
    addAlert,
    removeAlert,
    refreshData,
    
    // Optimistic state
    hasOptimisticUpdates: statsMutations.getOptimisticCount() > 0 || alertsMutations.getOptimisticCount() > 0,
    hasFailedUpdates: statsMutations.hasFailedItems() || alertsMutations.hasFailedItems(),
    hasPendingUpdates: statsMutations.hasPendingItems() || alertsMutations.hasPendingItems(),
    
    // Retry operations
    retryFailedStats: statsMutations.retryAllFailed,
    retryFailedAlerts: alertsMutations.retryAllFailed,
    
    // Clear operations
    clearErrors: () => {
      statsMutations.clearErrors();
      alertsMutations.clearErrors();
    }
  };
}
