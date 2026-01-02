"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Mail, Globe, Car, Droplets, Lock, Coffee, Lightbulb, Building2, CalendarDays } from "lucide-react";

// Amenities configuration matching the filter constants
const FACILITY_AMENITIES = [
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "showers", label: "Showers", icon: Droplets },
  { id: "lockers", label: "Lockers", icon: Lock },
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "lighting", label: "Lighting", icon: Lightbulb },
];

interface EditBasicInfoDialogProps {
  facility: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
    website?: string;
    facilities?: string[];
    defaultSeasonStartDate?: string | null;
    defaultSeasonEndDate?: string | null;
  };
  onClose: () => void;
  onSuccess: (data: { 
    name: string;
    address: string; 
    city: string; 
    phone?: string; 
    email?: string; 
    website?: string; 
    facilities?: string[];
    defaultSeasonStartDate?: string | null;
    defaultSeasonEndDate?: string | null;
  }) => Promise<void>;
}

export function EditBasicInfoDialog({ facility, onClose, onSuccess }: EditBasicInfoDialogProps) {
  const [formData, setFormData] = useState({
    name: facility.name,
    address: facility.address,
    city: facility.city,
    phone: facility.phone || "",
    email: facility.email || "",
    website: facility.website || "",
    facilities: facility.facilities || [],
    defaultSeasonStartDate: facility.defaultSeasonStartDate || "",
    defaultSeasonEndDate: facility.defaultSeasonEndDate || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, amenityId]
        : prev.facilities.filter(id => id !== amenityId)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Facility name is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSuccess({
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        facilities: formData.facilities,
        defaultSeasonStartDate: formData.defaultSeasonStartDate || null,
        defaultSeasonEndDate: formData.defaultSeasonEndDate || null,
      });
      onClose();
    } catch (error) {
      console.error("Error updating basic info:", error);
      setErrors({ submit: "Failed to update. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Basic Information</DialogTitle>
          <DialogDescription>
            Update contact details and amenities for this facility
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Facility Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Facility name"
              required
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
                required
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
                required
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+386 1 234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="facility@example.com"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.example.com"
            />
          </div>

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
                  value={formData.defaultSeasonStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultSeasonStartDate: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seasonEnd" className="text-xs">Season End</Label>
                <Input
                  id="seasonEnd"
                  type="date"
                  value={formData.defaultSeasonEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultSeasonEndDate: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Amenities</Label>
            <div className="grid grid-cols-2 gap-3">
              {FACILITY_AMENITIES.map((amenity) => {
                const Icon = amenity.icon;
                const isChecked = formData.facilities.includes(amenity.id);
                return (
                  <label 
                    key={amenity.id} 
                    htmlFor={`amenity-${amenity.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      id={`amenity-${amenity.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{amenity.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
