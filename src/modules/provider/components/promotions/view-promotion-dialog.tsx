"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Percent, Clock, Building2 } from "lucide-react";

interface PromotionUsage {
  id: string;
  usedAt: string;
  discountAmount: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  booking: {
    id: string;
    startTime: string;
    endTime: string;
    facility: {
      name: string;
    };
  };
}

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
  usageCount: number;
  facilities: Array<{ id: string; name: string }>;
  usageRecords?: PromotionUsage[];
  timeRestrictions?: {
    daysOfWeek?: number[];
    timeRange?: { start: string; end: string };
  } | null;
  firstTimeCustomerOnly?: boolean;
}

interface ViewPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
  onEdit: () => void;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ViewPromotionDialog({
  open,
  onOpenChange,
  promotion,
  onEdit,
}: ViewPromotionDialogProps) {
  if (!promotion) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{promotion.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {promotion.description || "No description provided"}
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(promotion.status)}>
              {promotion.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Discount Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Discount Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Discount Type</p>
                <p className="text-lg font-semibold">
                  {promotion.discountType === "percentage"
                    ? "Percentage"
                    : "Fixed Amount"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Discount Value</p>
                <p className="text-lg font-semibold">
                  {promotion.discountType === "percentage"
                    ? `${promotion.discountValue}%`
                    : `€${promotion.discountValue}`}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(promotion.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(promotion.endDate)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Usage</p>
                <p className="text-lg font-semibold">{promotion.usageCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Usage</p>
                <p className="text-lg font-semibold">
                  {promotion.maxUsage || "Unlimited"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Per User</p>
                <p className="text-lg font-semibold">
                  {promotion.maxUsagePerUser === null || promotion.maxUsagePerUser === 0
                    ? "Unlimited"
                    : promotion.maxUsagePerUser === 1
                    ? "1 (One-time use)"
                    : promotion.maxUsagePerUser}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* First-Time Customer Only */}
          {(promotion as any).firstTimeCustomerOnly && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Eligibility
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-900">
                    First-time customers only
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This promotion is only available to customers who have never made a booking before
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Facilities ({promotion.facilities.length})
            </h3>
            {promotion.facilities.length === 0 ? (
              <p className="text-sm text-gray-500">
                Applies to all facilities
              </p>
            ) : (
              <div className="space-y-2">
                {promotion.facilities.map((facility) => (
                  <div
                    key={facility.id}
                    className="bg-gray-50 border rounded-md p-2"
                  >
                    <p className="text-sm font-medium">{facility.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Restrictions */}
          {promotion.timeRestrictions && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Restrictions
                </h3>
                {promotion.timeRestrictions.daysOfWeek &&
                  promotion.timeRestrictions.daysOfWeek.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Days of Week</p>
                      <div className="flex flex-wrap gap-2">
                        {promotion.timeRestrictions.daysOfWeek.map((day) => (
                          <Badge key={day} variant="outline">
                            {daysOfWeek[day]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {promotion.timeRestrictions.timeRange && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Time Range</p>
                    <p className="text-lg font-semibold">
                      {formatTime(promotion.timeRestrictions.timeRange.start)} -{" "}
                      {formatTime(promotion.timeRestrictions.timeRange.end)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Usage History */}
          {promotion.usageRecords && promotion.usageRecords.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent Usage ({promotion.usageRecords.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {promotion.usageRecords.map((usage) => (
                    <div
                      key={usage.id}
                      className="bg-gray-50 border rounded-md p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {usage.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {usage.user.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {usage.booking.facility.name} -{" "}
                            {formatDate(usage.booking.startTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">
                            -€{Number(usage.discountAmount).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(usage.usedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>Edit Promotion</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

