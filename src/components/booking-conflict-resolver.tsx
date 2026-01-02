"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface BookingConflict {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  customerName: string;
  customerEmail: string;
}

interface ConflictResolverProps {
  conflicts: BookingConflict[];
  suggestedTimes: Date[];
  onSelectAlternative: (selectedTime: Date) => void;
  onCancel: () => void;
  facilityName?: string;
}

export function BookingConflictResolver({
  conflicts,
  suggestedTimes,
  onSelectAlternative,
  onCancel,
  facilityName = "Facility"
}: ConflictResolverProps) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeDifference = (time1: Date, time2: Date) => {
    const diff = Math.abs(time1.getTime() - time2.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleResolveConflict = async () => {
    if (!selectedTime) return;
    
    setIsResolving(true);
    try {
      await onSelectAlternative(selectedTime);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold text-gray-900">Booking Conflict Detected</h1>
        </div>
        <p className="text-lg text-gray-600">
          The time slot you selected for {facilityName} is already booked. 
          Please choose an alternative time below.
        </p>
      </div>

      {/* Conflict Details */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>Conflicting Bookings</span>
          </CardTitle>
          <CardDescription>
            The following bookings conflict with your selected time:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(conflict.startTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={conflict.status === 'confirmed' ? 'default' : 'secondary'}>
                    {conflict.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {conflict.customerName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alternative Time Suggestions */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Available Alternative Times</span>
          </CardTitle>
          <CardDescription>
            Choose from these available time slots:
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestedTimes.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No alternative times are currently available. Please try a different date or contact support.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedTimes.map((time, index) => {
                const isSelected = selectedTime?.getTime() === time.getTime();
                const isSameDay = time.toDateString() === new Date().toDateString();
                const isNextDay = time.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
                
                return (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {formatTime(time)}
                      </span>
                      {isSameDay && (
                        <Badge variant="outline" className="text-xs">
                          Same Day
                        </Badge>
                      )}
                      {isNextDay && (
                        <Badge variant="outline" className="text-xs">
                          Next Day
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(time)}
                    </p>
                    {isSelected && (
                      <div className="mt-2 flex items-center space-x-1 text-blue-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Users className="h-5 w-5" />
            <span>Smart Recommendations</span>
          </CardTitle>
          <CardDescription>
            Based on your preferences and availability:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                <strong>Same-day alternatives:</strong> {suggestedTimes.filter(time => 
                time.toDateString() === new Date().toDateString()
              ).length} available slots today
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                <strong>Next-day alternatives:</strong> {suggestedTimes.filter(time => 
                time.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
              ).length} available slots tomorrow
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                <strong>Peak hours:</strong> Consider booking during off-peak times for better availability
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 sm:flex-none"
        >
          Cancel Booking
        </Button>
        <Button
          onClick={handleResolveConflict}
          disabled={!selectedTime || isResolving}
          className="flex-1 sm:flex-none"
        >
          {isResolving ? 'Resolving...' : 'Book Alternative Time'}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Need help? Contact our support team for assistance with booking alternatives.
        </p>
      </div>
    </div>
  );
}