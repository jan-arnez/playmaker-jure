"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WaitlistJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  courtId: string;
  courtName: string;
  startTime: Date;
  endTime: Date;
  onSuccess: (position: number) => void;
}

export function WaitlistJoinDialog({
  open,
  onOpenChange,
  facilityId,
  courtId,
  courtName,
  startTime,
  endTime,
  onSuccess,
}: WaitlistJoinDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilityId,
          courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          email,
          phone: phone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join waitlist");
      }

      toast.success(`You're on the waitlist! Position #${result.waitlist.position}`);
      onSuccess(result.waitlist.position);
      onOpenChange(false);
      setEmail("");
      setPhone("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join waitlist",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            This slot is booked. Join the waitlist to be notified if it becomes
            available.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="court">Court & Time</Label>
              <div className="text-sm text-muted-foreground">
                {courtName} - {startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} - {endTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+386 40 123 456"
                disabled={isSubmitting}
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
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

