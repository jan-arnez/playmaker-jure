"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Clock, LogIn, UserPlus, Check, CalendarDays, AlertCircle } from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/modules/auth/lib/auth-client";
import { PiCourtBasketball } from "react-icons/pi";
import Image from "next/image";
import { useAuthModal } from "@/components/auth-modal";
import { useTranslations } from "next-intl";
import { SeasonalTermRequestDialog } from "./seasonal-term-request-dialog";

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

interface BookingSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityName: string;
  facilityAddress?: string;
  facilityId?: string;
  courtName: string;
  courtType: string;
  courtId?: string;
  selectedDate: string;
  selectedTime: string;
  price: number;
  duration: number;
  onBookNow: () => void;
  defaultSeasonStartDate?: string;
  defaultSeasonEndDate?: string;
}

export function BookingSummaryDialog({
  open,
  onOpenChange,
  facilityName,
  facilityAddress,
  facilityId,
  courtName,
  courtType,
  courtId,
  selectedDate,
  selectedTime,
  price,
  duration,
  onBookNow,
  defaultSeasonStartDate,
  defaultSeasonEndDate,
}: BookingSummaryDialogProps) {
  const t = useTranslations("PlatformModule.booking");
  const { data: session } = authClient.useSession();
  const { openLogin, openSignup } = useAuthModal();
  const isAuthenticated = !!session?.user;
  const userTrustLevel = (session?.user as any)?.trustLevel ?? 0;
  const [isSeasonalRequestOpen, setIsSeasonalRequestOpen] = useState(false);

  // Calculate end time based on duration
  const endTime = (() => {
    const [hour, minute] = selectedTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMin = totalMinutes % 60;
    return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  })();

  const handleSeasonalTermClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    if (userTrustLevel >= 2) {
      setIsSeasonalRequestOpen(true);
    }
  };

  const getSeasonalTermTooltip = () => {
    if (!isAuthenticated) return t("seasonalTerm.signInRequired");
    if (userTrustLevel === 0) return t("seasonalTerm.verifyEmail");
    if (userTrustLevel === 1) return t("seasonalTerm.completeBooking");
    return null;
  };

  const canRequestSeasonal = isAuthenticated && userTrustLevel >= 2;
  const seasonalTooltip = getSeasonalTermTooltip();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary/90 to-primary px-6 py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <BsFillLightningChargeFill className="h-5 w-5" />
                Booking Summary
              </DialogTitle>
              <DialogDescription className="text-white/80 text-sm">
                Review your booking details
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {/* Booking Details Card */}
            <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Facility */}
              <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
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
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-600" />
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
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {duration} min
                  </span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-green-700">{price} €</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seasonal Term Request Link */}
            {courtId && facilityId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSeasonalTermClick}
                      disabled={!canRequestSeasonal && isAuthenticated}
                      className={`w-full text-center py-2 text-sm flex items-center justify-center gap-2 rounded-lg transition-colors ${
                        canRequestSeasonal 
                          ? "text-primary hover:bg-primary/5 cursor-pointer" 
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <CalendarDays className="h-4 w-4" />
                      {t("seasonalTerm.requestLink")}
                      {!canRequestSeasonal && isAuthenticated && (
                        <AlertCircle className="h-3.5 w-3.5 ml-1" />
                      )}
                    </button>
                  </TooltipTrigger>
                  {seasonalTooltip && (
                    <TooltipContent>
                      <p>{seasonalTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              {isAuthenticated ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={onBookNow} 
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-sm text-amber-800 font-medium">
                      Sign in to complete your booking
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
                      className="flex-1 h-11 bg-primary hover:bg-primary/90"
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

      {/* Seasonal Term Request Dialog */}
      {courtId && facilityId && (
        <SeasonalTermRequestDialog
          open={isSeasonalRequestOpen}
          onOpenChange={setIsSeasonalRequestOpen}
          facilityId={facilityId}
          facilityName={facilityName}
          courtId={courtId}
          courtName={courtName}
          courtType={courtType}
          selectedTime={selectedTime}
          duration={duration}
          defaultSeasonStartDate={defaultSeasonStartDate}
          defaultSeasonEndDate={defaultSeasonEndDate}
        />
      )}
    </>
  );
}
