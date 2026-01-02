"use client";

import { motion } from "framer-motion";

export function FacilitySkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden">
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      </div>
      
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        
        {/* Address skeleton */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        
        {/* Sports tags skeleton */}
        <div className="min-h-[60px] flex items-start">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FacilitySkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <FacilitySkeleton key={index} />
      ))}
    </div>
  );
}