"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Facility {
  id: string;
  name: string;
}

interface AssignFacilitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  memberId: string;
  memberName: string;
  currentFacilities: Facility[];
  allFacilities: Facility[];
  onSuccess: () => void;
}

export function AssignFacilitiesDialog({
  open,
  onOpenChange,
  organizationId,
  memberId,
  memberName,
  currentFacilities,
  allFacilities,
  onSuccess,
}: AssignFacilitiesDialogProps) {
  const t = useTranslations("ProviderModule.team");
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Initialize with current facilities
      setSelectedFacilityIds(currentFacilities.map((f) => f.id));
    }
  }, [open, currentFacilities]);

  const handleToggleFacility = (facilityId: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/members/${memberId}/facilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            facilityIds: selectedFacilityIds,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("toast.facilitiesAssignError"));
      }

      toast.success(t("toast.facilitiesAssigned"));
      onSuccess();
    } catch (error) {
      console.error("Error assigning facilities:", error);
      toast.error(
        error instanceof Error ? error.message : t("toast.facilitiesAssignError")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dialogs.assignFacilities.title", { name: memberName })}</DialogTitle>
          <DialogDescription>
            {t("dialogs.assignFacilities.description")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {allFacilities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {t("dialogs.assignFacilities.noFacilities")}
              </p>
            ) : (
              allFacilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50"
                >
                  <Checkbox
                    id={facility.id}
                    checked={selectedFacilityIds.includes(facility.id)}
                    onCheckedChange={() => handleToggleFacility(facility.id)}
                  />
                  <Label
                    htmlFor={facility.id}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    {facility.name}
                  </Label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("dialogs.assignFacilities.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t("dialogs.assignFacilities.saving") : t("dialogs.assignFacilities.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
