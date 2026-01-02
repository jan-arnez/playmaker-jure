"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { getRelatedFacilities, type RelatedFacility } from "@/modules/platform/actions/get-related-facilities";
import { premiumEase, hoverSpring } from "@/components/motion";

interface RelatedFacilitiesProps {
  currentFacilityId: string;
  city: string;
  sportCategoryIds: string[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
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
    }
  },
};

export function RelatedFacilities({ currentFacilityId, city, sportCategoryIds }: RelatedFacilitiesProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage");
  const [facilities, setFacilities] = useState<RelatedFacility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      try {
        const related = await getRelatedFacilities(currentFacilityId, city, sportCategoryIds, 4);
        setFacilities(related);
      } catch (error) {
        console.error("Error fetching related facilities:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRelated();
  }, [currentFacilityId, city, sportCategoryIds]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {/* Responsive skeleton: 2x2 on phone, 3x1 on tablet, 4x1 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${
                i === 3 ? "md:hidden lg:block" : ""
              }`}
            >
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (facilities.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: premiumEase }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{t("youMightAlsoLike")}</h2>
        <motion.div
          whileHover={{ x: 2 }}
          transition={hoverSpring}
        >
          <Link 
            href="/facilities" 
            className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 group"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Facility Cards Grid - Responsive: 2x2 phone, 3x1 tablet, 4x1 desktop */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {facilities.map((facility, index) => (
          <motion.div
            key={facility.id}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={hoverSpring}
            // Hide 4th item on tablet (md), show on phone and desktop
            className={index === 3 ? "md:hidden lg:block" : ""}
          >
            <Link 
              href={`/facilities/${facility.slug}`}
              className="block bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {facility.imageUrl ? (
                  <img
                    src={facility.imageUrl}
                    alt={facility.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {/* Location Type Badge - only showing this now, sport badge removed */}
                {facility.locationType && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
                    {facility.locationType}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {facility.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{facility.city}</span>
                </div>
                {facility.pricePerHour && (
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-primary">
                      {facility.pricePerHour} {facility.currency || "EUR"}
                    </span>
                    <span className="text-muted-foreground"> / hour</span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
