"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AdvancedOccupancyHeatmap } from "./advanced-occupancy-heatmap";

interface OccupancyAnalyticsProps {
  organizationId: string;
  organizationSlug: string;
  facilities?: Array<{
    id: string;
    name: string;
    sportCategories?: Array<{ id: string; name: string }>;
  }>;
  occupancyAnalytics: {
    courtUtilizationByFacility: Array<{
      id: string;
      name: string;
      totalCourts: number;
      activeCourts: number;
      utilizationRate: number;
    }>;
    heatmapData: Array<
      Array<{ hour: number; day: number; bookings: number; occupancy: number }>
    >;
    facilityPerformance: Array<{
      id: string;
      name: string;
      totalBookings: number;
      totalRevenue: number;
      totalCourts: number;
      avgBookingsPerCourt: number;
      avgRevenuePerCourt: number;
      utilizationRate: number;
    }>;
    underutilizedCourts: Array<{
      id: string;
      name: string;
      bookings: number;
      utilizationPercent: number;
      isUnderutilized: boolean;
    }>;
    underutilizedFacilities: Array<{
      id: string;
      name: string;
      totalCourts: number;
      activeCourts: number;
      utilizationRate: number;
    }>;
  };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type OccupancyViewType =
  | "advanced-heatmap"
  | "court-utilization"
  | "peak-hours-heatmap"
  | "facility-performance"
  | "underutilized";

export function OccupancyAnalytics({
  organizationId,
  organizationSlug,
  facilities = [],
  occupancyAnalytics,
}: OccupancyAnalyticsProps) {
  const t = useTranslations("ProviderModule.analytics.occupancyAnalytics");
  const tGeneral = useTranslations("ProviderModule.analytics");
  
  const [selectedView, setSelectedView] =
    useState<OccupancyViewType>("advanced-heatmap");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart configuration with modern colors
  const utilizationChartConfig = {
    utilizationRate: {
      label: t("utilizationRate"),
      color: "#10b981", // Emerald
    },
  } satisfies ChartConfig;

  // Get color class based on occupancy/utilization
  const getUtilizationColor = (rate: number) => {
    if (rate === 0) return "bg-gray-50 text-gray-400";
    if (rate < 25) return "bg-emerald-100 text-emerald-700";
    if (rate < 50) return "bg-emerald-200 text-emerald-800";
    if (rate < 75) return "bg-amber-200 text-amber-800";
    if (rate < 90) return "bg-orange-200 text-orange-800";
    return "bg-rose-200 text-rose-800";
  };

  const renderChart = () => {
    switch (selectedView) {
      case "advanced-heatmap":
        return (
          <AdvancedOccupancyHeatmap
            organizationId={organizationId}
            organizationSlug={organizationSlug}
            facilities={facilities}
          />
        );
      case "court-utilization":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("courtUtilization")}</CardTitle>
              <CardDescription>
                {t("courtUtilizationDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyAnalytics.courtUtilizationByFacility.length > 0 ? (
                <ChartContainer config={utilizationChartConfig} className="h-[400px] w-full">
                  <BarChart data={occupancyAnalytics.courtUtilizationByFacility} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent 
                          formatter={(value) => `${Number(value).toFixed(1)}%`}
                        />
                      }
                    />
                    <Bar 
                      dataKey="utilizationRate" 
                      fill="var(--color-utilizationRate)" 
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  {tGeneral("noData")}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "peak-hours-heatmap":
        // Keep heatmap as-is per user request
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("peakHoursHeatmap")}</CardTitle>
              <CardDescription>
                {t("peakHoursHeatmapDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    <div className="text-xs font-medium text-gray-600 p-2"></div>
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className="text-xs font-medium text-gray-600 p-2 text-center"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 gap-1">
                      <div className="text-xs text-gray-600 p-2 flex items-center">
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                      {DAYS.map((_, dayIndex) => {
                        const cell = occupancyAnalytics.heatmapData[hour]?.[dayIndex];
                        const occupancy = cell?.occupancy || 0;
                        return (
                          <div
                            key={dayIndex}
                            className={cn(
                              "p-2 text-center text-xs rounded transition-colors",
                              getUtilizationColor(occupancy)
                            )}
                            title={`${DAYS[dayIndex]} ${hour.toString().padStart(2, "0")}:00 - ${occupancy.toFixed(1)}% occupancy - ${cell?.bookings || 0} bookings`}
                          >
                            {occupancy > 0 ? occupancy.toFixed(0) : ""}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 rounded border"></div>
                  <span>0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-100 rounded"></div>
                  <span>1-24%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-200 rounded"></div>
                  <span>25-49%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-200 rounded"></div>
                  <span>50-74%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 rounded"></div>
                  <span>75-89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-rose-200 rounded"></div>
                  <span>90-100%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "facility-performance":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("facilityPerformance")}</CardTitle>
              <CardDescription>
                {t("facilityPerformanceDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {occupancyAnalytics.facilityPerformance.map((facility) => (
                  <div
                    key={facility.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {facility.name}
                      </h3>
                      <Badge
                        variant={
                          facility.utilizationRate >= 75
                            ? "default"
                            : facility.utilizationRate >= 50
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {facility.utilizationRate.toFixed(1)}% {t("utilizationRate").toLowerCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{tGeneral("metrics.totalBookings")}</p>
                        <p className="font-semibold text-gray-900">
                          {facility.totalBookings}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{tGeneral("metrics.totalRevenue")}</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(facility.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t("avgPerCourt")}</p>
                        <p className="font-semibold text-gray-900">
                          {facility.avgBookingsPerCourt.toFixed(1)} {tGeneral("bookings").toLowerCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t("revenuePerCourt")}</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(facility.avgRevenuePerCourt)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, facility.utilizationRate)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "underutilized":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("underutilizedCourts")}</CardTitle>
                <CardDescription>
                  {t("underutilizedCourtsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyAnalytics.underutilizedCourts.length > 0 ? (
                  <div className="space-y-3">
                    {occupancyAnalytics.underutilizedCourts.map((court) => (
                      <div
                        key={court.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {court.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {court.bookings} {tGeneral("bookings").toLowerCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-rose-600">
                            {court.utilizationPercent.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">{t("utilizationRate").toLowerCase()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">{t("noUnderutilizedCourts")}</p>
                      <p className="text-xs mt-1">
                        {t("allCourtsUtilized")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("underutilizedFacilities")}</CardTitle>
                <CardDescription>
                  {t("underutilizedFacilitiesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyAnalytics.underutilizedFacilities.length > 0 ? (
                  <div className="space-y-3">
                    {occupancyAnalytics.underutilizedFacilities.map(
                      (facility) => (
                        <div
                          key={facility.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {facility.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {facility.activeCourts} {t("of")} {facility.totalCourts}{" "}
                              {t("courtsActive")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-rose-600">
                              {facility.utilizationRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">{t("utilizationRate").toLowerCase()}</p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">
                        {t("noUnderutilizedFacilities")}
                      </p>
                      <p className="text-xs mt-1">
                        {t("allFacilitiesUtilized")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("description")}
          </p>
        </div>
        <Select
          value={selectedView}
          onValueChange={(value) =>
            setSelectedView(value as OccupancyViewType)
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select view..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="advanced-heatmap">
              Advanced Heatmap
            </SelectItem>
            <SelectItem value="court-utilization">
              {t("courtUtilization")}
            </SelectItem>
            <SelectItem value="peak-hours-heatmap">
              {t("peakHoursHeatmap")}
            </SelectItem>
            <SelectItem value="facility-performance">
              {t("facilityPerformance")}
            </SelectItem>
            <SelectItem value="underutilized">
              {t("underutilized")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderChart()}
    </div>
  );
}
