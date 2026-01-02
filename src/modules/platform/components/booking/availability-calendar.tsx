"use client";

import { addDays, format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, Info } from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { parseWorkingHours, DAY_ORDER } from "@/lib/working-hours";
import { BookingSummaryDialog } from "./booking-summary-dialog";
import { BookingTooltip } from "./booking-tooltip";
import { WaitlistSummaryDialog } from "./waitlist-summary-dialog";
import { useFacilityContext } from "@/context/facility-context";
import { toast } from "sonner";
import { useAuthModal } from "@/components/auth-modal";
import { authClient } from "@/modules/auth/lib/auth-client";
import Image from "next/image";
import { PiCourtBasketball } from "react-icons/pi";



// Sport icon mapping - only valid sports
const sportIcons: Record<string, string> = {
  "Tennis": "/icons/tennis.svg",
  "Multi-purpose": "/icons/tennis.svg",
  "Basketball": "/icons/basketball.svg", 
  "Football": "/icons/football.svg",
  "Swimming": "/icons/swimming.svg",
  "Volleyball": "/icons/volleyball.svg",
  "Badminton": "/icons/badminton.svg",
  "Squash": "/icons/squash.svg",
  "Table Tennis": "/icons/table tennis.svg",
  "Pickleball": "/icons/pickleball.svg",
  "Padel": "/icons/padel.svg",
};

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price?: number;
  duration?: number;
  bookingId?: string;
  userName?: string;
}

interface CourtAvailability {
  courtId: string;
  courtName: string;
  courtType?: string;
  slots: TimeSlot[];
}

interface AvailabilityCalendarProps {
  facilityId: string;
  facilityName: string;
  selectedSport?: string;
  initialDate?: string;
  onBookingSelect?: (date: string, time: string, courtId: string) => void;
}

