"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
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
import { TrendingUp, Calendar, Clock } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface TimeBasedPatternsProps {
  timeBasedPatterns: {
    dayPerformance: Array<{
      day: string;
      bookings: number;
      revenue: number;
      avgRevenuePerBooking: number;
    }>;
    bestPerformingDays: Array<{
      day: string;
      bookings: number;
      revenue: number;
      avgRevenuePerBooking: number;
    }>;
    hourPerformance: Array<{
      hour: number;
      hourLabel: string;
      bookings: number;
      revenue: number;
      avgRevenuePerBooking: number;
    }>;
    bestPerformingHours: Array<{
      hour: number;
      hourLabel: string;
      bookings: number;
      revenue: number;
      avgRevenuePerBooking: number;
    }>;
    seasonalTrends: Array<{
      month: string;
      year: number;
      bookings: number;
      revenue: number;
    }>;
    hasSeasonalData: boolean;
  };
}

type TimePatternViewType =
  | "best-days"
  | "best-hours"
  | "seasonal-trends";

export function TimeBasedPatterns({
  timeBasedPatterns,
}: TimeBasedPatternsProps) {
  const t = useTranslations("ProviderModule.analytics.timeBasedPatterns");
  const tGeneral = useTranslations("ProviderModule.analytics");
  
  const [selectedView, setSelectedView] =
    useState<TimePatternViewType>("best-days");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart configurations with modern colors
  const dayChartConfig = {
    bookings: {
      label: tGeneral("bookings"),
      color: "#10b981", // Emerald
    },
    revenue: {
      label: tGeneral("revenue"),
      color: "#059669", // Emerald darker
    },
  } satisfies ChartConfig;

  const hourChartConfig = {
    bookings: {
      label: tGeneral("bookings"),
      color: "#34d399", // Emerald light
    },
    revenue: {
      label: tGeneral("revenue"),
      color: "#047857", // Emerald dark
    },
  } satisfies ChartConfig;

  const seasonalChartConfig = {
    bookings: {
      label: tGeneral("bookings"),
      color: "#6ee7b7", // Emerald lighter
    },
    revenue: {
      label: tGeneral("revenue"),
      color: "#059669", // Emerald
    },
  } satisfies ChartConfig;

  const renderChart = () => {
    switch (selectedView) {
      case "best-days":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("bestPerformingDays")}</CardTitle>
                <CardDescription>
                  {t("bestPerformingDaysDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={dayChartConfig} className="h-[400px] w-full">
                  <BarChart data={timeBasedPatterns.dayPerformance} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name) => {
                            if (name === "revenue") {
                              return formatCurrency(Number(value));
                            }
                            return value;
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="bookings"
                      fill="var(--color-bookings)"
                      radius={4}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("top3BestDays")}</CardTitle>
                <CardDescription>
                  {t("top3BestDaysDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeBasedPatterns.bestPerformingDays.map((day, index) => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {day.day}
                            <Badge variant="secondary" className="ml-2">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {t("best")}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {day.bookings} {tGeneral("bookings").toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(day.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(day.avgRevenuePerBooking)} {t("avg")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "best-hours":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("bestPerformingHours")}</CardTitle>
                <CardDescription>
                  {t("bestPerformingHoursDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={hourChartConfig} className="h-[400px] w-full">
                  <BarChart data={timeBasedPatterns.hourPerformance} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="hourLabel"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent 
                          formatter={(value, name) => {
                            if (name === "revenue") {
                              return formatCurrency(Number(value));
                            }
                            return value;
                          }}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      yAxisId="left"
                      dataKey="bookings"
                      fill="var(--color-bookings)"
                      radius={4}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("top5BestHours")}</CardTitle>
                <CardDescription>
                  {t("top5BestHoursDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeBasedPatterns.bestPerformingHours.map((hour, index) => (
                    <div
                      key={hour.hour}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {hour.hourLabel}
                            <Badge variant="secondary" className="ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              {t("peak")}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {hour.bookings} {tGeneral("bookings").toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(hour.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(hour.avgRevenuePerBooking)} {t("avg")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "seasonal-trends":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("seasonalTrends")}</CardTitle>
              <CardDescription>
                {t("seasonalTrendsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeBasedPatterns.hasSeasonalData ? (
                <div className="space-y-6">
                  <ChartContainer config={seasonalChartConfig} className="h-[400px] w-full">
                    <AreaChart data={timeBasedPatterns.seasonalTrends} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value, index) => {
                          const trend =
                            timeBasedPatterns.seasonalTrends[index];
                          return `${trend?.month || value} ${(trend?.year || "").toString().slice(2)}`;
                        }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name) => {
                              if (name === "revenue") {
                                return formatCurrency(Number(value));
                              }
                              return value;
                            }}
                          />
                        }
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="bookings"
                        stroke="var(--color-bookings)"
                        fill="var(--color-bookings)"
                        fillOpacity={0.3}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {timeBasedPatterns.seasonalTrends.reduce(
                          (sum, t) => sum + t.bookings,
                          0
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("totalBookings12Months")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          timeBasedPatterns.seasonalTrends.reduce(
                            (sum, t) => sum + t.revenue,
                            0
                          )
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("totalRevenue12Months")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          timeBasedPatterns.seasonalTrends.reduce(
                            (sum, t) => sum + t.revenue,
                            0
                          ) /
                            Math.max(
                              1,
                              timeBasedPatterns.seasonalTrends.filter(
                                (t) => t.bookings > 0
                              ).length
                            )
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("avgMonthlyRevenue")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm font-medium">
                      {t("insufficientData")}
                    </p>
                    <p className="text-xs mt-1">
                      {t("need3MonthsData")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
            setSelectedView(value as TimePatternViewType)
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select view..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best-days">{t("bestPerformingDays")}</SelectItem>
            <SelectItem value="best-hours">{t("bestPerformingHours")}</SelectItem>
            <SelectItem value="seasonal-trends">{t("seasonalTrends")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderChart()}
    </div>
  );
}
