"use client";

import { format } from "date-fns";
import { MapPin, Clock, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingTooltipProps {
  facilityName: string;
  courtName: string;
  courtType: string;
  date: string;
  time: string;
  price: number;
  duration: number;
  className?: string;
}

export function BookingTooltip({
  facilityName,
  courtName,
  courtType,
  date,
  time,
  price,
  duration,
  className,
}: BookingTooltipProps) {
  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[260px] relative",
      "before:content-[''] before:absolute before:top-[-6px] before:left-1/2 before:transform before:-translate-x-1/2",
      "before:border-l-6 before:border-r-6 before:border-b-6 before:border-l-transparent before:border-r-transparent before:border-b-gray-200",
      "after:content-[''] after:absolute after:top-[-5px] after:left-1/2 after:transform after:-translate-x-1/2",
      "after:border-l-5 after:border-r-5 after:border-b-5 after:border-l-transparent after:border-r-transparent after:border-b-white",
      className
    )}>
      <div className="space-y-3">
        {/* Facility Info */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">{facilityName}</h4>
            <p className="text-xs text-muted-foreground">{courtName} ({courtType})</p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {format(new Date(date), "EEEE, d. MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">{time} ({duration} minutes)</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <Euro className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs text-muted-foreground">Total Price</p>
            <p className="text-lg font-bold text-green-600">{price}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
