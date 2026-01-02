"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, UserX, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NoShowReportButtonProps {
  bookingId: string;
  customerName: string;
  slotTime: string;
  canReport: boolean; // Whether within 24h window
  onReported?: () => void;
}

export function NoShowReportButton({
  bookingId,
  customerName,
  slotTime,
  canReport,
  onReported,
}: NoShowReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleReport = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/bookings/report-no-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to report no-show");
      }

      toast.success("No-show reported", {
        description: data.penaltyApplied || "The user has been notified.",
      });
      
      setIsOpen(false);
      setReason("");
      onReported?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to report no-show");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canReport) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <UserX className="mr-2 h-4 w-4" />
        Reporting window closed
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <UserX className="mr-2 h-4 w-4" />
          Report No-Show
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report No-Show
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to report that <strong>{customerName}</strong> did not show up for their booking at <strong>{slotTime}</strong>.
              </p>
              <p className="text-destructive">
                This will affect the user's trust level and may result in booking restrictions or bans.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="e.g., Did not arrive, no response to calls..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleReport();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reporting...
              </>
            ) : (
              "Confirm Report"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
