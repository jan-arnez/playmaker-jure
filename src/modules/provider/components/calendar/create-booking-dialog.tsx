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
import { CalendarIcon, Ban, Calendar as CalendarIcon2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface CreateBookingDialogProps {
  courtId?: string;
  startTime?: Date;
  endTime?: Date;
  courts: Court[];
  selectedSlots?: Array<{ courtId: string; courtName: string; time: string; date: Date }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onBlockSuccess?: () => void;
}

export function CreateBookingDialog({
  courtId: initialCourtId,
  startTime: initialStartTime,
  endTime: initialEndTime,
  courts,
  selectedSlots = [],
  isOpen,
  onClose,
  onSuccess,
  onBlockSuccess,
}: CreateBookingDialogProps) {
  const [mode, setMode] = useState<"booking" | "block">("booking");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [selectedCourtId, setSelectedCourtId] = useState<string>(initialCourtId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialStartTime ? new Date(initialStartTime) : undefined
  );
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Block slot form fields
  const [blockReason, setBlockReason] = useState<string>("tournament");
  const [blockNotes, setBlockNotes] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<"weekly" | "weekdays" | "custom">("weekly");
  const [recurringEndDate, setRecurringEndDate] = useState<Date | undefined>(undefined);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);

  // Initialize form when dialog opens or props change
  useEffect(() => {
    if (isOpen) {
      // If multiple slots selected, default to block mode, otherwise booking mode
      if (selectedSlots.length > 1) {
        setMode("block");
      } else {
        setMode("booking");
      }
      
      if (initialCourtId) {
        setSelectedCourtId(initialCourtId);
      }
      if (initialStartTime) {
        const start = new Date(initialStartTime);
        setSelectedDate(start);
        setStartTime(
          `${start.getHours().toString().padStart(2, "0")}:${start
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );
        // Use provided end time or default to 1 hour
        const end = initialEndTime ? new Date(initialEndTime) : new Date(start);
        if (!initialEndTime) {
          end.setHours(end.getHours() + 1);
        }
        setEndTime(
          `${end.getHours().toString().padStart(2, "0")}:${end
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );
      }
      
      // If we have selected slots, use them for blocking
      if (selectedSlots.length > 0 && selectedSlots[0]) {
        const firstSlot = selectedSlots[0];
        setSelectedCourtId(firstSlot.courtId);
        setSelectedDate(firstSlot.date);
        
        // Calculate start and end times from all selected slots
        const hours = selectedSlots.map(slot => parseInt(slot.time.split(":")[0]));
        const minHour = Math.min(...hours);
        const maxHour = Math.max(...hours);
        
        // Start time is the earliest hour
        setStartTime(`${minHour.toString().padStart(2, "0")}:00`);
        // End time is the latest hour + 1 (since each slot is 1 hour)
        setEndTime(`${(maxHour + 1).toString().padStart(2, "0")}:00`);
      }
    }
  }, [isOpen, initialCourtId, initialStartTime, selectedSlots]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setMode("booking");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setSelectedCourtId(initialCourtId || "");
      setSelectedDate(initialStartTime ? new Date(initialStartTime) : undefined);
      setStartTime("");
      setEndTime("");
      setStatus("confirmed");
      setNotes("");
      setBlockReason("tournament");
      setBlockNotes("");
      setIsRecurring(false);
      setRecurringType("weekly");
      setRecurringEndDate(undefined);
      setDayOfWeek(undefined);
    }
  }, [isOpen, initialCourtId, initialStartTime]);

  const handleSubmit = async () => {
    if (mode === "block") {
      // Handle block slot submission
      let slotsToBlock: Array<{ courtId: string; courtName: string; time: string; date: Date }> = [];
      
      if (selectedSlots.length > 0) {
        // Use pre-selected slots from drag
        slotsToBlock = selectedSlots;
      } else if (selectedCourtId && selectedDate && startTime && endTime) {
        // Generate slots from time range
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        const slotDate = new Date(selectedDate);
        const selectedCourt = courts.find(c => c.id === selectedCourtId);
        
        // Create slots for each hour in the range
        for (let hour = startHours; hour < endHours; hour++) {
          const timeStr = `${hour.toString().padStart(2, "0")}:00`;
          slotsToBlock.push({
            courtId: selectedCourtId,
            courtName: selectedCourt?.name || "",
            time: timeStr,
            date: slotDate,
          });
        }
      }

      if (slotsToBlock.length === 0) {
        alert("Please select at least one slot to block (either by dragging or selecting court, date, and time)");
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
            slots: slotsToBlock.map((slot) => ({
              courtId: slot.courtId,
              startTime: new Date(
                slot.date.getFullYear(),
                slot.date.getMonth(),
                slot.date.getDate(),
                parseInt(slot.time.split(":")[0]),
                parseInt(slot.time.split(":")[1] || "0"),
                0
              ).toISOString(),
              endTime: new Date(
                slot.date.getFullYear(),
                slot.date.getMonth(),
                slot.date.getDate(),
                parseInt(slot.time.split(":")[0]) + 1,
                parseInt(slot.time.split(":")[1] || "0"),
                0
              ).toISOString(),
            })),
            reason: blockReason,
            notes: blockNotes.trim() || null,
            isRecurring,
            recurringType: isRecurring ? recurringType : null,
            recurringEndDate: isRecurring && recurringEndDate
              ? recurringEndDate.toISOString()
              : null,
            dayOfWeek: isRecurring && recurringType === "weekly" && selectedDate
              ? selectedDate.getDay()
              : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to block slots");
        }

        if (onBlockSuccess) {
          onBlockSuccess();
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
      return;
    }

    // Handle booking submission
    if (!selectedCourtId || !selectedDate || !startTime || !endTime) {
      alert("Please fill in all required fields");
      return;
    }

    if (!customerName || !customerEmail) {
      alert("Please provide customer name and email");
      return;
    }

    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const bookingStartTime = new Date(selectedDate);
    bookingStartTime.setHours(startHours, startMinutes, 0, 0);

    const bookingEndTime = new Date(selectedDate);
    bookingEndTime.setHours(endHours, endMinutes, 0, 0);

    if (bookingStartTime >= bookingEndTime) {
      alert("Start time must be before end time");
      return;
    }

    setIsLoading(true);
    try {
      // Find the facility ID from the selected court
      const selectedCourt = courts.find((c) => c.id === selectedCourtId);
      if (!selectedCourt) {
        throw new Error("Court not found");
      }

      const response = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: selectedCourt.facility.id,
          courtId: selectedCourtId,
          customerName,
          customerEmail,
          customerPhone: customerPhone.trim() || null,
          startTime: bookingStartTime.toISOString(),
          endTime: bookingEndTime.toISOString(),
          status,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create booking");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <DialogTitle>
            {mode === "booking" ? "Create Reservation" : "Block Slot"}
          </DialogTitle>
          <DialogDescription>
            {mode === "booking"
              ? "Create a booking for a customer who called or emailed you."
              : "Block time slots to prevent bookings."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(value) => setMode(value as "booking" | "block")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="booking" className="flex items-center gap-2">
              <CalendarIcon2 className="h-4 w-4" />
              Create Reservation
            </TabsTrigger>
            <TabsTrigger value="block" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Block Slot
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4 py-4">
          {mode === "block" ? (
            /* Block Slot Form */
            <>
              {/* Court Selection */}
              <div className="space-y-2">
                <Label htmlFor="blockCourt">Court *</Label>
                <Select
                  value={selectedCourtId || "none"}
                  onValueChange={(value) => setSelectedCourtId(value === "none" ? "" : value)}
                >
                  <SelectTrigger id="blockCourt">
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label>Date *</Label>
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
                  <Label htmlFor="blockStartTime">Start Time *</Label>
                  <Input
                    id="blockStartTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockEndTime">End Time *</Label>
                  <Input
                    id="blockEndTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Selected Slots Info (if multiple slots from drag) */}
              {selectedSlots.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm">
                    <strong>Selected Slots:</strong> {selectedSlots.length} slot(s)
                    {selectedSlots.length > 0 && (
                      <div className="mt-1 text-xs text-gray-600">
                        {Array.from(new Set(selectedSlots.map(s => s.courtName))).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Block Reason */}
              <div className="space-y-2">
                <Label htmlFor="blockReason">Reason *</Label>
                <Select value={blockReason} onValueChange={setBlockReason}>
                  <SelectTrigger id="blockReason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tournament">Tournament</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="lessons">Lessons</SelectItem>
                    <SelectItem value="rain">Rain</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Block Notes */}
              <div className="space-y-2">
                <Label htmlFor="blockNotes">Notes (Optional)</Label>
                <Textarea
                  id="blockNotes"
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  placeholder="Add any notes about this block..."
                  rows={3}
                />
              </div>

              {/* Recurring Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRecurring">Make this recurring</Label>
                </div>

                {isRecurring && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recurringType">Repeat</Label>
                      <Select
                        value={recurringType}
                        onValueChange={(value) => setRecurringType(value as "weekly" | "weekdays" | "custom")}
                      >
                        <SelectTrigger id="recurringType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="weekdays">Every Weekday</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                                <span>Pick an end date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={recurringEndDate}
                              onSelect={setRecurringEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            /* Booking Form */
            <>
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone (Optional)</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Booking Details</h3>

            {/* Court Selection */}
            <div className="space-y-2">
              <Label htmlFor="court">Court *</Label>
              <Select
                value={selectedCourtId || "none"}
                onValueChange={(value) => setSelectedCourtId(value === "none" ? "" : value)}
              >
                <SelectTrigger id="court">
                  <SelectValue placeholder="Select a court" />
                </SelectTrigger>
                <SelectContent>
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
              <Label>Date *</Label>
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
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
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
              <Select value={status} onValueChange={(value) => setStatus(value as "confirmed" | "pending")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
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
                rows={3}
              />
            </div>
          </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? mode === "block"
                ? "Blocking..."
                : "Creating..."
              : mode === "block"
                ? "Block Slot"
                : "Create Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

