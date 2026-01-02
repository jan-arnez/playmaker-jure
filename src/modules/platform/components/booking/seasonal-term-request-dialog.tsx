"use client";

import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { CalendarDays, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TimePicker } from "@/components/ui/time-picker";

interface SeasonalTermRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityName: string;
  courtId: string;
  courtName: string;
  courtType: string;
  selectedTime: string;
  duration: number;
  defaultSeasonStartDate?: string;
  defaultSeasonEndDate?: string;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function SeasonalTermRequestDialog({
  open,
  onOpenChange,
  facilityId,
  facilityName,
  courtId,
  courtName,
  courtType,
  selectedTime,
  duration,
  defaultSeasonStartDate,
  defaultSeasonEndDate,
}: SeasonalTermRequestDialogProps) {
  const t = useTranslations("PlatformModule.booking.seasonalTerm");
  
  // Calculate default dates
  const getDefaultStartDate = () => {
    if (defaultSeasonStartDate) {
      const seasonStart = new Date(defaultSeasonStartDate);
      const today = new Date();
      return seasonStart > today ? seasonStart : today;
    }
    return addDays(new Date(), 7); // Default to 1 week from now
  };

  const getDefaultEndDate = () => {
    if (defaultSeasonEndDate) {
      return new Date(defaultSeasonEndDate);
    }
    return addDays(new Date(), 90); // Default to 3 months from now
  };

  const [formData, setFormData] = useState({
    dayOfWeek: new Date().getDay().toString(),
    startTime: selectedTime || "09:00",
    endTime: (() => {
      const [hour, minute] = (selectedTime || "09:00").split(':').map(Number);
      const totalMinutes = hour * 60 + minute + duration;
      const endHour = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      return `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    })(),
    notes: "",
  });
  
  const [startDate, setStartDate] = useState<Date>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<Date>(getDefaultEndDate());
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate number of slots
  const numberOfSlots = useMemo(() => {
    if (!startDate || !endDate || !formData.dayOfWeek) return 0;
    
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    const targetDay = parseInt(formData.dayOfWeek);
    
    while (current <= end) {
      if (current.getDay() === targetDay) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }, [startDate, endDate, formData.dayOfWeek]);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !formData.dayOfWeek) {
      toast.error(t("fillRequired"));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/bookings/seasonal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId,
          seasonalStartDate: format(startDate, "yyyy-MM-dd"),
          seasonalEndDate: format(endDate, "yyyy-MM-dd"),
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit request");
      }

      toast.success(t("requestSubmitted"));
      onOpenChange(false);
      
      // Reset form
      setFormData({
        dayOfWeek: new Date().getDay().toString(),
        startTime: selectedTime || "09:00",
        endTime: formData.endTime,
        notes: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("requestError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Court Info (read-only) */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{courtName}</p>
            <p className="text-xs text-gray-500">{facilityName} • {courtType}</p>
          </div>

          {/* Season Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("startDate")}</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate ? format(startDate, "PPP") : t("pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>{t("endDate")}</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate ? format(endDate, "PPP") : t("pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }
                    }}
                    disabled={(date) => startDate && date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Day of Week and Times */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{t("dayOfWeek")}</Label>
              <Select
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("startTime")}</Label>
              <TimePicker
                value={formData.startTime}
                onChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                placeholder="Select"
                startHour={7}
                endHour={23}
              />
            </div>
            <div>
              <Label>{t("endTime")}</Label>
              <TimePicker
                value={formData.endTime}
                onChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                placeholder="Select"
                startHour={7}
                endHour={23}
              />
            </div>
          </div>

          {/* Slots Count */}
          {numberOfSlots > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("totalSlots")}</span>
                <span className="text-lg font-bold text-primary">{numberOfSlots}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>{t("notes")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || numberOfSlots === 0}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? t("submitting") : t("submitRequest")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
