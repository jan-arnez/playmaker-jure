"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Plus,
  User,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOptimisticBookings, type Booking as HookBooking } from "@/hooks/use-optimistic-bookings";
import { FacilityPicker } from "../facility-picker";

interface BookingProp {
  id: string;
  facilityId: string;
  facilityName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  totalAmount: number;
}

interface BookingsManagementProps {
  _organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  bookings: BookingProp[];
  facilities?: Array<{ id: string; name: string }>;
  onCreateBooking?: () => void;
  onUpdateBookingStatus?: (bookingId: string, status: string) => void;
  onViewBooking?: (bookingId: string) => void;
}

export function BookingsManagement({
  _organization,
  userRole,
  bookings = [],
  facilities = [],
  onCreateBooking,
  onViewBooking,
}: BookingsManagementProps) {
  const t = useTranslations("ProviderModule.bookings");
  const router = useRouter();

  const canManageBookings = userRole === "owner" || userRole === "admin";

  // Use optimistic bookings hook
  // Transform bookings to match hook requirements
  const formattedBookings: HookBooking[] = bookings.map(b => ({
    ...b,
    startTime: new Date(b.startTime),
    endTime: new Date(b.endTime),
    userId: 'unknown', // Required by hook but not present in props
    updatedAt: new Date(b.createdAt), // Required by hook but not present in props
    createdAt: new Date(b.createdAt),
  }));

  const {
    bookings: optimisticBookings,
    updateBookingStatus,
    isOptimistic,
  } = useOptimisticBookings(formattedBookings);

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: string,
  ) => {
    try {
      await updateBookingStatus(
        bookingId,
        status as any
      );
      
      router.refresh();
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      // case "pending":
      //   return (
      //     <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
      //       <AlertCircle className="h-3 w-3 mr-1" />
      //       {t("status.pending")}
      //     </Badge>
      //   );
      case "confirmed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("status.confirmed")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            {t("status.cancelled")}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("status.completed")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate stats using optimistic bookings
  const stats = {
    total: optimisticBookings.length,
    // pending: optimisticBookings.filter((b) => b.status === "pending").length,
    pending: 0, // Disabled for now
    confirmed: optimisticBookings.filter((b) => b.status === "confirmed").length,
    completed: optimisticBookings.filter((b) => b.status === "completed").length,
    cancelled: optimisticBookings.filter((b) => b.status === "cancelled").length,
    totalRevenue: optimisticBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("bookings")}</h1>
          <p className="text-gray-600 mt-1">{t("manageYourBookings")}</p>
        </div>
        <div className="flex items-center gap-3">
          {facilities.length > 0 && (
            <FacilityPicker
              facilities={facilities}
              organizationId={_organization.id}
            />
          )}
          {canManageBookings && onCreateBooking && (
            <Button onClick={onCreateBooking} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {t("createBooking")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalBookings")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("allTime")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("pending")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.pending}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("needsAttention")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("confirmed")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.confirmed}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("upcoming")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("completed")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completed}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("finished")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalRevenue")}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{stats.totalRevenue}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("allTime")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bookingsList")}</CardTitle>
          <CardDescription>{t("bookingsListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {optimisticBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("facility")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("time")}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimisticBookings.map((booking) => (
                    <TableRow key={booking.id} className={isOptimistic(booking.id) ? "opacity-75 bg-muted/50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {booking.customerName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{booking.customerEmail}</span>
                          </div>
                          {booking.customerPhone && (
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{booking.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {booking.facilityName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(booking.startTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatTime(booking.startTime)} -{" "}
                          {formatTime(booking.endTime)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          €{booking.totalAmount ?? 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {canManageBookings && (
                            <Select
                              value={booking.status}
                              onValueChange={(value) =>
                                handleUpdateBookingStatus(booking.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {/* <SelectItem value="pending">
                                  {t("status.pending")}
                                </SelectItem> */}
                                <SelectItem value="confirmed">
                                  {t("status.confirmed")}
                                </SelectItem>
                                <SelectItem value="completed">
                                  {t("status.completed")}
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  {t("status.cancelled")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {onViewBooking && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewBooking(booking.id)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("noBookings")}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {t("noBookingsDescription")}
              </p>
              {canManageBookings && onCreateBooking && (
                <Button onClick={onCreateBooking}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createFirstBooking")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
