"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "expired";
  maxUsage?: number | null;
  maxUsagePerUser?: number | null;
  facilities: string[];
  sportCategories?: string[];
  courts?: string[];
  timeRestrictions?: {
    daysOfWeek?: number[];
    timeRange?: { start: string; end: string };
  } | null;
}

interface EditPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion;
  facilities: Array<{
    id: string;
    name: string;
    sportCategories: Array<{
      id: string;
      name: string;
      type: string;
      courts: Array<{ id: string; name: string }>;
    }>;
  }>;
  onSuccess: () => void;
}

export function EditPromotionDialog({
  open,
  onOpenChange,
  promotion,
  facilities,
  onSuccess,
}: EditPromotionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set());
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: promotion.name,
    description: promotion.description || "",
    discountType: promotion.discountType,
    discountValue: promotion.discountValue.toString(),
    startDate: promotion.startDate.split("T")[0],
    endDate: promotion.endDate.split("T")[0],
    status: promotion.status === "expired" ? "inactive" : promotion.status,
    maxUsage: promotion.maxUsage?.toString() || "",
    maxUsagePerUser: promotion.maxUsagePerUser?.toString() || "1",
    facilityIds: promotion.facilities || [],
    sportCategoryIds: promotion.sportCategories || [],
    courtIds: promotion.courts || [],
    firstTimeCustomerOnly: (promotion as any).firstTimeCustomerOnly || false,
    timeRestrictions: {
      enabled: !!promotion.timeRestrictions,
      daysOfWeek: promotion.timeRestrictions?.daysOfWeek || [],
      timeRange: promotion.timeRestrictions?.timeRange || { start: "07:00", end: "10:00" },
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine targeting level based on selections
  const targetingLevel = useMemo(() => {
    if (formData.courtIds.length > 0) return "courts";
    if (formData.sportCategoryIds.length > 0) return "sports";
    if (formData.facilityIds.length > 0) return "facilities";
    return "all";
  }, [formData.facilityIds, formData.sportCategoryIds, formData.courtIds]);

  const toggleFacilityExpand = (facilityId: string) => {
    setExpandedFacilities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(facilityId)) {
        newSet.delete(facilityId);
      } else {
        newSet.add(facilityId);
      }
      return newSet;
    });
  };

  const toggleSportExpand = (sportId: string) => {
    setExpandedSports((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sportId)) {
        newSet.delete(sportId);
      } else {
        newSet.add(sportId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (open && promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || "",
        discountType: promotion.discountType,
        discountValue: promotion.discountValue.toString(),
        startDate: promotion.startDate.split("T")[0],
        endDate: promotion.endDate.split("T")[0],
        status: promotion.status === "expired" ? "inactive" : promotion.status,
        maxUsage: promotion.maxUsage?.toString() || "",
        maxUsagePerUser: promotion.maxUsagePerUser === null ? "0" : (promotion.maxUsagePerUser?.toString() || "1"),
        facilityIds: promotion.facilities || [],
        sportCategoryIds: promotion.sportCategories || [],
        courtIds: promotion.courts || [],
        firstTimeCustomerOnly: (promotion as any).firstTimeCustomerOnly || false,
        timeRestrictions: {
          enabled: !!promotion.timeRestrictions,
          daysOfWeek: promotion.timeRestrictions?.daysOfWeek || [],
          timeRange: promotion.timeRestrictions?.timeRange || { start: "07:00", end: "10:00" },
        },
      });
      setErrors({});
    }
  }, [open, promotion]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.discountValue) {
      newErrors.discountValue = "Discount value is required";
    } else {
      const value = Number(formData.discountValue);
      if (isNaN(value) || value < 0) {
        newErrors.discountValue = "Discount value must be a positive number";
      } else if (formData.discountType === "percentage" && value > 100) {
        newErrors.discountValue = "Percentage cannot exceed 100";
      }
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (formData.startDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (formData.maxUsage && (isNaN(Number(formData.maxUsage)) || Number(formData.maxUsage) < 1)) {
      newErrors.maxUsage = "Max usage must be a positive number";
    }
    if (formData.maxUsagePerUser && (isNaN(Number(formData.maxUsagePerUser)) || Number(formData.maxUsagePerUser) < 0)) {
        newErrors.maxUsagePerUser = "Max usage per user must be 0 (unlimited) or a positive number";
      }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        facilityIds: formData.facilityIds,
        sportCategoryIds: formData.sportCategoryIds,
        courtIds: formData.courtIds,
      };

      if (formData.maxUsage) {
        payload.maxUsage = Number(formData.maxUsage);
      } else {
        payload.maxUsage = null;
      }
      // Handle maxUsagePerUser: 0 = unlimited, null = unlimited, otherwise use the value
      if (formData.maxUsagePerUser) {
        const value = Number(formData.maxUsagePerUser);
        payload.maxUsagePerUser = value === 0 ? null : value;
      } else {
        payload.maxUsagePerUser = null; // Unlimited
      }
      if (formData.timeRestrictions.enabled) {
        payload.timeRestrictions = {
          daysOfWeek: formData.timeRestrictions.daysOfWeek,
          timeRange: formData.timeRestrictions.timeRange,
        };
      } else {
        payload.timeRestrictions = null;
      }
      payload.firstTimeCustomerOnly = formData.firstTimeCustomerOnly;

      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update promotion");
      }

      toast.success("Promotion updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating promotion:", error);
      toast.error(error.message || "Failed to update promotion");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      timeRestrictions: {
        ...prev.timeRestrictions,
        daysOfWeek: prev.timeRestrictions.daysOfWeek.includes(day)
          ? prev.timeRestrictions.daysOfWeek.filter((d) => d !== day)
          : [...prev.timeRestrictions.daysOfWeek, day],
      },
    }));
  };

  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Edit Promotion</DialogTitle>
          <DialogDescription>
            Update promotion details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Promotion Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Early Bird Special"
                required
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe the promotion..."
                rows={3}
              />
            </div>
          </div>

          {/* Discount Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Discount Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setFormData((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount Value * {formData.discountType === "percentage" ? "(%)" : "(€)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={formData.discountType === "percentage" ? "100" : undefined}
                  step={formData.discountType === "percentage" ? "1" : "0.01"}
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, discountValue: e.target.value }))
                  }
                  placeholder={formData.discountType === "percentage" ? "20" : "10"}
                  required
                />
                {errors.discountValue && (
                  <p className="text-xs text-red-500">{errors.discountValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  required
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Usage Limits</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Max Total Usage (optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  min="1"
                  value={formData.maxUsage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxUsage: e.target.value }))
                  }
                  placeholder="Unlimited if empty"
                />
                {errors.maxUsage && (
                  <p className="text-xs text-red-500">{errors.maxUsage}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsagePerUser">Max Usage Per User</Label>
                <Input
                  id="maxUsagePerUser"
                  type="number"
                  min="0"
                  value={formData.maxUsagePerUser}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxUsagePerUser: e.target.value }))
                  }
                  placeholder="0 = unlimited"
                />
                <p className="text-xs text-gray-500">
                  0 = unlimited, 1 = one-time use only
                </p>
                {errors.maxUsagePerUser && (
                  <p className="text-xs text-red-500">{errors.maxUsagePerUser}</p>
                )}
              </div>
            </div>
          </div>

          {/* First-Time Customer Only */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="firstTimeCustomerOnly"
              checked={formData.firstTimeCustomerOnly}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  firstTimeCustomerOnly: checked as boolean,
                }))
              }
            />
            <Label htmlFor="firstTimeCustomerOnly" className="cursor-pointer">
              First-time customers only
            </Label>
          </div>
          {formData.firstTimeCustomerOnly && (
            <p className="text-xs text-gray-500 ml-6">
              This promotion will only be available to customers who have never made a booking before
            </p>
          )}

          {/* Target Selection - Hierarchical */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Target Selection</Label>
              <p className="text-xs text-gray-500 mt-1">
                Select where this promotion applies. Most specific selection wins: Courts → Sports → Facilities → All
              </p>
            </div>

            {/* Targeting Level Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Currently applies to:</span>
              <span className={`font-medium ${targetingLevel === "all" ? "text-green-600" : "text-blue-600"}`}>
                {targetingLevel === "all" && "All courts in all facilities"}
                {targetingLevel === "facilities" && `${formData.facilityIds.length} facility(ies)`}
                {targetingLevel === "sports" && `${formData.sportCategoryIds.length} sport(s)`}
                {targetingLevel === "courts" && `${formData.courtIds.length} court(s)`}
              </span>
            </div>

            <div className="border rounded-md max-h-64 overflow-y-auto">
              {facilities.length === 0 ? (
                <p className="text-sm text-gray-500 p-3">No facilities available</p>
              ) : (
                facilities.map((facility) => (
                  <div key={facility.id} className="border-b last:border-b-0">
                    {/* Facility Level */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100">
                      <button
                        type="button"
                        onClick={() => toggleFacilityExpand(facility.id)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        {expandedFacilities.has(facility.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      <Checkbox
                        id={`edit-facility-${facility.id}`}
                        checked={formData.facilityIds.includes(facility.id)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            facilityIds: checked
                              ? [...prev.facilityIds, facility.id]
                              : prev.facilityIds.filter((id) => id !== facility.id),
                          }));
                        }}
                      />
                      <Label
                        htmlFor={`edit-facility-${facility.id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {facility.name}
                      </Label>
                      <span className="text-xs text-gray-400">
                        {facility.sportCategories.length} sport(s)
                      </span>
                    </div>

                    {/* Sports within Facility */}
                    {expandedFacilities.has(facility.id) && (
                      <div className="pl-6">
                        {facility.sportCategories.map((sport) => (
                          <div key={sport.id}>
                            {/* Sport Level */}
                            <div className="flex items-center gap-2 p-2 hover:bg-gray-50">
                              <button
                                type="button"
                                onClick={() => toggleSportExpand(sport.id)}
                                className="p-0.5 hover:bg-gray-200 rounded"
                              >
                                {expandedSports.has(sport.id) ? (
                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                              <Checkbox
                                id={`edit-sport-${sport.id}`}
                                checked={formData.sportCategoryIds.includes(sport.id)}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    sportCategoryIds: checked
                                      ? [...prev.sportCategoryIds, sport.id]
                                      : prev.sportCategoryIds.filter((id) => id !== sport.id),
                                  }));
                                }}
                              />
                              <Label
                                htmlFor={`edit-sport-${sport.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {sport.name}
                              </Label>
                              <span className="text-xs text-gray-400">
                                {sport.courts.length} court(s)
                              </span>
                            </div>

                            {/* Courts within Sport */}
                            {expandedSports.has(sport.id) && (
                              <div className="pl-8 pb-1">
                                {sport.courts.map((court) => (
                                  <div
                                    key={court.id}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50"
                                  >
                                    <Checkbox
                                      id={`edit-court-${court.id}`}
                                      checked={formData.courtIds.includes(court.id)}
                                      onCheckedChange={(checked) => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          courtIds: checked
                                            ? [...prev.courtIds, court.id]
                                            : prev.courtIds.filter((id) => id !== court.id),
                                        }));
                                      }}
                                    />
                                    <Label
                                      htmlFor={`edit-court-${court.id}`}
                                      className="text-xs cursor-pointer"
                                    >
                                      {court.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Time Restrictions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="timeRestrictions"
                checked={formData.timeRestrictions.enabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeRestrictions: {
                      ...prev.timeRestrictions,
                      enabled: checked as boolean,
                    },
                  }))
                }
              />
              <Label htmlFor="timeRestrictions" className="cursor-pointer">
                Enable Time Restrictions
              </Label>
            </div>

            {formData.timeRestrictions.enabled && (
              <div className="space-y-4 pl-6 border-l-2">
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={
                          formData.timeRestrictions.daysOfWeek.includes(day.value)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleDayOfWeek(day.value)}
                      >
                        {day.label.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeStart">Start Time</Label>
                    <Input
                      id="timeStart"
                      type="time"
                      value={formData.timeRestrictions.timeRange.start}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          timeRestrictions: {
                            ...prev.timeRestrictions,
                            timeRange: {
                              ...prev.timeRestrictions.timeRange,
                              start: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeEnd">End Time</Label>
                    <Input
                      id="timeEnd"
                      type="time"
                      value={formData.timeRestrictions.timeRange.end}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          timeRestrictions: {
                            ...prev.timeRestrictions,
                            timeRange: {
                              ...prev.timeRestrictions.timeRange,
                              end: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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

