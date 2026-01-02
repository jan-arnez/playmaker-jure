"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity,
  BarChart3,
  Eye,
  RefreshCw
} from 'lucide-react';

interface BookingMetrics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageBookingDuration: number;
  peakBookingHours: number[];
  mostPopularFacilities: Array<{ facilityId: string; count: number }>;
  abuseAttempts: number;
  conflictResolutions: number;
}

interface AnomalyData {
  suspiciousBookings: Array<{
    bookingId: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  abusePatterns: Array<{
    pattern: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface ProtectionDashboardProps {
  metrics?: BookingMetrics;
  anomalies?: AnomalyData;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function BookingProtectionDashboard({
  metrics,
  anomalies,
  onRefresh,
  isLoading = false
}: ProtectionDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'patterns'>('overview');

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return <Activity className="h-4 w-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>Booking Protection Dashboard</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and protection analytics
          </p>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abuse Attempts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.abuseAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Blocked attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflict Resolutions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.conflictResolutions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Resolved conflicts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageBookingDuration ? formatDuration(metrics.averageBookingDuration) : '0h 0m'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'anomalies'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Anomalies
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'patterns'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Abuse Patterns
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Booking Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confirmed</span>
                  <Badge variant="default">{metrics?.confirmedBookings || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <Badge variant="secondary">{metrics?.pendingBookings || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cancelled</span>
                  <Badge variant="destructive">{metrics?.cancelledBookings || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed</span>
                  <Badge variant="outline">{metrics?.completedBookings || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Peak Booking Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.peakBookingHours?.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {hour}:00 - {hour + 1}:00
                    </span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(index + 1) * 20}%` }}
                      ></div>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Suspicious Bookings</span>
              </CardTitle>
              <CardDescription>
                Recent bookings flagged for unusual activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies?.suspiciousBookings?.length ? (
                <div className="space-y-3">
                  {anomalies.suspiciousBookings.map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSeverityIcon(booking.severity)}
                        <div>
                          <p className="font-medium text-sm">{booking.bookingId}</p>
                          <p className="text-xs text-gray-600">{booking.reason}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(booking.severity)}>
                        {booking.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    No suspicious bookings detected in the current period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-purple-500" />
                <span>Abuse Patterns</span>
              </CardTitle>
              <CardDescription>
                Detected patterns of suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies?.abusePatterns?.length ? (
                <div className="space-y-3">
                  {anomalies.abusePatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSeverityIcon(pattern.severity)}
                        <div>
                          <p className="font-medium text-sm">{pattern.pattern}</p>
                          <p className="text-xs text-gray-600">{pattern.count} occurrences</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                        <Badge variant="outline">{pattern.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    No abuse patterns detected in the current period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Shield className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.abuseAttempts ? 
                  Math.round((1 - metrics.abuseAttempts / metrics.totalBookings) * 100) : 
                  100
                }%
              </div>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics?.conflictResolutions || 0}
              </div>
              <p className="text-sm text-gray-600">Resolved Conflicts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}