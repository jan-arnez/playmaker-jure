"use client";

import { useState } from "react";
import { SportSelectionButtons } from "./sport-selection-buttons";
import { AvailabilityCalendar } from "../booking/availability-calendar";

interface FacilitySportCalendarWrapperProps {
  facilityId: string;
  facilityName: string;
  sports: string[];
  initialSelectedSport?: string;
  initialDate?: string;
}

export function FacilitySportCalendarWrapper({
  facilityId,
  facilityName,
  sports,
  initialSelectedSport = "all",
  initialDate,
}: FacilitySportCalendarWrapperProps) {
  const [selectedSport, setSelectedSport] = useState<string>(initialSelectedSport);

  return (
    <>
      <SportSelectionButtons
        sports={sports}
        selectedSport={selectedSport}
        onSportChange={setSelectedSport}
      />
      <div className="mb-8">
        <AvailabilityCalendar
          facilityId={facilityId}
          facilityName={facilityName}
          selectedSport={selectedSport === "all" ? undefined : selectedSport}
          initialDate={initialDate}
        />
      </div>
    </>
  );
}

