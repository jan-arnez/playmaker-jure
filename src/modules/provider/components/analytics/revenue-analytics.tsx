"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface RevenueAnalyticsProps {
  revenueAnalytics: {
    monthlyRevenueData: Array<{ month: string; revenue: number }>;
    revenueByFacility: Array<{ id: string; name: string; revenue: number }>;
    revenueByCourt: Array<{ name: string; revenue: number }>;
    revenueByStatus: {
      confirmed: number;
      cancelled: number;
      pending: number;
      completed: number;
    };
    revenueByDayOfWeek: Array<{ day: string; revenue: number }>;
    revenueByHour: Array<{ hour: string; revenue: number }>;
  };
}

const COLORS = ["#10b981", "#059669", "#047857", "#34d399", "#6ee7b7"];

type RevenueViewType =
  | "over-time"
  | "by-facility"
  | "by-court"
  | "by-status"
  | "by-day"
  | "by-hour";

export function RevenueAnalytics({ revenueAnalytics }: RevenueAnalyticsProps) {
  const t = useTranslations("ProviderModule.analytics.charts");
  const tStatus = useTranslations("ProviderModule.analytics.status");
  const tGeneral = useTranslations("ProviderModule.analytics");
  const [selectedView, setSelectedView] = useState<RevenueViewType>("over-time");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Chart configurations for shadcn charts
  const revenueChartConfig = {
    revenue: {
      label: tGeneral("revenue"),
      color: "#10b981",
    },
  } satisfies ChartConfig;

  const facilityChartConfig = {
    revenue: {
      label: tGeneral("revenue"),
      color: "#059669",
    },
  } satisfies ChartConfig;

  const courtChartConfig = {
    revenue: {
      label: tGeneral("revenue"),
      color: "#047857",
    },
  } satisfies ChartConfig;

  const dayChartConfig = {
    revenue: {
      label: tGeneral("revenue"),
      color: "#34d399",
    },
  } satisfies ChartConfig;

  const hourChartConfig = {
    revenue: {
      label: tGeneral("revenue"),
      color: "#6ee7b7",
    },
  } satisfies ChartConfig;

  // Prepare status data for pie chart
  const statusData = [
    { name: tStatus("confirmed"), value: revenueAnalytics.revenueByStatus.confirmed, fill: COLORS[0] },
    { name: tStatus("cancelled"), value: revenueAnalytics.revenueByStatus.cancelled, fill: COLORS[1] },
    { name: tStatus("pending"), value: revenueAnalytics.revenueByStatus.pending, fill: COLORS[2] },
    { name: tStatus("completed"), value: revenueAnalytics.revenueByStatus.completed, fill: COLORS[3] },
  ].filter((item) => item.value > 0);

  const statusChartConfig = statusData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  // Prepare facility data for bar chart (top 10)
  const topFacilities = revenueAnalytics.revenueByFacility.slice(0, 10);

  const renderChart = () => {
    switch (selectedView) {
      case "over-time":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueOverTime")}</CardTitle>
              <CardDescription>{t("revenueOverTimeDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[400px] w-full">
                <AreaChart data={revenueAnalytics.monthlyRevenueData} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );

      case "by-facility":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByFacility")}</CardTitle>
              <CardDescription>{t("revenueByFacilityDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {topFacilities.length > 0 ? (
                <ChartContainer config={facilityChartConfig} className="h-[400px] w-full">
                  <BarChart data={topFacilities} accessibilityLayer>
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
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
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

      case "by-court":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByCourt")}</CardTitle>
              <CardDescription>{t("revenueByCourtDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueAnalytics.revenueByCourt.length > 0 ? (
                <ChartContainer config={courtChartConfig} className="h-[400px] w-full">
                  <BarChart data={revenueAnalytics.revenueByCourt} accessibilityLayer>
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
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
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

      case "by-status":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByStatus")}</CardTitle>
              <CardDescription>{t("revenueByStatusDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ChartContainer config={statusChartConfig} className="h-[400px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  {tGeneral("noData")}
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "by-day":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByDayOfWeek")}</CardTitle>
              <CardDescription>{t("revenueByDayOfWeekDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dayChartConfig} className="h-[400px] w-full">
                <BarChart data={revenueAnalytics.revenueByDayOfWeek} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );

      case "by-hour":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("revenueByHour")}</CardTitle>
              <CardDescription>{t("revenueByHourDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourChartConfig} className="h-[400px] w-full">
                <BarChart data={revenueAnalytics.revenueByHour} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
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
          <h2 className="text-xl font-bold text-gray-900">{t("revenueAnalyticsTitle")}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("revenueAnalyticsDesc")}
          </p>
        </div>
        <Select value={selectedView} onValueChange={(value) => setSelectedView(value as RevenueViewType)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select view..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="over-time">{t("revenueOverTime")}</SelectItem>
            <SelectItem value="by-facility">{t("revenueByFacility")}</SelectItem>
            {revenueAnalytics.revenueByCourt.length > 0 && (
              <SelectItem value="by-court">{t("revenueByCourt")}</SelectItem>
            )}
            <SelectItem value="by-status">{t("revenueByStatus")}</SelectItem>
            <SelectItem value="by-day">{t("revenueByDayOfWeek")}</SelectItem>
            <SelectItem value="by-hour">{t("revenueByHour")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderChart()}
    </div>
  );
}
