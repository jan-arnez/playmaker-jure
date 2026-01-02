"use client";

import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { PiCourtBasketball } from "react-icons/pi";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsString } from 'nuqs';
import { format, isToday, isTomorrow, isWeekend, addDays, isSaturday, nextSaturday } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { LocationPicker } from "@/components/location-picker";
import { cn } from "@/lib/utils";
import { SPORTS_LIST, TIME_PRESETS, TIME_OPTIONS } from "@/lib/filter-constants";

interface SearchBarProps {
  initialSearch: string;
  initialCity: string;
  initialSport: string;
  initialDate: string;
  initialTime?: string;
  cities: string[];
  sports: string[];
}

export function SearchBar({
  initialSearch,
  initialCity,
  initialSport,
  initialDate,
  initialTime,
  cities,
  sports,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("filters");
  
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(initialSearch || ''));
  
  // Local state for location object, initialized from params if possible
  const [selectedLocation, setSelectedLocation] = useState<{
    id: string;
    name: string;
    type: "current" | "region" | "city" | "place";
    region?: string;
  } | null>(() => {
    if (initialCity && initialCity !== "all") {
        return {
          id: `city-${initialCity}`,
          name: initialCity,
          type: 'city',
        };
    }
    return null;
  });

  const [city, setCity] = useQueryState('city', parseAsString.withDefault('all'));
  const [region, setRegion] = useQueryState('region', parseAsString.withDefault('all'));

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
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // If we are not on the facilities page, we need to navigate there with the current params
      if (!pathname.includes('/facilities')) {
         const currentParams = new URLSearchParams(searchParams?.toString() || "");
         const url = `/facilities?${currentParams.toString()}`;
         router.push(url);
      }
      // If we are already on facilities page, nuqs handles the URL update automatically via the setters above
    } finally {
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const today = new Date();
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

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

  // Get display name for the selected sport
  const getSelectedSportName = () => {
    if (sport === "all") return t("sport.allSports");
    const sportItem = SPORTS_LIST.find((s) => s.slug === sport);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sportItem ? t(`sport.${sportItem.translationKey}` as any) : sport;
  };

  // Get display name for time
  const getTimeDisplayName = () => {
    if (time === "any") return t("time.anyTime");
    const preset = TIME_PRESETS.find((p) => p.value === time);
    return preset ? t(`time.${preset.translationKey}`) : time;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full text-sm font-medium">
      <div className="sm:w-56 relative">
        <LocationPicker
          value={selectedLocation?.name || ""}
          onLocationSelect={handleLocationSelect}
          className="h-14 text-sm font-medium"
        />
      </div>

      {/* Sports Selector */}
      <div className="sm:w-56 relative">
        <Popover open={sportOpen} onOpenChange={setSportOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={sportOpen}
              className={cn(
                "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative group",
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
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      alt={t(`sport.${sportItem.translationKey}` as any)}
                      width={16}
                      height={16}
                      className="h-4 w-4 flex-shrink-0"
                    />
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <span className="truncate flex-1">{t(`sport.${sportItem.translationKey}` as any)}</span>
                  {sport === sportItem.slug && <Check className="h-4 w-4 text-primary" />}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Date Picker */}
      <div className="sm:w-56 relative">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative group",
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
          <PopoverContent align="start" side="bottom" avoidCollisions={false} className="w-auto p-0 text-sm font-medium">
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
                setDateOpen(false);
              }}
              weekStartsOn={1}
              disabled={{ before: todayAtMidnight }}
              initialFocus
              className="rounded-md border-0 text-sm font-medium"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selector */}
      <div className="sm:w-56 relative">
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-14 w-full justify-start text-left font-medium rounded-full pl-10 pr-10 text-sm relative group",
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
          <PopoverContent className="w-[280px] p-4 text-sm font-medium" align="start" side="bottom" avoidCollisions={false}>
            <div className="space-y-4">
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

              {/* Visual separator and exact time selector */}
              <div className="border-t pt-4 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("time.selectExactTime")}
                </label>
                <Select value={time} onValueChange={(newTime) => {
                  setTime(newTime);
                  setTimeOpen(false);
                }}>
                  <SelectTrigger className="w-full text-sm font-medium">
                    <SelectValue placeholder={t("time.selectTime")} />
                  </SelectTrigger>
                  <SelectContent className="text-sm font-medium">
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm font-medium"
                      >
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

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        className="h-14 w-full sm:w-14 rounded-full text-sm font-medium"
        variant="default"
        disabled={isSearching}
        aria-label="Search facilities"
      >
        {isSearching ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}