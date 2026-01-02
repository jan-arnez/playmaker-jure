"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AddWaitlistDialog } from "./add-waitlist-dialog";

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  facility: {
    id: string;
    name: string;
  };
  court: {
    id: string;
    name: string;
    sportCategory: {
      id: string;
      name: string;
    };
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface BookingDetailsDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (bookingId: string, status: "confirmed" | "cancelled" | "completed") => Promise<void>;
}

export function BookingDetailsDialog({
  booking,
  isOpen,
  onClose,
  onStatusChange,
}: BookingDetailsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);

  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        );
      // case "pending":
      //   return (
      //     <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
      //       <AlertCircle className="h-3 w-3 mr-1" />
      //       Pending
      //     </Badge>
      //   );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "no-show":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            <XCircle className="h-3 w-3 mr-1" />
            No-Show
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleStatusChange = async (status: "confirmed" | "cancelled" | "completed") => {
    if (!onStatusChange) return;

    setIsUpdating(true);
    try {
      await onStatusChange(booking.id, status);
      toast.success(`Booking ${status === "confirmed" ? "confirmed" : status === "cancelled" ? "cancelled" : "completed"} successfully`);
    } catch (error) {
      toast.error("Failed to update booking status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const duration = Math.round(
    (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            {getStatusBadge(booking.status)}
          </DialogTitle>
          <DialogDescription>
            View and manage booking information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {format(booking.startTime, "EEEE, MMMM d, yyyy")}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {format(booking.startTime, "HH:mm")} - {format(booking.endTime, "HH:mm")}
                </p>
                <span className="text-sm text-gray-400">({duration} min)</span>
              </div>
            </div>
          </div>

          {/* Facility */}
          <div className="flex items-start space-x-3">
            <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {booking.facility.name}
              </p>
              {booking.court && (
                <p className="text-sm text-gray-600">
                  {booking.court.sportCategory.name} - {booking.court.name}
                </p>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {booking.user.name || "Guest"}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{booking.user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1 flex-wrap">
            {/* {booking.status === "pending" && (
              <>
                <Button
                  onClick={() => handleStatusChange("confirmed")}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={isUpdating}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )} */}
            {booking.status === "confirmed" && (
              <>
                <Button
                  onClick={() => handleStatusChange("completed")}
                  disabled={isUpdating}
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
                <Button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={isUpdating}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsWaitlistDialogOpen(true)}
                  disabled={isUpdating}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add to Waitlist
                </Button>
              </>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Add Waitlist Dialog */}
      {booking.court && (
        <AddWaitlistDialog
          isOpen={isWaitlistDialogOpen}
          onClose={() => setIsWaitlistDialogOpen(false)}
          onSuccess={() => {
            setIsWaitlistDialogOpen(false);
            onClose();
            // Refresh bookings if needed
            window.location.reload();
          }}
          facilityId={booking.facility.id}
          courtId={booking.court.id}
          startTime={booking.startTime}
          endTime={booking.endTime}
          facilityName={booking.facility.name}
          courtName={booking.court.name}
        />
      )}
    </Dialog>
  );
}

