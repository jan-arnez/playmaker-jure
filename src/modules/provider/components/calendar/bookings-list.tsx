"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsString, parseAsIsoDate } from 'nuqs';
import { Search, CalendarIcon, Download, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, User, Mail } from "lucide-react";
import { FacilityPicker } from "../facility-picker";
import { EditBookingDialog } from "./edit-booking-dialog";
import { NoShowReportDialog } from "./no-show-report-dialog";
import { CreateBookingDialog } from "./create-booking-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Booking {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  createdAt: string; // ISO string
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  notes?: string | null;
  facility: {
    id: string;
    name: string;
    slug: string;
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
  visitCount: number;
}

interface Facility {
  id: string;
  name: string;
  slug: string;
}

interface Court {
  id: string;
  name: string;
  facility: {
    id: string;
    name: string;
  };
  sportCategory: {
    id: string;
    name: string;
  };
}

interface BookingsListProps {
  bookings: Booking[];
  facilities: Facility[];
  courts: Court[];
  organizationId: string;
  organizationSlug: string;
}

export function BookingsList({
  bookings,
  facilities,
  courts,
  organizationId,
  organizationSlug,
}: BookingsListProps) {
  const t = useTranslations("ProviderModule.calendar");
  const [currentView, setCurrentView] = useQueryState("view", parseAsString.withDefault("bookings"));
  const [selectedFacilityId, setSelectedFacilityId] = useQueryState("facility", parseAsString.withDefault("all"));
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
  
  const [dateFrom, setDateFrom] = useQueryState("from");
  const [dateTo, setDateTo] = useQueryState("to");
  
  const dateRange = useMemo(() => ({
    from: dateFrom ? new Date(dateFrom) : undefined,
    to: dateTo ? new Date(dateTo) : undefined
  }), [dateFrom, dateTo]);

  const [selectedCourtId, setSelectedCourtId] = useQueryState("court", parseAsString.withDefault("all"));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("all"));
  const [sortBy, setSortBy] = useQueryState("sort", parseAsString.withDefault("date-desc"));
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isCreateBookingDialogOpen, setIsCreateBookingDialogOpen] = useState(false);

  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);

  // Get unique courts from bookings for the court filter
  const availableCourts = useMemo(() => {
    const courtsMap = new Map<string, { id: string; name: string }>();
    bookings.forEach((booking) => {
      if (booking.court && !courtsMap.has(booking.court.id)) {
        courtsMap.set(booking.court.id, {
          id: booking.court.id,
          name: booking.court.name,
        });
      }
    });
    return Array.from(courtsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings]);

  // Filter bookings by facility, search query, date, and court
  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by facility
    if (selectedFacilityId !== "all") {
      result = result.filter((booking) => booking.facility.id === selectedFacilityId);
    }

    // Filter by search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((booking) => {
        const matchesName = booking.user.name?.toLowerCase().includes(query);
        const matchesEmail = booking.user.email?.toLowerCase().includes(query);
        return matchesName || matchesEmail;
      });
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      result = result.filter((booking) => {
        const bookingDate = new Date(booking.startTime);
        bookingDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (bookingDate < fromDate) return false;
        }
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (bookingDate > toDate) return false;
        }
        
        return true;
      });
    }

    // Filter by court
    if (selectedCourtId !== "all") {
      result = result.filter((booking) => {
        return booking.court?.id === selectedCourtId;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((booking) => {
        return booking.status === statusFilter;
      });
    }

    return result;
  }, [bookings, selectedFacilityId, searchQuery, dateRange, selectedCourtId, statusFilter]);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings];
    
    switch (sortBy) {
      case "date-desc":
        return sorted.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
      case "date-asc":
        return sorted.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      case "name-asc":
        return sorted.sort((a, b) => {
          const nameA = a.user.name || a.user.email || "";
          const nameB = b.user.name || b.user.email || "";
          return nameA.localeCompare(nameB);
        });
      case "name-desc":
        return sorted.sort((a, b) => {
          const nameA = a.user.name || a.user.email || "";
          const nameB = b.user.name || b.user.email || "";
          return nameB.localeCompare(nameA);
        });
      default:
        return sorted;
    }
  }, [filteredBookings, sortBy]);

  // Export to Excel function
  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = sortedBookings.map((booking) => {
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const duration = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60)
      );

      return {
        Date: format(startDate, "dd.MM.yyyy"),
        "Time (Start - End)": `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`,
        "Customer Name": booking.user.name || "Guest",
        "Customer Email": booking.user.email,
        Facility: booking.facility.name,
        Court: booking.court?.name || "—",
        "Sport Category": booking.court?.sportCategory.name || "—",
        Status: booking.status,
        "Duration (minutes)": duration,
        Notes: booking.notes || "",
        "Created At": format(new Date(booking.createdAt), "dd.MM.yyyy HH:mm"),
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Date
      { wch: 18 }, // Time
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 20 }, // Facility
      { wch: 15 }, // Court
      { wch: 18 }, // Sport Category
      { wch: 12 }, // Status
      { wch: 18 }, // Duration
      { wch: 30 }, // Notes
      { wch: 18 }, // Created At
    ];
    worksheet["!cols"] = columnWidths;

    // Generate filename with date range if applicable
    let filename = "bookings";
    if (dateRange.from && dateRange.to) {
      filename = `bookings_${format(dateRange.from, "yyyy-MM-dd")}_to_${format(dateRange.to, "yyyy-MM-dd")}`;
    } else if (dateRange.from) {
      filename = `bookings_from_${format(dateRange.from, "yyyy-MM-dd")}`;
    } else {
      filename = `bookings_${format(new Date(), "yyyy-MM-dd")}`;
    }

    // Export to Excel
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("filters.confirmed")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            {t("filters.cancelled")}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("filters.completed")}
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



  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <FacilityPicker
          facilities={facilities}
          organizationId={organizationId}
          selectedFacilityId={selectedFacilityId === "all" ? undefined : selectedFacilityId}
          onFacilityChange={(facilityId) =>
            setSelectedFacilityId(facilityId === "" ? "all" : facilityId)
          }
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b pb-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => setCurrentView("calendar")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === "calendar"
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {t("tabs.calendar")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCurrentView("bookings")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentView === "bookings"
              ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {t("tabs.bookings")}
        </Button>
      </div>

      {/* Filters and Export */}
      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search by name or email */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background hover:bg-background"
          />
        </div>

        {/* Date range filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-background hover:bg-background",
                !dateRange.from && !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from && dateRange.to
                ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                : dateRange.from
                  ? format(dateRange.from, "MMM d")
                  : "Select date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                setDateFrom(range?.from ? range.from.toISOString() : null);
                setDateTo(range?.to ? range.to.toISOString() : null);
              }}
              weekStartsOn={1}
              numberOfMonths={2}
              initialFocus
              className="rounded-md border-0"
            />
          </PopoverContent>
        </Popover>

        {/* Court filter */}
        <Select
          value={selectedCourtId}
          onValueChange={(value) => setSelectedCourtId(value)}
        >
          <SelectTrigger className="bg-background hover:bg-background">
            <SelectValue placeholder="All Courts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courts</SelectItem>
            {availableCourts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="bg-background hover:bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no-show">No-Show</SelectItem>
          </SelectContent>
        </Select>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setIsCreateBookingDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("navigation.createBooking")}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={sortedBookings.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t("bookingsList.exportExcel")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("bookingsList.title")}</CardTitle>
              <CardDescription>
                {t("bookingsList.found", { count: sortedBookings.length })}
              </CardDescription>
            </div>
            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBookings.map((booking) => {
                    const startDate = new Date(booking.startTime);
                    const endDate = new Date(booking.endTime);
                    return (
                      <TableRow
                        key={booking.id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {booking.user.name || "Guest"}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {booking.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.court ? (
                            <span>{booking.court.name}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(startDate, "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                        </TableCell>
                        <TableCell>
                          {booking.status === "no-show" && booking.notes ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>{getStatusBadge(booking.status)}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{booking.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            getStatusBadge(booking.status)
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {booking.visitCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            {booking.status === "no-show" && booking.notes ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBooking(booking);
                                        setIsReportDialogOpen(true);
                                      }}
                                    >
                                      Report
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{booking.notes}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setIsReportDialogOpen(true);
                                }}
                              >
                                Report
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">{t("bookingsList.emptyState")}</p>
              {selectedFacilityId !== "all" && (
                <p className="text-sm mt-2">
                  {t("bookingsList.emptyStateHint")}
                </p>
              )}
              <Button
                onClick={() => setIsCreateBookingDialogOpen(true)}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("bookingsList.createFirst")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Booking Dialog */}
      <EditBookingDialog
        booking={selectedBooking}
        courts={courts}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* No-Show Report Dialog */}
      <NoShowReportDialog
        booking={selectedBooking}
        isOpen={isReportDialogOpen}
        onClose={() => {
          setIsReportDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {/* Create Booking Dialog */}
      <CreateBookingDialog
        courts={courts}
        isOpen={isCreateBookingDialogOpen}
        onClose={() => setIsCreateBookingDialogOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

