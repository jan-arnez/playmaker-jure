"use client";

import { useMemo, useState, useEffect } from "react";
import {
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { WeekCellsHeight } from "@/components/constants";

// Limit hours to 7:00-22:00 for better usability
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 22;
const CALENDAR_CELL_HEIGHT = 48; // Reduced from 64px for more compact view
import { cn } from "@/lib/utils";

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

interface ProviderCalendarWeekViewProps {
  currentDate: Date;
  courts: Court[];
  bookings: Booking[];
  onBookingSelect: (booking: Booking) => void;
  onBookingCreate?: (courtId: string, startTime: Date) => void;
}

interface PositionedBooking {
  booking: Booking;
  top: number;
  height: number;
}

function getStatusColor(status: string): string {
  // Use consistent green color matching the website theme for all bookings
  return "bg-primary hover:bg-primary/90";
}

export function ProviderCalendarWeekView({
  currentDate,
  courts,
  bookings,
  onBookingSelect,
  onBookingCreate,
}: ProviderCalendarWeekViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }), // Monday
    [currentDate]
  );
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, CALENDAR_START_HOUR),
      end: addHours(dayStart, CALENDAR_END_HOUR - 1),
    });
  }, [currentDate]);

  // Group bookings by court and day
  const bookingsByCourtAndDay = useMemo(() => {
    const result: Record<string, Record<string, PositionedBooking[]>> = {};

    // Safety check: ensure courts and days are arrays
    if (!Array.isArray(courts) || !Array.isArray(days)) {
      return result;
    }

    courts.forEach((court) => {
      result[court.id] = {};
      days.forEach((day) => {
        result[court.id][day.toISOString()] = [];
      });
    });

    if (!Array.isArray(bookings)) {
      return result;
    }

    bookings.forEach((booking) => {
      if (!booking.court) return;

      const courtId = booking.court.id;
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      // Find all days this booking spans
      days.forEach((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = addHours(dayStart, 24);

        // Check if booking overlaps with this day
        if (bookingEnd > dayStart && bookingStart < dayEnd) {
          const adjustedStart = bookingStart < dayStart ? dayStart : bookingStart;
          const adjustedEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd;

          const startHour = getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
          const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;

          const top = (startHour - CALENDAR_START_HOUR) * CALENDAR_CELL_HEIGHT;
          const height = (endHour - startHour) * CALENDAR_CELL_HEIGHT;

          result[courtId][day.toISOString()].push({
            booking,
            top,
            height,
          });
        }
      });
    });

    return result;
  }, [courts, bookings, days]);

  // Calculate current time position for custom hours (7-22)
  const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
  const [currentTimeVisible, setCurrentTimeVisible] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const dayStartMinutes = CALENDAR_START_HOUR * 60;
      const dayEndMinutes = CALENDAR_END_HOUR * 60;
      const dayDuration = dayEndMinutes - dayStartMinutes;

      // Calculate position as percentage of visible day (7-22)
      const position = ((totalMinutes - dayStartMinutes) / dayDuration) * 100;

      // Check if current day is in view
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      const isVisible = now >= weekStart && now <= weekEnd && 
                       hours >= CALENDAR_START_HOUR && hours < CALENDAR_END_HOUR;

      setCurrentTimePosition(Math.max(0, Math.min(100, position)));
      setCurrentTimeVisible(isVisible);
    };

    calculateTimePosition();
    const interval = setInterval(calculateTimePosition, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      {/* Scrollable container for both header and content */}
      <div className="flex-1 overflow-auto">
        {/* Header with days and court info */}
        <div className="grid border-b bg-gray-50 sticky top-0 z-20" style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(0, 1fr))` }}>
          {/* First column with court information */}
          <div className="border-r p-2">
            {Array.isArray(courts) && courts.length > 0 ? (
              <div className="space-y-3">
                {courts.map((court) => (
                  <div key={court.id} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="font-medium text-sm text-gray-900">{court.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {court.sportCategory.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {court.facility.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">No courts</div>
            )}
          </div>
          {/* Day columns */}
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r last:border-r-0 p-2 text-center text-sm",
                isToday(day) && "bg-blue-50 font-semibold"
              )}
            >
              <div className="font-medium">{format(day, "EEE")}</div>
              <div className="text-xs text-gray-500">{format(day, "MMM d")}</div>
            </div>
          ))}
        </div>

        {/* Scrollable content - one row per court */}
        {Array.isArray(courts) && courts.length > 0 ? courts.map((court) => (
          <div
            key={court.id}
            className="grid border-b last:border-b-0"
            style={{ gridTemplateColumns: `200px repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {/* Empty first column - court info is in header */}
            <div className="border-r bg-gray-50 sticky left-0 z-10"></div>

            {/* Day columns for this court */}
            {days.map((day) => {
              const courtBookings = bookingsByCourtAndDay[court.id]?.[day.toISOString()] || [];

              return (
                <div
                  key={`${court.id}-${day.toISOString()}`}
                  className="border-r last:border-r-0 relative"
                >
                  {/* Time grid */}
                  <div className="relative" style={{ minHeight: `${hours.length * CALENDAR_CELL_HEIGHT}px` }}>
                    {hours.map((hour, hourIndex) => (
                      <div
                        key={hour.toISOString()}
                        className="border-b border-gray-200"
                        style={{ height: CALENDAR_CELL_HEIGHT }}
                      >
                        {hourIndex % 2 === 0 && (
                          <span className="text-xs text-gray-400 px-2">
                            {format(hour, "HH:mm")}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Bookings for this court on this day */}
                    {courtBookings.map((positioned) => (
                      <div
                        key={positioned.booking.id}
                        className={cn(
                          "absolute left-1 right-1 rounded px-2 py-1 text-white text-xs cursor-pointer shadow-sm",
                          getStatusColor(positioned.booking.status)
                        )}
                        style={{
                          top: `${positioned.top}px`,
                          height: `${positioned.height}px`,
                          minHeight: "24px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingSelect(positioned.booking);
                        }}
                      >
                        <div className="font-medium truncate">
                          {positioned.booking.user.name || positioned.booking.user.email}
                        </div>
                        <div className="text-[10px] opacity-90">
                          {format(positioned.booking.startTime, "HH:mm")} -{" "}
                          {format(positioned.booking.endTime, "HH:mm")}
                        </div>
                      </div>
                    ))}

                    {/* Current time indicator */}
                    {currentTimeVisible && isToday(day) && (
                      <div
                        className="absolute right-0 left-0 z-10 pointer-events-none"
                        style={{ top: `${currentTimePosition}%` }}
                      >
                        <div className="relative flex items-center">
                          <div className="bg-red-500 absolute -left-1 h-2 w-2 rounded-full"></div>
                          <div className="bg-red-500 h-[2px] w-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No courts available</p>
          </div>
        )}
      </div>
    </div>
  );
}

