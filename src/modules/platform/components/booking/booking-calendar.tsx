"use client";

import { addDays, format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookingConfirmationDialog } from "./booking-confirmation-dialog";
import { DayPicker } from "./day-picker";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookingId?: string;
  userName?: string;
}

interface CourtAvailability {
  courtId: string;
  courtName: string;
  slots: TimeSlot[];
}

interface BookingCalendarProps {
  facilityId: string;
  facilityName: string;
  onBookingSelect?: (date: string, time: string) => void;
}

export function BookingCalendar({
  facilityId,
  facilityName,
  onBookingSelect,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<CourtAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    courtId: string;
    time: string;
  } | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate time slots (8 AM to 10 PM) - memoized to prevent rerenders
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const hour = 8 + i;
        return `${hour.toString().padStart(2, "0")}:00`;
      }),
    [],
  );

  // Generate courts - memoized to prevent rerenders
  const courts = useMemo(() => {
    return [
      { id: "court-1", name: "Court 1" },
      { id: "court-2", name: "Court 2" },
      { id: "court-3", name: "Court 3" },
      { id: "court-4", name: "Court 4" },
    ];
  }, []);

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
      const mockAvailability = courts.map((court) => ({
        courtId: court.id,
        courtName: court.name,
        slots: timeSlots.map((time) => ({
          id: `${court.id}-${time}`,
          time,
          available: Math.random() > 0.3, // 70% availability
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

  const handlePreviousDay = useCallback(() => {
    setCurrentDate(addDays(currentDate, -1));
  }, [currentDate]);

  const handleNextDay = useCallback(() => {
    setCurrentDate(addDays(currentDate, 1));
  }, [currentDate]);

  const handleSlotClick = useCallback(
    (courtId: string, time: string, available: boolean) => {
      if (available) {
        setSelectedSlot({ courtId, time });
        setShowBookingDialog(true);
        onBookingSelect?.(courtId, time);
      }
    },
    [onBookingSelect],
  );

  const getSlotStatus = useCallback((slot: TimeSlot) => {
    if (!slot.available) {
      return slot.userName ? "booked" : "unavailable";
    }
    return "available";
  }, []);

  const getSlotColor = useCallback(
    (slot: TimeSlot) => {
      const status = getSlotStatus(slot);
      switch (status) {
        case "available":
          return "bg-green-100 hover:bg-green-200 border-green-300";
        case "booked":
          return "bg-red-100 border-red-300 cursor-not-allowed";
        case "unavailable":
          return "bg-gray-100 border-gray-300 cursor-not-allowed";
        default:
          return "bg-gray-100";
      }
    },
    [getSlotStatus],
  );

  const handleConfirmBooking = useCallback(() => {
    setShowBookingDialog(true);
  }, []);

  const handleBookingConfirmed = useCallback(() => {
    setSelectedSlot(null);
    fetchAvailability(); // Refresh availability
  }, [fetchAvailability]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BsFillLightningChargeFill className="h-5 w-5" />
              Book Online at {facilityName}
            </CardTitle>
            
            {/* Legend - Top Right */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Picker */}
          <div className="flex items-center justify-center mb-6">
            <DayPicker
              selectedDate={currentDate}
              onDateChange={setCurrentDate}
              onPreviousDay={handlePreviousDay}
              onNextDay={handleNextDay}
            />
          </div>

          {/* Selected Date Display */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-lg">
              {format(currentDate, "EEEE, d MMMM yyyy")}
            </h3>
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
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Header Row */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  <div className="p-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  {courts.map((court) => (
                    <div key={court.id} className="text-center p-2">
                      <div className="text-sm font-medium">
                        {court.name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-5 gap-1 mb-1">
                    <div className="p-2 text-sm text-muted-foreground flex items-center">
                      {time}
                    </div>
                    {courts.map((court) => {
                      const courtAvailability = availability.find(
                        (courtData) => courtData.courtId === court.id,
                      );
                      const slot = courtAvailability?.slots.find(
                        (s) => s.time === time,
                      );

                      if (!slot) {
                        return (
                          <div
                            key={`${court.id}-${time}`}
                            className="p-2"
                          >
                            <div className="w-full h-8 bg-gray-50 border border-gray-200 rounded"></div>
                          </div>
                        );
                      }

                      const isSelected =
                        selectedSlot?.courtId === court.id &&
                        selectedSlot?.time === time;
                      const status = getSlotStatus(slot);

                      return (
                        <div
                          key={`${court.id}-${time}`}
                          className="p-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotClick(
                                court.id,
                                time,
                                slot.available,
                              )
                            }
                            disabled={!slot.available}
                            className={cn(
                              "w-full h-8 border rounded text-xs transition-colors",
                              getSlotColor(slot),
                              isSelected && "ring-2 ring-blue-500",
                              slot.available && "hover:shadow-sm",
                            )}
                            title={
                              status === "booked"
                                ? `Booked by ${slot.userName}`
                                : status === "unavailable"
                                  ? "Unavailable"
                                  : "Click to book"
                            }
                          >
                            {status === "booked" && (
                              <div className="w-full h-full bg-red-200 bg-opacity-50 flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}
                            {status === "unavailable" && (
                              <div className="w-full h-full bg-gray-200 bg-opacity-50 flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSlot && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">Selected Time Slot</h4>
              <p className="text-sm text-blue-700">
                {format(currentDate, "EEEE, d MMMM yyyy")} at{" "}
                {selectedSlot.time} - {courts.find(c => c.id === selectedSlot.courtId)?.name}
              </p>
              <Button className="mt-2" onClick={handleConfirmBooking}>
                Confirm Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Confirmation Dialog */}
      {selectedSlot && (
        <BookingConfirmationDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          facilityId={facilityId}
          facilityName={facilityName}
          selectedDate={format(currentDate, "yyyy-MM-dd")}
          selectedTime={selectedSlot.time}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}
    </>
  );
}
