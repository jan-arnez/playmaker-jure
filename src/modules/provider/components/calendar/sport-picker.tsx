"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Sport {
  id: string;
  name: string;
}

interface SportPickerProps {
  sports: Sport[];
  selectedSportId?: string;
  onSportChange?: (sportId: string) => void;
}

export function SportPicker({
  sports,
  selectedSportId,
  onSportChange,
}: SportPickerProps) {
  const [selected, setSelected] = useState<string>(selectedSportId || "all");

  useEffect(() => {
    if (selectedSportId !== undefined) {
      setSelected(selectedSportId === "" ? "all" : selectedSportId);
    }
  }, [selectedSportId]);

  const handleSelect = (sportId: string) => {
    setSelected(sportId);
    onSportChange?.(sportId === "all" ? "" : sportId);
  };

  // Sort sports alphabetically for consistent display
  const sortedSports = [...sports].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={selected === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect("all")}
        className={cn(
          "h-9",
          selected === "all" && "bg-primary text-primary-foreground"
        )}
      >
        All Sports
      </Button>
      {sortedSports.map((sport) => (
        <Button
          key={sport.id}
          variant={selected === sport.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(sport.id)}
          className={cn(
            "h-9",
            selected === sport.id && "bg-primary text-primary-foreground"
          )}
        >
          {sport.name}
        </Button>
      ))}
    </div>
  );
}

