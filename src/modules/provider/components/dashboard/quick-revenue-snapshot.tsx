"use client";

import { Euro, TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface RevenueData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastWeek?: number;
  lastMonth?: number;
}

interface QuickRevenueSnapshotProps {
  revenue: RevenueData;
  currency?: string;
  showTrends?: boolean;
  onViewDetails?: () => void;
}

export function QuickRevenueSnapshot({
  revenue,
  currency = "EUR",
  showTrends = true,
  onViewDetails,
}: QuickRevenueSnapshotProps) {
  const t = useTranslations("ProviderModule.dashboard");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTrend = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      direction: percentage >= 0 ? "up" : "down",
      isSignificant: Math.abs(percentage) >= 5,
    };
  };

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

  const getTrendColor = (direction: string, isSignificant: boolean) => {
    if (!isSignificant) return "text-gray-500";
    return direction === "up" ? "text-green-600" : "text-red-600";
  };

  const weekTrend = calculateTrend(revenue.thisWeek, revenue.lastWeek);
  const monthTrend = calculateTrend(revenue.thisMonth, revenue.lastMonth);

  const revenueItems = [
    {
      period: "Today",
      amount: revenue.today,
      icon: Calendar,
      trend: null,
      description: "Current day revenue",
    },
    {
      period: "This Week",
      amount: revenue.thisWeek,
      icon: TrendingUp,
      trend: weekTrend,
      description: "Week to date",
    },
    {
      period: "This Month",
      amount: revenue.thisMonth,
      icon: DollarSign,
      trend: monthTrend,
      description: "Month to date",
    },
  ];

  const totalRevenue = revenue.today + revenue.thisWeek + revenue.thisMonth;
  const averageDaily = revenue.thisWeek / 7;
  const averageWeekly = revenue.thisMonth / 4;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Euro className="h-5 w-5 mr-2 text-green-600" />
          Revenue Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Revenue Items */}
          <div className="space-y-3">
            {revenueItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.period}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.period}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.amount)}
                    </div>
                    {showTrends && item.trend && (
                      <div className={`flex items-center text-xs ${getTrendColor(item.trend.direction, item.trend.isSignificant)}`}>
                        {getTrendIcon(item.trend.direction)}
                        <span className="ml-1">
                          {item.trend.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Daily</div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(averageDaily)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Weekly</div>
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(averageWeekly)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Quick Insights
              </div>
              <div className="space-y-1">
                {revenue.today > averageDaily && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Today is above daily average
                  </div>
                )}
                {revenue.thisWeek > averageWeekly && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    This week is above weekly average
                  </div>
                )}
                {revenue.today === 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Minus className="h-3 w-3 mr-1" />
                    No revenue today yet
                  </div>
                )}
                {revenue.thisWeek === 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Minus className="h-3 w-3 mr-1" />
                    No revenue this week yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {onViewDetails && (
            <div className="pt-4">
              <button
                onClick={onViewDetails}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Detailed Analytics →
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
