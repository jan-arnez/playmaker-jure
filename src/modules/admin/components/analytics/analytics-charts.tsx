"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface ChartData {
  date: string;
  users: number;
  bookings: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsChartsProps {
  chartData: ChartData[];
  bookingStatusData: StatusData[];
  waitlistStatusData?: StatusData[];
  noShowStatusData?: StatusData[];
  topCities?: [string, number][];
}

const activityChartConfig = {
  users: {
    label: "New Users",
    color: "#22c55e",
  },
  bookings: {
    label: "Bookings",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  confirmed: { label: "Confirmed", color: "#22c55e" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
  pending: { label: "Pending", color: "#f59e0b" },
} satisfies ChartConfig;

const waitlistChartConfig = {
  waiting: { label: "Waiting", color: "#3b82f6" },
  notified: { label: "Notified", color: "#f59e0b" },
  booked: { label: "Booked", color: "#22c55e" },
} satisfies ChartConfig;

const noShowChartConfig = {
  active: { label: "Active", color: "#ef4444" },
  redeemed: { label: "Redeemed", color: "#22c55e" },
  expired: { label: "Expired", color: "#6b7280" },
} satisfies ChartConfig;

const cityChartConfig = {
  bookings: {
    label: "Bookings",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export function AnalyticsCharts({ 
  chartData, 
  bookingStatusData,
  waitlistStatusData = [],
  noShowStatusData = [],
  topCities = [],
}: AnalyticsChartsProps) {
  // Format date for display
  const formattedChartData = chartData.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Format city data for chart
  const cityChartData = topCities.map(([city, count]) => ({
    city,
    bookings: count,
  }));

  const hasWaitlistData = waitlistStatusData.some(d => d.value > 0);
  const hasNoShowData = noShowStatusData.some(d => d.value > 0);
  const hasCityData = cityChartData.length > 0;

  return (
    <div className="space-y-6">
      {/* Activity Chart - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Activity (Last 30 Days)</CardTitle>
          <CardDescription>
            Daily new users and bookings across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
            <BarChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
                tickFormatter={(value) => value}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="users" fill="var(--color-users)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Booking Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Waitlist Status Pie Chart */}
        {hasWaitlistData && (
          <Card>
            <CardHeader>
              <CardTitle>Waitlist Status</CardTitle>
              <CardDescription>Conversion funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={waitlistChartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={waitlistStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {waitlistStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* No-Show Status Pie Chart */}
        {hasNoShowData && (
          <Card>
            <CardHeader>
              <CardTitle>No-Show Status</CardTitle>
              <CardDescription>Strike breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={noShowChartConfig} className="h-[200px] w-full">
                <PieChart>
                  <Pie
                    data={noShowStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {noShowStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Cities Chart */}
        {hasCityData && (
          <Card>
            <CardHeader>
              <CardTitle>Top Cities by Bookings</CardTitle>
              <CardDescription>Geographic distribution of confirmed bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cityChartConfig} className="h-[250px] w-full">
                <BarChart data={cityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="city" 
                    type="category" 
                    tickLine={false} 
                    axisLine={false}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* 30-Day Summary */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day Summary</CardTitle>
            <CardDescription>Activity summary for the past month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total New Users</span>
              <span className="font-bold text-lg">
                {chartData.reduce((sum, day) => sum + day.users, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="font-bold text-lg">
                {chartData.reduce((sum, day) => sum + day.bookings, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Daily Users</span>
              <span className="font-bold text-lg">
                {(chartData.reduce((sum, day) => sum + day.users, 0) / 30).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Daily Bookings</span>
              <span className="font-bold text-lg">
                {(chartData.reduce((sum, day) => sum + day.bookings, 0) / 30).toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
