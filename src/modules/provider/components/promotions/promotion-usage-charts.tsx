"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

interface PromotionUsageChartsProps {
  promotions: Array<{
    id: string;
    name: string;
    usageCount: number;
    discountValue: number;
    discountType: "percentage" | "fixed";
    createdAt: string;
    usageByDay?: Record<string, number>;
  }>;
}

export function PromotionUsageCharts({
  promotions,
}: PromotionUsageChartsProps) {
  const [selectedPromotion, setSelectedPromotion] = useState<string>("all");
  const [chartType, setChartType] = useState<"usage" | "discount">("usage");

  // Prepare data for charts
  const usageOverTimeData = promotions
    .filter((p) => selectedPromotion === "all" || p.id === selectedPromotion)
    .map((promo) => ({
      name: promo.name.length > 20 ? promo.name.substring(0, 20) + "..." : promo.name,
      usage: promo.usageCount,
      discount: promo.discountValue,
      date: new Date(promo.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Usage by promotion
  const usageByPromotion = promotions
    .map((promo) => ({
      name: promo.name.length > 15 ? promo.name.substring(0, 15) + "..." : promo.name,
      usage: promo.usageCount,
      discount: promo.discountValue,
    }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10); // Top 10

  // Daily usage data (if available)
  const dailyUsageData: Array<{ date: string; usage: number }> = [];
  promotions.forEach((promo) => {
    if (promo.usageByDay) {
      Object.entries(promo.usageByDay).forEach(([date, count]) => {
        const existing = dailyUsageData.find((d) => d.date === date);
        if (existing) {
          existing.usage += count;
        } else {
          dailyUsageData.push({ date, usage: count });
        }
      });
    }
  });
  dailyUsageData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Promotion</label>
              <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Promotions</SelectItem>
                  {promotions.map((promo) => (
                    <SelectItem key={promo.id} value={promo.id}>
                      {promo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={(v: "usage" | "discount") => setChartType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Usage</SelectItem>
                  <SelectItem value="discount">Discount Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
          <CardDescription>
            Promotion usage trends {selectedPromotion !== "all" ? "for selected promotion" : "across all promotions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageOverTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={chartType === "usage" ? "usage" : "discount"}
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name={chartType === "usage" ? "Usage Count" : "Discount Value"}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Promotions by Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Top Promotions by Usage</CardTitle>
          <CardDescription>Most used promotions</CardDescription>
        </CardHeader>
        <CardContent>
          {usageByPromotion.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageByPromotion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#8884d8" name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Usage Chart */}
      {dailyUsageData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
            <CardDescription>Promotion usage by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#00C49F" name="Daily Usage" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

