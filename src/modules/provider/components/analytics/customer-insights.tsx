"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, UserPlus, UserCheck } from "lucide-react";

interface CustomerInsightsProps {
  customerInsights: {
    totalUniqueCustomers: number;
    repeatCustomerRate: number;
    repeatCustomersCount: number;
    newCustomersCount: number;
    returningCustomersCount: number;
    topCustomersByBookings: Array<{
      id: string;
      name: string;
      email: string;
      bookings: number;
      revenue: number;
    }>;
    topCustomersByRevenue: Array<{
      id: string;
      name: string;
      email: string;
      bookings: number;
      revenue: number;
    }>;
  };
}

type CustomerViewType =
  | "overview"
  | "new-vs-returning"
  | "top-by-bookings"
  | "top-by-revenue";

export function CustomerInsights({
  customerInsights,
}: CustomerInsightsProps) {
  const [selectedView, setSelectedView] =
    useState<CustomerViewType>("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("sl-SI", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderChart = () => {
    switch (selectedView) {
      case "overview":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Unique Customers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {customerInsights.totalUniqueCustomers}
                </div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Repeat Customer Rate
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {customerInsights.repeatCustomerRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {customerInsights.repeatCustomersCount} repeat customers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  New Customers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {customerInsights.newCustomersCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Returning Customers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {customerInsights.returningCustomersCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">Before last 30 days</p>
              </CardContent>
            </Card>
          </div>
        );

      case "new-vs-returning":
        return (
          <Card>
            <CardHeader>
              <CardTitle>New vs Returning Customers</CardTitle>
              <CardDescription>
                Customer distribution: new (last 30 days) vs returning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {customerInsights.newCustomersCount}
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      New Customers
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      First booking in last 30 days
                    </p>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {customerInsights.returningCustomersCount}
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Returning Customers
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      First booking before last 30 days
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 flex">
                    <div
                      className="bg-green-500 h-4 rounded-l-full transition-all"
                      style={{
                        width: `${
                          customerInsights.totalUniqueCustomers > 0
                            ? (customerInsights.newCustomersCount /
                                customerInsights.totalUniqueCustomers) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="bg-orange-500 h-4 rounded-r-full transition-all"
                      style={{
                        width: `${
                          customerInsights.totalUniqueCustomers > 0
                            ? (customerInsights.returningCustomersCount /
                                customerInsights.totalUniqueCustomers) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>
                      {customerInsights.totalUniqueCustomers > 0
                        ? (
                            (customerInsights.newCustomersCount /
                              customerInsights.totalUniqueCustomers) *
                            100
                          ).toFixed(1)
                        : 0}
                      % New
                    </span>
                    <span>
                      {customerInsights.totalUniqueCustomers > 0
                        ? (
                            (customerInsights.returningCustomersCount /
                              customerInsights.totalUniqueCustomers) *
                            100
                          ).toFixed(1)
                        : 0}
                      % Returning
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "top-by-bookings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Bookings</CardTitle>
              <CardDescription>
                Top 10 customers ranked by number of bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerInsights.topCustomersByBookings.length > 0 ? (
                <div className="space-y-4">
                  {customerInsights.topCustomersByBookings.map(
                    (customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {customer.bookings}
                            </div>
                            <div className="text-xs text-gray-500">bookings</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(customer.revenue)}
                            </div>
                            <div className="text-xs text-gray-500">revenue</div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "top-by-revenue":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>
                Top 10 customers ranked by total revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerInsights.topCustomersByRevenue.length > 0 ? (
                <div className="space-y-4">
                  {customerInsights.topCustomersByRevenue.map(
                    (customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(customer.revenue)}
                            </div>
                            <div className="text-xs text-gray-500">revenue</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              {customer.bookings}
                            </div>
                            <div className="text-xs text-gray-500">bookings</div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  No customer data available
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Insights</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customer analytics and behavior patterns
          </p>
        </div>
        <Select
          value={selectedView}
          onValueChange={(value) =>
            setSelectedView(value as CustomerViewType)
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select view..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="new-vs-returning">
              New vs Returning Customers
            </SelectItem>
            <SelectItem value="top-by-bookings">
              Top Customers by Bookings
            </SelectItem>
            <SelectItem value="top-by-revenue">
              Top Customers by Revenue
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderChart()}
    </div>
  );
}

