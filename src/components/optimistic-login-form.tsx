"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimisticButton, OptimisticIndicator } from '@/components/ui/optimistic-indicator';
import { useOptimisticAuth } from '@/hooks/use-optimistic-auth';
import { 
  Mail, 
  Lock, 
  User, 
  Shield, 
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface OptimisticLoginFormProps {
  onLoginSuccess?: (user: any) => void;
  onLoginError?: (error: string) => void;
  onSignupSuccess?: (user: any) => void;
  onSignupError?: (error: string) => void;
}

export function OptimisticLoginForm({
  onLoginSuccess,
  onLoginError,
  onSignupSuccess,
  onSignupError
}: OptimisticLoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    user,
    isAuthenticated,
    isLoading,
    isOptimistic,
    login,
    signup,
    loginForm,
    signupForm
  } = useOptimisticAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.data.email || !loginForm.data.password) {
      return;
    }

    try {
      const result = await login(loginForm.data);
      onLoginSuccess?.(result.user);
    } catch (error) {
      onLoginError?.(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.data.name || !signupForm.data.email || !signupForm.data.password) {
      return;
    }

    try {
      const result = await signup(signupForm.data);
      onSignupSuccess?.(result.user);
    } catch (error) {
      onSignupError?.(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  const isLoginFormValid = loginForm.data.email && loginForm.data.password;
  const isSignupFormValid = signupForm.data.name && signupForm.data.email && signupForm.data.password;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Enter your credentials to access your account'
              : 'Create a new account to get started'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OptimisticIndicator
            isOptimistic={isOptimistic}
            status={isLoading ? 'pending' : 'success'}
          >
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              {/* Success/Error Messages */}
              {(loginForm.message || signupForm.message) && (
                <Alert variant={
                  (loginForm.message || signupForm.message)?.type === 'error' 
                    ? 'destructive' 
                    : 'default'
                }>
                  <AlertDescription>
                    {(loginForm.message || signupForm.message)?.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Signup Name Field */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="name"
                    value={signupForm.data.name}
                    onChange={(e) => signupForm.setData({ ...signupForm.data, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={isLogin ? loginForm.data.email : signupForm.data.email}
                  onChange={(e) => {
                    if (isLogin) {
                      loginForm.setData({ ...loginForm.data, email: e.target.value });
                    } else {
                      signupForm.setData({ ...signupForm.data, email: e.target.value });
                    }
                  }}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={isLogin ? loginForm.data.password : signupForm.data.password}
                    onChange={(e) => {
                      if (isLogin) {
                        loginForm.setData({ ...loginForm.data, password: e.target.value });
                      } else {
                        signupForm.setData({ ...signupForm.data, password: e.target.value });
                      }
                    }}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <OptimisticButton
                type="submit"
                isOptimistic={isLoading}
                status={isLoading ? 'pending' : 'success'}
                disabled={isLogin ? !isLoginFormValid : !isSignupFormValid}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </OptimisticButton>

              {/* Toggle Form */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    loginForm.clearMessage();
                    signupForm.clearMessage();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  disabled={isLoading}
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </form>
          </OptimisticIndicator>
        </CardContent>
      </Card>
    </div>
  );
}
