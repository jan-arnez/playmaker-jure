"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  notes?: string | null;
  court: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
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
}

interface EditBookingDialogProps {
  booking: Booking | null;
  courts: Court[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditBookingDialog({
  booking,
  courts,
  isOpen,
  onClose,
  onSuccess,
}: EditBookingDialogProps) {
  const [status, setStatus] = useState<string>(booking?.status || "confirmed");
  const [notes, setNotes] = useState<string>(booking?.notes || "");
  const [selectedCourtId, setSelectedCourtId] = useState<string>(
    booking?.court?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking ? new Date(booking.startTime) : undefined
  );
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when booking changes
  useEffect(() => {
    if (booking) {
      setStatus(booking.status);
      setNotes(booking.notes || "");
      setSelectedCourtId(booking.court?.id || "");
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      setSelectedDate(startDate);
      // Format time as HH:mm for input
      setStartTime(
        `${startDate.getHours().toString().padStart(2, "0")}:${startDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
      setEndTime(
        `${endDate.getHours().toString().padStart(2, "0")}:${endDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [booking]);

  const handleSubmit = async () => {
    if (!booking || !selectedDate) return;

    // Validate times
    if (!startTime || !endTime) {
      alert("Please select both start and end times");
      return;
    }

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const newStartTime = new Date(selectedDate);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(selectedDate);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

    if (newStartTime >= newEndTime) {
      alert("Start time must be before end time");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          status,
          notes: notes.trim() || null,
          courtId: selectedCourtId || null,
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update booking");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update booking. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  // Group courts by facility for better organization
  const courtsByFacility = courts.reduce(
    (acc, court) => {
      const facilityId = court.facility.id;
      if (!acc[facilityId]) {
        acc[facilityId] = {
          facility: court.facility,
          courts: [],
        };
      }
      acc[facilityId].courts.push(court);
      return acc;
    },
    {} as Record<
      string,
      {
        facility: { id: string; name: string };
        courts: Court[];
      }
    >
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update the booking details below. All fields can be modified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Customer (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer</Label>
            <div className="text-sm text-gray-600">
              {booking.user.name || "Guest"} ({booking.user.email})
            </div>
          </div>

          {/* Court Selection */}
          <div className="space-y-2">
            <Label htmlFor="court">Court</Label>
            <Select
              value={selectedCourtId || "none"}
              onValueChange={(value) => setSelectedCourtId(value === "none" ? "" : value)}
            >
              <SelectTrigger id="court">
                <SelectValue placeholder="Select a court (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No court assigned</SelectItem>
                {Object.values(courtsByFacility).map((group) =>
                  group.courts.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name} ({court.sportCategory.name}) - {group.facility.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd.MM.yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no-show">No-Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this booking..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
