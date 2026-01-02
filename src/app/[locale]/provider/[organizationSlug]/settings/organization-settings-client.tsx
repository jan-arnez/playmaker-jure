"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudRain, Building2, MapPin, Phone, Mail, Globe, Car, Droplets, Lock, Coffee, Lightbulb, CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Amenities configuration matching the filter constants
const FACILITY_AMENITIES = [
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "showers", label: "Showers", icon: Droplets },
  { id: "lockers", label: "Lockers", icon: Lock },
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
];

interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  facilities: string[];
  defaultSeasonStartDate?: Date;
  defaultSeasonEndDate?: Date;
}

interface OrganizationSettingsClientProps {
  organizationId: string;
  organizationSlug: string;
  rainSlotsEnabled: boolean;
  userRole?: string;
  facilities?: Facility[];
}

export function OrganizationSettingsClient({
  organizationId,
  organizationSlug,
  rainSlotsEnabled: initialRainSlotsEnabled,
  userRole,
  facilities = [],
}: OrganizationSettingsClientProps) {
  const [rainSlotsEnabled, setRainSlotsEnabled] = useState(initialRainSlotsEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id || "");
  const [facilityFormData, setFacilityFormData] = useState<{
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    facilities: string[];
    defaultSeasonStartDate: string;
    defaultSeasonEndDate: string;
  } | null>(null);
  const [isSavingFacility, setIsSavingFacility] = useState(false);
  const [facilityErrors, setFacilityErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const canEdit = userRole === "owner" || userRole === "admin";

  // Update form data when selected facility changes
  useEffect(() => {
    const facility = facilities.find(f => f.id === selectedFacilityId);
    if (facility) {
      setFacilityFormData({
        name: facility.name,
        address: facility.address,
        city: facility.city,
        phone: facility.phone || "",
        email: facility.email || "",
        website: facility.website || "",
        facilities: facility.facilities || [],
        defaultSeasonStartDate: facility.defaultSeasonStartDate 
          ? new Date(facility.defaultSeasonStartDate).toISOString().split('T')[0] 
          : "",
        defaultSeasonEndDate: facility.defaultSeasonEndDate 
          ? new Date(facility.defaultSeasonEndDate).toISOString().split('T')[0] 
          : "",
      });
      setFacilityErrors({});
    } else {
      setFacilityFormData(null);
    }
  }, [selectedFacilityId, facilities]);

  const handleRainSlotsToggle = async (enabled: boolean) => {
    if (!canEdit) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainSlotsEnabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      setRainSlotsEnabled(enabled);
      router.refresh();
    } catch (error) {
      console.error("Failed to update rain slots setting:", error);
      alert("Failed to update settings. Please try again.");
      setRainSlotsEnabled(!enabled); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (!facilityFormData) return;
    setFacilityFormData(prev => prev ? ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, amenityId]
        : prev.facilities.filter(id => id !== amenityId)
    }) : null);
  };

  const validateFacilityForm = () => {
    if (!facilityFormData) return false;
    const newErrors: Record<string, string> = {};
    
    if (!facilityFormData.name.trim()) {
      newErrors.name = "Facility name is required";
    }
    if (!facilityFormData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!facilityFormData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (facilityFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facilityFormData.email)) {
      newErrors.email = "Invalid email format";
    }

    setFacilityErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveFacility = async () => {
    if (!facilityFormData || !selectedFacilityId) return;
    if (!validateFacilityForm()) return;

    setIsSavingFacility(true);
    try {
      const response = await fetch(`/api/facilities/${selectedFacilityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: facilityFormData.name.trim(),
          address: facilityFormData.address.trim(),
          city: facilityFormData.city.trim(),
          phone: facilityFormData.phone.trim() || undefined,
          email: facilityFormData.email.trim() || undefined,
          website: facilityFormData.website.trim() || undefined,
          facilities: facilityFormData.facilities,
          defaultSeasonStartDate: facilityFormData.defaultSeasonStartDate || null,
          defaultSeasonEndDate: facilityFormData.defaultSeasonEndDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update facility");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to update facility:", error);
      setFacilityErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setIsSavingFacility(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Facility Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization and facility preferences
          </p>
        </div>
        
        {/* Facility Picker - Top Right */}
        {facilities.length > 0 && (
          <Select 
            value={selectedFacilityId} 
            onValueChange={setSelectedFacilityId}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select a facility" />
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
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Rain Slots
          </CardTitle>
          <CardDescription>
            Enable or disable automatic rain slot detection for outdoor facilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rain-slots" className="text-base">
                Enable Rain Slots
              </Label>
              <p className="text-sm text-gray-500">
                When enabled, slots may be automatically marked as unavailable due to rain.
                Owners can manage these slots in the calendar.
              </p>
            </div>
            <Switch
              id="rain-slots"
              checked={rainSlotsEnabled}
              onCheckedChange={handleRainSlotsToggle}
              disabled={!canEdit || isLoading}
            />
          </div>
          {!canEdit && (
            <p className="text-sm text-gray-500">
              Only owners and admins can change this setting.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Facility Settings */}
      {facilityFormData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility Settings
            </CardTitle>
            <CardDescription>
              Update contact details and amenities for the selected facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Facility Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Facility Name *
              </Label>
              <Input
                id="name"
                value={facilityFormData.name}
                onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                placeholder="Facility name"
                disabled={!canEdit}
              />
              {facilityErrors.name && (
                <p className="text-xs text-red-500">{facilityErrors.name}</p>
              )}
            </div>

            {/* Address and City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address *
                </Label>
                <Input
                  id="address"
                  value={facilityFormData.address}
                  onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                  placeholder="Street address"
                  disabled={!canEdit}
                />
                {facilityErrors.address && (
                  <p className="text-xs text-red-500">{facilityErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={facilityFormData.city}
                  onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, city: e.target.value }) : null)}
                  placeholder="City"
                  disabled={!canEdit}
                />
                {facilityErrors.city && (
                  <p className="text-xs text-red-500">{facilityErrors.city}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={facilityFormData.phone}
                onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                placeholder="+386 1 234 5678"
                disabled={!canEdit}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={facilityFormData.email}
                onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                placeholder="facility@example.com"
                disabled={!canEdit}
              />
              {facilityErrors.email && (
                <p className="text-xs text-red-500">{facilityErrors.email}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={facilityFormData.website}
                onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, website: e.target.value }) : null)}
                placeholder="https://www.example.com"
                disabled={!canEdit}
              />
            </div>

            {/* Default Season Dates */}
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Default Season Dates (for Seasonal Terms)
              </Label>
              <p className="text-xs text-muted-foreground">
                Pre-fill date range for seasonal term requests. If left empty, Jan 1 - Dec 31 of the current year will be used.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonStart" className="text-xs">Season Start</Label>
                  <Input
                    id="seasonStart"
                    type="date"
                    value={facilityFormData.defaultSeasonStartDate}
                    onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, defaultSeasonStartDate: e.target.value }) : null)}
                    className="text-sm"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonEnd" className="text-xs">Season End</Label>
                  <Input
                    id="seasonEnd"
                    type="date"
                    value={facilityFormData.defaultSeasonEndDate}
                    onChange={(e) => setFacilityFormData(prev => prev ? ({ ...prev, defaultSeasonEndDate: e.target.value }) : null)}
                    className="text-sm"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">Amenities</Label>
              <div className="grid grid-cols-2 gap-3">
                {FACILITY_AMENITIES.map((amenity) => {
                  const Icon = amenity.icon;
                  const isChecked = facilityFormData.facilities.includes(amenity.id);
                  return (
                    <label 
                      key={amenity.id} 
                      htmlFor={`amenity-${amenity.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                        disabled={!canEdit}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{amenity.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {facilityErrors.submit && (
              <p className="text-sm text-red-500">{facilityErrors.submit}</p>
            )}

            {/* Save Button */}
            {canEdit && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveFacility} 
                  disabled={isSavingFacility}
                >
                  {isSavingFacility ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Facility Settings"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No facilities message */}
      {facilities.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No facilities available. Create a facility first to configure its settings.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
