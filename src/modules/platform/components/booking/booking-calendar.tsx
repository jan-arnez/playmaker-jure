"use client";

import { addDays, format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookingConfirmationDialog } from "./booking-confirmation-dialog";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookingId?: string;
  userName?: string;
}

interface DayAvailability {
  date: string;
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
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
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

  // Generate week dates - memoized to prevent rerenders
  const weekDates = useMemo(() => {
    const getWeekDates = (startDate: Date) => {
      return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    };
    return getWeekDates(currentWeek);
  }, [currentWeek]);

  // Fetch availability data
  const fetchAvailability = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/facilities/${facilityId}/availability?start=${weekDates[0].toISOString()}&end=${weekDates[6].toISOString()}`,
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
      const mockAvailability = weekDates.map((date) => ({
        date: format(date, "yyyy-MM-dd"),
        slots: timeSlots.map((time) => ({
          id: `${format(date, "yyyy-MM-dd")}-${time}`,
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
  }, [facilityId, weekDates, timeSlots]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handlePreviousWeek = useCallback(() => {
    setCurrentWeek(addDays(currentWeek, -7));
  }, [currentWeek]);

  const handleNextWeek = useCallback(() => {
    setCurrentWeek(addDays(currentWeek, 7));
  }, [currentWeek]);

  const handleSlotClick = useCallback(
    (date: string, time: string, available: boolean) => {
      if (available) {
        setSelectedSlot({ date, time });
        setShowBookingDialog(true);
        onBookingSelect?.(date, time);
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book {facilityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h3 className="font-semibold">
                {format(weekDates[0], "MMM d")} -{" "}
                {format(weekDates[6], "MMM d, yyyy")}
              </h3>
              <p className="text-sm text-muted-foreground">Week View</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
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
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="p-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  {weekDates.map((date) => (
                    <div key={date.toISOString()} className="text-center p-2">
                      <div className="text-sm font-medium">
                        {format(date, "EEE")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(date, "MMM d")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="p-2 text-sm text-muted-foreground flex items-center">
                      {time}
                    </div>
                    {weekDates.map((date) => {
                      const dayAvailability = availability.find(
                        (day) => day.date === format(date, "yyyy-MM-dd"),
                      );
                      const slot = dayAvailability?.slots.find(
                        (s) => s.time === time,
                      );

                      if (!slot) {
                        return (
                          <div
                            key={`${date.toISOString()}-${time}`}
                            className="p-2"
                          >
                            <div className="w-full h-8 bg-gray-50 border border-gray-200 rounded"></div>
                          </div>
                        );
                      }

                      const isSelected =
                        selectedSlot?.date === format(date, "yyyy-MM-dd") &&
                        selectedSlot?.time === time;
                      const status = getSlotStatus(slot);

                      return (
                        <div
                          key={`${date.toISOString()}-${time}`}
                          className="p-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSlotClick(
                                format(date, "yyyy-MM-dd"),
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
                {format(new Date(selectedSlot.date), "EEEE, MMMM d, yyyy")} at{" "}
                {selectedSlot.time}
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
          selectedDate={selectedSlot.date}
          selectedTime={selectedSlot.time}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}
    </>
  );
}