export function AvailabilityCalendar({
  facilityId,
  facilityName,
  selectedSport,
  initialDate,
  onBookingSelect,
}: AvailabilityCalendarProps) {
  const t = useTranslations("filters");
  const { facility } = useFacilityContext();
  const { data: session } = authClient.useSession();
  const { openLogin } = useAuthModal();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (initialDate) {
      const parsedDate = new Date(initialDate);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  });
  const [availability, setAvailability] = useState<CourtAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: string;
    time: string;
    price?: number;
    duration?: number;
  } | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [optimisticBookings, setOptimisticBookings] = useState<Set<string>>(new Set());
  const [hoveredSlot, setHoveredSlot] = useState<{
    courtId: string;
    time: string;
    price: number;
  } | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [selectedWaitlistSlot, setSelectedWaitlistSlot] = useState<{
    courtId: string;
    courtName: string;
    courtType: string;
    startTime: Date;
    endTime: Date;
    date: string;
    time: string;
    price: number;
  } | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<Map<string, { position: number; status: string }>>(new Map());

  // Ref for measuring the slots container width to calculate dynamic row height
  const slotsContainerRef = useRef<HTMLDivElement>(null);
  const [slotHeight, setSlotHeight] = useState<number>(50); // Default height

  // Parse facility working hours to get earliest/latest times across all days
  const facilityHoursRange = useMemo(() => {
    const workingHours = parseWorkingHours(facility?.workingHours);
    if (!workingHours) {
      // Default fallback if no working hours set
      return { startHour: 7, endHour: 23 };
    }
    
    let earliestOpen = 24;
    let latestClose = 0;
    
    for (const day of DAY_ORDER) {
      const dayHours = workingHours[day];
      if (dayHours && !dayHours.closed) {
        const openHour = parseInt(dayHours.open.split(':')[0]);
        let closeHour = parseInt(dayHours.close.split(':')[0]);
        // Handle midnight: "00:00" means end of day (24)
        if (closeHour === 0 && dayHours.close === "00:00") closeHour = 24;
        if (openHour < earliestOpen) earliestOpen = openHour;
        if (closeHour > latestClose) latestClose = closeHour;
      }
    }
    
    // If no open days found, use defaults
    if (earliestOpen === 24 || latestClose === 0) {
      return { startHour: 7, endHour: 23 };
    }
    
    return { startHour: earliestOpen, endHour: latestClose };
  }, [facility?.workingHours]);

  // Hour headers for the grid - dynamically based on facility working hours
  const hourHeaders = useMemo(
    () => {
      const { startHour, endHour } = facilityHoursRange;
      const length = endHour - startHour;
      return Array.from({ length }, (_, i) => {
        const hour = startHour + i;
        return `${hour.toString().padStart(2, "0")}:00`;
      });
    },
    [facilityHoursRange],
  );

  // Total hours in the grid - used for percentage calculations
  const totalGridHours = facilityHoursRange.endHour - facilityHoursRange.startHour;

  // Backwards compatibility - keep timeSlots for existing logic
  const timeSlots = hourHeaders;

  /**
   * Generate time slots for a specific court based on its slotDuration.
   * Returns array of { time: string, duration: number, widthUnits: number }
   * 
   * BUSINESS RULE: No slot shall exceed the facility's closing hour.
   * This rule is enforced by checking if the slot END time would extend past
   * the closing time. If so, the slot is not generated.
   * 
   * Example: If closing is 22:00 and slot duration is 60 min:
   * - 21:00 slot (ends 22:00) ✓ included
   * - 21:30 slot (ends 22:30) ✗ excluded - would exceed closing
   */
  const generateCourtTimeSlots = useCallback((slotDuration: number) => {
    const { startHour, endHour } = facilityHoursRange;
    const slots: { time: string; duration: number; widthUnits: number }[] = [];
    
    let currentMinutes = startHour * 60;
    const endMinutes = endHour * 60;
    
    while (currentMinutes < endMinutes) {
      // Check if this slot would extend past closing time
      const slotEndMinutes = currentMinutes + slotDuration;
      if (slotEndMinutes > endMinutes) {
        // Slot would extend past closing, stop generating
        break;
      }
      
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      
      // Width in 15-min base units (e.g., 30min = 2 units, 60min = 4 units)
      const widthUnits = slotDuration / 15;
      
      slots.push({
        time,
        duration: slotDuration,
        widthUnits,
      });
      
      currentMinutes += slotDuration;
    }
    
    return slots;
  }, [facilityHoursRange]);

  // Calculate width percentage for a slot based on 15min base units
  // Each hour = 4 units, full grid has dynamic hours based on facility
  const getSlotWidthPercent = useCallback((duration: number) => {
    const unitsPerHour = 4; // 60min / 15min = 4
    const totalUnits = totalGridHours * unitsPerHour;
    const slotUnits = duration / 15;
    return (slotUnits / totalUnits) * 100;
  }, [totalGridHours]);

  // Calculate height percentage for mobile vertical layout (same calculation as width)
  const getSlotHeightPercent = useCallback((duration: number) => {
    const unitsPerHour = 4; // 60min / 15min = 4
    const totalUnits = totalGridHours * unitsPerHour;
    const slotUnits = duration / 15;
    return (slotUnits / totalUnits) * 100;
  }, [totalGridHours]);

  // Get the starting position (left %) for a time slot
  const getSlotLeftPercent = useCallback((time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = facilityHoursRange.startHour * 60;
    const minutesFromStart = totalMinutes - startMinutes;
    const totalDuration = totalGridHours * 60;
    return (minutesFromStart / totalDuration) * 100;
  }, [facilityHoursRange.startHour, totalGridHours]);

  // Get the starting position (top %) for mobile vertical layout
  const getSlotTopPercent = useCallback((time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = facilityHoursRange.startHour * 60;
    const minutesFromStart = totalMinutes - startMinutes;
    const totalDuration = totalGridHours * 60;
    return (minutesFromStart / totalDuration) * 100;
  }, [facilityHoursRange.startHour, totalGridHours]);

  // Pricing tiers based on time and court pricing data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPricingTier = (time: string, courtPricing?: any): { price: number; tier: string } => {
    const hour = parseInt(time.split(':')[0]);
    
    // If court has advanced pricing with tiers, use actual tier data
    if (courtPricing?.mode === 'advanced' && courtPricing?.advancedPricing?.tiers) {
      const enabledTiers = courtPricing.advancedPricing.tiers.filter((t: any) => t.enabled);
      
      // Find matching tier based on time range
      let lastTier = null;
      let maxEndHour = -1;

      for (const tier of enabledTiers) {
        const [startTime, endTime] = tier.timeRange.split('-');
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        // Track the tier that ends the latest
        if (endHour > maxEndHour) {
          maxEndHour = endHour;
          lastTier = tier;
        }
        
        if (hour >= startHour && hour < endHour) {
          return { price: tier.price, tier: tier.name.toLowerCase() };
        }
      }
      
      // If no exact match found, check if we're past the last tier's end time
      // This handles cases where facility stays open later than the last defined pricing tier
      if (lastTier && hour >= maxEndHour) {
        return { price: lastTier.price, tier: lastTier.name.toLowerCase() };
      }
      
      // If no tier matches, use first enabled tier as fallback
      if (enabledTiers.length > 0) {
        return { price: enabledTiers[0].price, tier: enabledTiers[0].name.toLowerCase() };
      }
    }
    
    // If court has basic pricing, use that price
    if (courtPricing?.mode === 'basic' && courtPricing?.basicPrice !== undefined) {
      // Determine tier based on hour for color purposes
      let tier = 'morning';
      if (hour >= 12 && hour < 16) tier = 'afternoon';
      else if (hour >= 16) tier = 'evening';
      return { price: courtPricing.basicPrice, tier };
    }
    
    // Fallback to default pricing
    if (hour < 12) return { price: 15, tier: 'morning' };
    if (hour < 16) return { price: 18, tier: 'afternoon' };
    return { price: 20, tier: 'evening' };
  };

  // Color classes for different pricing tiers
  // If useAdvancedColors is false, always return a single green (for basic pricing)
  const getPricingColor = (tier: string, useAdvancedColors: boolean = true) => {
    // Basic pricing - single uniform green color
    if (!useAdvancedColors) {
      return 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300';
    }
    
    // Advanced pricing - tiered colors
    switch (tier) {
      case 'morning':
        return 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200';
      case 'afternoon':
        return 'bg-green-200 border-green-300 text-green-900 hover:bg-green-300';
      case 'evening':
        return 'bg-green-300 border-green-400 text-green-950 hover:bg-green-400';
      default:
        return 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200';
    }
  };

  // Helper to parse slot duration from timeSlots array (e.g., ["60min"] -> 60)
  const parseSlotDuration = (timeSlots: string[] | undefined): number => {
    if (!timeSlots || timeSlots.length === 0) return 60; // Default to 60 minutes
    const match = timeSlots[0].match(/(\d+)min/);
    return match ? parseInt(match[1]) : 60;
  };

  // Generate courts based on facility data and filter by selected sport
  const courts = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allCourts: { id: string; name: string; type: string; locationType?: string; surface?: string; slotDuration: number; useAdvancedPricing: boolean; pricing?: any }[] = [];
    
    // Extract courts from sportCategories
    if (facility && 'sportCategories' in facility && Array.isArray(facility.sportCategories)) {
      facility.sportCategories.forEach((category: any) => {
        if (category.courts && Array.isArray(category.courts)) {
          category.courts.forEach((court: any) => {
            if (court.isActive !== false) { // Only include active courts
              allCourts.push({
                id: court.id,
                name: court.name,
                type: category.name, // Sport type comes from the category name
                locationType: court.locationType || undefined, // Court-level location type
                surface: court.surface || undefined, // Court-level surface type
                slotDuration: parseSlotDuration(court.timeSlots), // Slot duration in minutes
                useAdvancedPricing: court.pricing?.mode === 'advanced' && 
                  (court.pricing?.advancedPricing?.tiers?.length ?? 0) > 1,
                pricing: court.pricing || undefined, // Include full pricing data
              });
            }
          });
        }
      });
    }
    
    // Fallback to mock courts if no real courts found
    if (allCourts.length === 0) {
      allCourts = [
        { id: "court-1", name: "Court 1", type: "Tennis", locationType: "outdoor", surface: "clay", slotDuration: 60, useAdvancedPricing: false },
        { id: "court-2", name: "Court 2", type: "Tennis", locationType: "indoor", surface: "hard", slotDuration: 60, useAdvancedPricing: false },
        { id: "court-3", name: "Court 3", type: "Basketball", locationType: "indoor", surface: "wood", slotDuration: 60, useAdvancedPricing: false },
        { id: "court-4", name: "Court 4", type: "Football", locationType: "outdoor", surface: "grass", slotDuration: 60, useAdvancedPricing: false },
        { id: "court-5", name: "Court 5", type: "Tennis", locationType: "outdoor", slotDuration: 60, useAdvancedPricing: false },
        { id: "court-6", name: "Court 6", type: "Basketball", surface: "synthetic", slotDuration: 60, useAdvancedPricing: false },
      ];
    }
    
    // Filter by selected sport if specified
    if (selectedSport && selectedSport !== "all") {
      allCourts = allCourts.filter((court) => court.type === selectedSport);
    }
    
    // Sort courts: first by sport type (alphabetically), then by court name (natural numeric sort)
    const extractNumber = (name: string): number => {
      const match = name.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    allCourts.sort((a, b) => {
      // First sort by sport type
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      
      // Then sort by court number (extracted from name)
      const aNum = extractNumber(a.name);
      const bNum = extractNumber(b.name);
      if (aNum !== bNum) return aNum - bNum;
      
      // Finally alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return allCourts;
  }, [facility, selectedSport]);


  // Fetch availability data
  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/facilities/${facilityId}/availability?date=${currentDate.toISOString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAvailability(data.availability || []);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      // Generate mock data for demonstration
      const mockAvailability = courts.map((court: any) => ({
        courtId: court.id,
        courtName: court.name,
        courtType: court.type,
        slots: timeSlots.map((time) => ({
          id: `${court.id}-${time}`,
          time,
          available: Math.random() > 0.3, // 70% availability
          price: getPricingTier(time, court.pricing).price,
          duration: 60,
          bookingId:
            Math.random() > 0.7
              ? `booking-${Math.random().toString(36).substr(2, 9)}`
              : undefined,
          userName: Math.random() > 0.7 ? "John Doe" : undefined,
        })),
      }));
      setAvailability(mockAvailability);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, currentDate, courts, timeSlots]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Calculate slot height based on container width to maintain 1:1 aspect ratio for 1-hour slots
  useEffect(() => {
    const calculateSlotHeight = () => {
      if (slotsContainerRef.current && timeSlots.length > 0) {
        const containerWidth = slotsContainerRef.current.offsetWidth;
        const widthPerHour = containerWidth / timeSlots.length;
        if (widthPerHour > 0) {
          setSlotHeight(widthPerHour);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered before measuring
    const rafId = requestAnimationFrame(() => {
      calculateSlotHeight();
    });

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateSlotHeight);
    });
    
    if (slotsContainerRef.current) {
      resizeObserver.observe(slotsContainerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [timeSlots.length, isLoading]);

  const handlePreviousDay = useCallback(() => {
    setCurrentDate(addDays(currentDate, -1));
  }, [currentDate]);

  const handleNextDay = useCallback(() => {
    setCurrentDate(addDays(currentDate, 1));
  }, [currentDate]);

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setCalendarOpen(false);
    }
  }, []);

  const handleSlotClick = useCallback(
    (courtId: string, time: string, available: boolean, price?: number, duration?: number) => {
      if (available) {
        // Check if user is logged in
        if (!session?.user) {
          // Open the sign-in modal
          openLogin();
          return;
        }
        
        const slotKey = `${courtId}-${time}`;
        
        // Use the pricing tier price instead of the slot price
        const court = courts.find((c: any) => c.id === courtId);
        const pricingTier = getPricingTier(time, court?.pricing);
        
        // Optimistically mark slot as booked
        setOptimisticBookings(prev => new Set([...prev, slotKey]));
        
        setSelectedSlot({ courtId, time, price: pricingTier.price, duration: duration || 60 });
        setShowBookingDialog(true);
        onBookingSelect?.(format(currentDate, "yyyy-MM-dd"), time, courtId);
      }
    },
    [currentDate, onBookingSelect, session?.user, openLogin],
  );

  const getSlotStatus = useCallback((slot: TimeSlot, courtId: string) => {
    const slotKey = `${courtId}-${slot.time}`;
    
    // Check if slot is optimistically booked
    if (optimisticBookings.has(slotKey)) {
      return "booked";
    }
    
    if (!slot.available) {
      if (slot.userName) {
        return "booked";
      }
      // Check if it's rain - use deterministic logic based on slot ID
      // This ensures the same slot always has the same status
      const hash = slotKey.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      if (Math.abs(hash) % 10 < 1) { // 10% chance of rain, but deterministic
        return "rain";
      }
      return "unavailable";
    }
    return "available";
  }, [optimisticBookings]);

  const getSlotColor = useCallback(
    (slot: TimeSlot, courtId: string, time: string, useAdvancedPricing: boolean = false) => {
      const status = getSlotStatus(slot, courtId);
      switch (status) {
        case "available":
          const court = courts.find((c: any) => c.id === courtId);
          const pricingTier = getPricingTier(time, court?.pricing);
          return getPricingColor(pricingTier.tier, useAdvancedPricing);
        case "booked":
          return "bg-red-200 border-red-300 cursor-not-allowed";
        case "unavailable":
          return "bg-gray-200 border-gray-300 cursor-not-allowed";
        case "rain":
          return "bg-blue-200 border-blue-300 cursor-not-allowed";
        default:
          return "bg-gray-200";
      }
    },
    [getSlotStatus],
  );

  const handleBookingConfirmed = useCallback(() => {
    setShowBookingDialog(false);
    setSelectedSlot(null);
  }, []);

  const handleBookingCancelled = useCallback(() => {
    if (selectedSlot) {
      const slotKey = `${selectedSlot.courtId}-${selectedSlot.time}`;
      setOptimisticBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(slotKey);
        return newSet;
      });
    }
    setSelectedSlot(null);
  }, [selectedSlot]);

  const handleJoinWaitlist = useCallback((courtId: string, courtName: string, time: string) => {
    // Check if user is logged in
    if (!session?.user) {
      // Open the sign-in modal
      openLogin();
      return;
    }
    
    const slotDate = format(currentDate, "yyyy-MM-dd");
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = new Date(`${slotDate}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    // Find court details
    const court = courts.find((c: any) => c.id === courtId);
    const price = getPricingTier(time, court?.pricing).price;

    setSelectedWaitlistSlot({
      courtId,
      courtName,
      courtType: court?.type || "Tennis",
      startTime,
      endTime,
      date: slotDate,
      time,
      price,
    });
    setWaitlistDialogOpen(true);
  }, [currentDate, courts, session?.user, openLogin]);

  const handleWaitlistSuccess = useCallback((position: number) => {
    if (selectedWaitlistSlot) {
      const slotKey = `${selectedWaitlistSlot.courtId}-${format(selectedWaitlistSlot.startTime, "HH:mm")}`;
      setWaitlistEntries(prev => new Map(prev.set(slotKey, { position, status: "waitlist" })));
      // Refresh availability to show updated status
      fetchAvailability();
    }
  }, [selectedWaitlistSlot, fetchAvailability]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BsFillLightningChargeFill className="h-5 w-5" />
              Availability Calendar
            </CardTitle>
            
            {/* Mobile Legend - Info icon with popover, shown left of desktop legend */}
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    className="md:hidden flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Show legend"
                  >
                    <Info className="w-4 h-4 text-gray-400" />
                    <span>Legend</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-3" align="end" showArrow>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-900 mb-2">Slot Colors</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-100 border border-green-200"></div>
                      <span className="text-xs text-gray-700">Available Morning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-200 border border-green-300"></div>
                      <span className="text-xs text-gray-700">Available Afternoon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-green-300 border border-green-400"></div>
                      <span className="text-xs text-gray-700">Available Evening</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-red-200 border border-red-300"></div>
                      <span className="text-xs text-gray-700">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-yellow-100 border border-yellow-300"></div>
                      <span className="text-xs text-gray-700">On Waitlist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-100 border border-blue-200"></div>
                      <span className="text-xs text-gray-700">Rain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-100 border border-gray-200"></div>
                      <span className="text-xs text-gray-700">Unavailable</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            
            {/* Legend - Hidden on mobile, using popover instead */}
            <div className="hidden md:flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                  <div className="w-3 h-3 bg-green-300 border border-green-400 rounded"></div>
                </div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Rain</span>
              </div>
            </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Picker - Redesigned */}
          <div className="flex items-center justify-between mb-6 py-3 border-b border-gray-100 gap-2 md:gap-0">
            {/* Left: Pick date with calendar */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                  aria-label="Pick date"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="hidden md:inline text-base font-medium">Pick date</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={currentDate}
                  onSelect={handleCalendarSelect}
                  weekStartsOn={1}
                  initialFocus
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>

            {/* Center: Day Navigation */}
            <div className="flex items-center gap-1 md:gap-3 flex-1 md:flex-initial justify-center min-w-0">
              <button 
                type="button"
                onClick={handlePreviousDay}
                className="h-9 w-9 md:h-[42px] md:w-[42px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <div className="flex items-center gap-2 px-3 md:px-5 h-9 md:h-[42px] border border-gray-200 rounded-lg flex-1 max-w-[200px] md:flex-initial md:max-w-none md:min-w-[180px] justify-center">
                <span className="text-sm md:text-base font-semibold text-gray-900 truncate md:truncate-none">
                  <span className="md:hidden">{format(currentDate, "EEE, d MMM")}</span>
                  <span className="hidden md:inline">{format(currentDate, "EEEE, d MMM")}</span>
                </span>
              </div>

              <button 
                type="button"
                onClick={handleNextDay}
                className="h-9 w-9 md:h-[42px] md:w-[42px] flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            {/* Right: Today link */}
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading availability...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Grid View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <div className="bg-white rounded-lg border overflow-hidden min-w-fit">
                    {/* Two-column layout: Court name + Slots container */}
                    <div className="flex flex-col">
                      {/* Header Row */}
                      <div className="flex border-b">
                        <div className="w-[150px] flex-shrink-0 bg-gray-50 border-r px-2 py-2 flex items-center justify-center">
                          <span className="font-semibold text-gray-900 text-sm">Court / Time</span>
                        </div>
                        <div ref={slotsContainerRef} className="flex-1 flex bg-gray-50">
                          {timeSlots.map((time, index) => (
                            <div 
                              key={time} 
                              className="border-r last:border-r-0 flex items-start justify-start"
                              style={{ width: `${100 / timeSlots.length}%` }}
                            >
                              <div className="text-left py-2 pl-1">
                                <div className="text-xs font-semibold text-gray-900">
                                  {time}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Court Rows */}
                      {courts.map((court: any, courtIndex: number) => {
                        // Get slots from API response for this court
                        const courtAvailability = availability.find(
                          (courtData) => courtData.courtId === court.id,
                        );
                        
                        // Use slots from API (which now includes duration), fallback to frontend generation
                        const courtSlots = courtAvailability?.slots || generateCourtTimeSlots(court.slotDuration);
                        
                        return (
                          <div key={court.id} className="flex border-b last:border-b-0">
                            {/* Court Name Column */}
                            <div className="w-[150px] flex-shrink-0 bg-white border-r px-2 py-1 flex items-center" style={{ height: `${slotHeight}px` }}>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 flex-shrink-0">
                                  {court.type === "Multi-purpose" ? (
                                    <PiCourtBasketball className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <Image
                                      src={sportIcons[court.type] || "/icons/tennis.svg"}
                                      alt={`${court.type} icon`}
                                      width={20}
                                      height={20}
                                      className="w-5 h-5 opacity-60"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-xs text-gray-900 truncate">
                                    {court.name.replace(court.type + ' ', '').replace(court.type, '') || court.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{court.type}</div>
                                </div>
                                {/* Court Info Icon */}
                                {(court.locationType || court.surface) && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button 
                                        type="button"
                                        className="ml-auto flex-shrink-0 cursor-pointer p-0.5 rounded-full hover:bg-gray-100 transition-colors group"
                                      >
                                        <Info className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                      className="w-auto p-2 bg-white border border-gray-200 shadow-lg" 
                                      side="right"
                                      align="center"
                                      sideOffset={4}
                                      showArrow
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                      <div className="space-y-1 text-sm text-gray-700">
                                        {court.locationType && (
                                          <p>{court.locationType === "indoor" ? t("locationType.indoor") : t("locationType.outdoor")}</p>
                                        )}
                                        {court.surface && (
                                          <p>{t(`surface.${court.surface}` as any)}</p>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </div>

                            {/* Slots Container - relative positioning for variable width slots */}
                            <div 
                              className="flex-1 relative bg-white"
                              style={{ height: `${slotHeight}px` }}
                            >
                              {/* Background grid lines for visual reference */}
                              <div className="absolute inset-0 flex">
                                {timeSlots.map((time, idx) => (
                                  <div 
                                    key={time}
                                    className="border-r last:border-r-0 h-full"
                                    style={{ width: `${100 / timeSlots.length}%` }}
                                  />
                                ))}
                              </div>
                              
                              {/* Actual slots with variable widths - use absolute positioning for proper alignment */}
                              <div className="absolute inset-0">
                                {courtSlots.map((courtSlot: any, timeIndex: number) => {
                                  // courtSlot now contains full slot data from API (time, duration, available, etc.)
                                  // Get duration from slot or court fallback
                                  const slotDuration = courtSlot.duration || court.slotDuration || 60;
                                  
                                  // Calculate slot width and position as percentage of full row
                                  const slotWidthPercent = getSlotWidthPercent(slotDuration);
                                  const slotLeftPercent = getSlotLeftPercent(courtSlot.time);

                                  // If slot doesn't have availability info (fallback generation), show as unavailable
                                  if (courtSlot.available === undefined) {
                                    return (
                                      <div
                                        key={`${court.id}-${courtSlot.time}`}
                                        className="p-0.5 h-full absolute"
                                        style={{ 
                                          width: `${slotWidthPercent}%`,
                                          left: `${slotLeftPercent}%`
                                        }}
                                      >
                                        <div className="w-full h-full bg-gray-100 rounded border border-gray-200"></div>
                                      </div>
                                    );
                                  }

                                  const isSelected =
                                    selectedSlot?.courtId === court.id &&
                                    selectedSlot?.time === courtSlot.time;
                                  const status = getSlotStatus(courtSlot, court.id);
                                  const slotKey = `${court.id}-${courtSlot.time}`;
                                  const waitlistEntry = waitlistEntries.get(slotKey);
                                  const isOnWaitlist = waitlistEntry?.status === "waitlist";

                                  // Calculate end time for display
                                  const [startHours, startMinutes] = courtSlot.time.split(":").map(Number);
                                  const endTotalMinutes = startHours * 60 + startMinutes + slotDuration;
                                  const endHours = Math.floor(endTotalMinutes / 60);
                                  const endMins = endTotalMinutes % 60;
                                  const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

                                  // Show text based on slot duration:
                                  // - 30min slots: show only price (no time)
                                  // - 45min+ slots: show both time and price
                                  const showSlotText = slotDuration >= 30;
                                  const showSlotTime = slotDuration >= 45;

                                  return (
                                    <div
                                      key={`${court.id}-${courtSlot.time}`}
                                      className="p-0.5 h-full absolute"
                                      style={{ 
                                        width: `${slotWidthPercent}%`,
                                        left: `${slotLeftPercent}%`
                                      }}
                                    >
                                      {status === "booked" && !isOnWaitlist ? (
                                        <button
                                          type="button"
                                          onClick={() => handleJoinWaitlist(court.id, court.name, courtSlot.time)}
                                          onMouseEnter={() => {
                                            if (hoverTimeout) clearTimeout(hoverTimeout);
                                            const timeout = setTimeout(() => {
                                              setHoveredSlot({
                                                courtId: court.id,
                                                time: courtSlot.time,
                                                price: getPricingTier(courtSlot.time, court.pricing).price,
                                              });
                                            }, 100);
                                            setHoverTimeout(timeout);
                                          }}
                                          onMouseLeave={() => {
                                            if (hoverTimeout) {
                                              clearTimeout(hoverTimeout);
                                              setHoverTimeout(null);
                                            }
                                            setHoveredSlot(null);
                                          }}
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center relative group",
                                            "bg-red-200 border-red-300 text-red-900 hover:bg-red-300 cursor-pointer",
                                            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              {showSlotTime && <div className="font-semibold">{courtSlot.time}</div>}
                                              <div className="font-bold">
                                                €{getPricingTier(courtSlot.time, court.pricing).price}
                                              </div>
                                            </div>
                                          )}
                                        </button>
                                      ) : isOnWaitlist ? (
                                        <div
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center relative",
                                            "bg-yellow-100 border-yellow-300 text-yellow-800"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              {showSlotTime && <div className="font-semibold">{courtSlot.time}</div>}
                                              <div className="font-medium text-yellow-700">
                                                #{waitlistEntry.position}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (courtSlot.available) {
                                              handleSlotClick(
                                                court.id,
                                                courtSlot.time,
                                                courtSlot.available,
                                                courtSlot.price,
                                                slotDuration,
                                              );
                                            }
                                          }}
                                          onMouseEnter={() => {
                                            if (hoverTimeout) clearTimeout(hoverTimeout);
                                            const timeout = setTimeout(() => {
                                              setHoveredSlot({
                                                courtId: court.id,
                                                time: courtSlot.time,
                                                price: getPricingTier(courtSlot.time, court.pricing).price,
                                              });
                                            }, 100);
                                            setHoverTimeout(timeout);
                                          }}
                                          onMouseLeave={() => {
                                            if (hoverTimeout) {
                                              clearTimeout(hoverTimeout);
                                              setHoverTimeout(null);
                                            }
                                            setHoveredSlot(null);
                                          }}
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center relative group",
                                            getSlotColor(courtSlot, court.id, courtSlot.time, court.useAdvancedPricing),
                                            isSelected && "ring-2 ring-blue-500 ring-offset-1",
                                            courtSlot.available && "cursor-pointer",
                                            !courtSlot.available && "cursor-not-allowed",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              {showSlotTime && (
                                                <div className="font-semibold">
                                                  {courtSlot.time}
                                                </div>
                                              )}
                                              <div className="font-bold">
                                                €{getPricingTier(courtSlot.time, court.pricing).price}
                                              </div>
                                            </div>
                                          )}
                                        </button>
                                      )}
                                      
                                      {/* Hover Tooltip */}
                                      {hoveredSlot?.courtId === court.id && 
                                        hoveredSlot?.time === courtSlot.time && (() => {
                                          // Show tooltip above for the last 3 rows to prevent cropping
                                          const isLastThree = courtIndex >= courts.length - 3;
                                          return (
                                            <div className={cn(
                                              "absolute z-50 left-1/2 transform -translate-x-1/2",
                                              isLastThree ? "bottom-full mb-2" : "top-full mt-2"
                                            )}>
                                              {status === "available" ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span className="font-semibold text-green-900 text-sm">Available</span>
                                                  </div>
                                                  <div className="text-xs text-green-700">
                                                    <div className="font-medium text-green-900">{court.name} - {courtSlot.time} to {endTime}</div>
                                                    <div className="text-green-800 mt-1">
                                                      Duration: {courtSlot.duration} minutes
                                                    </div>
                                                    <div className="font-semibold text-green-900 mt-1">
                                                      Price: {getPricingTier(courtSlot.time, court.pricing).price} €
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : status === "booked" ? (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span className="font-semibold text-red-900 text-sm">Booked</span>
                                                  </div>
                                                  <div className="text-xs text-red-700">
                                                    <div className="font-medium text-red-900">{court.name} - {courtSlot.time}</div>
                                                    {!isOnWaitlist ? (
                                                      <div className="text-red-800 mt-1">Click to join waitlist</div>
                                                    ) : waitlistEntry ? (
                                                      <div className="text-yellow-800 mt-1">Waitlist Position #{waitlistEntry.position}</div>
                                                    ) : null}
                                                    <div className="font-semibold text-red-900 mt-1">
                                                      Price: {getPricingTier(courtSlot.time, court.pricing).price} €
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : status === "rain" ? (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="font-semibold text-blue-900 text-sm">Rain</span>
                                                  </div>
                                                  <div className="text-xs text-blue-700">
                                                    <div className="font-medium">{court.name} - {courtSlot.time}</div>
                                                    <div className="text-blue-600 mt-1">This time slot is unavailable due to rain</div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    <span className="font-semibold text-gray-900 text-sm">Unavailable</span>
                                                  </div>
                                                  <div className="text-xs text-gray-700">
                                                    <div className="font-medium">{court.name} - {courtSlot.time}</div>
                                                    <div className="text-gray-600 mt-1">This time slot is not available for booking</div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Grid View - Mirrors desktop exactly, just transposed (time vertical, courts horizontal) */}
              <div className="md:hidden">
                {/* Outer container - no vertical scroll, full height for all slots */}
                <div className="bg-white rounded-lg border">
                  {/* Sticky Header Row (Court Names) */}
                  <div className="flex bg-gray-50 border-b shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] sticky top-16 z-20 rounded-t-lg">
                    {/* Top-left corner cell - "Time / Court" - matches time column width */}
                    <div className="w-[56px] h-[52px] flex flex-col items-center justify-center bg-gray-50 border-r flex-shrink-0">
                      <span className="text-[9px] font-semibold text-gray-700">Time</span>
                      <span className="text-[8px] text-gray-400">/</span>
                      <span className="text-[9px] font-semibold text-gray-700">Court</span>
                    </div>
                    
                    {/* Court Headers - horizontal scroll only using ScrollArea */}
                    <ScrollArea 
                      className="flex-1 whitespace-nowrap border-l" 
                      id="mobile-court-headers"
                    >
                      <div className="flex">
                        {courts.map((court: any) => (
                          (court.locationType || court.surface) ? (
                            <Popover key={court.id}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-[56px] h-[52px] flex flex-col items-center justify-center px-0.5 bg-gray-50 border-r hover:bg-gray-100 transition-colors flex-shrink-0"
                                >
                                  <span className="text-[10px] font-medium text-gray-900 text-center leading-tight truncate w-full">
                                    {court.name.replace(court.type + ' ', '').replace(court.type, '') || court.name}
                                  </span>
                                  <span className="text-[9px] text-gray-500">{court.type}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-2 bg-white border border-gray-200 shadow-lg" 
                                side="bottom"
                                align="center"
                                sideOffset={4}
                                showArrow
                              >
                                <div className="space-y-1 text-sm text-gray-700">
                                  {court.locationType && (
                                    <p>{court.locationType === "indoor" ? t("locationType.indoor") : t("locationType.outdoor")}</p>
                                  )}
                                  {court.surface && (
                                    <p>{t(`surface.${court.surface}` as any)}</p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div key={court.id} className="w-[56px] h-[52px] flex flex-col items-center justify-center px-0.5 bg-gray-50 border-r flex-shrink-0">
                              <span className="text-[10px] font-medium text-gray-900 text-center leading-tight truncate w-full">
                                {court.name.replace(court.type + ' ', '').replace(court.type, '') || court.name}
                              </span>
                              <span className="text-[9px] text-gray-500">{court.type}</span>
                            </div>
                          )
                        ))}
                      </div>
                      {/* Hidden ScrollBar for header to create single scroll effect */}
                      <ScrollBar orientation="horizontal" className="invisible" />
                    </ScrollArea>
                  </div>
                  
                  {/* Body Area - full height, horizontal scroll only */}
                  <div className="flex">
                    {/* Time Column - fixed 56px width, no scroll */}
                    <div className="w-[56px] flex-shrink-0 bg-white border-r">
                      <div className="relative" style={{ height: `${totalGridHours * 56}px` }}>
                        {/* Hour markers for reference - with grid lines */}
                        {hourHeaders.map((time) => (
                          <div 
                            key={time}
                            className="absolute w-[56px] flex items-start justify-center bg-white border-b border-gray-200"
                            style={{ 
                              top: `${getSlotTopPercent(time)}%`,
                              height: `${getSlotHeightPercent(60)}%`
                            }}
                          >
                            <span className="text-[11px] font-semibold text-gray-900 pt-1">{time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Court Columns Container - horizontal scroll only using ScrollArea */}
                    <ScrollArea 
                      className="flex-1 border-l"
                      id="mobile-court-columns"
                      style={{ height: `${totalGridHours * 56}px` }}
                    >
                      <div className="flex" style={{ height: `${totalGridHours * 56}px` }}>
                        {/* Court Columns - slots only (headers are in sticky row above) */}
                        {courts.map((court: any, courtIndex: number) => {
                          const courtAvailability = availability.find(
                            (courtData) => courtData.courtId === court.id,
                          );
                          
                          // Use slots from API (same as desktop), fallback to frontend generation
                          const courtSlots = courtAvailability?.slots || generateCourtTimeSlots(court.slotDuration);
                        
                          return (
                            <div key={court.id} className="w-[56px] flex-shrink-0">
                              {/* Time Slots Container - variable height slots matching desktop */}
                              <div 
                                className="relative bg-white border-r w-full"
                                style={{ height: `${totalGridHours * 56}px` }}
                              >
                                {/* Background grid lines for visual reference (hourly) */}
                                <div className="absolute inset-0">
                                  {hourHeaders.map((time) => (
                                    <div 
                                      key={time}
                                      className="absolute w-full border-b border-gray-100"
                                      style={{ 
                                        top: `${getSlotTopPercent(time)}%`,
                                        height: `${getSlotHeightPercent(60)}%`
                                      }}
                                    />
                                  ))}
                                </div>
                                
                                {/* Actual slots with variable heights - mirrors desktop exactly */}
                                {courtSlots.map((courtSlot: any, timeIndex: number) => {
                                  // Get duration from slot or court fallback (same as desktop)
                                  const slotDuration = courtSlot.duration || court.slotDuration || 60;
                                  
                                  // Calculate slot height as percentage of full column
                                  const slotHeightPercent = getSlotHeightPercent(slotDuration);
                                  const slotTopPercent = getSlotTopPercent(courtSlot.time);

                                  // If slot doesn't have availability info, show as unavailable (same as desktop)
                                  if (courtSlot.available === undefined) {
                                    return (
                                      <div
                                        key={`${court.id}-${courtSlot.time}`}
                                        className="absolute w-full p-0.5"
                                        style={{ 
                                          top: `${slotTopPercent}%`,
                                          height: `${slotHeightPercent}%`
                                        }}
                                      >
                                        <div className="w-full h-full bg-gray-100 rounded border border-gray-200"></div>
                                      </div>
                                    );
                                  }

                                  const isSelected = selectedSlot?.courtId === court.id && selectedSlot?.time === courtSlot.time;
                                  const status = getSlotStatus(courtSlot, court.id);
                                  const slotKey = `${court.id}-${courtSlot.time}`;
                                  const waitlistEntry = waitlistEntries.get(slotKey);
                                  const isOnWaitlist = waitlistEntry?.status === "waitlist";
                                  const pricingTier = getPricingTier(courtSlot.time, court.pricing);
                                  const price = pricingTier.price;

                                  // Only show text for slots >= 30 minutes
                                  const showSlotText = slotDuration >= 30;
                                  // Only show price for slots > 30 minutes (30-min slots show time only)
                                  const showPrice = slotDuration > 30;

                                  return (
                                    <div
                                      key={`${court.id}-${courtSlot.time}`}
                                      className="absolute w-full p-0.5"
                                      style={{ 
                                        top: `${slotTopPercent}%`,
                                        height: `${slotHeightPercent}%`
                                      }}
                                    >
                                      {status === "booked" && !isOnWaitlist ? (
                                        <button
                                          type="button"
                                          onClick={() => handleJoinWaitlist(court.id, court.name, courtSlot.time)}
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center",
                                            "bg-red-200 border-red-300 text-red-900 hover:bg-red-300 cursor-pointer"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              <div className="font-semibold">{courtSlot.time}</div>
                                              {showPrice && <div className="font-bold">€{price}</div>}
                                            </div>
                                          )}
                                        </button>
                                      ) : isOnWaitlist && waitlistEntry ? (
                                        <div
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center",
                                            "bg-yellow-100 border-yellow-300 text-yellow-800"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              <div className="font-semibold">{courtSlot.time}</div>
                                              <div className="font-medium">#{waitlistEntry.position}</div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (courtSlot.available) {
                                              handleSlotClick(
                                                court.id,
                                                courtSlot.time,
                                                courtSlot.available,
                                                courtSlot.price,
                                                slotDuration,
                                              );
                                            }
                                          }}
                                          className={cn(
                                            "w-full h-full border rounded text-[11px] transition-all duration-200 flex flex-col items-center justify-center",
                                            getSlotColor(courtSlot, court.id, courtSlot.time, court.useAdvancedPricing),
                                            isSelected && "ring-2 ring-blue-500 ring-offset-1",
                                            courtSlot.available && "cursor-pointer",
                                            !courtSlot.available && "cursor-not-allowed"
                                          )}
                                        >
                                          {showSlotText && (
                                            <div className="text-center leading-tight">
                                              <div className="font-semibold">{courtSlot.time}</div>
                                              {showPrice && <div className="font-bold">€{price}</div>}
                                            </div>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSlot && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">Selected Time Slot</h4>
              <p className="text-sm text-blue-700">
                {format(currentDate, "EEEE, d MMMM yyyy")} at{" "}
                {selectedSlot.time} - {courts.find((c: any) => c.id === selectedSlot.courtId)?.name}
                {selectedSlot.price && ` - €${selectedSlot.price}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waitlist Summary Dialog */}
      {selectedWaitlistSlot && (
        <WaitlistSummaryDialog
          open={waitlistDialogOpen}
          onOpenChange={setWaitlistDialogOpen}
          facilityId={facilityId}
          facilityName={facilityName}
          facilityAddress={facility && 'address' in facility ? `${facility.address}, ${facility.city || ''}` : undefined}
          courtId={selectedWaitlistSlot.courtId}
          courtName={selectedWaitlistSlot.courtName}
          courtType={selectedWaitlistSlot.courtType}
          selectedDate={selectedWaitlistSlot.date}
          selectedTime={selectedWaitlistSlot.time}
          price={selectedWaitlistSlot.price}
          duration={60}
          onJoinSuccess={handleWaitlistSuccess}
        />
      )}
      {selectedSlot && (
        <BookingSummaryDialog
          open={showBookingDialog}
          onOpenChange={(open) => {
            setShowBookingDialog(open);
            if (!open) {
              handleBookingCancelled();
            }
          }}
          facilityName={facilityName}
          facilityAddress={facility && 'address' in facility ? `${facility.address}, ${facility.city || ''}` : undefined}
          facilityId={facilityId}
          courtName={courts.find((c: any) => c.id === selectedSlot.courtId)?.name || ""}
          courtType={courts.find((c: any) => c.id === selectedSlot.courtId)?.type || ""}
          courtId={selectedSlot.courtId}
          selectedDate={format(currentDate, "yyyy-MM-dd")}
          selectedTime={selectedSlot.time}
          price={selectedSlot.price || 0}
          duration={selectedSlot.duration || 60}
          onBookNow={handleBookingConfirmed}
        />
      )}

      {/* Scroll Sync Effect */}
      <SyncScrollEffect />
    </>
  );
}

