"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { BookingConflictResolver } from './booking-conflict-resolver';

interface BookingFormData {
  facilityId: string;
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

interface ConflictData {
  conflicts: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    customerName: string;
    customerEmail: string;
  }>;
  suggestedTimes: Date[];
}

interface EnhancedBookingFormProps {
  facilityId: string;
  facilityName?: string;
  onBookingSuccess?: (bookingId: string) => void;
  onBookingError?: (error: string) => void;
}

export function EnhancedBookingForm({
  facilityId,
  facilityName = "Facility",
  onBookingSuccess,
  onBookingError
}: EnhancedBookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    facilityId,
    name: '',
    email: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [protectionStatus, setProtectionStatus] = useState<'idle' | 'validating' | 'protected' | 'warning'>('idle');

  // Real-time validation
  useEffect(() => {
    if (formData.name && formData.email && formData.date && formData.startTime && formData.endTime) {
      validateBooking();
    }
  }, [formData]);

  const validateBooking = async () => {
    setProtectionStatus('validating');
    
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
      
      // Client-side validation
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('Invalid email format');
      }
      
      // Name validation
      if (formData.name.length < 2) {
        errors.push('Name must be at least 2 characters long');
      }
      
      // Time validation
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000);
      
      if (startDateTime < minBookingTime) {
        errors.push('Booking must be at least 30 minutes in advance');
      }
      
      if (startDateTime >= endDateTime) {
        errors.push('End time must be after start time');
      }
      
      // Duration validation
      const duration = endDateTime.getTime() - startDateTime.getTime();
      const minDuration = 30 * 60 * 1000; // 30 minutes
      const maxDuration = 8 * 60 * 60 * 1000; // 8 hours
      
      if (duration < minDuration) {
        errors.push('Minimum booking duration is 30 minutes');
      }
      
      if (duration > maxDuration) {
        errors.push('Maximum booking duration is 8 hours');
      }
      
      // Business hours validation
      const startHour = startDateTime.getHours();
      const endHour = endDateTime.getHours();
      
      if (startHour < 6 || endHour > 22) {
        warnings.push('Booking is outside normal business hours (6 AM - 10 PM)');
      }
      
      // Weekend validation
      const isWeekend = startDateTime.getDay() === 0 || startDateTime.getDay() === 6;
      if (isWeekend) {
        warnings.push('Booking is on a weekend');
      }
      
      setValidationErrors(errors);
      setWarnings(warnings);
      
      if (errors.length === 0) {
        setProtectionStatus(warnings.length > 0 ? 'warning' : 'protected');
      } else {
        setProtectionStatus('idle');
      }
      
    } catch (error) {
      console.error('Validation error:', error);
      setProtectionStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validationErrors.length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        onBookingSuccess?.(result.booking.id);
        setFormData({
          facilityId,
          name: '',
          email: '',
          date: '',
          startTime: '',
          endTime: '',
          notes: ''
        });
        setValidationErrors([]);
        setWarnings([]);
        setProtectionStatus('idle');
      } else if (response.status === 409 && result.type === 'conflict') {
        // Handle conflict
        setConflictData({
          conflicts: result.conflicts,
          suggestedTimes: result.suggestedTimes.map((time: string) => new Date(time))
        });
        setShowConflictResolver(true);
      } else {
        onBookingError?.(result.error || 'Booking failed');
      }
    } catch (error) {
      onBookingError?.(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlternativeTime = async (selectedTime: Date) => {
    const newFormData = {
      ...formData,
      date: selectedTime.toISOString().split('T')[0],
      startTime: selectedTime.toTimeString().slice(0, 5),
      endTime: new Date(selectedTime.getTime() + (2 * 60 * 60 * 1000)).toTimeString().slice(0, 5) // 2 hours later
    };
    
    setFormData(newFormData);
    setShowConflictResolver(false);
    setConflictData(null);
    
    // Auto-submit with new time
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 100);
  };

  const getProtectionStatusIcon = () => {
    switch (protectionStatus) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'protected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProtectionStatusText = () => {
    switch (protectionStatus) {
      case 'validating':
        return 'Validating...';
      case 'protected':
        return 'Protected';
      case 'warning':
        return 'Warning';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {showConflictResolver && conflictData && (
        <BookingConflictResolver
          conflicts={conflictData.conflicts}
          suggestedTimes={conflictData.suggestedTimes}
          onSelectAlternative={handleAlternativeTime}
          onCancel={() => setShowConflictResolver(false)}
          facilityName={facilityName}
        />
      )}
      
      {!showConflictResolver && (
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
              {/* Protection Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getProtectionStatusIcon()}
                  <span className="text-sm font-medium">
                    Protection Status: {getProtectionStatusText()}
                  </span>
                </div>
                {warnings.length > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
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
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  <p>🛡️ Protected by advanced validation</p>
                  <p>⚡ Real-time conflict detection</p>
                  <p>🔒 Secure booking process</p>
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting || validationErrors.length > 0}
                  className="flex items-center space-x-2"
                >
                  {isSubmitting ? (
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
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
