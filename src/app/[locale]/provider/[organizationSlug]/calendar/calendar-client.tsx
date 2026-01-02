"use client";

import { useState, useEffect, useMemo } from "react";
// Removed useSearchParams import
import { useQueryState, parseAsString } from 'nuqs';
import { useTranslations } from "next-intl";
import { ProviderCalendar } from "@/modules/provider/components/calendar/provider-calendar";
import { FacilityPicker } from "@/modules/provider/components/facility-picker";
import { SportPicker } from "@/modules/provider/components/calendar/sport-picker";
import { Button } from "@/components/ui/button";

interface Facility {
  id: string;
  name: string;
  slug: string;
}

interface Court {
  id: string;
  name: string;
  facility: {
    id: string;
    name: string;
  };
  sportCategory: {
    id: string;
    name: string;
  };
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  facility: {
    id: string;
    name: string;
    slug: string;
  };
  court: {
    id: string;
    name: string;
    sportCategory: {
      id: string;
      name: string;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CalendarClientProps {
  facilities: Facility[];
  courts: Court[];
  bookings: Booking[];
  organizationId: string;
  organizationSlug: string;
  userRole?: "owner" | "admin" | "staff";
  rainSlotsEnabled?: boolean;
}

export function CalendarClient({
  facilities,
  courts,
  bookings,
  organizationId,
  organizationSlug,
  userRole,
  rainSlotsEnabled = true,
}: CalendarClientProps) {
  const t = useTranslations("ProviderModule.calendar");
  const [selectedFacilityId, setSelectedFacilityId] = useQueryState("facility", parseAsString.withDefault("all"));
  const [selectedSportId, setSelectedSportId] = useQueryState("sport", parseAsString.withDefault("all"));

  // Read from localStorage on mount (optional sync with URL)
  useEffect(() => {
    if (typeof window !== "undefined" && selectedFacilityId === "all") {
      const storageKey = `selectedFacility_${organizationId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved && facilities.some((f) => f.id === saved)) {
        setSelectedFacilityId(saved);
      } else if (facilities.length > 0) {
        setSelectedFacilityId(facilities[0].id);
      }
    }
  }, [facilities, organizationId, selectedFacilityId, setSelectedFacilityId]);

  // Extract unique sports from courts of the selected facility
  const availableSports = useMemo(() => {
    const sportsMap = new Map<string, { id: string; name: string }>();
    
    // Filter courts by selected facility
    const filteredCourts = selectedFacilityId === "all" 
      ? courts 
      : courts.filter((court) => court.facility.id === selectedFacilityId);
    
    filteredCourts.forEach((court) => {
      if (court.sportCategory && !sportsMap.has(court.sportCategory.id)) {
        sportsMap.set(court.sportCategory.id, {
          id: court.sportCategory.id,
          name: court.sportCategory.name,
        });
      }
    });
    return Array.from(sportsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [courts, selectedFacilityId]);

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId === "" ? "all" : facilityId);
    // Reset sport selection when facility changes
    setSelectedSportId("all");
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSportId(sportId === "" ? "all" : sportId);
  };

  // const searchParams = useSearchParams(); // Removed
  const [currentView, setCurrentView] = useQueryState("view", parseAsString.withDefault("calendar"));
  const [dateParam] = useQueryState("date");
  
  // Parse date from query parameter
  const initialDate = useMemo(() => {
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  }, [dateParam]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <FacilityPicker
          facilities={facilities}
          organizationId={organizationId}
          selectedFacilityId={selectedFacilityId === "all" ? undefined : selectedFacilityId}
          onFacilityChange={handleFacilityChange}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b pb-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => setCurrentView("calendar")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === "calendar"
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {t("tabs.calendar")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCurrentView("bookings")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === "bookings"
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {t("tabs.bookings")}
        </Button>
      </div>

      {/* Sport Picker */}
      {currentView === "calendar" && availableSports.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <SportPicker
            sports={availableSports}
            selectedSportId={selectedSportId === "all" ? undefined : selectedSportId}
            onSportChange={handleSportChange}
          />
        </div>
      )}

      <ProviderCalendar
        facilities={facilities}
        courts={courts}
        bookings={bookings}
        selectedFacilityId={selectedFacilityId === "all" ? undefined : selectedFacilityId}
        selectedSportId={selectedSportId === "all" ? undefined : selectedSportId}
        onFacilityChange={handleFacilityChange}
        organizationSlug={organizationSlug}
        userRole={userRole}
        rainSlotsEnabled={rainSlotsEnabled}
        initialDate={initialDate}
      />
    </div>
  );
}

