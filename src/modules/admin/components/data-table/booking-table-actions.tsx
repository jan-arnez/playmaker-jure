"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Eye,
  MoreVertical,
  XCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";

interface Booking {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
  };
}

interface BookingTableActionsProps {
  booking: Booking;
}

export function BookingTableActions({ booking }: BookingTableActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleStatusChange = async (action: "confirm" | "complete" | "cancel") => {
    if (action === "cancel") {
      setCancelDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to update booking");

      const actionLabels = {
        confirm: "confirmed",
        complete: "completed",
        cancel: "cancelled",
      };

      toast.success(`Booking ${actionLabels[action]}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          action: "cancel",
        }),
      });

      if (!res.ok) throw new Error("Failed to cancel booking");

      toast.success("Booking cancelled");
      setCancelDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = () => {
    router.push(`/admin/users/${booking.user.id}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
            disabled={loading}
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* View User */}
          <DropdownMenuItem onClick={handleViewUser}>
            <Eye className="h-4 w-4 mr-2" />
            View Customer
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status Management */}
          {booking.status === "pending" && (
            <DropdownMenuItem onClick={() => handleStatusChange("confirm")}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Confirm
            </DropdownMenuItem>
          )}

          {booking.status === "confirmed" && (
            <DropdownMenuItem onClick={() => handleStatusChange("complete")}>
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              Mark Complete
            </DropdownMenuItem>
          )}

          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <DropdownMenuItem
              onClick={() => handleStatusChange("cancel")}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Booking
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking for {booking.user.name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
