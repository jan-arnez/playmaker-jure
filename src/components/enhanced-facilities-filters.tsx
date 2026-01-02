"use client";

import { useState } from "react";
// Removed useRouter as nuqs handles URL updates
import { useTranslations } from "next-intl";
import { useQueryState, parseAsString } from 'nuqs';
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  Droplets,
  Lock,
  Coffee,
  Lightbulb,
  X,
  Check,
  House,
  Sun,
  HousePlus,
} from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { PiCourtBasketball } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/location-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterAccordion, FilterCheckbox } from "@/components/filter-accordion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { format, isToday, isTomorrow, isWeekend, addDays, isSaturday, nextSaturday } from "date-fns";
import {
  SPORTS_LIST,
  TIME_PRESETS,
  TIME_OPTIONS,
  LOCATION_TYPES,
  SURFACE_TYPES,
  FACILITY_AMENITIES,
} from "@/lib/filter-constants";

// Icons for location types
const locationTypeIcons = {
  all: HousePlus,
  indoor: House,
  outdoor: Sun,
};

// Icons for amenities
const amenityIcons = {
  parking: Car,
  showers: Droplets,
  lockers: Lock,
  cafe: Coffee,
  lighting: Lightbulb,
};

interface EnhancedFacilitiesFiltersProps {
  initialSearch?: string;
  initialCity?: string;
  initialRegion?: string;
  initialSport?: string;
  initialDate?: string;
  initialTime?: string;
  initialLocationType?: string;
  initialSurface?: string;
  initialFacilities?: string[];
  cities: string[];
}

