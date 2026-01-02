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
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface NoShowReportDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NoShowReportDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: NoShowReportDialogProps) {
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load existing notes when dialog opens
  useEffect(() => {
    if (isOpen && booking) {
      setNotes(booking.notes || "");
    }
  }, [isOpen, booking]);

  const handleSubmit = async () => {
    if (!booking) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          status: "no-show",
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to report no-show");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to report no-show:", error);
      alert("Failed to report no-show. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report No-Show</DialogTitle>
          <DialogDescription>
            Mark this booking as a no-show. The time slot will remain reserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Info (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer</Label>
            <div className="text-sm text-gray-600">
              {booking.user.name || "Guest"} ({booking.user.email})
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Date & Time</Label>
            <div className="text-sm text-gray-600">
              {format(startDate, "dd.MM.yyyy")} • {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this no-show..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
            {isLoading ? "Reporting..." : "Report No-Show"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

