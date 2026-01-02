"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateSportCategoryFormProps {
  facilityId: string;
  onSuccess: (category: any) => void;
  onCancel?: () => void;
}

const SPORT_TYPES = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
];

const COMMON_SPORTS = [
  "Tennis",
  "Multi-purpose",
  "Badminton",
  "Table Tennis",
  "Volleyball",
  "Padel",
  "Swimming",
  "Football",
  "Squash",
  "Basketball",
  "Pickleball",
  "Other"
];

export function CreateSportCategoryForm({ facilityId, onSuccess, onCancel }: CreateSportCategoryFormProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "indoor" as "indoor" | "outdoor",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/sport-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          facilityId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create sport category");
      }

      const category = await response.json();
      onSuccess(category);
    } catch (error) {
      console.error("Error creating sport category:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSportSelect = (sport: string) => {
    if (sport === "Other") {
      setFormData(prev => ({ ...prev, name: "" }));
    } else {
      setFormData(prev => ({ ...prev, name: sport }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sport">{t("sport")} *</Label>
        <Select onValueChange={handleSportSelect}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectSport")} />
          </SelectTrigger>
          <SelectContent>
            {COMMON_SPORTS.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("categoryName")} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={t("enterCategoryName")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">{t("type")} *</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value: "indoor" | "outdoor") => 
            setFormData(prev => ({ ...prev, type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPORT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("creating") : t("createCategory")}
        </Button>
      </div>
    </form>
  );
}
