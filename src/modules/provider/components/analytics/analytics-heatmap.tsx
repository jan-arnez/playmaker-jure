"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Download, Filter, BarChart3, PieChart } from "lucide-react";

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  facilityId: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  revenue?: number;
  facility: {
    id: string;
    name: string;
    sport?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Facility {
  id: string;
  name: string;
  sport?: string;
}

interface AnalyticsHeatmapProps {
  bookings: BookingData[];
  facilities: Facility[];
}

export function AnalyticsHeatmap({
  bookings = [],
  facilities = [],
}: AnalyticsHeatmapProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current");

  // Export functionality
  const handleExport = (format: "csv" | "pdf") => {
    console.log(`Exporting analytics data as ${format}`);
    // Implement export functionality here
    if (format === "csv") {
      // Generate CSV data
      const csvData = filteredBookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        facility: booking.facility.name,
        sport: booking.facility.sport || "N/A",
        status: booking.status,
        revenue: booking.revenue || 0,
        user: booking.user.name,
        userEmail: booking.user.email,
      }));
      
      // Convert to CSV string
      const csvString = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Get unique sports from facilities
  const sports = Array.from(new Set(facilities.map(f => f.sport).filter(Boolean)));

  // Filter bookings based on selected sport
  const filteredBookings = selectedSport === "all" 
    ? bookings 
    : bookings.filter(booking => {
        const facility = facilities.find(f => f.id === booking.facilityId);
        return facility?.sport === selectedSport;
      });

  // Filter facilities based on selected sport
  const filteredFacilities = selectedSport === "all" 
    ? facilities 
    : facilities.filter(f => f.sport === selectedSport);

  // Calculate summary statistics
  const totalBookings = filteredBookings.length;
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0);
  const averageOccupancy = facilities.length > 0 
    ? Math.round((filteredBookings.length / (facilities.length * 24 * 7)) * 100)
    : 0;

  // Get peak hours (highest occupancy)
  const hourlyBookings = Array.from({ length: 24 }, (_, hour) => {
    const hourBookings = filteredBookings.filter(booking => {
      const startHour = new Date(booking.startTime).getHours();
      return startHour === hour;
    });
    return {
      hour,
      count: hourBookings.length,
      revenue: hourBookings.reduce((sum, b) => sum + (b.revenue || 0), 0),
    };
  });

  const peakHours = hourlyBookings
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Occupancy Analytics</h2>
          <p className="text-gray-600">Detailed occupancy patterns and insights</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Sport Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map(sport => (
                  <SelectItem key={sport} value={sport!}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Week</SelectItem>
              <SelectItem value="last">Last Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{totalRevenue.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">{averageOccupancy}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{filteredFacilities.length}</p>
              </div>
              <PieChart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Heatmap</CardTitle>
          <CardDescription>Heatmap visualization temporarily unavailable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Heatmap component is being rebuilt with new court-based layout.
          </div>
        </CardContent>
      </Card>

      {/* Peak Hours Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Peak Hours
            </CardTitle>
            <CardDescription>Most popular booking times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakHours.map((peak, index) => (
                <div key={peak.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">
                        {peak.hour.toString().padStart(2, '0')}:00 - {(peak.hour + 1).toString().padStart(2, '0')}:00
                      </p>
                      <p className="text-sm text-gray-600">
                        {peak.count} bookings • €{peak.revenue.toFixed(0)} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round((peak.count / totalBookings) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">of total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Insights
            </CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Best Performing Day</span>
                <span className="text-sm font-medium text-gray-900">
                  {(() => {
                    const dayBookings = Array.from({ length: 7 }, (_, day) => {
                      const dayCount = filteredBookings.filter(booking => {
                        const bookingDay = new Date(booking.startTime).getDay();
                        return bookingDay === (day === 6 ? 0 : day + 1); // Convert to Sunday=0 format
                      }).length;
                      return { day, count: dayCount };
                    });
                    const bestDay = dayBookings.reduce((max, current) => 
                      current.count > max.count ? current : max
                    );
                    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    return dayNames[bestDay.day];
                  })()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenue per Booking</span>
                <span className="text-sm font-medium text-gray-900">
                  €{totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : "0.00"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Utilization Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {averageOccupancy}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Peak Hour Share</span>
                <span className="text-sm font-medium text-gray-900">
                  {peakHours.length > 0 ? Math.round((peakHours[0].count / totalBookings) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered insights to improve occupancy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {averageOccupancy < 50 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  Low Occupancy Alert
                </p>
                <p className="text-sm text-yellow-700">
                  Consider offering promotions during off-peak hours to increase bookings.
                </p>
              </div>
            )}
            
            {peakHours.length > 0 && peakHours[0].count > totalBookings * 0.3 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Peak Hour Optimization
                </p>
                <p className="text-sm text-green-700">
                  Your peak hours are performing well. Consider premium pricing during these times.
                </p>
              </div>
            )}
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Revenue Opportunity
              </p>
              <p className="text-sm text-blue-700">
                Focus on converting pending bookings and implementing dynamic pricing strategies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
