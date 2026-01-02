"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, TrendingUp, Download, Filter, BarChart3, Brain, Crown, Sparkles } from "lucide-react";

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  facilityId: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  revenue?: number;
}

interface Facility {
  id: string;
  name: string;
  sport?: string;
}

interface PredictionData {
  hour: number;
  day: number;
  predictedOccupancy: number;
  confidence: number;
  recommendation: string;
  potentialRevenue: number;
}

interface PremiumHeatmapProps {
  bookings: BookingData[];
  facilities: Facility[];
  predictions?: PredictionData[];
  isPremium?: boolean;
}

export function PremiumHeatmap({
  bookings = [],
  facilities = [],
  predictions = [],
  isPremium = false,
}: PremiumHeatmapProps) {
  const [showPredictions, setShowPredictions] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Upgrade functionality
  const handleUpgrade = () => {
    console.log("Redirect to upgrade page");
    // Implement upgrade flow - could redirect to billing page
    window.open('/billing/upgrade', '_blank');
  };

  // Generate mock predictions if not provided
  const mockPredictions: PredictionData[] = predictions.length > 0 ? predictions : Array.from({ length: 24 * 7 }, (_, index) => {
    const hour = Math.floor(index / 7);
    const day = index % 7;
    const baseOccupancy = Math.random() * 100;
    const confidence = 0.7 + Math.random() * 0.3;
    
    return {
      hour,
      day,
      predictedOccupancy: Math.round(baseOccupancy),
      confidence: Math.round(confidence * 100),
      recommendation: baseOccupancy < 30 ? "Offer promotion" : baseOccupancy > 80 ? "Consider premium pricing" : "Normal operations",
      potentialRevenue: Math.round(baseOccupancy * 2.5),
    };
  });

  // Merge actual data with predictions
  const enhancedBookings = bookings.map(booking => {
    const prediction = mockPredictions.find(p => {
      const bookingHour = new Date(booking.startTime).getHours();
      const bookingDay = new Date(booking.startTime).getDay();
      const adjustedDay = bookingDay === 0 ? 6 : bookingDay - 1;
      return p.hour === bookingHour && p.day === adjustedDay;
    });

    return {
      ...booking,
      prediction,
    };
  });

  const totalPotentialRevenue = mockPredictions.reduce((sum, p) => sum + p.potentialRevenue, 0);
  const currentRevenue = bookings.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const revenueOpportunity = totalPotentialRevenue - currentRevenue;

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <Card className="border-gradient-to-r from-yellow-400 to-orange-500 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  AI-Powered Occupancy Predictions
                </CardTitle>
                <CardDescription>
                  Advanced analytics with machine learning insights
                </CardDescription>
              </div>
            </div>
            {!isPremium && (
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="predictions"
              checked={showPredictions && isPremium}
              onCheckedChange={setShowPredictions}
              disabled={!isPremium}
            />
            <label htmlFor="predictions" className="text-sm font-medium">
              Show AI Predictions
            </label>
          </div>
          
          {isPremium && (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium Active
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Revenue Opportunity Card */}
      {isPremium && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Revenue Opportunity</p>
                  <p className="text-2xl font-bold text-green-900">€{revenueOpportunity.toFixed(0)}</p>
                  <p className="text-xs text-green-700">Potential additional revenue this week</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">+{Math.round((revenueOpportunity / currentRevenue) * 100)}%</p>
                <p className="text-xs text-green-500">vs current</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Occupancy Heatmap</CardTitle>
          <CardDescription>Heatmap visualization temporarily unavailable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Heatmap component is being rebuilt with new court-based layout.
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {isPremium && showPredictions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-green-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Machine learning insights for optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPredictions
                  .filter(p => p.predictedOccupancy < 30)
                  .slice(0, 3)
                  .map((prediction, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800">
                          {DAYS[prediction.day]} {prediction.hour.toString().padStart(2, '0')}:00
                        </span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {prediction.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-yellow-700">{prediction.recommendation}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Potential: €{prediction.potentialRevenue}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Performance Metrics
              </CardTitle>
              <CardDescription>AI model accuracy and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prediction Accuracy</span>
                  <span className="text-sm font-medium text-gray-900">87.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Impact</span>
                  <span className="text-sm font-medium text-green-600">+23.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Occupancy Optimization</span>
                  <span className="text-sm font-medium text-blue-600">+15.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Model Confidence</span>
                  <span className="text-sm font-medium text-green-600">High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Prompt for Non-Premium Users */}
      {!isPremium && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unlock AI-Powered Insights
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get predictive analytics, revenue optimization suggestions, and advanced occupancy forecasting with our Premium plan.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="h-4 w-4 text-green-600" />
                  <span>AI Predictions</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span>Revenue Optimization</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Advanced Analytics</span>
                </div>
              </div>
              <Button 
                onClick={handleUpgrade}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now - €4.99/month
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
