"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SPORTS_LIST, TIME_PRESETS } from "@/lib/filter-constants";
import { premiumEase, hoverSpring } from "@/components/motion";

interface ActiveFiltersChipsProps {
  city?: string;
  region?: string;
  sport?: string;
  date?: string;
  time?: string;
  locationType?: string;
  surface?: string;
  facilities?: string;
}

export function ActiveFiltersChips({
  city,
  region,
  sport,
  date,
  time,
  locationType,
  surface,
  facilities,
}: ActiveFiltersChipsProps) {
  const router = useRouter();
  const t = useTranslations("filters");
  const tPage = useTranslations("PlatformModule.facilitiesPage");

  // Build current params
  const getCurrentParams = () => {
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("city", city);
    if (region && region !== "all") params.set("region", region);
    if (sport && sport !== "all") params.set("sport", sport);
    if (date) params.set("date", date);
    if (time && time !== "any") params.set("time", time);
    if (locationType && locationType !== "all") params.set("locationType", locationType);
    if (surface) params.set("surface", surface);
    if (facilities) params.set("facilities", facilities);
    return params;
  };

  // Remove a filter and navigate
  const removeFilter = (filterKey: string, valueToRemove?: string) => {
    const params = getCurrentParams();
    
    if (filterKey === "surface" && valueToRemove && surface) {
      const surfaces = surface.split(",").filter(s => s !== valueToRemove);
      if (surfaces.length > 0) {
        params.set("surface", surfaces.join(","));
      } else {
        params.delete("surface");
      }
    } else if (filterKey === "facilities" && valueToRemove && facilities) {
      const facilityList = facilities.split(",").filter(f => f !== valueToRemove);
      if (facilityList.length > 0) {
        params.set("facilities", facilityList.join(","));
      } else {
        params.delete("facilities");
      }
    } else {
      params.delete(filterKey);
    }
    
    const query = params.toString();
    router.push(query ? `/facilities?${query}` : "/facilities");
  };

  // Get display name for sport
  const getSportDisplayName = (sportSlug: string) => {
    const sportItem = SPORTS_LIST.find(s => s.slug === sportSlug);
    if (sportItem) {
      return t(`sport.${sportItem.translationKey}` as any);
    }
    return sportSlug;
  };

  // Get display name for time
  const getTimeDisplayName = (timeValue: string) => {
    const preset = TIME_PRESETS.find(p => p.value === timeValue);
    if (preset) {
      return t(`time.${preset.translationKey}` as any);
    }
    return timeValue;
  };

  // Get display name for location type
  const getLocationTypeDisplayName = (typeValue: string) => {
    return t(`locationType.${typeValue}` as any);
  };

  // Get display name for surface
  const getSurfaceDisplayName = (surfaceValue: string) => {
    return t(`surface.${surfaceValue}` as any);
  };

  // Get display name for amenity
  const getAmenityDisplayName = (amenityValue: string) => {
    return t(`amenities.${amenityValue}` as any);
  };

  // Format date for display (dd.MM.yyyy format)
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t("date.today");
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t("date.tomorrow");
    }
    // Format as dd.MM.yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Collect all active filters
  const activeFilters: { key: string; label: string; value?: string }[] = [];

  if (city && city !== "all") {
    activeFilters.push({ key: "city", label: city });
  }
  if (region && region !== "all") {
    activeFilters.push({ key: "region", label: region });
  }
  if (sport && sport !== "all") {
    activeFilters.push({ key: "sport", label: getSportDisplayName(sport) });
  }
  if (date) {
    activeFilters.push({ key: "date", label: formatDateDisplay(date) });
  }
  if (time && time !== "any") {
    activeFilters.push({ key: "time", label: getTimeDisplayName(time) });
  }
  if (locationType && locationType !== "all") {
    activeFilters.push({ key: "locationType", label: getLocationTypeDisplayName(locationType) });
  }
  if (surface) {
    surface.split(",").forEach(s => {
      activeFilters.push({ key: "surface", label: getSurfaceDisplayName(s), value: s });
    });
  }
  if (facilities) {
    facilities.split(",").forEach(f => {
      activeFilters.push({ key: "facilities", label: getAmenityDisplayName(f), value: f });
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: premiumEase }}
      className="flex flex-wrap gap-2 items-center"
    >
      <span className="text-sm text-muted-foreground">{tPage("activeFilters")}:</span>
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
          <motion.button
            key={`${filter.key}-${filter.value || index}`}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            transition={{ 
              opacity: { duration: 0.2 },
              scale: { type: "spring", stiffness: 500, damping: 30 },
              layout: { type: "spring", stiffness: 500, damping: 30 },
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => removeFilter(filter.key, filter.value)}
            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium
                       bg-primary/10 text-primary border border-primary/20
                       hover:bg-primary/15 hover:border-primary/30 
                       transition-colors duration-200 cursor-pointer group"
          >
            <span>{filter.label}</span>
            <span className="p-0.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <X className="h-3 w-3" />
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

