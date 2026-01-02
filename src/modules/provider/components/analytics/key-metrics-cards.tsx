"use client";

import { Euro, Calendar, TrendingUp, TrendingDown, Building2, Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KeyMetricsCardsProps {
  metrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    totalBookings: number;
    monthlyBookings: number;
    bookingGrowth: number;
    averageBookingValue: number;
    occupancyRate: number;
    totalFacilities: number;
    activeFacilities: number;
    totalCourts: number;
    activeCourts: number;
  };
}

export function KeyMetricsCards({ metrics }: KeyMetricsCardsProps) {
  const t = useTranslations("ProviderModule.analytics.metrics");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Total Revenue */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("totalRevenue")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <Euro className="h-3 w-3 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div className="flex items-center text-[10px] text-gray-500">
            {metrics.revenueGrowth >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 text-green-600 mr-0.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-red-600 mr-0.5" />
            )}
            <span
              className={
                metrics.revenueGrowth >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
              }
            >
              {formatPercentage(metrics.revenueGrowth)}
            </span>
            <span className="ml-0.5">{t("vsLastMonth")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("monthlyRevenue")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Euro className="h-3 w-3 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {formatCurrency(metrics.monthlyRevenue)}
          </div>
          <p className="text-[10px] text-gray-500">{t("thisMonth")}</p>
        </CardContent>
      </Card>

      {/* Total Bookings */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("totalBookings")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
            <Calendar className="h-3 w-3 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {metrics.totalBookings}
          </div>
          <div className="flex items-center text-[10px] text-gray-500">
            {metrics.bookingGrowth >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5 text-green-600 mr-0.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-red-600 mr-0.5" />
            )}
            <span
              className={
                metrics.bookingGrowth >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
              }
            >
              {formatPercentage(metrics.bookingGrowth)}
            </span>
            <span className="ml-0.5">{t("vsLastMonth")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Average Booking Value */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("avgBooking")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {formatCurrency(metrics.averageBookingValue)}
          </div>
          <p className="text-[10px] text-gray-500">{t("perBooking")}</p>
        </CardContent>
      </Card>

      {/* Occupancy Rate */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("occupancy")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
            <Activity className="h-3 w-3 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {metrics.occupancyRate.toFixed(1)}%
          </div>
          <p className="text-[10px] text-gray-500">
            {t("courts", { active: metrics.activeCourts, total: metrics.totalCourts })}
          </p>
        </CardContent>
      </Card>

      {/* Active Facilities/Courts */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-4 pt-3">
          <CardTitle className="text-xs font-medium text-gray-600">
            {t("activeFacilities")}
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center">
            <Building2 className="h-3 w-3 text-teal-600" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          <div className="text-lg font-bold text-gray-900 mb-0.5">
            {metrics.activeFacilities}
          </div>
          <p className="text-[10px] text-gray-500">
            {t("ofTotal", { count: metrics.totalFacilities })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

