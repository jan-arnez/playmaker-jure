"use client";

import { addDays, format, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DayPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export function DayPicker({
  selectedDate,
  onDateChange,
  onPreviousDay,
  onNextDay,
}: DayPickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Generate current week starting with Monday
  const availableDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center w-full">
      {/* Calendar Icon - Far Left */}
      <div className="flex-shrink-0">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-16 h-16 rounded-full flex items-center justify-center"
            >
              <CalendarIcon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              weekStartsOn={1}
              initialFocus
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Day Picker with Arrows - Center */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-4">
        {/* Previous Day Button */}
        <Button 
          variant="outline" 
          onClick={onPreviousDay}
          className="w-16 h-16 rounded-full flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Day Picker */}
        <div className="flex items-center gap-3">
          {availableDays.map((date, index) => (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-full transition-all duration-200 hover:scale-105",
                isSelected(date)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-background hover:bg-muted text-foreground border border-border"
              )}
            >
              {/* Day Number */}
              <div className={cn(
                "text-2xl font-bold",
                isSelected(date) ? "text-white" : "text-foreground"
              )}>
                {format(date, "d")}
              </div>
              
              {/* Day Abbreviation */}
              <div className={cn(
                "text-xs font-medium",
                isSelected(date) ? "text-white/80" : "text-muted-foreground"
              )}>
                {format(date, "EEE")}
              </div>
            </button>
          ))}
        </div>

          {/* Next Day Button */}
          <Button 
            variant="outline" 
            onClick={onNextDay}
            className="w-16 h-16 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
