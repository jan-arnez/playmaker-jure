"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimisticButton, OptimisticBadge, OptimisticIndicator, OptimisticList } from '@/components/ui/optimistic-indicator';
import { useOptimisticBookings, Booking } from '@/hooks/use-optimistic-bookings';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';

interface OptimisticBookingsManagementProps {
  initialBookings: Booking[];
  onBookingUpdate?: (booking: Booking) => void;
  onBookingDelete?: (bookingId: string) => void;
  onError?: (error: string) => void;
}

export function OptimisticBookingsManagement({
  initialBookings,
  onBookingUpdate,
  onBookingDelete,
  onError
}: OptimisticBookingsManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    bookings,
    isOptimistic,
    updateBookingStatus,
    cancelBooking,
    confirmBooking,
    completeBooking,
    deleteBooking,
    getBookingsByStatus,
    getBookingsByFacility,
    rollbackOptimistic,
    clearErrors
  } = useOptimisticBookings(initialBookings, {
    successMessage: 'Booking updated successfully!',
    errorMessage: 'Failed to update booking. Please try again.',
    onBookingUpdated: onBookingUpdate,
    onBookingDeleted: onBookingDelete,
    onError: (error) => onError?.(error.message)
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesSearch = searchQuery === '' || 
      booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      switch (newStatus) {
        case 'confirmed':
          await confirmBooking(bookingId);
          break;
        case 'cancelled':
          await cancelBooking(bookingId);
          break;
        case 'completed':
          await completeBooking(bookingId);
          break;
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBooking(bookingId);
      } catch (error) {
        console.error('Failed to delete booking:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      // case 'pending':
      //   return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const renderBookingItem = (booking: Booking, index: number) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">
              {formatDate(booking.startTime)}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <OptimisticBadge
              isOptimistic={isOptimistic(booking.id)}
              status={isOptimistic(booking.id) ? 'pending' : 'success'}
              className={getStatusColor(booking.status)}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon(booking.status)}
                <span className="capitalize">{booking.status}</span>
              </div>
            </OptimisticBadge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Time Information */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{booking.customerEmail}</span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              {/* {booking.status === 'pending' && (
                <OptimisticButton
                  size="sm"
                  variant="outline"
                  isOptimistic={isOptimistic(booking.id)}
                  onClick={() => handleStatusChange(booking.id, 'confirmed')}
                >
                  Confirm
                </OptimisticButton>
              )}
              {booking.status === 'confirmed' && (
                <OptimisticButton
                  size="sm"
                  variant="outline"
                  isOptimistic={isOptimistic(booking.id)}
                  onClick={() => handleStatusChange(booking.id, 'completed')}
                >
                  Complete
                </OptimisticButton>
              )}
              {booking.status !== 'cancelled' && (
                <OptimisticButton
                  size="sm"
                  variant="destructive"
                  isOptimistic={isOptimistic(booking.id)}
                  onClick={() => handleStatusChange(booking.id, 'cancelled')}
                >
                  Cancel
                </OptimisticButton>
              )} */ }
            </div>

            <div className="flex space-x-2">
              <OptimisticButton
                size="sm"
                variant="ghost"
                isOptimistic={isOptimistic(booking.id)}
                onClick={() => handleDelete(booking.id)}
              >
                <Trash2 className="h-4 w-4" />
              </OptimisticButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookings Management</h2>
          <p className="text-gray-600">Manage and update booking statuses</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearErrors}
          >
            Clear Errors
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {/* <option value="pending">Pending</option> */}
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {getBookingsByStatus('pending').length}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card> */}
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {getBookingsByStatus('confirmed').length}
            </div>
            <p className="text-sm text-gray-600">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {getBookingsByStatus('cancelled').length}
            </div>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {getBookingsByStatus('completed').length}
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <OptimisticList
        items={filteredBookings.map(booking => ({
          id: booking.id,
          isOptimistic: isOptimistic(booking.id),
          status: isOptimistic(booking.id) ? 'pending' : 'success',
          data: booking
        }))}
        renderItem={renderBookingItem}
        emptyMessage="No bookings found"
      />
    </div>
  );
}
