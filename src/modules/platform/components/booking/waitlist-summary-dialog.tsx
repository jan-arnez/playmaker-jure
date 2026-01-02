"use client";

import { format } from "date-fns";
import { MapPin, Clock, LogIn, UserPlus, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/modules/auth/lib/auth-client";
import { useAuthModal } from "@/components/auth-modal";
import { PiCourtBasketball } from "react-icons/pi";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

// Sport icon mapping
const sportIcons: Record<string, string> = {
  "Tennis": "/icons/tennis.svg",
  "Multi-purpose": "/icons/tennis.svg",
  "Basketball": "/icons/basketball.svg", 
  "Football": "/icons/football.svg",
  "Swimming": "/icons/swimming.svg",
  "Volleyball": "/icons/volleyball.svg",
  "Badminton": "/icons/badminton.svg",
  "Squash": "/icons/squash.svg",
  "Table Tennis": "/icons/table tennis.svg",
  "Pickleball": "/icons/pickleball.svg",
  "Padel": "/icons/padel.svg",
};

interface WaitlistSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityName: string;
  facilityAddress?: string;
  courtName: string;
  courtType: string;
  selectedDate: string;
  selectedTime: string;
  price: number;
  duration: number;
  facilityId: string;
  courtId: string;
  onJoinSuccess: (position: number) => void;
}

export function WaitlistSummaryDialog({
  open,
  onOpenChange,
  facilityName,
  facilityAddress,
  courtName,
  courtType,
  selectedDate,
  selectedTime,
  price,
  duration,
  facilityId,
  courtId,
  onJoinSuccess,
}: WaitlistSummaryDialogProps) {
  const { data: session } = authClient.useSession();
  const { openLogin, openSignup } = useAuthModal();
  const isAuthenticated = !!session?.user;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Calculate end time
  const endTime = (() => {
    const [hour, minute] = selectedTime.split(':');
    const endHour = (parseInt(hour) + (duration / 60)).toString().padStart(2, '0');
    return `${endHour}:${minute}`;
  })();

  const handleJoinWaitlist = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endTimeDate = new Date(startTime);
      endTimeDate.setHours(endTimeDate.getHours() + (duration / 60));

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilityId,
          courtId,
          startTime: startTime.toISOString(),
          endTime: endTimeDate.toISOString(),
          email,
          phone: phone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to join waitlist");
      }

      toast.success(`You're on the waitlist! Position #${result.waitlist.position}`);
      onJoinSuccess(result.waitlist.position);
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header with gradient - amber/orange for waitlist */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 py-5 text-white">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Waitlist
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              This slot is booked. Get notified when available.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Details Card */}
          <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Facility */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{facilityName}</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{facilityAddress || "Ljubljana, Slovenia"}</p>
              </div>
            </div>

            {/* Court & Sport */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                {courtType === "Multi-purpose" ? (
                  <PiCourtBasketball className="w-5 h-5 text-blue-600" />
                ) : (
                  <Image
                    src={sportIcons[courtType] || "/icons/tennis.svg"}
                    alt={`${courtType} icon`}
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm">{courtName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{courtType}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 p-4 bg-white">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedTime} - {endTime}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(selectedDate), "EEE, d MMMM yyyy")}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                  Booked
                </span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-amber-700 font-medium">If slot becomes available</p>
                <p className="text-xl font-bold text-amber-700">{price} €</p>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-4">
            {isAuthenticated ? (
              <>
                {/* Contact Form */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="waitlist-email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="waitlist-phone" className="text-sm font-medium text-gray-700">
                      Phone <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="waitlist-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+386 40 123 456"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                    />
                    <p className="text-xs text-gray-400">
                      For SMS notifications when slot opens up
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-11"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleJoinWaitlist} 
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/25"
                    disabled={isSubmitting || !email}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Joining..." : "Join Waitlist"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-800 font-medium">
                    Sign in to join the waitlist
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      openLogin();
                    }}
                    className="flex-1 h-11"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      openSignup();
                    }}
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
