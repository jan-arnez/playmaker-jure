"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

export interface OptimisticFormOptions {
  successMessage?: string;
  errorMessage?: string;
  autoReset?: boolean;
  resetDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onReset?: () => void;
}

export interface OptimisticFormResult<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  submit: (data?: T) => Promise<any>;
  isSubmitting: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
  clearMessage: () => void;
  reset: () => void;
  isDirty: boolean;
  hasErrors: boolean;
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  validate: (data: T) => Record<string, string>;
  isValid: boolean;
}

/**
 * Enhanced optimistic form hook with validation and error handling
 */
export function useOptimisticForm<T>(
  initialData: T,
  apiCall: (data: T) => Promise<any>,
  options: OptimisticFormOptions = {}
): OptimisticFormResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState<T>(initialData);
  
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validate = useCallback((formData: T): Record<string, string> => {
    // Basic validation - can be extended with specific validation rules
    const validationErrors: Record<string, string> = {};
    
    // Check for required fields (basic implementation)
    if (typeof formData === 'object' && formData !== null) {
      Object.entries(formData).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          validationErrors[key] = `${key} is required`;
        }
      });
    }
    
    return validationErrors;
  }, []);

  const submit = useCallback(async (submitData?: T) => {
    const formData = submitData || data;
    const validationErrors = validate(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrors({});

    try {
      const result = await apiCall(formData);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      if (options.successMessage) {
        setMessage({ type: 'success', text: options.successMessage });
      }

      // Auto reset if enabled
      if (options.autoReset && options.resetDelay) {
        resetTimeoutRef.current = setTimeout(() => {
          reset();
        }, options.resetDelay);
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
  }, [data, apiCall, options, validate]);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  const reset = useCallback(() => {
    setData(originalData);
    setMessage(null);
    setErrors({});
    setIsDirty(false);
    
    if (options.onReset) {
      options.onReset();
    }
  }, [originalData, options]);

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleSetData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(newData);
    setIsDirty(true);
  }, []);

  const hasErrors = Object.keys(errors).length > 0;
  const isValid = !hasErrors && !isSubmitting;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    setData: handleSetData,
    submit,
    isSubmitting,
    message,
    clearMessage,
    reset,
    isDirty,
    hasErrors,
    errors,
    setError,
    clearError,
    clearAllErrors,
    validate,
    isValid
  };
}

/**
 * Optimistic form with field-level validation
 */
export function useOptimisticFormWithValidation<T>(
  initialData: T,
  apiCall: (data: T) => Promise<any>,
  validationRules: Record<string, (value: any) => string | null>,
  options: OptimisticFormOptions = {}
): OptimisticFormResult<T> {
  const form = useOptimisticForm(initialData, apiCall, options);

  const validate = useCallback((formData: T): Record<string, string> => {
    const validationErrors: Record<string, string> = {};
    
    if (typeof formData === 'object' && formData !== null) {
      Object.entries(formData).forEach(([key, value]) => {
        const rule = validationRules[key];
        if (rule) {
          const error = rule(value);
          if (error) {
            validationErrors[key] = error;
          }
        }
      });
    }
    
    return validationErrors;
  }, [validationRules]);

  return {
    ...form,
    validate
  };
}

/**
 * Optimistic form with debounced validation
 */
export function useOptimisticFormWithDebounce<T>(
  initialData: T,
  apiCall: (data: T) => Promise<any>,
  options: OptimisticFormOptions & { debounceMs?: number } = {}
): OptimisticFormResult<T> {
  const [debouncedData, setDebouncedData] = useState<T>(initialData);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useOptimisticForm(initialData, apiCall, options);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedData(form.data);
    }, options.debounceMs || 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [form.data, options.debounceMs]);

  return {
    ...form,
    data: debouncedData
  };
}

/**
 * Optimistic form with auto-save functionality
 */
export function useOptimisticFormWithAutoSave<T>(
  initialData: T,
  apiCall: (data: T) => Promise<any>,
  options: OptimisticFormOptions & { autoSaveMs?: number } = {}
): OptimisticFormResult<T> & { isAutoSaving: boolean; lastSaved: Date | null } {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useOptimisticForm(initialData, apiCall, options);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    if (form.isDirty && !form.isSubmitting) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        setIsAutoSaving(true);
        try {
          await form.submit();
          setLastSaved(new Date());
        } catch (error) {
          // Auto-save errors are handled silently
          console.warn('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }, options.autoSaveMs || 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form.data, form.isDirty, form.isSubmitting, options.autoSaveMs]);

  return {
    ...form,
    isAutoSaving,
    lastSaved
  };
}