// Separate component for scroll sync to avoid massive file redraws
function SyncScrollEffect() {
  useEffect(() => {
    const headerRoot = document.getElementById('mobile-court-headers');
    const bodyRoot = document.getElementById('mobile-court-columns');
    
    if (!headerRoot || !bodyRoot) return;
    
    // Radix ScrollArea structure: Root -> Viewport -> Content
    // We need to find the Viewport elements which have the scroll capability
    const headerViewport = headerRoot.querySelector('[data-radix-scroll-area-viewport]');
    const bodyViewport = bodyRoot.querySelector('[data-radix-scroll-area-viewport]');
    
    if (!headerViewport || !bodyViewport) return;
    
    const handleHeaderScroll = () => {
      if (Math.abs(headerViewport.scrollLeft - bodyViewport.scrollLeft) > 1) {
        bodyViewport.scrollLeft = headerViewport.scrollLeft;
      }
    };
    
    const handleBodyScroll = () => {
      if (Math.abs(bodyViewport.scrollLeft - headerViewport.scrollLeft) > 1) {
        headerViewport.scrollLeft = bodyViewport.scrollLeft;
      }
    };
    
    headerViewport.addEventListener('scroll', handleHeaderScroll);
    bodyViewport.addEventListener('scroll', handleBodyScroll);
    
    return () => {
      headerViewport.removeEventListener('scroll', handleHeaderScroll);
      bodyViewport.removeEventListener('scroll', handleBodyScroll);
    };
  }); 
  
  return null;
}