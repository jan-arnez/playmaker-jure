"use client";

import { 
  Car, 
  Droplets, 
  Lock, 
  Lightbulb,
  Coffee,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { premiumEase } from "@/components/motion";

interface AmenitiesImageOverlayProps {
  amenities: string[];
}

// Only the 5 allowed amenities: parking, showers, lockers, cafe, lighting
const AMENITY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; key: string }> = {
  parking: { icon: Car, key: "parking" },
  showers: { icon: Droplets, key: "showers" },
  lockers: { icon: Lock, key: "lockers" },
  cafe: { icon: Coffee, key: "cafe" },
  lighting: { icon: Lightbulb, key: "lighting" },
};

export function AmenitiesImageOverlay({ amenities }: AmenitiesImageOverlayProps) {
  const t = useTranslations("PlatformModule.facilityDetail.amenities");
  
  if (!amenities || amenities.length === 0) {
    return null;
  }

  // Filter to only show amenities that exist in our config
  const validAmenities = amenities.filter(amenity => AMENITY_CONFIG[amenity]);

  if (validAmenities.length === 0) {
    return null;
  }

  return (
    <motion.div 
      className="absolute bottom-4 left-4 z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: premiumEase }}
    >
      {/* Main container with glass morphism effect */}
      <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-xl rounded-full px-2 py-1.5 shadow-lg border border-white/50 ring-1 ring-black/5">
        {validAmenities.map((amenity, index) => {
          const config = AMENITY_CONFIG[amenity];
          const Icon = config.icon;
          
          return (
            <Tooltip key={amenity}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.04, duration: 0.3, ease: premiumEase }}
                  whileHover={{ scale: 1.15, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 rounded-full hover:bg-primary/10 transition-all duration-200 cursor-default group"
                >
                  <Icon className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={8} 
                className="bg-gray-900 text-white border-0 shadow-xl px-3 py-1.5 text-xs font-medium"
              >
                {t(config.key as any)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </motion.div>
  );
}

