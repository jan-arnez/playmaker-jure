"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompactStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period?: string;
  };
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  onClick?: () => void;
  className?: string;
}

export function CompactStatCard({
  title,
  value,
  description,
  icon: Icon,
  color = "text-gray-600",
  bgColor = "bg-gray-100",
  trend,
  subtitle,
  badge,
  onClick,
  className = "",
}: CompactStatCardProps) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  const formatTrendValue = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(1)}k`;
    }
    return absValue.toFixed(1);
  };

  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 truncate">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-gray-900 truncate">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center text-xs ${getTrendColor(trend.direction)}`}>
              {getTrendIcon(trend.direction)}
              <span className="ml-1">
                {formatTrendValue(trend.value)}%
              </span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 truncate">
            {description}
          </p>
        )}
        
        {subtitle && (
          <p className="text-xs text-gray-600 font-medium">
            {subtitle}
          </p>
        )}
        
        {trend?.period && (
          <p className="text-xs text-gray-400">
            vs {trend.period}
          </p>
        )}
        
        {badge && (
          <div className="pt-1">
            <Badge variant={badge.variant || "secondary"} className="text-xs">
              {badge.text}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preset configurations for common stat types
export const StatCardPresets = {
  revenue: {
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  bookings: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  occupancy: {
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  rating: {
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  facilities: {
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  team: {
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  pending: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  active: {
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
} as const;
