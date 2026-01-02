"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FacilityCard } from "@/modules/platform/components/facility/facility-card";
import { premiumEase } from "@/components/motion";

interface FacilityData {
  id: string;
  slug?: string;
  title: string;
  location: string;
  rating: number;
  description: string;
  organization: string;
  bookingCount: number;
  sport: string;
  imageUrl: string;
  region: string;
  address: string;
  sports: string[];
  priceFrom: number;
  selectedSport?: string;
  selectedDate?: string;
  selectedTime?: string;
  slotsAvailableToday?: number;
  slotsForDate?: number;
  slotsForTimeRange?: string[];
}

interface FacilitiesGridProps {
  facilities: FacilityData[];
  hideRegion?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: premiumEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

export function FacilitiesGrid({ facilities, hideRegion = false }: FacilitiesGridProps) {
  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {facilities.map((facility) => (
          <motion.div 
            key={facility.id} 
            variants={itemVariants}
            layout
            layoutId={facility.id}
          >
            <FacilityCard
              data={facility}
              variant="compact"
              hideRegion={hideRegion}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

