"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudRain, Calendar, X } from "lucide-react";

interface RainSlotDialogProps {
  courtId: string;
  courtName: string;
  time: string;
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  onFree: () => void;
  onReserve: () => void;
}

export function RainSlotDialog({
  courtId,
  courtName,
  time,
  date,
  isOpen,
  onClose,
  onFree,
  onReserve,
}: RainSlotDialogProps) {
  const [action, setAction] = useState<"free" | "reserve">("free");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (action === "free") {
        // Free the slot by creating a rain override block
        const hour = parseInt(time.split(":")[0]);
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        const response = await fetch("/api/slot-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slots: [{
              courtId,
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
            }],
            reason: "rain_override",
            notes: "Rain slot freed by owner",
            isRecurring: false,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to free slot");
        }

        onFree();
        onClose();
      } else if (action === "reserve") {
        // Open reservation dialog
        onReserve();
        onClose();
      }
    } catch (error) {
      console.error("Failed to process rain slot action:", error);
      alert("Failed to process action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-500" />
            Manage Rain Slot
          </DialogTitle>
          <DialogDescription>
            This slot is marked as unavailable due to rain. You can free it or create a reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot Info */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <div className="text-sm space-y-1">
              <div>
                <strong>Court:</strong> {courtName}
              </div>
              <div>
                <strong>Time:</strong> {time}
              </div>
              <div>
                <strong>Date:</strong> {format(date, "dd.MM.yyyy")}
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <Label htmlFor="action">What would you like to do?</Label>
            <Select value={action} onValueChange={(value) => setAction(value as "free" | "reserve")}>
              <SelectTrigger id="action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Free the slot (mark as available)
                  </div>
                </SelectItem>
                <SelectItem value="reserve">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Create reservation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {action === "free"
                ? "The slot will be marked as available and can be booked normally."
                : "You'll be able to create a reservation for this time slot."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : action === "free"
                ? "Free Slot"
                : "Create Reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

