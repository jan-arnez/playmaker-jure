"use client";

import { useState, useEffect } from "react";
import { Building2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Facility {
  id: string;
  name: string;
}

interface FacilityPickerProps {
  facilities: Facility[];
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
  canManageFacilities?: boolean;
  onAddNew?: () => void;
  organizationId?: string;
}

const STORAGE_KEY_PREFIX = "selectedFacility_";

export function FacilityPicker({
  facilities,
  selectedFacilityId,
  onFacilityChange,
  canManageFacilities = false,
  onAddNew,
  organizationId,
}: FacilityPickerProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>("");

  // Get storage key based on organization
  const storageKey = organizationId 
    ? `${STORAGE_KEY_PREFIX}${organizationId}`
    : STORAGE_KEY_PREFIX;

  // Initialize from localStorage or props
  useEffect(() => {
    if (selectedFacilityId) {
      // If prop is provided, use it and save to localStorage
      setInternalSelectedId(selectedFacilityId);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, selectedFacilityId);
      }
    } else if (typeof window !== "undefined") {
      // Try to get from localStorage
      const saved = localStorage.getItem(storageKey);
      if (saved && facilities.some(f => f.id === saved)) {
        setInternalSelectedId(saved);
      } else if (facilities.length > 0) {
        // Fall back to first facility
        const firstId = facilities[0].id;
        setInternalSelectedId(firstId);
        localStorage.setItem(storageKey, firstId);
      }
    } else if (facilities.length > 0) {
      // Server-side fallback
      setInternalSelectedId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId, storageKey]);

  if (facilities.length === 0) {
    return null;
  }

  // Use internal state or fallback to first facility
  const currentFacilityId = internalSelectedId || (facilities.length > 0 ? facilities[0].id : "");

  const handleChange = (facilityId: string) => {
    if (facilityId === "add-new") {
      onAddNew?.();
    } else {
      // Update internal state
      setInternalSelectedId(facilityId);
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, facilityId);
      }
      // Call external callback if provided
      onFacilityChange?.(facilityId);
    }
  };

  return (
    <Select
      value={currentFacilityId}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-full md:w-64 lg:w-80">
        <SelectValue placeholder="Select a facility..." />
      </SelectTrigger>
      <SelectContent>
        {facilities.map((facility) => (
          <SelectItem key={facility.id} value={facility.id}>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{facility.name}</span>
            </div>
          </SelectItem>
        ))}
        {canManageFacilities && (
          <>
            <Separator className="my-2" />
            <SelectItem value="add-new" className="text-blue-600 font-medium">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Add New Facility</span>
              </div>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}

