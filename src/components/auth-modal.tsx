"use client";

import React, { useState, createContext, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { authClient } from '@/modules/auth/lib/auth-client';
import { GoogleButton } from '@/modules/auth/components/google-button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Mail, 
  Lock, 
  User, 
  Shield, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

// Context for managing auth modal state globally
interface AuthModalContextType {
  isOpen: boolean;
  mode: 'login' | 'signup';
  intendedPath: string | null;
  openLogin: () => void;
  openSignup: () => void;
  openLoginWithRedirect: (path: string) => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [intendedPath, setIntendedPath] = useState<string | null>(null);

  const openLogin = useCallback(() => {
    setMode('login');
    setIntendedPath(null);
    setIsOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setMode('signup');
    setIntendedPath(null);
    setIsOpen(true);
  }, []);

  const openLoginWithRedirect = useCallback((path: string) => {
    setMode('login');
    setIntendedPath(path);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIntendedPath(null);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, intendedPath, openLogin, openSignup, openLoginWithRedirect, close }}>
      {children}
      <AuthModal 
        isOpen={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setIntendedPath(null);
        }} 
        defaultMode={mode}
        intendedPath={intendedPath}
      />
    </AuthModalContext.Provider>
  );
}

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'signup';
  intendedPath?: string | null;
}

export function AuthModal({ isOpen, onOpenChange, defaultMode = 'login', intendedPath }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  
  // Reset mode and form when modal opens/closes
  React.useEffect(() => {
    setIsLogin(defaultMode === 'login');
    if (isOpen) {
      setError(null);
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [defaultMode, isOpen]);

  // Handle role-based redirect after successful login
  const handleSuccessfulLogin = useCallback(async () => {
    onOpenChange(false);
    
    // Get the fresh session to check user role
    const session = await authClient.getSession();
    const user = session?.data?.user;
    
    if (!user) {
      // If no user, just close the modal
      router.refresh();
      return;
    }
    
    // Check user role and intended path
    const userRole = user.role;
    
    // Admin users go to admin dashboard
    if (userRole === 'admin') {
      if (intendedPath?.startsWith('/admin')) {
        router.push(intendedPath, { locale });
      } else {
        router.push('/admin', { locale });
      }
      return;
    }
    
    // If there's an intended path for provider, check if user has access
    if (intendedPath?.startsWith('/provider')) {
      router.push(intendedPath, { locale });
      return;
    }
    
    // If there's any other intended path, redirect there
    if (intendedPath && intendedPath !== pathname) {
      router.push(intendedPath, { locale });
      return;
    }
    
    // Default: stay on current page (just refresh)
    router.refresh();
  }, [onOpenChange, intendedPath, router, locale, pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        const errorMessage = result.error.message 
          || (result.error as any).body?.message 
          || result.error.statusText 
          || 'Login failed';
          
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success('Login successful!');
      await handleSuccessfulLogin();
    } catch (err) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        // Try to get the most specific error message
        const errorMessage = result.error.message 
          || (result.error as any).body?.message 
          || result.error.statusText 
          || 'Signup failed';
          
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success('Account created successfully!');
      await handleSuccessfulLogin();
    } catch (err) {
      console.error('Signup error:', err);
      // Try to extract message from error object if it exists
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoginFormValid = email && password;
  const isSignupFormValid = name && email && password;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLogin 
              ? 'Enter your credentials to access your account'
              : 'Create a new account to get started'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Google SSO */}
        <div className="mt-4">
          <GoogleButton context={isLogin ? 'login' : 'signup'} />
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Signup Name Field */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </Label>
              <Input
                id="modal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="modal-email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email Address</span>
            </Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="modal-password" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Password</span>
            </Label>
            <div className="relative">
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
          <Button
            type="submit"
            disabled={isLoading || (isLogin ? !isLoginFormValid : !isSignupFormValid)}
            className="w-full h-11"
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
          </Button>

          {/* Toggle Form */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              disabled={isLoading}
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
