"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQueryState, parseAsString } from 'nuqs';
import { Building2, Calendar, Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AnalyticsFiltersProps {
  facilities: Array<{ id: string; name: string }>;
  courts: Array<{ id: string; name: string; facilityId: string }>;
  initialFilters?: {
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    facilityId?: string;
    courtId?: string;
  };
  onFiltersChange?: (filters: any) => void;
}
export function AnalyticsFilters({
  facilities,
  courts,
  onFiltersChange,
}: AnalyticsFiltersProps) {
  const t = useTranslations("ProviderModule.analytics.filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params using nuqs
  const [dateRange, setDateRange] = useQueryState("dateRange", parseAsString.withDefault("all"));
  const [startDateString, setStartDateString] = useQueryState("startDate");
  const [endDateString, setEndDateString] = useQueryState("endDate");
  
  const startDate = startDateString ? new Date(startDateString) : undefined;
  const endDate = endDateString ? new Date(endDateString) : undefined;

  const [facilityId, setFacilityId] = useQueryState("facilityId", parseAsString.withDefault("all"));
  const [courtId, setCourtId] = useQueryState("courtId", parseAsString.withDefault("all"));
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Filter courts based on selected facility
  const availableCourts = facilityId === "all"
    ? courts
    : courts.filter((c) => c.facilityId === facilityId);

  const handleDateRangeChange = (range: string) => {
    // Cast to expected type for logic
    const typedRange = range as "7d" | "30d" | "90d" | "custom" | "all";
    setDateRange(typedRange);
    
    if (typedRange === "custom") {
      setShowCustomDatePicker(true);
      return;
    }

    let newStartDate: Date | undefined;
    let newEndDate: Date | undefined;

    if (typedRange !== "all") {
      newEndDate = new Date();
      newEndDate.setHours(23, 59, 59, 999);
      newStartDate = new Date();
      
      if (typedRange === "7d") {
        newStartDate.setDate(newStartDate.getDate() - 7);
      } else if (typedRange === "30d") {
        newStartDate.setDate(newStartDate.getDate() - 30);
      } else if (typedRange === "90d") {
        newStartDate.setDate(newStartDate.getDate() - 90);
      }
      
      newStartDate.setHours(0, 0, 0, 0);
    }

    setStartDateString(newStartDate?.toISOString().split('T')[0] || null);
    setEndDateString(newEndDate?.toISOString().split('T')[0] || null);
  };

  const handleCustomDateRange = (start: Date | undefined, end: Date | undefined) => {
    setStartDateString(start?.toISOString().split('T')[0] || null);
    setEndDateString(end?.toISOString().split('T')[0] || null);
    
    if (start && end) {
      setShowCustomDatePicker(false);
      setDateRange("custom");
    }
  };

  useEffect(() => {
    onFiltersChange?.({
      dateRange,
      startDate,
      endDate,
      facilityId,
      courtId,
    });
  }, [dateRange, startDateString, endDateString, facilityId, courtId, onFiltersChange]);

  const handleFacilityChange = (value: string) => {
    setFacilityId(value);
    // Reset court if facility changes
    setCourtId("all");
  };

  const clearFilters = () => {
    setDateRange("all");
    setStartDateString(null);
    setEndDateString(null);
    setFacilityId("all");
    setCourtId("all");
  };

  const hasActiveFilters =
    dateRange !== "all" || facilityId !== "all" || courtId !== "all";

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{t("label")}</span>
      </div>

      {/* Date Range Filter */}
      <Select value={dateRange} onValueChange={handleDateRangeChange}>
        <SelectTrigger className="w-full sm:w-40">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTime")}</SelectItem>
          <SelectItem value="7d">{t("last7Days")}</SelectItem>
          <SelectItem value="30d">{t("last30Days")}</SelectItem>
          <SelectItem value="90d">{t("last90Days")}</SelectItem>
          <SelectItem value="custom">{t("customRange")}</SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Date Range Picker */}
      {dateRange === "custom" && (
        <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-64">
              <Calendar className="h-4 w-4 mr-2" />
              {startDate && endDate
                ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                : t("selectDateRange")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                handleCustomDateRange(range?.from, range?.to);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Facility Filter */}
      <Select value={facilityId} onValueChange={handleFacilityChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Building2 className="h-4 w-4 mr-2" />
          <SelectValue placeholder={t("allFacilities")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allFacilities")}</SelectItem>
          {facilities.map((facility) => (
            <SelectItem key={facility.id} value={facility.id}>
              {facility.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Court Filter */}
      {availableCourts.length > 0 && (
        <Select
          value={courtId}
          onValueChange={setCourtId}
          disabled={facilityId === "all" && availableCourts.length === 0}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("allCourts")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCourts")}</SelectItem>
            {availableCourts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="ml-auto"
        >
          <X className="h-4 w-4 mr-1" />
          {t("clearFilters")}
        </Button>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {dateRange !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {dateRange === "custom" && startDate && endDate
                ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                : dateRange === "7d"
                ? t("last7Days")
                : dateRange === "30d"
                ? t("last30Days")
                : t("last90Days")}
            </Badge>
          )}
          {facilityId !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {facilities.find((f) => f.id === facilityId)?.name}
            </Badge>
          )}
          {courtId !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {courts.find((c) => c.id === courtId)?.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

