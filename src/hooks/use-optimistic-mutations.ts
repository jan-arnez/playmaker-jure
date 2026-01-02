"use client";

import { useCallback } from 'react';
import { useOptimisticMutations as useBaseOptimisticMutations } from './use-optimistic-updates';

export interface MutationOptions {
  successMessage?: string;
  errorMessage?: string;
  autoRollback?: boolean;
  rollbackDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRollback?: (data: any) => void;
}

/**
 * Enhanced optimistic mutations hook with additional utilities
 */
export function useOptimisticMutations<T extends { id: string }>(
  initialData: T[] = [],
  options: MutationOptions = {}
) {
  const baseMutations = useBaseOptimisticMutations(initialData, options);

  const batchCreate = useCallback(async (
    items: T[],
    apiCall: (items: T[]) => Promise<any[]>
  ) => {
    const optimisticIds: string[] = [];
    
    // Add all items optimistically
    for (const item of items) {
      const id = baseMutations.addOptimistic(item);
      optimisticIds.push(id);
    }

    try {
      const results = await apiCall(items);
      
      // Remove optimistic items and add real results
      optimisticIds.forEach(id => baseMutations.removeOptimistic(id));
      
      return results;
    } catch (error) {
      // Rollback all optimistic items
      optimisticIds.forEach(id => baseMutations.rollbackOptimistic(id));
      throw error;
    }
  }, [baseMutations]);

  const batchUpdate = useCallback(async (
    updates: Array<{ id: string; data: Partial<T> }>,
    apiCall: (updates: Array<{ id: string; data: Partial<T> }>) => Promise<any[]>
  ) => {
    const originalData = new Map<string, T>();
    
    // Store original data and apply optimistic updates
    for (const update of updates) {
      const item = baseMutations.getOptimisticItem(update.id);
      if (item) {
        originalData.set(update.id, item.data);
        baseMutations.updateOptimistic(update.id, update.data);
      }
    }

    try {
      const results = await apiCall(updates);
      return results;
    } catch (error) {
      // Rollback to original data
      for (const [id, original] of originalData) {
        baseMutations.updateOptimistic(id, original);
      }
      throw error;
    }
  }, [baseMutations]);

  const batchDelete = useCallback(async (
    ids: string[],
    apiCall: (ids: string[]) => Promise<any>
  ) => {
    const originalItems = new Map<string, T>();
    
    // Store original data
    for (const id of ids) {
      const item = baseMutations.getOptimisticItem(id);
      if (item) {
        originalItems.set(id, item.data);
      }
    }

    try {
      const result = await apiCall(ids);
      
      // Remove all items
      ids.forEach(id => baseMutations.removeOptimistic(id));
      
      return result;
    } catch (error) {
      // Restore all items
      for (const [id, original] of originalItems) {
        baseMutations.addOptimistic(original);
      }
      throw error;
    }
  }, [baseMutations]);

  const optimisticUpdate = useCallback(async (
    id: string,
    updates: Partial<T>,
    apiCall: (id: string, updates: Partial<T>) => Promise<any>
  ) => {
    const originalItem = baseMutations.getOptimisticItem(id);
    if (!originalItem) return;

    // Store original data
    const originalData = { ...originalItem.data };
    
    // Apply optimistic update
    baseMutations.updateOptimistic(id, updates);

    try {
      const result = await apiCall(id, updates);
      return result;
    } catch (error) {
      // Rollback to original data
      baseMutations.updateOptimistic(id, originalData);
      throw error;
    }
  }, [baseMutations]);

  const optimisticCreate = useCallback(async (
    data: T,
    apiCall: (data: T) => Promise<any>
  ) => {
    const id = baseMutations.addOptimistic(data);

    try {
      const result = await apiCall(data);
      baseMutations.removeOptimistic(id);
      return result;
    } catch (error) {
      baseMutations.rollbackOptimistic(id);
      throw error;
    }
  }, [baseMutations]);

  const optimisticDelete = useCallback(async (
    id: string,
    apiCall: (id: string) => Promise<any>
  ) => {
    const item = baseMutations.getOptimisticItem(id);
    if (!item) return;

    const originalData = { ...item.data };
    
    // Remove optimistically
    baseMutations.removeOptimistic(id);

    try {
      const result = await apiCall(id);
      return result;
    } catch (error) {
      // Restore item
      baseMutations.addOptimistic(originalData);
      throw error;
    }
  }, [baseMutations]);

  const retryFailed = useCallback(async (
    id: string,
    apiCall: (data: T) => Promise<any>
  ) => {
    const item = baseMutations.getOptimisticItem(id);
    if (!item || item.status !== 'error') return;

    // Reset status and retry
    baseMutations.updateOptimistic(id, { ...item.data });

    try {
      const result = await apiCall(item.data);
      baseMutations.removeOptimistic(id);
      return result;
    } catch (error) {
      throw error;
    }
  }, [baseMutations]);

  const retryAllFailed = useCallback(async (
    apiCall: (data: T) => Promise<any>
  ) => {
    const failedItems = baseMutations.data.filter(item => 
      baseMutations.isOptimistic(item.id) && 
      baseMutations.getOptimisticItem(item.id)?.status === 'error'
    );

    const results = [];
    for (const item of failedItems) {
      try {
        const result = await retryFailed(item.id, apiCall);
        results.push(result);
      } catch (error) {
        // Continue with other items
        console.error(`Failed to retry item ${item.id}:`, error);
      }
    }

    return results;
  }, [baseMutations, retryFailed]);

  const getFailedItems = useCallback(() => {
    return baseMutations.data.filter((item: any) => 
      baseMutations.isOptimistic(item.id) && 
      baseMutations.getOptimisticItem(item.id)?.status === 'error'
    );
  }, [baseMutations]);

  const getPendingItems = useCallback(() => {
    return baseMutations.data.filter((item: any) => 
      baseMutations.isOptimistic(item.id) && 
      baseMutations.getOptimisticItem(item.id)?.status === 'pending'
    );
  }, [baseMutations]);

  const getSuccessItems = useCallback(() => {
    return baseMutations.data.filter((item: any) => 
      baseMutations.isOptimistic(item.id) && 
      baseMutations.getOptimisticItem(item.id)?.status === 'success'
    );
  }, [baseMutations]);

  const hasFailedItems = useCallback(() => {
    return getFailedItems().length > 0;
  }, [getFailedItems]);

  const hasPendingItems = useCallback(() => {
    return getPendingItems().length > 0;
  }, [getPendingItems]);

  const getOptimisticCount = useCallback(() => {
    return baseMutations.data.filter((item: any) => baseMutations.isOptimistic(item.id)).length;
  }, [baseMutations]);

  return {
    ...baseMutations,
    
    // Batch operations
    batchCreate,
    batchUpdate,
    batchDelete,
    
    // Enhanced optimistic operations
    optimisticUpdate,
    optimisticCreate,
    optimisticDelete,
    
    // Retry operations
    retryFailed,
    retryAllFailed,
    
    // Status queries
    getFailedItems,
    getPendingItems,
    getSuccessItems,
    hasFailedItems,
    hasPendingItems,
    getOptimisticCount
  };
}