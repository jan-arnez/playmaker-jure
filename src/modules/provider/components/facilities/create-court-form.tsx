"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateCourtFormProps {
  sportCategoryId: string;
  onSuccess: (court: any) => void;
  onCancel?: () => void;
}

const SURFACE_TYPES = [
  "Hard",
  "Clay", 
  "Grass",
  "Synthetic",
  "Wood",
  "Concrete",
  "Carpet",
  "Other"
];

const CAPACITY_OPTIONS = [
  { value: "1", label: "1 person" },
  { value: "2", label: "2 people" },
  { value: "4", label: "4 people" },
  { value: "6", label: "6 people" },
  { value: "8", label: "8 people" },
  { value: "10", label: "10 people" },
  { value: "12", label: "12 people" },
  { value: "16", label: "16 people" },
  { value: "20", label: "20 people" },
  { value: "25", label: "25 people" },
  { value: "30", label: "30 people" },
  { value: "50", label: "50 people" },
  { value: "100", label: "100 people" },
];

export function CreateCourtForm({ sportCategoryId, onSuccess, onCancel }: CreateCourtFormProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    surface: "",
    capacity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/courts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sportCategoryId,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create court");
      }

      const court = await response.json();
      onSuccess(court);
    } catch (error) {
      console.error("Error creating court:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("courtName")} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t("enterCourtName")}
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
          <Label htmlFor="surface">{t("surface")}</Label>
          <Select 
            value={formData.surface} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, surface: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectSurface")} />
            </SelectTrigger>
            <SelectContent>
              {SURFACE_TYPES.map((surface) => (
                <SelectItem key={surface} value={surface}>
                  {surface}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">{t("capacity")}</Label>
          <Select 
            value={formData.capacity} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, capacity: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCapacity")} />
            </SelectTrigger>
            <SelectContent>
              {CAPACITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("creating") : t("createCourt")}
        </Button>
      </div>
    </form>
  );
}
