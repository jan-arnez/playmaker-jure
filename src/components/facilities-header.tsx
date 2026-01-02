"use client";

import { motion } from "framer-motion";
import { premiumEase, durations } from "@/components/motion";

interface FacilitiesHeaderProps {
  title: string;
  subtitle: string;
  totalCount?: number;
}

export function FacilitiesHeader({ title, subtitle, totalCount }: FacilitiesHeaderProps) {
  return (
    <div className="text-center mb-8 relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -mx-6 -mt-12 -mb-4 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent pointer-events-none" />
      
      <motion.h1 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durations.normal, ease: premiumEase }}
        className="text-3xl md:text-4xl font-bold mb-4 relative"
      >
        {title}
        {/* Show count in title on mobile only */}
        {totalCount !== undefined && (
          <span className="lg:hidden"> ({totalCount})</span>
        )}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durations.normal, delay: 0.1, ease: premiumEase }}
        className="text-lg md:text-xl text-muted-foreground relative"
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

