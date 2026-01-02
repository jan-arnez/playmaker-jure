"use client";

import { MapPin, Navigation, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FacilityMapPreview } from "./facility-map-preview";
import { parseWorkingHours, formatDayHours, DAY_ORDER, hasOpenDays } from "@/lib/working-hours";

interface FacilityInfoCardProps {
  address: string;
  city: string;
  googleMapsUrl?: string;
  workingHours?: unknown;
}

export function FacilityInfoCard({ address, city, googleMapsUrl, workingHours: rawWorkingHours }: FacilityInfoCardProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");
  
  // Generate Google Maps URL if not provided
  const mapsUrl = googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`;
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  // Convert to our array index (0 = Monday, 6 = Sunday)
  const currentDayIndex = today === 0 ? 6 : today - 1;
  
  // Parse working hours using shared utility
  const workingHours = rawWorkingHours ? parseWorkingHours(rawWorkingHours) : null;
  
  // Check if working hours are provided and have at least one open day
  const hasValidWorkingHours = workingHours !== null && hasOpenDays(workingHours);

  return (
    <motion.div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Opening Hours Section - Fixed min-height on desktop for consistent layout */}
      <div className="p-4 flex-1 lg:min-h-[296px]">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{t("openingHours")}</span>
        </div>
        {hasValidWorkingHours && workingHours ? (
          <div className="space-y-0.5">
            {DAY_ORDER.map((dayKey, index) => {
              const isToday = index === currentDayIndex;
              const closedText = t("closed");
              const dayHours = workingHours[dayKey];
              const displayHours = formatDayHours(dayHours, closedText);
              
              return (
                <div 
                  key={dayKey}
                  className={`flex justify-between items-center py-1.5 px-2 rounded transition-colors ${
                    isToday 
                      ? "bg-primary/10" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-sm ${isToday ? "font-semibold text-primary" : "font-medium text-gray-700"}`}>
                    {t(`days.${dayKey}`)}
                  </span>
                  <span className={`text-sm ${isToday ? "font-medium text-primary" : "text-gray-600"}`}>
                    {displayHours}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <span className="text-sm italic">{t("contactForHours")}</span>
          </div>
        )}
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-100" />
      
      {/* Location Section */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{t("location")}</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{address}</p>
            <p className="text-sm text-gray-500">{city}</p>
          </div>
          
          {/* React Leaflet Preview & Google Maps Modal */}
          <FacilityMapPreview address={address} city={city} />
          
          {/* Get Directions Button */}
          <Button
            asChild
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {t("getDirections")}
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
