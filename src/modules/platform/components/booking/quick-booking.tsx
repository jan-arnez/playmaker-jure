"use client";

import { Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickBookingProps {
  facilitySlug: string;
  facilityName: string;
  sport?: string;
}

export function QuickBooking({
  facilitySlug,
  facilityName: _facilityName,
  sport,
}: QuickBookingProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  const timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
  ];

  const handleQuickBook = () => {
    if (selectedDate && selectedTime) {
      // Navigate to facility page with pre-selected booking
      window.location.href = `/facilities/${facilitySlug}?date=${selectedDate}&time=${selectedTime}`;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Quick Book
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sport && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{sport}</Badge>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-input">Date</Label>
            <Input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-select">Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger id="time-select">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleQuickBook}
            disabled={!selectedDate || !selectedTime}
            className="flex-1"
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Book Now
          </Button>

          <Button variant="outline" asChild size="sm">
            <Link href={`/facilities/${facilitySlug}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
