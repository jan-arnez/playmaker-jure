"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays, addWeeks, format, subDays, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
// import { ProviderCalendarWeekView } from "./provider-calendar-week-view";
import { ProviderCalendarDayView } from "./provider-calendar-day-view";

import { BookingDetailsDialog } from "./booking-details-dialog";
import { BlockSlotDialog } from "./block-slot-dialog";
import { CreateBookingDialog } from "./create-booking-dialog";
import { RainSlotDialog } from "./rain-slot-dialog";

interface Facility {
  id: string;
  name: string;
  slug: string;
}

interface Court {
  id: string;
  name: string;
  facility: {
    id: string;
    name: string;
  };
  sportCategory: {
    id: string;
    name: string;
  };
  timeSlots?: string[];
  pricing?: {
    mode?: string;
    basicPrice?: number;
    advancedPricing?: {
      tiers?: Array<{
        enabled?: boolean;
        timeRange: string;
        price: number;
        name: string;
      }>;
    };
  };
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  facility: {
    id: string;
    name: string;
  };
  court: {
    id: string;
    name: string;
    sportCategory: {
      id: string;
      name: string;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ProviderCalendarProps {
  facilities: Facility[];
  courts: Court[];
  bookings: Booking[];
  selectedFacilityId?: string;
  selectedSportId?: string;
  onFacilityChange?: (facilityId: string) => void;
  organizationSlug?: string;
  userRole?: "owner" | "admin" | "staff";
  rainSlotsEnabled?: boolean;
  initialDate?: Date;
}

type CalendarView = "week" | "day";

export function ProviderCalendar({ 
  facilities, 
  courts = [], 
  bookings = [],
  selectedFacilityId,
  selectedSportId,
  onFacilityChange,
  organizationSlug,
  userRole,
  rainSlotsEnabled = true,
  initialDate,
}: ProviderCalendarProps) {
  // Initialize date from props
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date());
  const t = useTranslations("ProviderModule.calendar");
  
  // Update currentDate when initialDate changes (e.g., from query param)
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);
  // Weekly view temporarily hidden - defaulting to day view
  const [view, setView] = useState<CalendarView>("day");
  const [selectedFacility, setSelectedFacility] = useState<string>(selectedFacilityId || "all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ courtId: string; courtName: string; time: string; date: Date }>>([]);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [slotBlocks, setSlotBlocks] = useState<any[]>([]);
  const [isCreateBookingDialogOpen, setIsCreateBookingDialogOpen] = useState(false);
  const [createBookingData, setCreateBookingData] = useState<{ courtId?: string; startTime?: Date; endTime?: Date } | null>(null);
  const [rainSlotState, setRainSlotState] = useState<{ courtId: string; courtName: string; time: string; date: Date } | null>(null);
  const [availability, setAvailability] = useState<Record<string, Array<{
    time: string;
    available: boolean;
    price?: number;
    duration?: number;
    bookingId?: string;
    userName?: string;
  }>>>({});

  // Sync with external facility selection
  useEffect(() => {
    if (selectedFacilityId !== undefined) {
      setSelectedFacility(selectedFacilityId === "" ? "all" : selectedFacilityId);
    }
  }, [selectedFacilityId]);

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacility(facilityId);
    onFacilityChange?.(facilityId);
  };

  // Filter courts by facility AND sport
  const filteredCourts = useMemo(() => {
    if (!Array.isArray(courts)) {
      return [];
    }
    let filtered = courts;
    
    // Filter by facility
    if (selectedFacility !== "all") {
      filtered = filtered.filter((court) => court.facility.id === selectedFacility);
    }
    
    // Filter by sport
    if (selectedSportId && selectedSportId !== "all") {
      filtered = filtered.filter((court) => court.sportCategory.id === selectedSportId);
    }
    
    // Sort courts: first by sport category name (alphabetically), then by court number (natural numeric sort)
    const extractNumber = (name: string): number => {
      const match = name.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    filtered.sort((a, b) => {
      // First sort by sport category name
      const sportCompare = a.sportCategory.name.localeCompare(b.sportCategory.name);
      if (sportCompare !== 0) return sportCompare;
      
      // Then sort by court number (extracted from name)
      const aNum = extractNumber(a.name);
      const bNum = extractNumber(b.name);
      if (aNum !== bNum) return aNum - bNum;
      
      // Finally alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return filtered;
  }, [courts, selectedFacility, selectedSportId]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) {
      return [];
    }
    return bookings.filter((booking) => {
      if (selectedFacility !== "all" && booking.facility.id !== selectedFacility) {
        return false;
      }
      // Only show bookings for filtered courts
      if (booking.court && !filteredCourts.some((c) => c.id === booking.court!.id)) {
        return false;
      }
      return true;
    });
  }, [bookings, selectedFacility, filteredCourts]);

  // Fetch slot blocks and availability for the current date
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch slot blocks for the current date
        const startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);

        const blocksResponse = await fetch(
          `/api/slot-blocks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        if (blocksResponse.ok) {
          const data = await blocksResponse.json();
          setSlotBlocks(data.blocks || []);
        }

        // Fetch availability for each unique facility
        const uniqueFacilityIds = [...new Set(filteredCourts.map(c => c.facility.id))];
        const availabilityMap: Record<string, Array<{
          time: string;
          available: boolean;
          price?: number;
          duration?: number;
          bookingId?: string;
          userName?: string;
        }>> = {};

        for (const facilityId of uniqueFacilityIds) {
          try {
            const availResponse = await fetch(
              `/api/facilities/${facilityId}/availability?date=${currentDate.toISOString()}`
            );
            if (availResponse.ok) {
              const availData = await availResponse.json();
              // Map availability by court ID
              if (availData.availability && Array.isArray(availData.availability)) {
                for (const courtAvail of availData.availability) {
                  availabilityMap[courtAvail.courtId] = courtAvail.slots || [];
                }
              }
            }
          } catch (facilityError) {
            console.error(`Failed to fetch availability for facility ${facilityId}:`, facilityError);
          }
        }

        setAvailability(availabilityMap);
      } catch (error) {
        console.error("Failed to fetch slot blocks:", error);
      }
    };

    if (filteredCourts.length > 0) {
      fetchData();
    }
  }, [currentDate, filteredCourts]);

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (
    bookingId: string,
    status: "confirmed" | "cancelled" | "completed"
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking");
      }

      // Update local state
      const updatedBooking = filteredBookings.find((b) => b.id === bookingId);
      if (updatedBooking) {
        updatedBooking.status = status;
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error("Failed to update booking:", error);
      throw error;
    }
  };

  const handlePrevious = () => {
    // Weekly view temporarily hidden
    // if (view === "week") {
    //   setCurrentDate(subWeeks(currentDate, 1));
    // } else {
      setCurrentDate(subDays(currentDate, 1));
    // }
  };

  const handleNext = () => {
    // Weekly view temporarily hidden
    // if (view === "week") {
    //   setCurrentDate(addWeeks(currentDate, 1));
    // } else {
      setCurrentDate(addDays(currentDate, 1));
    // }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const viewTitle = useMemo(() => {
    // Weekly view temporarily hidden
    // if (view === "week") {
    //   const weekStart = new Date(currentDate);
    //   weekStart.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7)); // Monday
    //   const weekEnd = addDays(weekStart, 6);
    //   return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    // }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [currentDate]);

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border">
        {/* Left: Navigation and Date */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleToday}>
            {t("navigation.today")}
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-sm font-semibold text-gray-900 min-w-[140px]">
            {viewTitle}
          </span>
        </div>

        {/* Right: Add Button (for owners/admins) */}
        {(userRole === "owner" || userRole === "admin") && (
          <Button
            onClick={() => {
              setSelectedSlots([]);
              setCreateBookingData(null);
              setIsCreateBookingDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("navigation.createBooking")}
          </Button>
        )}

        {/* Right: View Toggle - Weekly view temporarily hidden */}
        {/* <div className="flex items-center gap-2">
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("day")}
          >
            Day
          </Button>
        </div> */}
      </div>

      {/* Calendar */}
      {/* Weekly view temporarily hidden */}
      {/* {view === "week" ? (
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="h-[calc(100vh-400px)] min-h-[600px] max-h-[800px]">
            <ProviderCalendarWeekView
              currentDate={currentDate}
              courts={filteredCourts}
              bookings={filteredBookings}
              onBookingSelect={handleBookingSelect}
            />
          </div>
        </div>
      ) : ( */}
        <ProviderCalendarDayView
          currentDate={currentDate}
          courts={filteredCourts}
          bookings={filteredBookings}
          slotBlocks={slotBlocks.map((block) => ({
            id: block.id,
            courtId: block.courtId,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            reason: block.reason,
            notes: block.notes,
          }))}
          availability={availability}
          onBookingSelect={handleBookingSelect}
          onSlotsSelected={(slots) => {
            setSelectedSlots(slots);
            // Open the unified dialog with tabs when slots are selected via drag
            // If multiple slots, default to block mode, otherwise booking mode
            if (slots.length > 0 && (userRole === "owner" || userRole === "admin")) {
              // Use the first slot's data to pre-fill the dialog
              const firstSlot = slots[0];
              const hour = parseInt(firstSlot.time.split(":")[0]);
              const slotTime = new Date(firstSlot.date);
              slotTime.setHours(hour, 0, 0, 0);
              setCreateBookingData({ courtId: firstSlot.courtId, startTime: slotTime });
              setIsCreateBookingDialogOpen(true);
            }
          }}
          onSlotClick={(courtId, startTime, duration) => {
            // Open booking dialog directly for single slot click
            if (userRole === "owner" || userRole === "admin") {
              // Calculate end time based on slot duration
              const endTime = new Date(startTime);
              endTime.setMinutes(endTime.getMinutes() + duration);
              setCreateBookingData({ courtId, startTime, endTime });
              setIsCreateBookingDialogOpen(true);
            }
          }}
          onRainSlotClick={(courtId, time, position) => {
            // Show rain slot management dialog
            if (userRole === "owner" || userRole === "admin") {
              const court = filteredCourts.find((c) => c.id === courtId);
              const hour = parseInt(time.split(":")[0]);
              const slotDate = new Date(currentDate);
              slotDate.setHours(hour, 0, 0, 0);
              setRainSlotState({
                courtId,
                courtName: court?.name || "",
                time,
                date: slotDate,
              });
            }
          }}
          userRole={userRole}
          rainSlotsEnabled={rainSlotsEnabled}
        />
      {/* )} */}

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        booking={selectedBooking}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedBooking(null);
        }}
        onStatusChange={handleStatusChange}
      />


      {/* Block Slot Dialog */}
      <BlockSlotDialog
        selectedSlots={selectedSlots}
        isOpen={isBlockDialogOpen}
        onClose={() => {
          setIsBlockDialogOpen(false);
          setSelectedSlots([]); // Clear selection when dialog closes
        }}
        onSuccess={() => {
          // Clear selection after successful block
          setSelectedSlots([]);
          
          // Refresh slot blocks
          const startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);

          fetch(
            `/api/slot-blocks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          )
            .then((res) => res.json())
            .then((data) => {
              setSlotBlocks(data.blocks || []);
            })
            .catch((error) => {
              console.error("Failed to refresh slot blocks:", error);
            });
        }}
      />

      {/* Create Manual Booking Dialog */}
      <CreateBookingDialog
        courtId={createBookingData?.courtId}
        startTime={createBookingData?.startTime}
        endTime={createBookingData?.endTime}
        courts={filteredCourts}
        selectedSlots={selectedSlots}
        isOpen={isCreateBookingDialogOpen}
        onClose={() => {
          setIsCreateBookingDialogOpen(false);
          setCreateBookingData(null);
          setSelectedSlots([]); // Clear selection when dialog closes
        }}
        onSuccess={() => {
          setSelectedSlots([]); // Clear selection after successful booking
          // Refresh the page to show new booking
          window.location.reload();
        }}
        onBlockSuccess={() => {
          // Refresh slot blocks after blocking
          const startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);

          fetch(
            `/api/slot-blocks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          )
            .then((res) => res.json())
            .then((data) => {
              setSlotBlocks(data.blocks || []);
            })
            .catch((error) => {
              console.error("Failed to refresh slot blocks:", error);
            });
        }}
      />

      {/* Rain Slot Management Dialog */}
      <RainSlotDialog
        courtId={rainSlotState?.courtId || ""}
        courtName={rainSlotState?.courtName || ""}
        time={rainSlotState?.time || ""}
        date={rainSlotState?.date || new Date()}
        isOpen={!!rainSlotState}
        onClose={() => {
          setRainSlotState(null);
        }}
        onFree={() => {
          // Refresh slot blocks after freeing
          const startDate = new Date(currentDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setHours(23, 59, 59, 999);

          fetch(
            `/api/slot-blocks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          )
            .then((res) => res.json())
            .then((data) => {
              setSlotBlocks(data.blocks || []);
            })
            .catch((error) => {
              console.error("Failed to refresh slot blocks:", error);
            });
          
          window.location.reload();
        }}
        onReserve={() => {
          // Open reservation dialog
          if (rainSlotState) {
            const hour = parseInt(rainSlotState.time.split(":")[0]);
            const slotTime = new Date(rainSlotState.date);
            slotTime.setHours(hour, 0, 0, 0);
            setCreateBookingData({ courtId: rainSlotState.courtId, startTime: slotTime });
            setIsCreateBookingDialogOpen(true);
          }
        }}
      />
    </div>
  );
}
