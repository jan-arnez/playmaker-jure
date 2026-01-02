"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateFacilityFormProps {
  organizationId: string;
  onSuccess: (facility: any) => void;
  onCancel?: () => void;
}

const FACILITY_AMENITIES = [
  { id: "parking", label: "Parking" },
  { id: "changing_room", label: "Changing Room" },
  { id: "showers", label: "Showers" },
  { id: "lockers", label: "Lockers" },
  { id: "cafe", label: "Cafe" },
  { id: "wifi", label: "WiFi" },
  { id: "lighting", label: "Lighting" },
  { id: "heating", label: "Heating" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "first_aid", label: "First Aid" },
  { id: "security", label: "Security" },
  { id: "accessibility", label: "Accessibility" },
];

export function CreateFacilityForm({ organizationId, onSuccess, onCancel }: CreateFacilityFormProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    imageUrl: "",
    facilities: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create facility");
      }

      const facility = await response.json();
      onSuccess(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, amenityId]
        : prev.facilities.filter(id => id !== amenityId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("facilityName")} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t("enterFacilityName")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t("city")} *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder={t("enterCity")}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("address")} *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder={t("enterAddress")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={t("enterDescription")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={t("enterPhone")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t("enterEmail")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">{t("imageUrl")}</Label>
        <Input
          id="imageUrl"
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          placeholder={t("enterImageUrl")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("amenities")}</CardTitle>
          <CardDescription>
            {t("selectAmenitiesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FACILITY_AMENITIES.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={formData.facilities.includes(amenity.id)}
                  onCheckedChange={(checked) => 
                    handleAmenityChange(amenity.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={amenity.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("creating") : t("createFacility")}
        </Button>
      </div>
    </form>
  );
}
