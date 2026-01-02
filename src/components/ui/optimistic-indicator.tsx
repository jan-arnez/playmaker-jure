"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface OptimisticIndicatorProps {
  isOptimistic?: boolean;
  status?: 'pending' | 'success' | 'error' | 'rollback';
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'outline';
}

export function OptimisticIndicator({
  isOptimistic = false,
  status = 'pending',
  children,
  className,
  showIcon = true,
  showText = false,
  size = 'md',
  variant = 'default'
}: OptimisticIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="animate-spin" />;
      case 'success':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <XCircle className="text-red-500" />;
      case 'rollback':
        return <AlertTriangle className="text-yellow-500" />;
      default:
        return <Clock className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Processing...';
      case 'success':
        return 'Success';
      case 'error':
        return 'Failed';
      case 'rollback':
        return 'Rolling back...';
      default:
        return 'Ready';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'subtle':
        return 'opacity-75';
      case 'outline':
        return 'border border-gray-200';
      default:
        return '';
    }
  };

  const getStatusClasses = () => {
    if (!isOptimistic) return '';
    
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'rollback':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        isOptimistic && 'border-2',
        getStatusClasses(),
        getVariantClasses(),
        className
      )}
    >
      {children}
      
      {isOptimistic && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-lg border">
            {showIcon && (
              <div className={cn('flex-shrink-0', getSizeClasses())}>
                {getStatusIcon()}
              </div>
            )}
            {showText && (
              <span className={cn('font-medium text-gray-700', getSizeClasses())}>
                {getStatusText()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface OptimisticBadgeProps {
  isOptimistic?: boolean;
  status?: 'pending' | 'success' | 'error' | 'rollback';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OptimisticBadge({
  isOptimistic = false,
  status = 'pending',
  children,
  className,
  size = 'md'
}: OptimisticBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'md':
        return 'text-sm px-3 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-1';
    }
  };

  const getStatusClasses = () => {
    if (!isOptimistic) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rollback':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-all duration-200',
        getSizeClasses(),
        getStatusClasses(),
        isOptimistic && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}

interface OptimisticButtonProps {
  isOptimistic?: boolean;
  status?: 'pending' | 'success' | 'error' | 'rollback';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  type?: "button" | "submit" | "reset";
}

export function OptimisticButton({
  isOptimistic = false,
  status = 'pending',
  children,
  className,
  disabled = false,
  onClick,
  variant = 'default',
  size = 'md',
  type
}: OptimisticButtonProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs';
      case 'md':
        return 'h-10 px-4 text-sm';
      case 'lg':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'destructive':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'outline':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
      case 'secondary':
        return 'bg-gray-100 text-gray-900 hover:bg-gray-200';
      case 'ghost':
        return 'text-gray-700 hover:bg-gray-100';
      case 'link':
        return 'text-blue-600 hover:text-blue-800 underline';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getStatusClasses = () => {
    if (!isOptimistic) return '';
    
    switch (status) {
      case 'pending':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'rollback':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return '';
    }
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
        getSizeClasses(),
        getVariantClasses(),
        getStatusClasses(),
        isOptimistic && 'animate-pulse',
        className
      )}
      disabled={disabled || isOptimistic}
      onClick={onClick}
      type={type}
    >
      {isOptimistic && status === 'pending' && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  );
}

interface OptimisticListProps {
  items: Array<{
    id: string;
    isOptimistic?: boolean;
    status?: 'pending' | 'success' | 'error' | 'rollback';
    data: any;
  }>;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function OptimisticList({
  items,
  renderItem,
  className,
  emptyMessage = 'No items found'
}: OptimisticListProps) {
  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <OptimisticIndicator
          key={item.id}
          isOptimistic={item.isOptimistic}
          status={item.status}
        >
          {renderItem(item.data, index)}
        </OptimisticIndicator>
      ))}
    </div>
  );
}