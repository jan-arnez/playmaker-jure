"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PiCourtBasketball } from "react-icons/pi";
import { BsFillLightningChargeFill } from "react-icons/bs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SportSelectionButtonsProps {
  sports: string[];
  selectedSport?: string;
  onSportChange?: (sport: string) => void;
}

// Sport icon mapping
const sportIcons: Record<string, string> = {
  "Tennis": "/icons/tennis.svg",
  "Multi-purpose": "/icons/tennis.svg",
  "Basketball": "/icons/basketball.svg", 
  "Football": "/icons/football.svg",
  "Swimming": "/icons/swimming.svg",
  "Volleyball": "/icons/volleyball.svg",
  "Badminton": "/icons/badminton.svg",
  "Squash": "/icons/squash.svg",
  "Table Tennis": "/icons/table tennis.svg",
  "Pickleball": "/icons/pickleball.svg",
  "Padel": "/icons/padel.svg",
  "Climbing": "/icons/climbing.svg",
};

export function SportSelectionButtons({ 
  sports, 
  selectedSport, 
  onSportChange 
}: SportSelectionButtonsProps) {
  const t = useTranslations("PlatformModule.facilityDetailPage.sportSelector");
  const [activeSport, setActiveSport] = useState(selectedSport || "all");

  // Update active sport when selectedSport prop changes
  useEffect(() => {
    if (selectedSport !== undefined) {
      setActiveSport(selectedSport);
    }
  }, [selectedSport]);

  const handleSportClick = (sport: string) => {
    setActiveSport(sport);
    onSportChange?.(sport);
  };

  // Get display name for a sport (for dropdown)
  const getDisplayName = (sport: string) => {
    return sport === "all" ? t("allSports") : sport;
  };

  // Sort sports alphabetically for consistent display
  const sortedSports = [...sports].sort((a, b) => a.localeCompare(b));

  return (
    <>
      {/* Mobile: Dropdown (shown below 640px) */}
      <div className="sm:hidden mb-6">
        <Select value={activeSport} onValueChange={handleSportClick}>
          <SelectTrigger className="w-full h-12 text-base">
            <SelectValue placeholder={t("selectSport")}>
              {getDisplayName(activeSport)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="h-12">
              <div className="flex items-center gap-2">
                <BsFillLightningChargeFill className="w-4 h-4" />
                <span>{t("allSports")}</span>
              </div>
            </SelectItem>
            {sortedSports.map((sport) => {
              const iconPath = sportIcons[sport] || "/icons/tennis.svg";
              return (
                <SelectItem key={sport} value={sport} className="h-12">
                  <div className="flex items-center gap-2">
                    {sport === "Multi-purpose" ? (
                      <PiCourtBasketball className="w-4 h-4" />
                    ) : (
                      <Image
                        src={iconPath}
                        alt={`${sport} icon`}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    )}
                    <span>{sport}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop/Tablet: Horizontal tabs (shown at 640px and above) */}
      <div className="hidden sm:flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {/* All tab */}
        <button
          type="button"
          onClick={() => handleSportClick("all")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
            activeSport === "all"
              ? "text-primary"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <BsFillLightningChargeFill className={cn(
            "w-4 h-4",
            activeSport === "all" ? "text-primary" : "text-gray-500"
          )} />
          <span>{t("allSports")}</span>
          {/* Active indicator with smooth animation */}
          {activeSport === "all" && (
            <motion.span
              layoutId="sportTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        
        {/* Individual sport tabs */}
        {sortedSports.map((sport) => {
          const iconPath = sportIcons[sport] || "/icons/tennis.svg";
          const isActive = activeSport === sport;
          
          return (
            <button
              key={sport}
              type="button"
              onClick={() => handleSportClick(sport)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                isActive
                  ? "text-primary"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {sport === "Multi-purpose" ? (
                <PiCourtBasketball className={cn(
                  "w-4 h-4",
                  isActive ? "text-primary" : "text-gray-500"
                )} />
              ) : (
                <Image
                  src={iconPath}
                  alt={`${sport} icon`}
                  width={16}
                  height={16}
                  className={cn(
                    "w-4 h-4",
                    isActive ? "" : "opacity-60"
                  )}
                />
              )}
              <span>{sport}</span>
              {/* Active indicator with smooth animation */}
              {isActive && (
                <motion.span
                  layoutId="sportTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
