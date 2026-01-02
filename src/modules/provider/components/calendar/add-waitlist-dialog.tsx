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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddWaitlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facilityId: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  facilityName: string;
  courtName: string;
}

export function AddWaitlistDialog({
  isOpen,
  onClose,
  onSuccess,
  facilityId,
  courtId,
  startTime,
  endTime,
  facilityName,
  courtName,
}: AddWaitlistDialogProps) {
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      toast.error("Name and email are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/waitlist/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          name: customerName,
          email: customerEmail,
          phone: customerPhone.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add to waitlist");
      }

      toast.success("Customer added to waitlist successfully!");
      onSuccess();
      onClose();
      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    } catch (error) {
      console.error("Failed to add to waitlist:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add to waitlist. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const duration = Math.round(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Waitlist</DialogTitle>
          <DialogDescription>
            Add a customer to the waitlist for this booked slot
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Booking Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Facility:</span>{" "}
                <span className="text-gray-900">{facilityName}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Court:</span>{" "}
                <span className="text-gray-900">{courtName}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Date:</span>{" "}
                <span className="text-gray-900">
                  {format(startTime, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700">Time:</span>{" "}
                <span className="text-gray-900">
                  {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")} ({duration} min)
                </span>
              </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="waitlist-name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="waitlist-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <Label htmlFor="waitlist-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="waitlist-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="waitlist-phone">Phone (optional)</Label>
              <Input
                id="waitlist-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+386 40 123 456"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                For SMS notifications when slot becomes available
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !customerName || !customerEmail}>
              {isLoading ? "Adding..." : "Add to Waitlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

