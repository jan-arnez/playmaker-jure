"use client";

import { useState } from "react";
import { Clock, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkingHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface WorkingHoursEditorProps {
  workingHours: WorkingHours;
  onHoursChange: (hours: WorkingHours) => void;
  className?: string;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const PRESET_HOURS = [
  { name: "Standard Business", hours: { open: "09:00", close: "17:00" } },
  { name: "Extended Business", hours: { open: "08:00", close: "20:00" } },
  { name: "24/7", hours: { open: "00:00", close: "23:59" } },
  { name: "Weekend Only", hours: { open: "10:00", close: "18:00" } },
  { name: "Evening Hours", hours: { open: "16:00", close: "22:00" } },
];

export function WorkingHoursEditor({ 
  workingHours, 
  onHoursChange, 
  className = "" 
}: WorkingHoursEditorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handleDayChange = (day: string, field: string, value: any) => {
    const newHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value
      }
    };
    onHoursChange(newHours);
  };

  const applyPreset = (preset: typeof PRESET_HOURS[0]) => {
    const newHours = { ...workingHours };
    DAYS.forEach(day => {
      newHours[day.key] = {
        open: preset.hours.open,
        close: preset.hours.close,
        closed: false
      };
    });
    onHoursChange(newHours);
    setSelectedPreset("");
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = workingHours[sourceDay];
    if (!sourceHours) return;

    const newHours = { ...workingHours };
    DAYS.forEach(day => {
      if (day.key !== sourceDay) {
        newHours[day.key] = { ...sourceHours };
      }
    });
    onHoursChange(newHours);
  };

  const resetToDefault = () => {
    const defaultHours: WorkingHours = {
      monday: { open: "08:00", close: "22:00", closed: false },
      tuesday: { open: "08:00", close: "22:00", closed: false },
      wednesday: { open: "08:00", close: "22:00", closed: false },
      thursday: { open: "08:00", close: "22:00", closed: false },
      friday: { open: "08:00", close: "22:00", closed: false },
      saturday: { open: "09:00", close: "20:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: false },
    };
    onHoursChange(defaultHours);
  };

  const getDayStatus = (day: string) => {
    const hours = workingHours[day];
    if (!hours) return "Not set";
    if (hours.closed) return "Closed";
    return `${hours.open} - ${hours.close}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Working Hours</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Apply preset" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_HOURS.map((preset) => (
                <SelectItem 
                  key={preset.name} 
                  value={preset.name}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Hours Grid */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const hours = workingHours[day.key];
          if (!hours) return null;

          return (
            <Card key={day.key} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Day Name */}
                  <div className="flex items-center gap-4">
                    <Label className="font-medium w-20 text-sm">
                      {day.label}
                    </Label>
                    
                    {/* Open/Closed Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => 
                          handleDayChange(day.key, "closed", !checked)
                        }
                      />
                      <span className="text-sm text-gray-600">
                        {hours.closed ? "Closed" : "Open"}
                      </span>
                    </div>
                  </div>

                  {/* Time Inputs */}
                  {!hours.closed && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => 
                          handleDayChange(day.key, "open", e.target.value)
                        }
                        className="w-32"
                      />
                      <span className="text-gray-500 text-sm">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => 
                          handleDayChange(day.key, "close", e.target.value)
                        }
                        className="w-32"
                      />
                      
                      {/* Copy to All Days Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAllDays(day.key)}
                        className="ml-2"
                        title="Copy to all days"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Closed State */}
                  {hours.closed && (
                    <div className="text-sm text-gray-500">
                      Closed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            Hours Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {DAYS.map((day) => (
              <div key={day.key} className="flex justify-between">
                <span className="font-medium">{day.label}:</span>
                <span className="text-gray-600">
                  {getDayStatus(day.key)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
