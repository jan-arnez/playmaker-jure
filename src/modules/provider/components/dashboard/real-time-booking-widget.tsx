"use client";

import { Clock, MapPin, User, Phone, Mail, CheckCircle, AlertCircle, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  facilityName: string;
  courtName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  totalAmount?: number;
  notes?: string;
  isCurrent?: boolean;
}

interface RealTimeBookingWidgetProps {
  currentBookings: Booking[];
  upcomingBookings: Booking[];
  onViewBooking?: (bookingId: string) => void;
  onContactCustomer?: (email: string, phone?: string) => void;
}

export function RealTimeBookingWidget({
  currentBookings = [],
  upcomingBookings = [],
  onViewBooking,
  onContactCustomer,
}: RealTimeBookingWidgetProps) {
  const t = useTranslations("ProviderModule.dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = currentTime;
    const diffMinutes = Math.floor((end.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Ending soon";
    if (diffMinutes < 60) return `${diffMinutes}m remaining`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m remaining`;
  };

  const getTimeUntil = (startTime: string) => {
    const start = new Date(startTime);
    const now = currentTime;
    const diffMinutes = Math.floor((start.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Starting now";
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `in ${hours}h ${minutes}m`;
  };

  const totalActive = currentBookings.length;
  const totalUpcoming = upcomingBookings.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Radio className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
            Real-Time Bookings
            {(totalActive > 0 || totalUpcoming > 0) && (
              <Badge variant="secondary" className="ml-2">
                {totalActive + totalUpcoming}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Bookings */}
          {totalActive > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wide flex items-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                  Active Now ({totalActive})
                </div>
              </div>
              {currentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border-l-4 border-l-green-500 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                  onClick={() => onViewBooking?.(booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {booking.customerName}
                          </h4>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.facilityName}
                            {booking.courtName && ` • ${booking.courtName}`}
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            <span className="ml-2 text-green-700 font-medium">
                              ({getTimeRemaining(booking.endTime)})
                            </span>
                          </div>
                          
                          {booking.totalAmount && (
                            <div className="flex items-center">
                              <span className="font-medium">€{booking.totalAmount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {onContactCustomer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onContactCustomer(booking.customerEmail, booking.customerPhone);
                        }}
                      >
                        <User className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Bookings */}
          {totalUpcoming > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  Starting Soon ({totalUpcoming})
                </div>
              </div>
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => onViewBooking?.(booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {booking.customerName}
                          </h4>
                          <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {booking.facilityName}
                            {booking.courtName && ` • ${booking.courtName}`}
                          </div>
                          
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            <span className="ml-2 text-blue-700 font-medium">
                              ({getTimeUntil(booking.startTime)})
                            </span>
                          </div>
                          
                          {booking.totalAmount && (
                            <div className="flex items-center">
                              <span className="font-medium">€{booking.totalAmount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {onContactCustomer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onContactCustomer(booking.customerEmail, booking.customerPhone);
                        }}
                      >
                        <User className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {totalActive === 0 && totalUpcoming === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Radio className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No active or upcoming bookings</p>
              <p className="text-xs text-gray-400 mt-1">
                Bookings will appear here in real-time
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

