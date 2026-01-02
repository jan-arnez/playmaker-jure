"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/modules/auth/lib/auth-client";

interface VerificationStatus {
  isLoading: boolean;
  isVerified: boolean;
  canBook: boolean;
  reason?: string;
  trustLevel: number;
  weeklyBookingLimit: number;
  weeklyBookingCount?: number;
  bookingBanUntil?: Date;
  refetch: () => Promise<void>;
}

/**
 * Hook to check user's verification and booking status
 */
export function useVerificationStatus(): VerificationStatus {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState({
    isVerified: false,
    canBook: false,
    trustLevel: 0,
    weeklyBookingLimit: 0,
    reason: undefined as string | undefined,
    weeklyBookingCount: undefined as number | undefined,
    bookingBanUntil: undefined as Date | undefined,
  });

  const fetchStatus = useCallback(async () => {
    try {
      // Check if user is authenticated
      const session = await authClient.getSession();
      if (!session?.data?.user) {
        setIsLoading(false);
        setStatus({
          isVerified: false,
          canBook: false,
          trustLevel: 0,
          weeklyBookingLimit: 0,
          reason: "Please log in to make bookings",
          weeklyBookingCount: undefined,
          bookingBanUntil: undefined,
        });
        return;
      }

      const response = await fetch("/api/user/booking-status");
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isVerified: data.isVerified,
          canBook: data.canBook,
          trustLevel: data.trustLevel,
          weeklyBookingLimit: data.weeklyBookingLimit,
          reason: data.reason,
          weeklyBookingCount: data.weeklyBookingCount,
          bookingBanUntil: data.bookingBanUntil ? new Date(data.bookingBanUntil) : undefined,
        });
      }
    } catch (error) {
      console.error("Failed to fetch verification status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isLoading,
    ...status,
    refetch: fetchStatus,
  };
}
