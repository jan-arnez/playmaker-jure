"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimisticButton, OptimisticIndicator } from '@/components/ui/optimistic-indicator';
import { useOptimisticBookings } from '@/hooks/use-optimistic-bookings';
import { useOptimisticForm } from '@/hooks/use-optimistic-updates';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Shield, 
  CheckCircle,
  Loader2
} from 'lucide-react';

interface OptimisticBookingFormProps {
  facilityId: string;
  facilityName?: string;
  onBookingSuccess?: (bookingId: string) => void;
  onBookingError?: (error: string) => void;
}

export function OptimisticBookingForm({
  facilityId,
  facilityName = "Facility",
  onBookingSuccess,
  onBookingError
}: OptimisticBookingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const { createBooking } = useOptimisticBookings([], {
    successMessage: 'Booking created successfully!',
    errorMessage: 'Failed to create booking. Please try again.',
    onBookingCreated: (booking) => {
      onBookingSuccess?.(booking.id);
      setFormData({
        name: '',
        email: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
    },
    onError: (error) => {
      onBookingError?.(error.message);
    }
  });

  const optimisticForm = useOptimisticForm(
    formData,
    async (data) => {
      return createBooking({
        facilityId,
        name: data.name,
        email: data.email,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes
      });
    },
    {
      successMessage: 'Booking created successfully!',
      errorMessage: 'Failed to create booking. Please try again.'
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.date || !formData.startTime || !formData.endTime) {
      return;
    }

    try {
      await optimisticForm.submit(formData);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isFormValid = formData.name && formData.email && formData.date && formData.startTime && formData.endTime;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Book {facilityName}</span>
        </CardTitle>
        <CardDescription>
          Complete the form below to make your booking. All fields are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Messages */}
          {optimisticForm.message && (
            <Alert variant={optimisticForm.message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>
                {optimisticForm.message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Full Name</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
                disabled={optimisticForm.isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
                disabled={optimisticForm.isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Date</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              disabled={optimisticForm.isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Start Time</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                disabled={optimisticForm.isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>End Time</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
                disabled={optimisticForm.isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or special requests..."
              rows={3}
              disabled={optimisticForm.isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              <p>🛡️ Protected by advanced validation</p>
              <p>⚡ Real-time conflict detection</p>
              <p>🔒 Secure booking process</p>
            </div>
            
            <OptimisticButton
              type="submit"
              isOptimistic={optimisticForm.isSubmitting}
              status={optimisticForm.isSubmitting ? 'pending' : 'success'}
              disabled={!isFormValid}
              className="flex items-center space-x-2"
            >
              {optimisticForm.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Booking...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Create Protected Booking</span>
                </>
              )}
            </OptimisticButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
