"use client";

import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

interface UpcomingBookingsListProps {
  bookings: Booking[];
  onViewBooking?: (bookingId: string) => void;
  onContactCustomer?: (email: string, phone?: string) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
  onViewAll?: () => void;
  maxItems?: number;
}

export function UpcomingBookingsList({
  bookings = [],
  onViewBooking,
  onContactCustomer,
  onConfirmBooking,
  onCancelBooking,
  onViewAll,
  maxItems = 5,
}: UpcomingBookingsListProps) {
  const t = useTranslations("ProviderModule.dashboard");

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const bookingTime = new Date(dateString);
    const diffMinutes = Math.floor((bookingTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return "Now";
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `in ${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      // case "pending":
      //   return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      // case "pending":
      //   return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "border-l-green-500 bg-green-50";
      // case "pending":
      //   return "border-l-yellow-500 bg-yellow-50";
      case "cancelled":
        return "border-l-red-500 bg-red-50";
      case "completed":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const upcomingBookings = bookings
    .filter(booking => booking.status !== "cancelled" && booking.status !== "completed")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, maxItems);

  // const pendingBookings = upcomingBookings.filter(booking => booking.status === "pending");
  const pendingBookings: Booking[] = []; // Disabled for now
  const confirmedBookings = upcomingBookings.filter(booking => booking.status === "confirmed");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Bookings
            {upcomingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingBookings.length}
              </Badge>
            )}
          </CardTitle>
          {onViewAll && bookings.length > maxItems && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No upcoming bookings</p>
            </div>
          ) : (
            <>
              {/* Pending Bookings (if any) */}
              {pendingBookings.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
                    Pending Approval ({pendingBookings.length})
                  </div>
                  {pendingBookings.map((booking) => (
                    <BookingItem
                      key={booking.id}
                      booking={booking}
                      onViewBooking={onViewBooking}
                      onContactCustomer={onContactCustomer}
                      onConfirmBooking={onConfirmBooking}
                      onCancelBooking={onCancelBooking}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                      getStatusColor={getStatusColor}
                      formatTime={formatTime}
                      formatDate={formatDate}
                      getTimeUntil={getTimeUntil}
                    />
                  ))}
                </div>
              )}

              {/* Confirmed Bookings */}
              {confirmedBookings.length > 0 && (
                <div className="space-y-2">
                  {pendingBookings.length > 0 && (
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      Confirmed ({confirmedBookings.length})
                    </div>
                  )}
                  {confirmedBookings.map((booking) => (
                    <BookingItem
                      key={booking.id}
                      booking={booking}
                      onViewBooking={onViewBooking}
                      onContactCustomer={onContactCustomer}
                      onConfirmBooking={onConfirmBooking}
                      onCancelBooking={onCancelBooking}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                      getStatusColor={getStatusColor}
                      formatTime={formatTime}
                      formatDate={formatDate}
                      getTimeUntil={getTimeUntil}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BookingItemProps {
  booking: Booking;
  onViewBooking?: (bookingId: string) => void;
  onContactCustomer?: (email: string, phone?: string) => void;
  onConfirmBooking?: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  formatTime: (dateString: string) => string;
  formatDate: (dateString: string) => string;
  getTimeUntil: (dateString: string) => string;
}

function BookingItem({
  booking,
  onViewBooking,
  onContactCustomer,
  onConfirmBooking,
  onCancelBooking,
  getStatusIcon,
  getStatusBadge,
  getStatusColor,
  formatTime,
  formatDate,
  getTimeUntil,
}: BookingItemProps) {
  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${getStatusColor(booking.status)} hover:shadow-sm transition-shadow cursor-pointer`}
      onClick={() => onViewBooking?.(booking.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {getStatusIcon(booking.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {booking.customerName}
              </h4>
              {getStatusBadge(booking.status)}
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {booking.facilityName}
                {booking.courtName && ` • ${booking.courtName}`}
              </div>
              
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(booking.startTime)} at {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                <span className="ml-2 text-blue-600 font-medium">
                  ({getTimeUntil(booking.startTime)})
                </span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium">€{booking.totalAmount}</span>
                {booking.notes && (
                  <span className="ml-2 truncate">• {booking.notes}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {onContactCustomer && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onContactCustomer(booking.customerEmail, booking.customerPhone);
              }}
            >
              <User className="h-3 w-3" />
            </Button>
          )}
          
          {/* {booking.status === "pending" && onConfirmBooking && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmBooking(booking.id);
              }}
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
          
          {booking.status === "pending" && onCancelBooking && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              onClick={(e) => {
                e.stopPropagation();
                onCancelBooking(booking.id);
              }}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          )} */}
        </div>
      </div>
    </div>
  );
}
