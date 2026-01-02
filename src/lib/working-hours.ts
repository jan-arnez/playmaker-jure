/**
 * Shared working hours utilities and constants
 * Used across provider dashboard and public facility pages
 */

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type WorkingHours = Record<string, DayHours>;

// Day order for consistent display
export const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// Day labels - short version
export const DAY_LABELS_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// Day labels - full version
export const DAY_LABELS_FULL: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * Empty working hours - all days closed
 * Used when creating new facilities or when no hours are set
 */
export function getEmptyWorkingHours(): WorkingHours {
  return {
    monday: { open: "08:00", close: "22:00", closed: true },
    tuesday: { open: "08:00", close: "22:00", closed: true },
    wednesday: { open: "08:00", close: "22:00", closed: true },
    thursday: { open: "08:00", close: "22:00", closed: true },
    friday: { open: "08:00", close: "22:00", closed: true },
    saturday: { open: "08:00", close: "22:00", closed: true },
    sunday: { open: "08:00", close: "22:00", closed: true },
  };
}

/**
 * Parse working hours from various formats (string, object, null)
 * Returns null if no valid data exists, otherwise returns parsed WorkingHours
 */
export function parseWorkingHours(rawHours: unknown): WorkingHours | null {
  if (!rawHours) return null;
  
  let hours = rawHours;
  
  // Handle JSON string
  if (typeof hours === 'string') {
    try {
      hours = JSON.parse(hours);
    } catch {
      return null;
    }
  }
  
  // Validate it's an object
  if (typeof hours !== 'object' || hours === null) {
    return null;
  }
  
  // Check if any valid day data exists
  const hoursObj = hours as Record<string, unknown>;
  const hasValidData = DAY_ORDER.some(day => {
    const dayHours = hoursObj[day];
    return dayHours && typeof dayHours === 'object';
  });
  
  if (!hasValidData) return null;
  
  // Build result from data
  const result: WorkingHours = {};
  
  for (const day of DAY_ORDER) {
    const dayHours = hoursObj[day];
    if (dayHours && typeof dayHours === 'object') {
      const dh = dayHours as Partial<DayHours>;
      result[day] = {
        open: dh.open || "08:00",
        close: dh.close || "22:00",
        closed: Boolean(dh.closed),
      };
    } else {
      // Day not specified - mark as closed
      result[day] = { open: "08:00", close: "22:00", closed: true };
    }
  }
  
  return result;
}

/**
 * Format a single day's hours for display
 */
export function formatDayHours(dayHours: DayHours | undefined, closedText: string = "Closed"): string {
  if (!dayHours) return closedText;
  if (dayHours.closed) return closedText;
  return `${dayHours.open} - ${dayHours.close}`;
}

/**
 * Check if working hours have any open days
 */
export function hasOpenDays(workingHours: WorkingHours | null): boolean {
  if (!workingHours) return false;
  return DAY_ORDER.some(day => workingHours[day] && !workingHours[day].closed);
}
