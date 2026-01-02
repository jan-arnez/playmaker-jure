"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

interface SelectedSlot {
  courtId: string;
  courtName: string;
  time: string; // Format: "HH:mm"
  date: Date;
}

interface BlockSlotDialogProps {
  selectedSlots: SelectedSlot[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type BlockReason = "tournament" | "maintenance" | "lessons" | "other";
type RecurringType = "weekly" | "weekdays" | "custom";

export function BlockSlotDialog({
  selectedSlots,
  isOpen,
  onClose,
  onSuccess,
}: BlockSlotDialogProps) {
  const [reason, setReason] = useState<BlockReason>("maintenance");
  const [notes, setNotes] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringType, setRecurringType] = useState<RecurringType>("weekly");
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setReason("maintenance");
      setNotes("");
      setIsRecurring(false);
      setRecurringType("weekly");
      setRecurringEndDate(undefined);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      alert("No slots selected");
      return;
    }

    if (isRecurring && !recurringEndDate && recurringType !== "weekdays") {
      alert("Please select an end date for recurring blocks");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/slot-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: selectedSlots.map((slot) => ({
            courtId: slot.courtId,
            startTime: new Date(
              slot.date.getFullYear(),
              slot.date.getMonth(),
              slot.date.getDate(),
              parseInt(slot.time.split(":")[0]),
              parseInt(slot.time.split(":")[1]),
              0
            ).toISOString(),
            endTime: new Date(
              slot.date.getFullYear(),
              slot.date.getMonth(),
              slot.date.getDate(),
              parseInt(slot.time.split(":")[0]) + 1,
              parseInt(slot.time.split(":")[1]),
              0
            ).toISOString(),
          })),
          reason,
          notes: notes.trim() || null,
          isRecurring,
          recurringType: isRecurring ? recurringType : null,
          recurringEndDate: isRecurring && recurringEndDate
            ? recurringEndDate.toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to block slots");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to block slots:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to block slots. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique courts from selected slots
  const uniqueCourts = Array.from(
    new Map(selectedSlots.map((slot) => [slot.courtId, slot.courtName])).entries()
  );

  // Get time range from selected slots
  const timeRange = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    const times = selectedSlots.map((s) => s.time).sort();
    if (times.length === 1) return times[0];
    return `${times[0]} - ${times[times.length - 1]}`;
  }, [selectedSlots]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Block Slots</DialogTitle>
          <DialogDescription>
            Block selected time slots to prevent bookings. You can make this recurring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected slots info */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <Label className="text-sm font-medium">Selected Slots</Label>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <strong>{selectedSlots.length}</strong> slot{selectedSlots.length !== 1 ? "s" : ""} selected
              </div>
              {uniqueCourts.length > 0 && (
                <div>
                  Court{uniqueCourts.length !== 1 ? "s" : ""}:{" "}
                  {uniqueCourts.map(([id, name]) => name).join(", ")}
                </div>
              )}
              {timeRange && (
                <div>Time: {timeRange}</div>
              )}
              {selectedSlots.length > 0 && (
                <div>
                  Date: {format(selectedSlots[0].date, "dd.MM.yyyy")}
                </div>
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Blocking</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as BlockReason)}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="lessons">Lessons</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="rain_override">Rain Override (Free Rain Slot)</SelectItem>
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
              placeholder="Add any additional notes about this block..."
              rows={3}
            />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            <Label
              htmlFor="recurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Recurring
            </Label>
          </div>

          {/* Recurring Options */}
          {isRecurring && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              {/* Recurring Type */}
              <div className="space-y-2">
                <Label htmlFor="recurringType">Repeat</Label>
                <Select
                  value={recurringType}
                  onValueChange={(value) => setRecurringType(value as RecurringType)}
                >
                  <SelectTrigger id="recurringType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="weekdays">Every weekday</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* End Date (not needed for weekdays) */}
              {recurringType !== "weekdays" && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !recurringEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurringEndDate ? (
                          format(recurringEndDate, "dd.MM.yyyy")
                        ) : (
                          <span>Select end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurringEndDate}
                        onSelect={setRecurringEndDate}
                        initialFocus
                        disabled={(date) => {
                          if (selectedSlots.length === 0) return true;
                          const startDate = selectedSlots[0].date;
                          return date < startDate;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500">
                    Blocks will repeat until this date
                  </p>
                </div>
              )}

              {recurringType === "weekdays" && (
                <p className="text-xs text-gray-500">
                  Blocks will repeat every weekday (Monday-Friday) indefinitely
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Blocking..." : `Block ${selectedSlots.length} Slot${selectedSlots.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

