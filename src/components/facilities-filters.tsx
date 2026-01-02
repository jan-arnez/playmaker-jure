"use client";

import { useState } from "react";
// Removed useRouter as nuqs handles URL updates
import { useTranslations } from "next-intl";
import { useQueryState, parseAsString } from 'nuqs';
import { Calendar as CalendarIcon, Clock, Car, Droplets, Lock, Coffee, Lightbulb, X, Check, House, Sun, HousePlus } from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { PiCourtBasketball } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/location-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

interface FacilitiesFiltersProps {
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

export function FacilitiesFilters({
  initialSearch = "",
  initialCity = "all",
  initialRegion = "all", 
  initialSport = "all",
  initialDate = "",
  initialTime = "any",
  initialLocationType = "all",
  initialSurface = "all",
  initialFacilities = [],
  cities
}: FacilitiesFiltersProps) {
  const t = useTranslations("filters");
  
  // Local state for location picker UI synchronization
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
    type: 'current' | 'region' | 'city' | 'place';
    region?: string;
  } | null>(() => {
    // Initialize with the selected city or region from URL params
    if (initialCity && initialCity !== "all") {
      return {
        id: `city-${initialCity.toLowerCase().replace(/\s+/g, '-')}`,
        name: initialCity,
        type: 'city' as const,
        region: initialRegion !== "all" ? initialRegion : undefined
      };
    }
    if (initialRegion && initialRegion !== "all") {
      return {
        id: `region-${initialRegion.toLowerCase().replace(/\s+/g, '-')}`,
        name: initialRegion,
        type: 'region' as const,
        region: initialRegion
      };
    }
    return null;
  });

  const [city, setCity] = useQueryState('city', parseAsString.withDefault('all'));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [region, setRegion] = useQueryState('region', parseAsString.withDefault('all'));

  const [sport, setSport] = useQueryState('sport', parseAsString.withDefault('all'));
  const [sportOpen, setSportOpen] = useState(false);
  
  const [dateString, setDateString] = useQueryState('date');
  const date = dateString ? new Date(dateString) : undefined;
  
  const setDate = (newDate: Date | undefined) => {
    if (!newDate) {
      setDateString(null);
      return;
    }
    // Create UTC date to avoid timezone issues when converting to ISO string substring
    const iso = new Date(Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()))
      .toISOString()
      .slice(0, 10);
    setDateString(iso);
  };

  const [time, setTime] = useQueryState('time', parseAsString.withDefault('any'));
  
  const [locationType, setLocationType] = useQueryState('locationType', parseAsString.withDefault('all'));
  
  // Manually handle comma-separated arrays for surface and facilities
  const [surfaceString, setSurfaceString] = useQueryState('surface', parseAsString.withDefault(''));
  const selectedSurfaces = surfaceString ? surfaceString.split(',').filter(Boolean) : [];
  
  const setSelectedSurfaces = (surfaces: string[]) => {
    const newValue = surfaces.length > 0 ? surfaces.join(',') : null;
    setSurfaceString(newValue);
  };
  
  const [facilitiesString, setFacilitiesString] = useQueryState('facilities', parseAsString.withDefault(''));
  const selectedFacilities = facilitiesString ? facilitiesString.split(',').filter(Boolean) : [];
  
  const setSelectedFacilities = (facilities: string[]) => {
    const newValue = facilities.length > 0 ? facilities.join(',') : null;
    setFacilitiesString(newValue);
  };

  // Update city/region when location changes
  const handleLocationSelect = (location: {
    id: string;
    name: string;
    type: 'current' | 'region' | 'city' | 'place';
    region?: string;
  } | null) => {
    setSelectedLocation(location);
    if (location) {
      if (location.name !== "all") {
         setCity(location.name);
      } else {
         setCity(null);
      }
    } else {
      setCity(null);
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
  };

  const today = new Date();
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-primary mb-4">{t("title")}</h3>
      
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSport("all");
                    }
                  }}
                  className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Clear sport"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 text-sm font-medium" align="start" side="bottom" avoidCollisions={false}>
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
                  {'useCustomIcon' in sportItem && sportItem.useCustomIcon ? (
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
        <Popover>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setDate(undefined);
                    }
                  }}
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
                onClick={() => {
                  handleDatePreset('today');
                }}
                className="flex-1 text-xs"
              >
                {t("date.today")}
              </Button>
              <Button
                variant={date && isTomorrow(date) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  handleDatePreset('tomorrow');
                }}
                className="flex-1 text-xs"
              >
                {t("date.tomorrow")}
              </Button>
              <Button
                variant={date && isWeekend(date) && !isToday(date) && !isTomorrow(date) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  handleDatePreset('weekend');
                }}
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
        <Popover>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setTime("any");
                    }
                  }}
                  className="absolute right-3 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Clear time"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4 text-sm font-medium" align="start" side="bottom" avoidCollisions={false}>
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
                <Select value={time} onValueChange={(newTime) => {
                  setTime(newTime);
                }}>
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
          onValueChange={(newLocationType) => {
            setLocationType(newLocationType);
          }}
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

      {/* Surface Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("surface.label")}</label>
        <div className="space-y-2">
          {SURFACE_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={selectedSurfaces.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSurfaces([...selectedSurfaces, type.value]);
                  } else {
                    setSelectedSurfaces(selectedSurfaces.filter(s => s !== type.value));
                  }
                }}
              />
              <label
                htmlFor={type.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t(`surface.${type.translationKey}`)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Facilities Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("amenities.label")}</label>
        <div className="space-y-2">
          {FACILITY_AMENITIES.map((amenity) => {
            const IconComponent = amenityIcons[amenity.value as keyof typeof amenityIcons];
            return (
            <div key={amenity.value} className="flex items-center space-x-2">
              <Checkbox
                id={amenity.value}
                checked={selectedFacilities.includes(amenity.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedFacilities([...selectedFacilities, amenity.value]);
                  } else {
                    setSelectedFacilities(selectedFacilities.filter(f => f !== amenity.value));
                  }
                }}
              />
              <label
                htmlFor={amenity.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {t(`amenities.${amenity.translationKey}`)}
              </label>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
