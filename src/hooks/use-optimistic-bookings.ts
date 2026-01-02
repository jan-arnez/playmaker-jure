"use client";

import { useCallback } from 'react';
import { useOptimisticMutations } from './use-optimistic-updates';

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount?: number;
  facilityName?: string;
}

export interface CreateBookingData {
  facilityId: string;
  name: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

/**
 * Optimistic bookings hook for booking CRUD operations
 */
export function useOptimisticBookings(
  initialBookings: Booking[] = [],
  options: {
    successMessage?: string;
    errorMessage?: string;
    onBookingCreated?: (booking: Booking) => void;
    onBookingUpdated?: (booking: Booking) => void;
    onBookingDeleted?: (bookingId: string) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const optimisticMutations = useOptimisticMutations(initialBookings, {
    successMessage: options.successMessage || 'Booking updated successfully',
    errorMessage: options.errorMessage || 'Failed to update booking',
    onSuccess: options.onBookingCreated,
    onError: options.onError
  });

  const createBooking = useCallback(async (bookingData: CreateBookingData) => {
    const optimisticBooking: Booking = {
      id: `temp_${Date.now()}`,
      facilityId: bookingData.facilityId,
      userId: 'current_user',
      startTime: new Date(`${bookingData.date}T${bookingData.startTime}`),
      endTime: new Date(`${bookingData.date}T${bookingData.endTime}`),
      status: 'pending',
      notes: bookingData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerName: bookingData.name,
      customerEmail: bookingData.email
    };

    return optimisticMutations.create(optimisticBooking, async (data) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      return result.booking;
    });
  }, [optimisticMutations]);

  const updateBookingStatus = useCallback(async (
    bookingId: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  ) => {
    return optimisticMutations.update(bookingId, { status }, async (id, updates) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updates.status })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      const result = await response.json();
      return result.booking;
    });
  }, [optimisticMutations]);

  const updateBookingNotes = useCallback(async (
    bookingId: string, 
    notes: string
  ) => {
    return optimisticMutations.update(bookingId, { notes }, async (id, updates) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updates.notes })
      });

      if (!response.ok) {
        throw new Error('Failed to update booking notes');
      }

      const result = await response.json();
      return result.booking;
    });
  }, [optimisticMutations]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    return updateBookingStatus(bookingId, 'cancelled');
  }, [updateBookingStatus]);

  const confirmBooking = useCallback(async (bookingId: string) => {
    return updateBookingStatus(bookingId, 'confirmed');
  }, [updateBookingStatus]);

  const completeBooking = useCallback(async (bookingId: string) => {
    return updateBookingStatus(bookingId, 'completed');
  }, [updateBookingStatus]);

  const deleteBooking = useCallback(async (bookingId: string) => {
    return optimisticMutations.remove(bookingId, async (id) => {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }

      return { success: true };
    });
  }, [optimisticMutations]);

  const getBookingById = useCallback((bookingId: string) => {
    return optimisticMutations.data.find(booking => booking.id === bookingId);
  }, [optimisticMutations.data]);

  const getBookingsByStatus = useCallback((status: string) => {
    return optimisticMutations.data.filter(booking => booking.status === status);
  }, [optimisticMutations.data]);

  const getBookingsByFacility = useCallback((facilityId: string) => {
    return optimisticMutations.data.filter(booking => booking.facilityId === facilityId);
  }, [optimisticMutations.data]);

  const getBookingsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return optimisticMutations.data.filter(booking => 
      booking.startTime >= startDate && booking.startTime <= endDate
    );
  }, [optimisticMutations.data]);

  return {
    bookings: optimisticMutations.data,
    isOptimistic: optimisticMutations.isOptimistic,
    getOptimisticItem: optimisticMutations.getOptimisticItem,
    rollbackOptimistic: optimisticMutations.rollbackOptimistic,
    rollbackAll: optimisticMutations.rollbackAll,
    clearErrors: optimisticMutations.clearErrors,
    
    // Booking operations
    createBooking,
    updateBookingStatus,
    updateBookingNotes,
    cancelBooking,
    confirmBooking,
    completeBooking,
    deleteBooking,
    
    // Query helpers
    getBookingById,
    getBookingsByStatus,
    getBookingsByFacility,
    getBookingsByDateRange
  };
}