"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface OptimisticUpdate<T> {
  id: string;
  data: T;
  isOptimistic: boolean;
  timestamp: number;
  originalData?: T;
  error?: string;
  status: 'pending' | 'success' | 'error' | 'rollback';
}

export interface OptimisticUpdateOptions {
  successMessage?: string;
  errorMessage?: string;
  autoRollback?: boolean;
  rollbackDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRollback?: (data: any) => void;
}

export interface OptimisticUpdateResult<T> {
  data: T[];
  addOptimistic: (data: T) => string;
  updateOptimistic: (id: string, updates: Partial<T>) => void;
  removeOptimistic: (id: string) => void;
  rollbackOptimistic: (id: string) => void;
  rollbackAll: () => void;
  isOptimistic: (id: string) => boolean;
  getOptimisticItem: (id: string) => OptimisticUpdate<T> | undefined;
  clearErrors: () => void;
}

/**
 * Universal optimistic update hook for any data type
 */
export function useOptimisticUpdate<T>(
  initialData: T[] = [],
  options: OptimisticUpdateOptions = {}
): OptimisticUpdateResult<T> {
  const updateIdRef = useRef(0);
  const rollbackTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateId = () => {
    return `optimistic_${Date.now()}_${++updateIdRef.current}`;
  };

  const [data, setData] = useState<OptimisticUpdate<T>[]>(
    initialData.map(item => ({
      id: generateId(),
      data: item,
      isOptimistic: false,
      timestamp: Date.now(),
      status: 'success'
    }))
  );

  const addOptimistic = useCallback((newData: T): string => {
    const id = generateId();
    const optimisticUpdate: OptimisticUpdate<T> = {
      id,
      data: newData,
      isOptimistic: true,
      timestamp: Date.now(),
      status: 'pending'
    };

    setData(prev => [...prev, optimisticUpdate]);

    // Auto-rollback if enabled
    if (options.autoRollback && options.rollbackDelay) {
      const timeout = setTimeout(() => {
        rollbackOptimistic(id);
      }, options.rollbackDelay);
      rollbackTimeouts.current.set(id, timeout);
    }

    return id;
  }, [options.autoRollback, options.rollbackDelay]);

  const updateOptimistic = useCallback((id: string, updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, data: { ...item.data, ...updates } }
        : item
    ));
  }, []);

  const removeOptimistic = useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
    
    // Clear any pending rollback timeout
    const timeout = rollbackTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      rollbackTimeouts.current.delete(id);
    }
  }, []);

  const rollbackOptimistic = useCallback((id: string) => {
    setData(prev => prev.map(item => 
      item.id === id 
        ? { ...item, isOptimistic: false, status: 'rollback' }
        : item
    ));

    // Clear any pending rollback timeout
    const timeout = rollbackTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      rollbackTimeouts.current.delete(id);
    }

    // Call rollback callback
    const item = data.find(d => d.id === id);
    if (item && options.onRollback) {
      options.onRollback(item.data);
    }
  }, [data, options.onRollback]);

  const rollbackAll = useCallback(() => {
    setData(prev => prev.map(item => 
      item.isOptimistic 
        ? { ...item, isOptimistic: false, status: 'rollback' }
        : item
    ));

    // Clear all rollback timeouts
    rollbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    rollbackTimeouts.current.clear();
  }, []);

  const isOptimistic = useCallback((id: string): boolean => {
    return data.some(item => item.id === id && item.isOptimistic);
  }, [data]);

  const getOptimisticItem = useCallback((id: string): OptimisticUpdate<T> | undefined => {
    return data.find(item => item.id === id);
  }, [data]);

  const clearErrors = useCallback(() => {
    setData(prev => prev.map(item => 
      item.status === 'error' 
        ? { ...item, status: 'success', error: undefined }
        : item
    ));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      rollbackTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    data: data.map(item => item.data),
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    rollbackOptimistic,
    rollbackAll,
    isOptimistic,
    getOptimisticItem,
    clearErrors
  };
}

/**
 * Optimistic form submission hook
 */
export function useOptimisticForm<T>(
  initialData: T,
  apiCall: (data: T) => Promise<any>,
  options: OptimisticUpdateOptions = {}
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submit = useCallback(async (data: T) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await apiCall(data);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      if (options.successMessage) {
        setMessage({ type: 'success', text: options.successMessage });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage));
      }

      if (options.errorMessage) {
        setMessage({ type: 'error', text: options.errorMessage });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiCall, options]);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    formData,
    setFormData,
    submit,
    isSubmitting,
    message,
    clearMessage
  };
}

/**
 * Optimistic mutation hook for generic operations
 */
export function useOptimisticMutations<T>(
  initialData: T[] = [],
  options: OptimisticUpdateOptions = {}
) {
  const optimisticUpdate = useOptimisticUpdate(initialData, options);

  const create = useCallback(async (
    data: T,
    apiCall: (data: T) => Promise<any>
  ) => {
    const id = optimisticUpdate.addOptimistic(data);
    
    try {
      const result = await apiCall(data);
      optimisticUpdate.removeOptimistic(id);
      return result;
    } catch (error) {
      optimisticUpdate.rollbackOptimistic(id);
      throw error;
    }
  }, [optimisticUpdate]);

  const update = useCallback(async (
    id: string,
    updates: Partial<T>,
    apiCall: (id: string, updates: Partial<T>) => Promise<any>
  ) => {
    const originalItem = optimisticUpdate.getOptimisticItem(id);
    if (!originalItem) return;

    optimisticUpdate.updateOptimistic(id, updates);
    
    try {
      const result = await apiCall(id, updates);
      return result;
    } catch (error) {
      // Rollback to original data
      if (originalItem.originalData) {
        optimisticUpdate.updateOptimistic(id, originalItem.originalData);
      }
      throw error;
    }
  }, [optimisticUpdate]);

  const remove = useCallback(async (
    id: string,
    apiCall: (id: string) => Promise<any>
  ) => {
    const item = optimisticUpdate.getOptimisticItem(id);
    if (!item) return;

    // Store original data for potential rollback
    const originalData = { ...item.data };
    
    try {
      const result = await apiCall(id);
      optimisticUpdate.removeOptimistic(id);
      return result;
    } catch (error) {
      // Restore item if deletion failed
      optimisticUpdate.addOptimistic(originalData);
      throw error;
    }
  }, [optimisticUpdate]);

  return {
    ...optimisticUpdate,
    create,
    update,
    remove
  };
}