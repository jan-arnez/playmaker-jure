"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";
import { TimePicker } from "@/components/ui/time-picker";
import { getEmptyWorkingHours, DAY_LABELS_FULL, DAY_ORDER } from "@/lib/working-hours";

interface EditCourtHoursDialogProps {
  court: {
    id: string;
    name: string;
    workingHours?: any;
  };
  facilityWorkingHours?: any; // Default working hours from facility
  onClose: () => void;
  onSuccess: (workingHours: any) => Promise<void>;
}

export function EditCourtHoursDialog({ court, facilityWorkingHours, onClose, onSuccess }: EditCourtHoursDialogProps) {
  // Parse facility working hours
  const parseFacilityHours = () => {
    if (!facilityWorkingHours) return getEmptyWorkingHours();
    let hours = facilityWorkingHours;
    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
      } catch {
        return getEmptyWorkingHours();
      }
    }
    return hours || getEmptyWorkingHours();
  };

  // Get facility hour bounds (earliest open, latest close across all days)
  const getFacilityHourBounds = () => {
    const facilityHours = parseFacilityHours();
    let earliestOpen = 24;
    let latestClose = 0;

    Object.values(facilityHours).forEach((dayData: any) => {
      if (!dayData.closed) {
        const [openHour] = (dayData.open || "08:00").split(':').map(Number);
        const [closeHour] = (dayData.close || "22:00").split(':').map(Number);
        if (openHour < earliestOpen) earliestOpen = openHour;
        if (closeHour > latestClose) latestClose = closeHour;
      }
    });

    // Defaults if no facility hours found
    if (earliestOpen === 24) earliestOpen = 7;
    if (latestClose === 0) latestClose = 23;

    return { earliestOpen, latestClose };
  };

  // Get facility hours for a specific day
  const getFacilityHoursForDay = (day: string) => {
    const facilityHours = parseFacilityHours();
    const dayData = facilityHours[day];
    if (!dayData || dayData.closed) {
      return { open: "08:00", close: "22:00", closed: true };
    }
    return {
      open: dayData.open || "08:00",
      close: dayData.close || "22:00",
      closed: false
    };
  };

  // Parse working hours - use court hours if available, otherwise use facility hours, otherwise use empty
  const parseCourtWorkingHours = () => {
    let hours = court.workingHours;
    if (!hours && facilityWorkingHours) {
      hours = facilityWorkingHours;
    }
    if (typeof hours === 'string') {
      try {
        hours = JSON.parse(hours);
      } catch {
        return getEmptyWorkingHours();
      }
    }
    return hours || getEmptyWorkingHours();
  };

  const facilityBounds = getFacilityHourBounds();

  // Normalize time to nearest half hour (00 or 30 minutes)
  const normalizeTime = (time: string): string => {
    if (!time) return "08:00";
    const [hours, minutes] = time.split(':').map(Number);
    const normalizedMinutes = minutes < 30 ? 0 : 30;
    return `${hours.toString().padStart(2, '0')}:${normalizedMinutes.toString().padStart(2, '0')}`;
  };

  // Normalize all times in working hours and validate against facility hours
  const normalizeWorkingHours = (hours: any) => {
    const normalized: any = {};
    Object.entries(hours).forEach(([day, dayData]: [string, any]) => {
      const facilityDayHours = getFacilityHoursForDay(day);
      
      if (dayData.closed || facilityDayHours.closed) {
        normalized[day] = {
          ...dayData,
          closed: true,
          open: facilityDayHours.open,
          close: facilityDayHours.close,
        };
      } else {
        let openTime = normalizeTime(dayData.open || facilityDayHours.open);
        let closeTime = normalizeTime(dayData.close || facilityDayHours.close);
        
        // Ensure times are within facility hours
        const [openHour] = openTime.split(':').map(Number);
        const [closeHour] = closeTime.split(':').map(Number);
        const [facilityOpenHour] = facilityDayHours.open.split(':').map(Number);
        const [facilityCloseHour] = facilityDayHours.close.split(':').map(Number);
        
        if (openHour < facilityOpenHour) openTime = facilityDayHours.open;
        if (closeHour > facilityCloseHour) closeTime = facilityDayHours.close;
        if (openHour >= closeHour) {
          // If open >= close, set to facility hours
          openTime = facilityDayHours.open;
          closeTime = facilityDayHours.close;
        }
        
        normalized[day] = {
          ...dayData,
          open: openTime,
          close: closeTime,
        };
      }
    });
    return normalized;
  };

  const [workingHours, setWorkingHours] = useState(normalizeWorkingHours(parseCourtWorkingHours()));
  const [useFacilityDefault, setUseFacilityDefault] = useState(!court.workingHours);
  const [isLoading, setIsLoading] = useState(false);

  const handleDayChange = (day: string, field: string, value: any) => {
    setWorkingHours((prev: any) => {
      const normalizedValue = field === 'open' || field === 'close' ? normalizeTime(value) : value;
      const facilityDayHours = getFacilityHoursForDay(day);
      const currentDayHours = prev[day] || { open: "08:00", close: "22:00", closed: false };
      
      // Validate that court hours are within facility hours for this day
      let finalValue = normalizedValue;
      if (field === 'open' && !facilityDayHours.closed && !currentDayHours.closed) {
        const [courtHour] = normalizedValue.split(':').map(Number);
        const [facilityOpenHour] = facilityDayHours.open.split(':').map(Number);
        const [currentCloseHour] = currentDayHours.close.split(':').map(Number);
        
        if (courtHour < facilityOpenHour) {
          finalValue = facilityDayHours.open;
        } else if (courtHour >= currentCloseHour) {
          // Open time must be before close time
          finalValue = currentDayHours.open;
        }
      } else if (field === 'close' && !facilityDayHours.closed && !currentDayHours.closed) {
        const [courtHour] = normalizedValue.split(':').map(Number);
        const [facilityCloseHour] = facilityDayHours.close.split(':').map(Number);
        const [currentOpenHour] = currentDayHours.open.split(':').map(Number);
        
        if (courtHour > facilityCloseHour) {
          finalValue = facilityDayHours.close;
        } else if (courtHour <= currentOpenHour) {
          // Close time must be after open time
          finalValue = currentDayHours.close;
        }
      }

      const updatedDay = {
        ...currentDayHours,
        [field]: finalValue
      };

      // If open time was changed and is now >= close time, adjust close time
      if (field === 'open' && !updatedDay.closed) {
        const [newOpenHour] = finalValue.split(':').map(Number);
        const [currentCloseHour] = updatedDay.close.split(':').map(Number);
        if (newOpenHour >= currentCloseHour) {
          const [facilityCloseHour] = facilityDayHours.close.split(':').map(Number);
          updatedDay.close = `${Math.min(newOpenHour + 1, facilityCloseHour).toString().padStart(2, '0')}:00`;
        }
      }

      return {
        ...prev,
        [day]: updatedDay
      };
    });
    setUseFacilityDefault(false);
  };

  const handleUseFacilityDefault = (checked: boolean) => {
    setUseFacilityDefault(checked);
    if (checked && facilityWorkingHours) {
      let facilityHours = facilityWorkingHours;
      if (typeof facilityHours === 'string') {
        try {
          facilityHours = JSON.parse(facilityHours);
        } catch {
          facilityHours = getEmptyWorkingHours();
        }
      }
      setWorkingHours(normalizeWorkingHours(facilityHours || getEmptyWorkingHours()));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // If using facility default, send null; otherwise send the working hours
      await onSuccess(useFacilityDefault ? null : workingHours);
      onClose();
    } catch (error) {
      console.error("Error updating court working hours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" />
            Working Hours - {court.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="use-facility-default"
              checked={useFacilityDefault}
              onCheckedChange={handleUseFacilityDefault}
            />
            <Label htmlFor="use-facility-default" className="text-sm font-normal cursor-pointer">
              Use facility default hours
            </Label>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-2 text-xs font-medium text-gray-600 pb-1 border-b">
              <div>Day</div>
              <div>Open</div>
              <div>Close</div>
              <div className="text-center">Closed</div>
            </div>
            {DAY_ORDER.map((day) => {
              const label = DAY_LABELS_FULL[day];
              const dayHours = workingHours[day] || { open: "08:00", close: "22:00", closed: false };
              const facilityDayHours = getFacilityHoursForDay(day);
              const shortLabel = label.slice(0, 3);
              
              // Get time bounds for this specific day
              // Handle midnight: if close time is "00:00", treat as 24 (end of day)
              const [facilityOpenHour] = facilityDayHours.closed ? [7] : facilityDayHours.open.split(':').map(Number);
              let [facilityCloseHour] = facilityDayHours.closed ? [23] : facilityDayHours.close.split(':').map(Number);
              if (facilityCloseHour === 0) facilityCloseHour = 24; // Midnight = 24
              
              // For close time picker, start from the open time (can't close before opening)
              const [currentOpenHour] = dayHours.open.split(':').map(Number);
              const closeStartHour = Math.max(facilityOpenHour, currentOpenHour);
              
              return (
                <div key={day} className={`grid grid-cols-[120px_1fr_1fr_80px] gap-2 items-center py-1 ${useFacilityDefault ? 'opacity-75' : ''}`}>
                  <Label className="text-sm font-medium">{shortLabel}</Label>
                  <TimePicker
                    value={dayHours.open}
                    onChange={(value) => handleDayChange(day, "open", value)}
                    disabled={useFacilityDefault || dayHours.closed || facilityDayHours.closed}
                    className="h-8 text-sm"
                    startHour={facilityOpenHour}
                    endHour={facilityCloseHour}
                    placeholder="Open"
                  />
                  <TimePicker
                    value={dayHours.close}
                    onChange={(value) => handleDayChange(day, "close", value)}
                    disabled={useFacilityDefault || dayHours.closed || facilityDayHours.closed}
                    className="h-8 text-sm"
                    startHour={closeStartHour}
                    endHour={facilityCloseHour}
                    placeholder="Close"
                  />
                  <div className="flex justify-center">
                    <Checkbox
                      id={`${day}-closed`}
                      checked={dayHours.closed}
                      onCheckedChange={(checked) => 
                        handleDayChange(day, "closed", checked)
                      }
                      disabled={useFacilityDefault || facilityDayHours.closed}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

