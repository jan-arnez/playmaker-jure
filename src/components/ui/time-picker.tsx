"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  startHour?: number; // Default: 7
  endHour?: number; // Default: 23
}

// Generate time options with 30-minute intervals
// When endHour is 24, it means "up to midnight", so we include times up to 23:30 and add 00:00 for midnight
const generateTimeOptions = (startHour = 0, endHour = 23): string[] => {
  const options: string[] = [];
  const actualEndHour = endHour === 24 ? 23 : endHour;
  
  for (let hour = startHour; hour <= actualEndHour; hour++) {
    const formattedHour = hour.toString().padStart(2, "0");
    options.push(`${formattedHour}:00`);
    if (hour < actualEndHour || endHour === 24) {
      options.push(`${formattedHour}:30`);
    }
  }
  
  // Add midnight option if endHour is 24
  if (endHour === 24) {
    options.push("00:00");
  }
  
  return options;
};

// Format time for display (24-hour format, e.g., "09:00" -> "09:00")
const formatTimeDisplay = (time: string): string => {
  return time; // Already in 24-hour format
};

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Select time",
  startHour = 7,
  endHour = 23,
}: TimePickerProps) {
  const timeOptions = React.useMemo(
    () => generateTimeOptions(startHour, endHour),
    [startHour, endHour]
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <SelectValue placeholder={placeholder}>
            {value ? formatTimeDisplay(value) : placeholder}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time}>
            {formatTimeDisplay(time)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

