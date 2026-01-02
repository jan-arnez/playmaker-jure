"use client";

import {
  Building2,
  Calendar,
  Euro,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
  ResponsiveContainer,
  Tooltip,
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

interface AnalyticsProps {
  _organization: {
    id: string;
    name: string;
    slug: string;
  };
  _userRole: string;
  analytics?: {
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    totalBookings: number;
    monthlyBookings: number;
    bookingGrowth: number;
    totalFacilities: number;
    activeFacilities: number;
    averageBookingValue: number;
    topFacilities: Array<{
      id: string;
      name: string;
      bookingCount: number;
      revenue: number;
    }>;
  };
}

export function Analytics({
  _organization,
  _userRole,
  analytics = {
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    monthlyBookings: 0,
    bookingGrowth: 0,
    totalFacilities: 0,
    activeFacilities: 0,
    averageBookingValue: 0,
    topFacilities: [],
  },
}: AnalyticsProps) {
  const t = useTranslations("ProviderModule.analytics");

  // Mock data for charts (in production, this would come from API)
  const revenueData = [
    { month: "Jan", revenue: 4000 },
    { month: "Feb", revenue: 3000 },
    { month: "Mar", revenue: 5000 },
    { month: "Apr", revenue: 4500 },
    { month: "May", revenue: 6000 },
    { month: "Jun", revenue: 5500 },
  ];

  const bookingData = [
    { month: "Jan", bookings: 24 },
    { month: "Feb", bookings: 18 },
    { month: "Mar", bookings: 30 },
    { month: "Apr", bookings: 27 },
    { month: "May", bookings: 36 },
    { month: "Jun", bookings: 33 },
  ];

  const facilityData = analytics.topFacilities.map((facility, index) => ({
    name: facility.name,
    value: facility.bookingCount,
    color: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"][index % 5],
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("analytics")}</h1>
        <p className="text-gray-600 mt-1">{t("analyticsSubtitle")}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalRevenue")}
            </CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {analytics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.revenueGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatPercentage(analytics.revenueGrowth)}
              </span>
              <span className="ml-1">{t("vsLastMonth")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalBookings")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.totalBookings}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {analytics.bookingGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span
                className={
                  analytics.bookingGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatPercentage(analytics.bookingGrowth)}
              </span>
              <span className="ml-1">{t("vsLastMonth")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("averageBookingValue")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.averageBookingValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("perBooking")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("activeFacilities")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analytics.activeFacilities}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("outOf")} {analytics.totalFacilities} {t("total")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueChart")}</CardTitle>
            <CardDescription>{t("revenueChartDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("bookingsChart")}</CardTitle>
            <CardDescription>{t("bookingsChartDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [value, "Bookings"]} />
                <Bar dataKey="bookings" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("topFacilities")}</CardTitle>
            <CardDescription>{t("topFacilitiesDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topFacilities.length > 0 ? (
              <div className="space-y-4">
                {analytics.topFacilities.map((facility, index) => (
                  <div
                    key={facility.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {facility.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {facility.bookingCount} {t("bookings")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(facility.revenue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("revenue")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t("noFacilityData")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Facility Distribution</CardTitle>
            <CardDescription>
              Booking distribution across facilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={facilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {facilityData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{t("noFacilityData")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("monthlyBreakdown")}</CardTitle>
          <CardDescription>{t("monthlyBreakdownDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("thisMonth")}</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(analytics.monthlyRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("thisMonthBookings")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.monthlyBookings}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("averagePerBooking")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(analytics.averageBookingValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("facilityUtilization")}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {analytics.totalFacilities > 0
                    ? `${Math.round(
                        (analytics.activeFacilities /
                          analytics.totalFacilities) *
                          100
                      )}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
