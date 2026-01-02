"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface PromotionAnalyticsProps {
  organizationId: string;
  promotionId?: string;
}

interface AnalyticsData {
  promotions: Array<{
    promotionId: string;
    promotionName: string;
    totalUsage: number;
    totalDiscountGiven: number;
    estimatedRevenueImpact: number;
    estimatedBookingsGenerated: number;
    averageDiscountPerUse: number;
    usageByDay: Record<string, number>;
    usageByFacility: Record<string, { count: number; discount: number }>;
    conversionRate: number | null;
    facilities: Array<{ id: string; name: string }>;
    discountType: string;
    discountValue: number;
    status: string;
  }>;
  overall: {
    totalPromotions: number;
    totalUsage: number;
    totalDiscountGiven: number;
    totalEstimatedRevenue: number;
    averageDiscountPerPromotion: number;
    mostUsedPromotion: {
      promotionName: string;
      totalUsage: number;
    } | null;
  };
}

export function PromotionAnalytics({
  organizationId,
  promotionId,
}: PromotionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    promotionId: promotionId || "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, [organizationId, filters]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        organizationId,
        ...(filters.promotionId && filters.promotionId !== "all" && { promotionId: filters.promotionId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/promotions/analytics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
          <CardDescription>Filter analytics by date range and promotion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotion">Promotion (All)</Label>
              <Select
                value={filters.promotionId}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, promotionId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All promotions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Promotions</SelectItem>
                  {analytics.promotions.map((promo) => (
                    <SelectItem key={promo.promotionId} value={promo.promotionId}>
                      {promo.promotionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Discount Given
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{analytics.overall.totalDiscountGiven.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all promotions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Estimated Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{analytics.overall.totalEstimatedRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From promoted bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Usage
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.overall.totalUsage}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Times redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Discount/Promotion
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{analytics.overall.averageDiscountPerPromotion.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per promotion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Promotion Analytics */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Promotion Performance</h2>
        <div className="grid gap-4">
          {analytics.promotions.map((promo) => (
            <Card key={promo.promotionId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{promo.promotionName}</CardTitle>
                  <span className="text-sm text-gray-500">
                    {promo.discountType === "percentage"
                      ? `${promo.discountValue}%`
                      : `€${promo.discountValue}`}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Usage</p>
                    <p className="text-lg font-semibold">{promo.totalUsage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discount Given</p>
                    <p className="text-lg font-semibold text-green-600">
                      €{promo.totalDiscountGiven.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Est. Revenue</p>
                    <p className="text-lg font-semibold text-blue-600">
                      €{promo.estimatedRevenueImpact.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Discount</p>
                    <p className="text-lg font-semibold">
                      €{promo.averageDiscountPerUse.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Usage by Facility */}
                {Object.keys(promo.usageByFacility).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Usage by Facility
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(promo.usageByFacility).map(([facility, data]) => (
                        <div
                          key={facility}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span className="text-sm">{facility}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">
                              {data.count} uses
                            </span>
                            <span className="text-green-600 font-medium">
                              €{data.discount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

