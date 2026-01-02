"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOptimisticForm } from './use-optimistic-updates';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'provider';
  emailVerified: boolean;
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOptimistic: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

/**
 * Optimistic authentication hook
 */
export function useOptimisticAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isOptimistic: false
  });

  const loginForm = useOptimisticForm<LoginData>(
    { email: '', password: '' },
    async (data) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      return result;
    },
    {
      successMessage: 'Login successful!',
      errorMessage: 'Login failed. Please check your credentials.',
      onSuccess: (result) => {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          isOptimistic: false
        });
      },
      onError: (error) => {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isOptimistic: false
        }));
      }
    }
  );

  const signupForm = useOptimisticForm<SignupData>(
    { name: '', email: '', password: '' },
    async (data) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const result = await response.json();
      return result;
    },
    {
      successMessage: 'Account created successfully!',
      errorMessage: 'Signup failed. Please try again.',
      onSuccess: (result) => {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          isOptimistic: false
        });
      },
      onError: (error) => {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isOptimistic: false
        }));
      }
    }
  );

  const login = useCallback(async (data: LoginData) => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      isOptimistic: true
    }));

    try {
      const result = await loginForm.submit(data);
      return result;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isOptimistic: false
      }));
      throw error;
    }
  }, [loginForm]);

  const signup = useCallback(async (data: SignupData) => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      isOptimistic: true
    }));

    try {
      const result = await signupForm.submit(data);
      return result;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isOptimistic: false
      }));
      throw error;
    }
  }, [signupForm]);

  const logout = useCallback(async () => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      isOptimistic: true
    }));

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isOptimistic: false
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isOptimistic: false
      }));
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!authState.user) return;

    setAuthState(prev => ({
      ...prev,
      isOptimistic: true
    }));

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const result = await response.json();
      
      setAuthState(prev => ({
        ...prev,
        user: result.user,
        isOptimistic: false
      }));

      return result.user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isOptimistic: false
      }));
      throw error;
    }
  }, [authState.user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setAuthState(prev => ({
      ...prev,
      isOptimistic: true
    }));

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        throw new Error('Password change failed');
      }

      setAuthState(prev => ({
        ...prev,
        isOptimistic: false
      }));

      return { success: true };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isOptimistic: false
      }));
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setAuthState(prev => ({
      ...prev,
      isOptimistic: true
    }));

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Account deletion failed');
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isOptimistic: false
      });

      return { success: true };
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isOptimistic: false
      }));
      throw error;
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const result = await response.json();
          setAuthState({
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            isOptimistic: false
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isOptimistic: false
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isOptimistic: false
        });
      }
    };

    checkAuth();
  }, []);

  return {
    // Auth state
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isOptimistic: authState.isOptimistic,
    
    // Auth operations
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    
    // Form states
    loginForm: {
      data: loginForm.formData,
      setData: loginForm.setFormData,
      submit: loginForm.submit,
      isSubmitting: loginForm.isSubmitting,
      message: loginForm.message,
      clearMessage: loginForm.clearMessage
    },
    signupForm: {
      data: signupForm.formData,
      setData: signupForm.setFormData,
      submit: signupForm.submit,
      isSubmitting: signupForm.isSubmitting,
      message: signupForm.message,
      clearMessage: signupForm.clearMessage
    }
  };
}