export function EnhancedFacilitiesFilters({
  initialCity = "all",
  initialRegion = "all",
  // Other initials are handled by nuqs default or state init
}: EnhancedFacilitiesFiltersProps) {
  const t = useTranslations("filters");

  const [city, setCity] = useQueryState('city', parseAsString.withDefault('all'));
  const [region, setRegion] = useQueryState('region', parseAsString.withDefault('all'));

  // Local state for location picker UI synchronization
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
    type: "current" | "region" | "city" | "place";
    region?: string;
  } | null>(() => {
    // Initialize with the selected city or region from URL params (or props if first load)
    // Note: nuqs hooks might return default 'all' on first render if strictly client-side, 
    // but we can trust props or the fact that layout wraps us.
    // For consistency with props given (if any):
    if (initialCity && initialCity !== "all") {
      return {
        id: `city-${initialCity.toLowerCase().replace(/\s+/g, "-")}`,
        name: initialCity,
        type: "city" as const,
        region: initialRegion !== "all" ? initialRegion : undefined,
      };
    }
    if (initialRegion && initialRegion !== "all") {
      return {
        id: `region-${initialRegion.toLowerCase().replace(/\s+/g, "-")}`,
        name: initialRegion,
        type: "region" as const,
        region: initialRegion,
      };
    }
    return null;
  });

  const [sport, setSport] = useQueryState('sport', parseAsString.withDefault('all'));
  const [sportOpen, setSportOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  
  const [dateString, setDateString] = useQueryState('date');
  const date = dateString ? new Date(dateString) : undefined;
  
  const setDate = (newDate: Date | undefined) => {
    if (!newDate) {
      setDateString(null);
      return;
    }
    const iso = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()))
      .toISOString()
      .slice(0, 10);
    setDateString(iso);
  };
  
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useQueryState('time', parseAsString.withDefault('any'));
  const [locationType, setLocationType] = useQueryState('locationType', parseAsString.withDefault('all'));

  const [surfaceString, setSurfaceString] = useQueryState('surface');
  const selectedSurfaces = surfaceString ? surfaceString.split(',') : [];

  const setSelectedSurfaces = (surfaces: string[]) => {
    setSurfaceString(surfaces.length > 0 ? surfaces.join(',') : null);
  };

  const [facilitiesString, setFacilitiesString] = useQueryState('facilities');
  const selectedFacilities = facilitiesString ? facilitiesString.split(',') : [];

  const setSelectedFacilities = (facilities: string[]) => {
    setFacilitiesString(facilities.length > 0 ? facilities.join(',') : null);
  };

  // Sync selectedLocation to query states
  const handleLocationSelect = (location: {
    id: string;
    name: string;
    type: "current" | "region" | "city" | "place";
    region?: string;
  } | null) => {
    setSelectedLocation(location);
    if (location) {
        if (location.type === 'region') {
            setRegion(location.name);
            setCity(null);
        } else {
            setCity(location.name);
            setRegion(null);
        }
    } else {
        setCity(null);
        setRegion(null);
    }
  };


  // Get display name for the selected sport
  const getSelectedSportName = () => {
    if (sport === "all") return t("sport.allSports");
    const sportItem = SPORTS_LIST.find((s) => s.slug === sport);
    return sportItem ? t(`sport.${sportItem.translationKey}`) : sport;
  };

  // Get display name for time
  const getTimeDisplayName = () => {
    if (time === "any") return t("time.anyTime");
    const preset = TIME_PRESETS.find((p) => p.value === time);
    return preset ? t(`time.${preset.translationKey}`) : time;
  };

  // Get display text for date (Today, Tomorrow, or formatted date)
  const getDateDisplayText = () => {
    if (!date) return t("date.selectDate");
    if (isToday(date)) return t("date.today");
    if (isTomorrow(date)) return t("date.tomorrow");
    return format(date, "dd.MM.yyyy");
  };

  // Get next weekend (Saturday)
  const getNextWeekend = () => {
    const now = new Date();
    if (isSaturday(now)) return now;
    return nextSaturday(now);
  };

  // Handle date preset selection
  const handleDatePreset = (preset: 'today' | 'tomorrow' | 'weekend') => {
    switch (preset) {
      case 'today':
        setDate(new Date());
        break;
      case 'tomorrow':
        setDate(addDays(new Date(), 1));
        break;
      case 'weekend':
        setDate(getNextWeekend());
        break;
    }
    // Auto-close the popover after selection
    setDateOpen(false);
  };

  const today = new Date();
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Check if there are any active filters
  const hasActiveFilters = !!(
    (selectedLocation && selectedLocation.name !== "all") ||
    sport !== "all" ||
    date ||
    time !== "any" ||
    locationType !== "all" ||
    selectedSurfaces.length > 0 ||
    selectedFacilities.length > 0
  );

  const handleClearAll = () => {
    setSelectedLocation(null);
    setCity("all");
    setRegion("all");
    setSport("all");
    setDate(undefined);
    setTime("any");
    setLocationType("all");
    setSelectedSurfaces([]);
    setSelectedFacilities([]);
  };

  return (
    <div className="w-full lg:w-80 bg-white lg:border-r border-gray-200 space-y-0">
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">{t("title")}</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              {t("clearAll")}
            </Button>
          )}
        </div>
      </div>

      {/* Main Filters */}
      <div className="p-4 lg:p-6 space-y-5 lg:space-y-6">
        {/* Location Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("location.label")}</label>
          <LocationPicker
            value={selectedLocation?.name || ""}
            onLocationSelect={handleLocationSelect}
            className="h-14 text-sm font-medium"
          />
        </div>

        {/* Sport Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("sport.label")}</label>
          <Popover open={sportOpen} onOpenChange={setSportOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={sportOpen}
                className={cn(
                  "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative",
                  sport === "all" && "text-muted-foreground"
                )}
              >
                <BsFillLightningChargeFill className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{getSelectedSportName()}</span>
                {sport !== "all" && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSport("all");
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setSport("all")}
                    className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Clear sport"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-[280px] p-0 text-sm font-medium" align="start" side="bottom" avoidCollisions={false}>
              <div className="max-h-[300px] overflow-y-auto">
                <div
                  onClick={() => {
                    setSport("all");
                    setSportOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm font-medium",
                    sport === "all" && "bg-accent"
                  )}
                >
                  <BsFillLightningChargeFill className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{t("sport.allSports")}</span>
                  {sport === "all" && <Check className="h-4 w-4 text-primary" />}
                </div>
                {SPORTS_LIST.map((sportItem) => (
                  <div
                    key={sportItem.slug}
                    onClick={() => {
                      setSport(sportItem.slug);
                      setSportOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm font-medium",
                      sport === sportItem.slug && "bg-accent"
                    )}
                  >
                    {sportItem.useCustomIcon ? (
                      <PiCourtBasketball className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Image
                        src={sportItem.icon}
                        alt={t(`sport.${sportItem.translationKey}`)}
                        width={16}
                        height={16}
                        className="h-4 w-4 flex-shrink-0"
                      />
                    )}
                    <span className="truncate flex-1">{t(`sport.${sportItem.translationKey}`)}</span>
                    {sport === sportItem.slug && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("date.label")}</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{getDateDisplayText()}</span>
                {date && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setDate(undefined)}
                    className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Clear date"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="bottom" avoidCollisions={false} className="w-auto p-0">
              {/* Quick Date Presets */}
              <div className="px-3 pt-3 pb-2 border-b flex gap-1">
                <Button
                  variant={date && isToday(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePreset('today')}
                  className="flex-1 text-xs"
                >
                  {t("date.today")}
                </Button>
                <Button
                  variant={date && isTomorrow(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePreset('tomorrow')}
                  className="flex-1 text-xs"
                >
                  {t("date.tomorrow")}
                </Button>
                <Button
                  variant={date && isWeekend(date) && !isToday(date) && !isTomorrow(date) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePreset('weekend')}
                  className="flex-1 text-xs"
                >
                  {t("date.weekend")}
                </Button>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  // Auto-close the popover after date selection
                  setDateOpen(false);
                }}
                weekStartsOn={1}
                disabled={{ before: todayAtMidnight }}
                initialFocus
                className="rounded-md border-0"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("time.label")}</label>
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative",
                  time === "any" && "text-muted-foreground"
                )}
              >
                <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{getTimeDisplayName()}</span>
                {time !== "any" && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTime("any");
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setTime("any")}
                    className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Clear time"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-[280px] p-4 text-sm font-medium" align="start" side="bottom" avoidCollisions={false}>
              <div className="space-y-4">
                {/* Time Presets */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {TIME_PRESETS.slice(0, 2).map((preset) => (
                    <Button
                        key={preset.value}
                        variant={time === preset.value ? "default" : "outline"}
                      size="sm"
                        onClick={() => {
                          setTime(preset.value);
                          setTimeOpen(false);
                        }}
                        className="flex-1 text-sm font-medium"
                    >
                        {t(`time.${preset.translationKey}`)}
                    </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {TIME_PRESETS.slice(2).map((preset) => (
                    <Button
                        key={preset.value}
                        variant={time === preset.value ? "default" : "outline"}
                      size="sm"
                        onClick={() => {
                          setTime(preset.value);
                          setTimeOpen(false);
                        }}
                        className="flex-1 text-sm font-medium"
                    >
                        {t(`time.${preset.translationKey}`)}
                    </Button>
                    ))}
                  </div>
                </div>

                {/* Visual separator and Specific Time Picker */}
                <div className="border-t pt-4 space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("time.selectExactTime")}
                  </label>
                  <Select
                    value={time}
                    onValueChange={(newTime) => {
                      setTime(newTime);
                      setTimeOpen(false);
                    }}
                  >
                    <SelectTrigger className="w-full text-sm font-medium">
                      <SelectValue placeholder={t("time.selectTime")} />
                    </SelectTrigger>
                    <SelectContent className="text-sm font-medium">
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm font-medium">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Location Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("locationType.label")}</label>
          <Select
            value={locationType}
            onValueChange={setLocationType}
          >
            <SelectTrigger className={cn(
              "h-14 rounded-full text-sm font-medium pl-10 relative",
              locationType === "all" && "text-muted-foreground"
            )}>
              {(() => {
                const IconComponent = locationTypeIcons[locationType as keyof typeof locationTypeIcons] || HousePlus;
                return <IconComponent className="absolute left-3 h-4 w-4 flex-shrink-0" />;
              })()}
              <SelectValue placeholder={t("locationType.allTypes")} />
            </SelectTrigger>
            <SelectContent className="text-sm font-medium">
              {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm font-medium">
                    {t(`locationType.${type.translationKey}`)}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Accordion Filters */}
      <div className="space-y-0">
        {/* Surface Filter Accordion */}
        <FilterAccordion title={t("surface.label")}>
          {SURFACE_TYPES.map((type) => (
            <FilterCheckbox
              key={type.value}
              id={type.value}
              label={t(`surface.${type.translationKey}`)}
              checked={selectedSurfaces.includes(type.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedSurfaces([...selectedSurfaces, type.value]);
                } else {
                  setSelectedSurfaces(
                    selectedSurfaces.filter((s) => s !== type.value)
                  );
                }
              }}
            />
          ))}
        </FilterAccordion>

        {/* Amenities Filter Accordion */}
        <FilterAccordion title={t("amenities.label")}>
          {FACILITY_AMENITIES.map((amenity) => {
            const IconComponent = amenityIcons[amenity.value as keyof typeof amenityIcons];
            return (
            <FilterCheckbox
              key={amenity.value}
              id={amenity.value}
                label={t(`amenities.${amenity.translationKey}`)}
              checked={selectedFacilities.includes(amenity.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedFacilities([...selectedFacilities, amenity.value]);
                } else {
                  setSelectedFacilities(
                    selectedFacilities.filter((f) => f !== amenity.value)
                  );
                }
              }}
                icon={<IconComponent className="h-4 w-4" />}
            />
            );
          })}
        </FilterAccordion>
      </div>
    </div>
  );
}
