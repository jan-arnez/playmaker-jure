"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  addHours,
  eachHourOfInterval,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
// Limit hours to 7:00-22:00 for better usability
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 22;
const CALENDAR_CELL_HEIGHT = 48; // Reduced from 64px for more compact view
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPricingTier, getPricingColor, getSlotStatusColor } from "@/lib/slot-utils";

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

interface SlotBlock {
  id: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  reason: "tournament" | "maintenance" | "lessons" | "other" | "rain" | "rain_override";
  notes?: string | null;
}

interface ProviderCalendarDayViewProps {
  currentDate: Date;
  courts: Court[];
  bookings: Booking[];
  slotBlocks?: SlotBlock[];
  availability?: Record<string, Array<{
    time: string;
    available: boolean;
    price?: number;
    duration?: number;
    bookingId?: string;
    userName?: string;
  }>>;
  onBookingSelect: (booking: Booking) => void;
  onBookingCreate?: (courtId: string, startTime: Date) => void;
  onSlotsSelected?: (slots: Array<{ courtId: string; courtName: string; time: string; date: Date }>) => void;
  onSlotClick?: (courtId: string, startTime: Date, duration: number) => void;
  onRainSlotClick?: (courtId: string, time: string, position: { x: number; y: number }) => void;
  userRole?: "owner" | "admin" | "staff";
  rainSlotsEnabled?: boolean;
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

// Extract court number from court name (e.g., "Basketball Court 1" -> "1", "Court 2" -> "2")
function extractCourtNumber(courtName: string): string {
  // Match patterns like "Court 1", "Court 2", or numbers at the end
  const match = courtName.match(/(?:court\s+)?(\d+)$/i);
  if (match) {
    return match[1];
  }
  // If no number found, try to extract any number from the name
  const numberMatch = courtName.match(/\d+/);
  return numberMatch ? numberMatch[0] : "";
}

export function ProviderCalendarDayView({
  currentDate,
  courts,
  bookings,
  slotBlocks = [],
  availability = {},
  onBookingSelect,
  onBookingCreate,
  onSlotsSelected,
  onSlotClick,
  onRainSlotClick,
  userRole,
  rainSlotsEnabled = true,
}: ProviderCalendarDayViewProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ courtId: string; time: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ courtId: string; time: string } | null>(null);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const canBlockSlots = userRole === "owner" || userRole === "admin";
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);
    return eachHourOfInterval({
      start: addHours(dayStart, CALENDAR_START_HOUR),
      end: addHours(dayStart, CALENDAR_END_HOUR - 1),
    });
  }, [currentDate]);

  // Calculate selected slots from drag range
  const dragSelectedSlots = useMemo(() => {
    if (!dragStart || !dragEnd) return new Set<string>();
    
    // Only select if same court
    if (dragStart.courtId !== dragEnd.courtId) {
      return new Set<string>();
    }

    const startHour = parseInt(dragStart.time.split(":")[0]);
    const endHour = parseInt(dragEnd.time.split(":")[0]);
    const minHour = Math.min(startHour, endHour);
    const maxHour = Math.max(startHour, endHour);

    const selected = new Set<string>();
    for (let h = minHour; h <= maxHour; h++) {
      const timeStr = `${h.toString().padStart(2, "0")}:00`;
      selected.add(`${dragStart.courtId}-${timeStr}`);
    }
    return selected;
  }, [dragStart, dragEnd]);

  // Group slot blocks by court
  const blocksByCourt = useMemo(() => {
    const result: Record<string, Array<{ block: SlotBlock; top: number; height: number }>> = {};

    if (!Array.isArray(courts)) {
      return result;
    }

    courts.forEach((court) => {
      result[court.id] = [];
    });

    if (!Array.isArray(slotBlocks)) {
      return result;
    }

    slotBlocks.forEach((block) => {
      const blockStart = new Date(block.startTime);
      const blockEnd = new Date(block.endTime);
      const dayStart = startOfDay(currentDate);
      const dayEnd = addHours(dayStart, 24);

      // Find which court this block belongs to
      const court = courts.find((c) => {
        // We need to match by time - this is a simplified approach
        // In a real implementation, blocks should have courtId
        return true; // Placeholder - will need courtId in SlotBlock
      });

      if (blockEnd > dayStart && blockStart < dayEnd) {
        const adjustedStart = blockStart < dayStart ? dayStart : blockStart;
        const adjustedEnd = blockEnd > dayEnd ? dayEnd : blockEnd;

        const startHour = getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
        const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;

        const fullHeight = (endHour - startHour) * CALENDAR_CELL_HEIGHT;
        const height = fullHeight * 0.75;
        const top = (startHour - CALENDAR_START_HOUR) * CALENDAR_CELL_HEIGHT + (fullHeight - height) / 2;

        // For now, we'll need to update the API to include courtId in blocks
        // This is a placeholder implementation
      }
    });

    return result;
  }, [courts, slotBlocks, currentDate]);

  // Group bookings by court
  const bookingsByCourt = useMemo(() => {
    const result: Record<string, PositionedBooking[]> = {};

    // Safety check: ensure courts is an array
    if (!Array.isArray(courts)) {
      return result;
    }

    courts.forEach((court) => {
      result[court.id] = [];
    });

    if (!Array.isArray(bookings)) {
      return result;
    }

    bookings.forEach((booking) => {
      if (!booking.court) return;

      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const dayStart = startOfDay(currentDate);
      const dayEnd = addHours(dayStart, 24);

      // Check if booking is on this day
      if (bookingEnd > dayStart && bookingStart < dayEnd) {
        const adjustedStart = bookingStart < dayStart ? dayStart : bookingStart;
        const adjustedEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd;

        const startHour = getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
        const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;

        const fullHeight = (endHour - startHour) * CALENDAR_CELL_HEIGHT;
        // Reduce height by 25% to make boxes more compact
        const height = fullHeight * 0.75;
        // Center the box vertically within its time slot
        const top = (startHour - CALENDAR_START_HOUR) * CALENDAR_CELL_HEIGHT + (fullHeight - height) / 2;

        result[booking.court.id].push({
          booking,
          top,
          height,
        });
      }
    });

    return result;
  }, [courts, bookings, currentDate]);

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
      const isVisible = isSameDay(now, currentDate) && 
                       hours >= CALENDAR_START_HOUR && hours < CALENDAR_END_HOUR;

      setCurrentTimePosition(Math.max(0, Math.min(100, position)));
      setCurrentTimeVisible(isVisible);
    };

    calculateTimePosition();
    const interval = setInterval(calculateTimePosition, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // Handle mouse down - prepare for drag or click
  const handleMouseDown = useCallback(
    (courtId: string, time: string, e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only left mouse button

      const hour = parseInt(time.split(":")[0]);

      // Check if this slot has a booking
      const hasBooking = bookings.some((booking) => {
        if (!booking.court || booking.court.id !== courtId) return false;
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        const slotTime = new Date(currentDate);
        slotTime.setHours(hour, 0, 0, 0);
        const slotEndTime = new Date(slotTime);
        slotEndTime.setHours(hour + 1, 0, 0, 0);

        return (
          (slotTime >= bookingStart && slotTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (slotTime <= bookingStart && slotEndTime >= bookingEnd)
        );
      });

      // Check if this slot is rain (deterministic) - only if enabled
      const slotKey = `${courtId}-${time}`;
      const hash = slotKey.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const isRain = rainSlotsEnabled && !hasBooking && Math.abs(hash) % 10 < 1;

      if (hasBooking) {
        return; // Don't allow interaction with booked slots
      }

      // Rain slots are handled in onClick, not here
      if (isRain) {
        return;
      }

      // Store mouse position to detect drag vs click
      setMouseDownPos({ x: e.clientX, y: e.clientY });
      
      // If owner/admin, prepare for drag selection
      if (canBlockSlots) {
        setDragStart({ courtId, time });
        setDragEnd({ courtId, time });
      }
    },
    [canBlockSlots, bookings, currentDate]
  );

  // Handle single click - show action menu (only if not dragging)
  const handleSlotClick = useCallback(
    (courtId: string, time: string, duration: number, e: React.MouseEvent) => {
      // Don't show menu if we just finished a drag
      if (isDragging || !canBlockSlots) return;
      
      e.stopPropagation();
      
      // Parse time including minutes (e.g., "07:45" -> hours=7, minutes=45)
      const [hours, minutes] = time.split(":").map(Number);
      const slotTime = new Date(currentDate);
      slotTime.setHours(hours, minutes, 0, 0);

      // Check if this slot has a booking
      const slotEndTime = new Date(slotTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);
      
      const hasBooking = bookings.some((booking) => {
        if (!booking.court || booking.court.id !== courtId) return false;
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);

        return (
          (slotTime >= bookingStart && slotTime < bookingEnd) ||
          (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
          (slotTime <= bookingStart && slotEndTime >= bookingEnd)
        );
      });

      if (hasBooking) return;

      // Open booking dialog directly with duration
      if (onSlotClick) {
        onSlotClick(courtId, slotTime, duration);
      }
    },
    [canBlockSlots, isDragging, bookings, currentDate, onSlotClick]
  );

  // Handle mouse move - detect drag
  const handleMouseMove = useCallback(
    (courtId: string, time: string, e: React.MouseEvent) => {
      if (!mouseDownPos || !dragStart) return;
      
      // Check if mouse moved enough to be considered a drag (5px threshold)
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      
      if (moveDistance > 5) {
        // This is a drag
        if (!isDragging) {
          setIsDragging(true);
        }
        if (dragStart.courtId === courtId && canBlockSlots) {
          setDragEnd({ courtId, time });
        }
      }
    },
    [mouseDownPos, dragStart, isDragging, canBlockSlots]
  );

  // Handle mouse up - finish drag or handle click
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragStart && dragEnd && dragStart.courtId === dragEnd.courtId) {
        // This was a drag - calculate selected slots
        const startHour = parseInt(dragStart.time.split(":")[0]);
        const endHour = parseInt(dragEnd.time.split(":")[0]);
        const minHour = Math.min(startHour, endHour);
        const maxHour = Math.max(startHour, endHour);

        const selectedSlotsArray: Array<{ courtId: string; courtName: string; time: string; date: Date }> = [];
        for (let h = minHour; h <= maxHour; h++) {
          const timeStr = `${h.toString().padStart(2, "0")}:00`;
          const court = courts.find((c) => c.id === dragStart.courtId);
          selectedSlotsArray.push({
            courtId: dragStart.courtId,
            courtName: court?.name || "",
            time: timeStr,
            date: currentDate,
          });
        }

        // Notify parent to open block dialog
        if (onSlotsSelected && selectedSlotsArray.length > 0) {
          onSlotsSelected(selectedSlotsArray);
        }
      }
      
      // Reset drag state
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setMouseDownPos(null);
    };

    if (mouseDownPos) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, dragEnd, courts, currentDate, onSlotsSelected, mouseDownPos]);

  // Clear selection when date changes
  useEffect(() => {
    setSelectedSlots(new Set());
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
  }, [currentDate]);

  const totalHeight = hours.length * CALENDAR_CELL_HEIGHT;

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-white mx-auto w-fit">
      {/* Header with court names */}
      <div
        className="grid border-b bg-gray-50"
        style={{ gridTemplateColumns: `70px repeat(${courts.length}, 150px)` }}
      >
        <div className="border-r p-2 font-medium text-sm text-gray-700">
          Time
        </div>
        {courts.map((court) => {
          const courtNumber = extractCourtNumber(court.name);
          const displayText = courtNumber
            ? `${court.sportCategory.name} - Court ${courtNumber}`
            : `${court.sportCategory.name} - ${court.name}`;
          
          return (
            <div key={court.id} className="border-r last:border-r-0 p-2">
              <div className="font-medium text-sm text-gray-900">
                {displayText}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full height content - no scrolling */}
      <div
        className="grid overflow-visible"
        style={{ 
          gridTemplateColumns: `70px repeat(${courts.length}, 150px)`,
          height: `${totalHeight}px`
        }}
      >
        {/* Time column */}
        <div className="border-r bg-gray-50">
          {hours.map((hour, index) => (
            <div
              key={hour.toISOString()}
              className="border-b border-gray-200 flex items-center"
              style={{ height: CALENDAR_CELL_HEIGHT }}
            >
              <span className="text-xs text-gray-600 px-2">
                {format(hour, "HH:mm")}
              </span>
            </div>
          ))}
        </div>

        {/* Court columns */}
        {Array.isArray(courts) && courts.length > 0 ? courts.map((court) => {
          const courtBookings = bookingsByCourt[court.id] || [];

          return (
            <div
              key={court.id}
              className="border-r last:border-r-0 relative"
            >
              {/* Time grid - background hour lines */}
              <div
                className="relative"
                style={{ height: `${totalHeight}px` }}
              >
                {/* Background grid lines for visual reference */}
                {hours.map((hour, idx) => (
                  <div
                    key={hour.toISOString()}
                    className="border-b border-gray-100"
                    style={{ height: CALENDAR_CELL_HEIGHT }}
                  />
                ))}

                {/* Actual slots from availability API with variable heights */}
                {(() => {
                  // Get slots for this court from availability data
                  const courtSlots = availability[court.id] || [];
                  
                  // If no availability data, fall back to generating 1-hour slots
                  if (courtSlots.length === 0) {
                    return hours.map((hour) => {
                      const timeStr = format(hour, "HH:mm");
                      const slotKey = `${court.id}-${timeStr}`;
                      const isSelected = selectedSlots.has(slotKey) || dragSelectedSlots.has(slotKey);
                      
                      // Calculate position based on time
                      const hourNum = parseInt(timeStr.split(":")[0]);
                      const top = (hourNum - CALENDAR_START_HOUR) * CALENDAR_CELL_HEIGHT;
                      
                      return (
                        <div
                          key={slotKey}
                          className={cn(
                            "absolute left-0 right-0 border-b border-gray-200 transition-colors select-none",
                            isSelected && canBlockSlots && "ring-2 ring-blue-500 ring-opacity-75",
                            canBlockSlots && "cursor-pointer hover:bg-gray-100"
                          )}
                          style={{ 
                            top: `${top}px`, 
                            height: `${CALENDAR_CELL_HEIGHT}px` 
                          }}
                          onMouseDown={(e) => handleMouseDown(court.id, timeStr, e)}
                          onMouseMove={(e) => handleMouseMove(court.id, timeStr, e)}
                          onClick={(e) => handleSlotClick(court.id, timeStr, 60, e)}
                        />
                      );
                    });
                  }
                  
                  // Render slots from availability data with variable heights
                  return courtSlots.map((slot: { time: string; available: boolean; duration?: number; price?: number }) => {
                    const timeStr = slot.time;
                    const slotKey = `${court.id}-${timeStr}`;
                    const isSelected = selectedSlots.has(slotKey) || dragSelectedSlots.has(slotKey);
                    
                    // Parse time and calculate position
                    const [hours, minutes] = timeStr.split(":").map(Number);
                    const slotStartMinutes = hours * 60 + minutes;
                    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
                    
                    // Get duration (default 60 min if not specified)
                    const duration = slot.duration || 60;
                    
                    // Calculate pixel position and height
                    const top = ((slotStartMinutes - calendarStartMinutes) / 60) * CALENDAR_CELL_HEIGHT;
                    const height = (duration / 60) * CALENDAR_CELL_HEIGHT;
                    
                    // Check if this slot is within visible range
                    if (hours < CALENDAR_START_HOUR || hours >= CALENDAR_END_HOUR) {
                      return null;
                    }
                    
                    // Check for manual rain blocks
                    const hasManualRainBlock = slotBlocks.some((block) => {
                      if (block.courtId !== court.id || block.reason !== "rain") return false;
                      const blockStart = new Date(block.startTime);
                      const blockEnd = new Date(block.endTime);
                      const slotTime = new Date(currentDate);
                      slotTime.setHours(hours, minutes, 0, 0);
                      const slotEndTime = new Date(slotTime);
                      slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);
                      return (slotTime >= blockStart && slotTime < blockEnd) || 
                             (slotEndTime > blockStart && slotEndTime <= blockEnd) ||
                             (slotTime <= blockStart && slotEndTime >= blockEnd);
                    });
                    
                    // Check for blocked slots
                    const isBlocked = slotBlocks.some((block) => {
                      if (block.courtId !== court.id) return false;
                      if (block.reason === "rain_override" || block.reason === "rain") return false;
                      const blockStart = new Date(block.startTime);
                      const blockEnd = new Date(block.endTime);
                      const slotTime = new Date(currentDate);
                      slotTime.setHours(hours, minutes, 0, 0);
                      const slotEndTime = new Date(slotTime);
                      slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);
                      return (slotTime >= blockStart && slotTime < blockEnd) || 
                             (slotEndTime > blockStart && slotEndTime <= blockEnd) ||
                             (slotTime <= blockStart && slotEndTime >= blockEnd);
                    });
                    
                    // Check for rain override
                    const hasRainOverride = slotBlocks.some((block) => {
                      if (block.courtId !== court.id || block.reason !== "rain_override") return false;
                      const blockStart = new Date(block.startTime);
                      const blockEnd = new Date(block.endTime);
                      const slotTime = new Date(currentDate);
                      slotTime.setHours(hours, minutes, 0, 0);
                      const slotEndTime = new Date(slotTime);
                      slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);
                      return (slotTime >= blockStart && slotTime < blockEnd) || 
                             (slotEndTime > blockStart && slotEndTime <= blockEnd) ||
                             (slotTime <= blockStart && slotEndTime >= blockEnd);
                    });
                    
                    // Automatic rain detection (same as before)
                    const hash = slotKey.split('').reduce((a, b) => {
                      a = ((a << 5) - a) + b.charCodeAt(0);
                      return a & a;
                    }, 0);
                    const isAutomaticRain = rainSlotsEnabled && slot.available && !isBlocked && !hasRainOverride && !hasManualRainBlock && Math.abs(hash) % 10 < 1;
                    const isRain = isAutomaticRain || hasManualRainBlock;
                    
                    // Determine slot status
                    const slotStatus = !slot.available ? "booked" :
                                       isBlocked ? "blocked" :
                                       isRain ? "rain" : "available";
                    
                    const pricingTier = getPricingTier(timeStr);
                    const slotColor = getSlotStatusColor(slotStatus, pricingTier.tier, true);
                    
                    return (
                      <TooltipProvider key={slotKey}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute left-0 right-0 border border-gray-200 transition-colors select-none rounded-sm mx-0.5 flex flex-col items-center justify-center text-xs",
                                slotStatus === "available" && slotColor,
                                slotStatus === "booked" && "bg-red-200 border-red-300",
                                slotStatus === "blocked" && "bg-gray-300 border-gray-400",
                                slotStatus === "rain" && "bg-blue-200 border-blue-300",
                                isSelected && canBlockSlots && "ring-2 ring-blue-500 ring-opacity-75",
                                slotStatus === "available" && canBlockSlots && "cursor-pointer",
                                slotStatus === "rain" && (userRole === "owner" || userRole === "admin") && "cursor-pointer hover:bg-blue-300"
                              )}
                              style={{ 
                                top: `${top}px`, 
                                height: `${height - 2}px` // Subtract 2px for gap
                              }}
                              onMouseDown={(e) => {
                                if (!isRain && slotStatus === "available") {
                                  handleMouseDown(court.id, timeStr, e);
                                }
                              }}
                              onMouseMove={(e) => handleMouseMove(court.id, timeStr, e)}
                              onClick={(e) => {
                                if (isRain && onRainSlotClick && (userRole === "owner" || userRole === "admin")) {
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  onRainSlotClick(court.id, timeStr, {
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 10,
                                  });
                                } else if (!isRain && slotStatus === "available") {
                                  handleSlotClick(court.id, timeStr, duration, e);
                                }
                              }}
                            >
                              {/* Show time and price for slots >= 45 min */}
                              {duration >= 45 && slotStatus === "available" && (
                                <div className="text-center leading-tight">
                                  <div className="font-semibold text-[10px]">{timeStr}</div>
                                  <div className="font-bold text-[10px]">€{pricingTier.price}</div>
                                </div>
                              )}
                              {isBlocked && (
                                <div className="w-2 h-2 bg-gray-600 rounded-full" />
                              )}
                              {isRain && (
                                <div className="text-xs text-blue-600 font-medium">🌧️</div>
                              )}
                            </div>
                          </TooltipTrigger>
                          {slotStatus === "available" && duration >= 30 && (
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-medium">{timeStr} - {duration}min</div>
                                <div>€{pricingTier.price}</div>
                              </div>
                            </TooltipContent>
                          )}
                          {isBlocked && (
                            <TooltipContent>
                              <div className="text-xs font-medium">Blocked</div>
                            </TooltipContent>
                          )}
                          {isRain && (
                            <TooltipContent>
                              <div className="text-xs font-medium">
                                {hasManualRainBlock ? "Rain (Manual)" : "Rain - Unavailable"}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  });
                })()}

                {/* Bookings for this court */}
                {courtBookings.map((positioned) => (
                  <div
                    key={positioned.booking.id}
                    className={cn(
                      "absolute left-1 right-1 rounded px-1.5 py-0.5 text-white text-xs cursor-pointer shadow-sm flex flex-col justify-center",
                      getStatusColor(positioned.booking.status)
                    )}
                    style={{
                      top: `${positioned.top}px`,
                      height: `${positioned.height}px`,
                      minHeight: "20px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingSelect(positioned.booking);
                    }}
                  >
                    <div className="font-medium truncate leading-tight">
                      {positioned.booking.user.name || positioned.booking.user.email}
                    </div>
                    <div className="text-[10px] opacity-90 leading-tight">
                      {format(positioned.booking.startTime, "HH:mm")} -{" "}
                      {format(positioned.booking.endTime, "HH:mm")}
                    </div>
                  </div>
                ))}

                {/* Current time indicator */}
                {currentTimeVisible && (
                  <div
                    className="absolute right-0 left-0 z-10 pointer-events-none"
                    style={{ top: `${currentTimePosition}%` }}
                  >
                    <div className="bg-green-500 h-[2px] w-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full flex items-center justify-center text-gray-500" style={{ height: `${totalHeight}px` }}>
            <p>No courts available</p>
          </div>
        )}
      </div>
    </div>
  );
}

