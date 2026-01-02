"use client";

import { 
  Car, 
  Wifi, 
  Droplets, 
  Lock, 
  DoorOpen,
  Package,
  Wind,
  Lightbulb,
  Coffee,
  ShoppingBag,
  GraduationCap,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { premiumEase, hoverSpring } from "@/components/motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface FacilityAmenitiesProps {
  facilities?: string[];
}

const AMENITY_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; key: string }> = {
  parking: { icon: Car, key: "parking" },
  wifi: { icon: Wifi, key: "wifi" },
  showers: { icon: Droplets, key: "showers" },
  lockers: { icon: Lock, key: "lockers" },
  changingRooms: { icon: DoorOpen, key: "changingRooms" },
  equipment: { icon: Package, key: "equipment" },
  airConditioning: { icon: Wind, key: "airConditioning" },
  lighting: { icon: Lightbulb, key: "lighting" },
  cafe: { icon: Coffee, key: "cafe" },
  proShop: { icon: ShoppingBag, key: "proShop" },
  coaching: { icon: GraduationCap, key: "coaching" },
  spectatorSeating: { icon: Users, key: "spectatorSeating" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: premiumEase,
    }
  },
};

export function FacilityAmenities({ facilities }: FacilityAmenitiesProps) {
  const t = useTranslations("PlatformModule.facilityDetail.amenities");
  const tPage = useTranslations("PlatformModule.facilityDetailPage");
  
  // Only show actual amenities - no default fallback
  if (!facilities || facilities.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: premiumEase }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{tPage("amenities")}</h3>
        
        <motion.div 
          className="flex items-center gap-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {facilities.map((facility) => {
            const config = AMENITY_CONFIG[facility];
            if (!config) return null;
            
            const Icon = config.icon;
            
            return (
              <Tooltip key={facility}>
                <TooltipTrigger asChild>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={hoverSpring}
                    className="p-2.5 rounded-full bg-gray-50 hover:bg-primary/10 border border-gray-100 hover:border-primary/20 transition-colors cursor-default"
                  >
                    <Icon className="h-4 w-4 text-gray-600 hover:text-primary transition-colors" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>
                  {t(config.key)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}


