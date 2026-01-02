"use client";

import { useState, useEffect } from "react";

interface BookingData {
  id: string;
  startTime: string;
  endTime: string;
  facilityId: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  revenue?: number;
  facility: {
    id: string;
    name: string;
    sport?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Facility {
  id: string;
  name: string;
  sport?: string;
}

interface OccupancyData {
  occupancyGrid: number[][];
  averageOccupancy: number;
  peakHours: Array<{
    hour: number;
    day: number;
    occupancy: number;
  }>;
}

interface OccupancySummary {
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
  peakHours: Array<{
    hour: number;
    day: number;
    occupancy: number;
  }>;
}

interface UseOccupancyDataOptions {
  organizationId: string;
  facilityId?: string;
  startDate?: string;
  endDate?: string;
  sport?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseOccupancyDataReturn {
  bookings: BookingData[];
  facilities: Facility[];
  occupancyData: OccupancyData | null;
  summary: OccupancySummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOccupancyData({
  organizationId,
  facilityId,
  startDate,
  endDate,
  sport,
  enabled = true,
  refetchInterval = 5 * 60 * 1000, // 5 minutes
}: UseOccupancyDataOptions): UseOccupancyDataReturn {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [summary, setSummary] = useState<OccupancySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled || !organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organizationId,
        ...(facilityId && { facilityId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(sport && sport !== "all" && { sport }),
      });

      const response = await fetch(`/api/provider/occupancy?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch occupancy data: ${response.statusText}`);
      }

      const data = await response.json();
      
      setBookings(data.bookings || []);
      setFacilities(data.facilities || []);
      setOccupancyData(data.occupancyData || null);
      setSummary(data.summary || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch occupancy data";
      setError(errorMessage);
      console.error("Error fetching occupancy data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationId, facilityId, startDate, endDate, sport, enabled]);

  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, refetchInterval]);

  return {
    bookings,
    facilities,
    occupancyData,
    summary,
    isLoading,
    error,
    refetch: fetchData,
  };
}







