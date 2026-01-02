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

interface BookingAnalyticsProps {
  bookingAnalytics: {
    monthlyBookingData: Array<{ month: string; bookings: number }>;
    bookingStatusBreakdown: {
      confirmed: number;
      cancelled: number;
      pending: number;
      completed: number;
    };
    bookingsByFacility: Array<{ id: string; name: string; bookings: number }>;
    bookingsByCourt: Array<{ name: string; bookings: number }>;
    bookingsByDayOfWeek: Array<{ day: string; bookings: number }>;
    bookingsByHour: Array<{ hour: string; bookings: number }>;
    cancellationRate: number;
    totalBookings: number;
    cancelledBookings: number;
  };
}

const COLORS = ["#10b981", "#059669", "#047857", "#34d399", "#6ee7b7"];

type BookingViewType =
  | "over-time"
  | "by-status"
  | "by-facility"
  | "by-court"
  | "by-day"
  | "by-hour"
  | "cancellation-rate";

export function BookingAnalytics({
  bookingAnalytics,
}: BookingAnalyticsProps) {
  const t = useTranslations("ProviderModule.analytics.bookingAnalytics");
  const tStatus = useTranslations("ProviderModule.analytics.status");
  const tGeneral = useTranslations("ProviderModule.analytics");

  const [selectedView, setSelectedView] =
    useState<BookingViewType>("over-time");

  // Chart configurations
  const bookingsChartConfig = {
    bookings: {
      label: t("bookings"),
      color: "#10b981",
    },
  } satisfies ChartConfig;

  const facilityChartConfig = {
    bookings: {
      label: t("bookings"),
      color: "#059669",
    },
  } satisfies ChartConfig;

  const courtChartConfig = {
    bookings: {
      label: t("bookings"),
      color: "#047857",
    },
  } satisfies ChartConfig;

  const dayChartConfig = {
    bookings: {
      label: t("bookings"),
      color: "#34d399",
    },
  } satisfies ChartConfig;

  const hourChartConfig = {
    bookings: {
      label: t("bookings"),
      color: "#6ee7b7",
    },
  } satisfies ChartConfig;

  // Prepare status data for pie chart
  const statusData = [
    {
      name: tStatus("confirmed"),
      value: bookingAnalytics.bookingStatusBreakdown.confirmed,
      fill: COLORS[0],
    },
    {
      name: tStatus("cancelled"),
      value: bookingAnalytics.bookingStatusBreakdown.cancelled,
      fill: COLORS[1],
    },
    {
      name: tStatus("pending"),
      value: bookingAnalytics.bookingStatusBreakdown.pending,
      fill: COLORS[2],
    },
    {
      name: tStatus("completed"),
      value: bookingAnalytics.bookingStatusBreakdown.completed,
      fill: COLORS[3],
    },
  ].filter((item) => item.value > 0);

  const statusChartConfig = statusData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  // Prepare facility data (top 10)
  const topFacilities = bookingAnalytics.bookingsByFacility.slice(0, 10);

  const renderChart = () => {
    switch (selectedView) {
      case "over-time":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingsOverTime")}</CardTitle>
              <CardDescription>{t("bookingsOverTimeDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={bookingsChartConfig} className="h-[400px] w-full">
                <AreaChart data={bookingAnalytics.monthlyBookingData} accessibilityLayer>
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
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="var(--color-bookings)"
                    fill="var(--color-bookings)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );

      case "by-status":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingStatusBreakdown")}</CardTitle>
              <CardDescription>
                {t("bookingStatusBreakdownDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ChartContainer config={statusChartConfig} className="h-[400px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }: { name: string; percent: number; value: number }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
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

      case "by-facility":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingsByFacility")}</CardTitle>
              <CardDescription>{t("bookingsByFacilityDesc")}</CardDescription>
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
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
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
              <CardTitle>{t("bookingsByCourt")}</CardTitle>
              <CardDescription>{t("bookingsByCourtDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingAnalytics.bookingsByCourt.length > 0 ? (
                <ChartContainer config={courtChartConfig} className="h-[400px] w-full">
                  <BarChart data={bookingAnalytics.bookingsByCourt} accessibilityLayer>
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
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
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

      case "by-day":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingsByDayOfWeek")}</CardTitle>
              <CardDescription>
                {t("bookingsByDayOfWeekDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dayChartConfig} className="h-[400px] w-full">
                <BarChart data={bookingAnalytics.bookingsByDayOfWeek} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );

      case "by-hour":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("bookingsByHourOfDay")}</CardTitle>
              <CardDescription>{t("bookingsByHourOfDayDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourChartConfig} className="h-[400px] w-full">
                <BarChart data={bookingAnalytics.bookingsByHour} accessibilityLayer>
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
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        );

      case "cancellation-rate":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("cancellationRate")}</CardTitle>
              <CardDescription>
                {t("cancellationRateDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-900 mb-2">
                      {bookingAnalytics.cancellationRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("cancellationRate")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {bookingAnalytics.cancelledBookings}
                    </div>
                    <p className="text-sm text-gray-600">{tStatus("cancelled")}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {bookingAnalytics.totalBookings}
                    </div>
                    <p className="text-sm text-gray-600">{t("totalBookings")}</p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-red-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${bookingAnalytics.cancellationRate}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
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
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t("description")}
          </p>
        </div>
        <Select
          value={selectedView}
          onValueChange={(value) =>
            setSelectedView(value as BookingViewType)
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select view..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="over-time">{t("bookingsOverTime")}</SelectItem>
            <SelectItem value="by-status">{t("bookingStatusBreakdown")}</SelectItem>
            <SelectItem value="by-facility">{t("bookingsByFacility")}</SelectItem>
            {bookingAnalytics.bookingsByCourt.length > 0 && (
              <SelectItem value="by-court">{t("bookingsByCourt")}</SelectItem>
            )}
            <SelectItem value="by-day">{t("bookingsByDayOfWeek")}</SelectItem>
            <SelectItem value="by-hour">{t("bookingsByHourOfDay")}</SelectItem>
            <SelectItem value="cancellation-rate">{t("cancellationRate")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderChart()}
    </div>
  );
}
