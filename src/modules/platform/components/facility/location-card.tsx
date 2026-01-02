"use client";

import { MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface LocationCardProps {
  address: string;
  city: string;
  googleMapsUrl?: string;
}

export function LocationCard({ address, city, googleMapsUrl }: LocationCardProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");
  
  // Generate Google Maps URL if not provided
  const mapsUrl = googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`;

  return (
    <motion.div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="p-2 rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{t("location")}</h3>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Address */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-700">{address}</p>
          <p className="text-sm text-gray-500">{city}</p>
        </div>
        
        {/* Map Preview Placeholder */}
        <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-1" />
              <span className="text-xs text-gray-500">Map Preview</span>
            </div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Get Directions Button */}
        <Button
          asChild
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
    </motion.div>
  );
}


