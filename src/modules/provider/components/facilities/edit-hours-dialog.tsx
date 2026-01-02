"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";
import { 
  parseWorkingHours,
  getEmptyWorkingHours,
  DAY_ORDER, 
  DAY_LABELS_SHORT,
  type WorkingHours 
} from "@/lib/working-hours";

interface EditHoursDialogProps {
  facility: {
    id: string;
    workingHours?: unknown;
  };
  onClose: () => void;
  onSuccess: (workingHours: WorkingHours) => Promise<void>;
}

export function EditHoursDialog({ facility, onClose, onSuccess }: EditHoursDialogProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(() => 
    parseWorkingHours(facility.workingHours) || getEmptyWorkingHours()
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleDayChange = (day: string, field: string, value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSuccess(workingHours);
      onClose();
    } catch (error) {
      console.error("Error updating working hours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edit Working Hours
          </DialogTitle>
          <DialogDescription>
            Set operating hours for each day
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-[50px_100px_1fr_1fr] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <span>Day</span>
            <span>Status</span>
            <span>Open</span>
            <span>Close</span>
          </div>
          
          {DAY_ORDER.map((day) => {
            const dayHours = workingHours[day];
            
            return (
              <div 
                key={day} 
                className={`grid grid-cols-[50px_100px_1fr_1fr] gap-3 items-center px-3 py-2 rounded transition-colors ${
                  dayHours.closed ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <Label className="text-sm font-medium">
                  {DAY_LABELS_SHORT[day]}
                </Label>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id={`${day}-open`}
                    checked={!dayHours.closed}
                    onCheckedChange={(checked) => handleDayChange(day, "closed", !checked)}
                  />
                  <Label 
                    htmlFor={`${day}-open`} 
                    className={`text-xs cursor-pointer ${dayHours.closed ? 'text-muted-foreground' : 'text-green-600'}`}
                  >
                    {dayHours.closed ? 'Closed' : 'Open'}
                  </Label>
                </div>
                
                <Input
                  type="time"
                  value={dayHours.open}
                  onChange={(e) => handleDayChange(day, "open", e.target.value)}
                  disabled={dayHours.closed}
                  className="h-9 text-sm"
                />
                
                <Input
                  type="time"
                  value={dayHours.close}
                  onChange={(e) => handleDayChange(day, "close", e.target.value)}
                  disabled={dayHours.closed}
                  className="h-9 text-sm"
                />
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
