"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarCheck, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus,
  Mail,
  Calendar,
  Search,
  X,
  MoreHorizontal,
  CalendarDays,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { TimePicker } from "@/components/ui/time-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FacilityPicker } from "@/modules/provider/components/facility-picker";

interface Court {
  id: string;
  name: string;
  facilityId: string;
  facilityName: string;
  sportCategoryName: string;
}

interface Facility {
  id: string;
  name: string;
  workingHours?: any;
  pricePerHour?: number;
  sportCategories: Array<{
    id: string;
    name: string;
    courts: Court[];
  }>;
}

interface SeasonalSeries {
  seriesId: string;
  parentBookingId: string;
  courtId: string;
  courtName: string;
  facilityId: string;
  facilityName: string;
  sportCategoryName: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "rejected" | "active" | "completed";
  paymentStatus?: "pending" | "paid";
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  price?: number;
  createdAt: string;
  bookingCount: number;
  bookings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
}

interface SeasonalTermsClientProps {
  organizationId: string;
  userRole: string;
  facilities: Facility[];
  seasonalSeries: SeasonalSeries[];
}

export function SeasonalTermsClient({
  organizationId,
  userRole,
  facilities,
  seasonalSeries: initialSeasonalSeries,
}: SeasonalTermsClientProps) {
  const t = useTranslations("ProviderModule.seasonalTerms");
  
  const [selectedFacility, setSelectedFacility] = useState<string>(
    facilities.length > 0 ? facilities[0].id : ""
  );
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [seasonalSeries, setSeasonalSeries] = useState<SeasonalSeries[]>(initialSeasonalSeries);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCommunicateDialogOpen, setIsCommunicateDialogOpen] = useState(false);
  const [selectedSeriesForCommunication, setSelectedSeriesForCommunication] = useState<SeasonalSeries | null>(null);
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  
  // Search and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  
  const [createFormData, setCreateFormData] = useState({
    facilityId: "",
    courtId: "",
    startDate: "",
    endDate: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
    price: "",
    status: "confirmed",
    paymentStatus: "pending",
  });
  const [filteredCourtsForCreate, setFilteredCourtsForCreate] = useState<Court[]>([]);
  const [selectedCourtData, setSelectedCourtData] = useState<{
    timeSlots?: string[];
    pricing?: {
      mode: "basic" | "advanced";
      basicPrice?: number;
      advancedPricing?: {
        tiers: Array<{
          id: string;
          name: string;
          timeRange: string;
          price: number;
          enabled: boolean;
        }>;
      };
    };
  } | null>(null);

  // Days of week with translations
  const DAYS_OF_WEEK = useMemo(() => [
    t("days.sunday"),
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
  ], [t]);

  // Get all courts from facilities - memoized to prevent infinite loops
  const allCourts = useMemo(() => 
    facilities.flatMap(facility =>
      facility.sportCategories.flatMap(category =>
        category.courts.map(court => ({
          ...court,
          facilityName: facility.name,
          sportCategoryName: category.name,
        }))
      )
    ), [facilities]
  );

  // Filter courts based on selected facility
  const filteredCourts = useMemo(() => 
    selectedFacility
      ? allCourts.filter(court => court.facilityId === selectedFacility)
      : allCourts,
    [selectedFacility, allCourts]
  );

  // Auto-complete expired seasonal series on mount
  useEffect(() => {
    const autoCompleteExpiredSeries = async () => {
      try {
        const response = await fetch("/api/bookings/seasonal/auto-complete", {
          method: "POST",
        });
        if (response.ok) {
          const result = await response.json();
          if (result.seriesCompleted > 0) {
            // Refresh the page to get updated data
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Failed to auto-complete expired series:", error);
      }
    };
    autoCompleteExpiredSeries();
  }, []);

  // Sync facility selection when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen && selectedFacility) {
      setCreateFormData(prev => ({ ...prev, facilityId: selectedFacility }));
    }
  }, [isCreateDialogOpen, selectedFacility]);

  // Update filtered courts for create dialog when facility changes
  useEffect(() => {
    if (createFormData.facilityId) {
      const courts = allCourts.filter(court => court.facilityId === createFormData.facilityId);
      setFilteredCourtsForCreate(courts);
      // Reset court selection if current court is not in filtered list
      setCreateFormData(prev => {
        if (prev.courtId && !courts.find(c => c.id === prev.courtId)) {
          return { ...prev, courtId: "" };
        }
        return prev;
      });
    } else {
      setFilteredCourtsForCreate([]);
    }
  }, [createFormData.facilityId, allCourts]);

  // Fetch court details including pricing when court is selected
  useEffect(() => {
    if (createFormData.courtId) {
      fetch(`/api/courts/${createFormData.courtId}`)
        .then(res => res.json())
        .then(data => {
          setSelectedCourtData(data);
        })
        .catch(err => {
          console.error("Error fetching court details:", err);
          setSelectedCourtData(null);
        });
    } else {
      setSelectedCourtData(null);
    }
  }, [createFormData.courtId]);

  // Calculate number of bookings and pricing
  const calculateBookingInfo = useMemo(() => {
    if (!createFormData.startDate || !createFormData.endDate || !createFormData.dayOfWeek || 
        !createFormData.startTime || !createFormData.endTime) {
      return null;
    }

    const startDate = new Date(createFormData.startDate);
    const endDate = new Date(createFormData.endDate);
    const dayOfWeek = parseInt(createFormData.dayOfWeek);
    
    // Calculate number of weeks
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getDay() === dayOfWeek) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate duration in minutes
    const [startHour, startMin] = createFormData.startTime.split(':').map(Number);
    const [endHour, endMin] = createFormData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    const durationHours = durationMinutes / 60;

    // Get price per slot (slot-based pricing, not hourly)
    let pricePerSlot = 0;
    const pricing = selectedCourtData?.pricing;
    const selectedFacilityData = facilities.find(f => f.id === createFormData.facilityId);
    const courtTimeSlots = selectedCourtData?.timeSlots || [];
    
    // Helper to parse slot duration (e.g., "60min" -> 60)
    const parseSlotDuration = (slot: string): number => {
      const match = slot.match(/(\d+)min/);
      return match ? parseInt(match[1]) : 60; // Default to 60min
    };
    
    // Find the closest matching slot or calculate proportional price
    const findSlotPrice = (basePrice: number): number => {
      if (courtTimeSlots.length === 0) {
        // No slots defined, use base price as-is
        return basePrice;
      }
      
      // Find the closest slot length
      const slotDurations = courtTimeSlots.map(parseSlotDuration);
      const closestSlot = slotDurations.reduce((prev: number, curr: number) => 
        Math.abs(curr - durationMinutes) < Math.abs(prev - durationMinutes) ? curr : prev
      );
      
      // Calculate price proportionally based on slot length
      // If base price is for 60min and booking is 90min, price = basePrice * (90/60)
      const baseSlotDuration = slotDurations[0] || 60; // Use first slot as base
      return basePrice * (durationMinutes / baseSlotDuration);
    };
    
    if (pricing?.mode === "basic" && pricing.basicPrice) {
      // Basic pricing: price per slot, scale with duration
      pricePerSlot = findSlotPrice(pricing.basicPrice);
    } else if (pricing?.mode === "advanced" && pricing.advancedPricing?.tiers) {
      // Advanced pricing: find matching tier
      const startTimeStr = createFormData.startTime;
      const matchingTier = pricing.advancedPricing.tiers.find(tier => {
        if (!tier.enabled) return false;
        const [tierStart, tierEnd] = tier.timeRange.split('-');
        return startTimeStr >= tierStart && startTimeStr < tierEnd;
      });
      
      if (matchingTier) {
        pricePerSlot = findSlotPrice(matchingTier.price);
      } else {
        // Fallback to first enabled tier or basic price
        const firstEnabledTier = pricing.advancedPricing.tiers.find(t => t.enabled);
        if (firstEnabledTier) {
          pricePerSlot = findSlotPrice(firstEnabledTier.price);
        } else if (pricing.basicPrice) {
          pricePerSlot = findSlotPrice(pricing.basicPrice);
        }
      }
    } else if (selectedFacilityData?.pricePerHour) {
      // Fallback to facility price per hour (convert to slot-based)
      pricePerSlot = Number(selectedFacilityData.pricePerHour) * durationHours;
    }

    const totalPrice = pricePerSlot * count;

    return {
      numberOfSlots: count,
      pricePerSlot: pricePerSlot,
      totalPrice: totalPrice,
      durationHours: durationHours,
      durationMinutes: durationMinutes,
    };
  }, [createFormData.startDate, createFormData.endDate, createFormData.dayOfWeek, 
      createFormData.startTime, createFormData.endTime, createFormData.facilityId,
      selectedCourtData, facilities]);

  // Filter and sort seasonal series
  const filteredSeries = useMemo(() => {
    return seasonalSeries
      .filter(series => {
        // Facility filter
        if (selectedFacility && series.facilityId !== selectedFacility) return false;
        // Court filter
        if (selectedCourt !== "all" && series.courtId !== selectedCourt) return false;
        // Tab filter
        if (activeTab !== "all" && series.status !== activeTab) return false;
        // Payment status filter
        if (paymentStatusFilter !== "all" && series.paymentStatus !== paymentStatusFilter) return false;
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            (series.customerName || "").toLowerCase().includes(query) ||
            (series.customerEmail || "").toLowerCase().includes(query) ||
            series.courtName.toLowerCase().includes(query) ||
            series.facilityName.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date-desc":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "date-asc":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "bookings-desc":
            return b.bookingCount - a.bookingCount;
          case "bookings-asc":
            return a.bookingCount - b.bookingCount;
          default:
            return 0;
        }
      });
  }, [seasonalSeries, selectedFacility, selectedCourt, activeTab, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => ({
    totalSeries: seasonalSeries.length,
    activeSeries: seasonalSeries.filter(s => s.status === "active" || s.status === "confirmed").length,
    pendingSeries: seasonalSeries.filter(s => s.status === "pending").length,
    totalBookings: seasonalSeries.reduce((sum, s) => sum + s.bookingCount, 0),
  }), [seasonalSeries]);

  const handleConfirm = async (seriesId: string) => {
    try {
      const series = seasonalSeries.find(s => s.seriesId === seriesId);
      if (!series) return;

      const response = await fetch(`/api/bookings/seasonal/${seriesId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to confirm seasonal series");

      setSeasonalSeries(prev =>
        prev.map(s =>
          s.seriesId === seriesId ? { ...s, status: "confirmed" as const } : s
        )
      );

      toast.success(t("toast.seriesConfirmed"));
    } catch (error) {
      toast.error(t("toast.confirmError"));
    }
  };

  const handleReject = async (seriesId: string) => {
    try {
      const response = await fetch(`/api/bookings/seasonal/${seriesId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to reject seasonal series");

      setSeasonalSeries(prev =>
        prev.map(s =>
          s.seriesId === seriesId ? { ...s, status: "rejected" as const } : s
        )
      );

      toast.success(t("toast.seriesRejected"));
    } catch (error) {
      toast.error(t("toast.rejectError"));
    }
  };

  const handleActivate = async (seriesId: string, skipConflictCheck = false): Promise<void> => {
    try {
      // First check payment status
      const series = seasonalSeries.find(s => s.seriesId === seriesId);
      if (!series) return;

      if (series.paymentStatus !== "paid") {
        toast.error(t("toast.activeRequiresPaid"));
        return;
      }

      const response = await fetch(`/api/bookings/seasonal/${seriesId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skipConflictCheck }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to activate seasonal series");
      }

      // Check if there are conflicts
      if (result.hasConflicts) {
        const conflictMessage = result.conflicts
          .map((c: any) => `${c.date} at ${c.time} - ${c.courtName}`)
          .join("\n");
        
        const shouldProceed = window.confirm(
          `${t("toast.conflictsFound")}\n\n${conflictMessage}\n\n${t("toast.confirmActivate")}`
        );

        if (shouldProceed) {
          // Retry with skip conflict check
          await handleActivate(seriesId, true);
        }
        return;
      }

      // Update local state
      setSeasonalSeries(prev =>
        prev.map(s =>
          s.seriesId === seriesId ? { ...s, status: "active" as const } : s
        )
      );

      toast.success(t("toast.seriesActivated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.activateError"));
    }
  };

  const handleCommunicate = (series: SeasonalSeries) => {
    setSelectedSeriesForCommunication(series);
    setCommunicationMessage("");
    setIsCommunicateDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!selectedSeriesForCommunication || !communicationMessage.trim()) return;

    try {
      // TODO: Implement actual communication API
      toast.success(t("toast.messageSent", { email: selectedSeriesForCommunication.customerEmail || "" }));
      setIsCommunicateDialogOpen(false);
      setCommunicationMessage("");
    } catch (error) {
      toast.error(t("toast.messageError"));
    }
  };

  const handleCreateSeasonalSeries = async () => {
    if (!createFormData.courtId || !createFormData.startDate || !createFormData.endDate || 
        !createFormData.dayOfWeek || !createFormData.startTime || !createFormData.endTime) {
      toast.error(t("toast.fillRequired"));
      return;
    }

    // Validate: active status requires paid payment
    if (createFormData.status === "active" && createFormData.paymentStatus !== "paid") {
      toast.error(t("toast.activeRequiresPaid"));
      return;
    }

    try {
      const response = await fetch("/api/bookings/seasonal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courtId: createFormData.courtId,
          seasonalStartDate: createFormData.startDate,
          seasonalEndDate: createFormData.endDate,
          dayOfWeek: parseInt(createFormData.dayOfWeek),
          startTime: createFormData.startTime,
          endTime: createFormData.endTime,
          customerName: createFormData.customerName || undefined,
          customerEmail: createFormData.customerEmail || undefined,
          customerPhone: createFormData.customerPhone || undefined,
          notes: createFormData.notes || undefined,
          price: createFormData.price || undefined,
          status: createFormData.status || "confirmed",
          paymentStatus: createFormData.paymentStatus || "pending",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create seasonal series");
      }

      const result = await response.json();
      
      // Refresh the page or add the new series to state
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("toast.createError"));
    }
  };

  const getStatusBadge = (status: SeasonalSeries["status"]) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, label: t("status.pending") },
      confirmed: { variant: "default" as const, icon: CheckCircle2, label: t("status.confirmed") },
      rejected: { variant: "destructive" as const, icon: XCircle, label: t("status.rejected") },
      active: { variant: "default" as const, icon: CalendarCheck, label: t("status.active") },
      completed: { variant: "outline" as const, icon: CheckCircle2, label: t("status.completed") },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusCounts = () => {
    return {
      all: seasonalSeries.length,
      pending: seasonalSeries.filter(s => s.status === "pending").length,
      confirmed: seasonalSeries.filter(s => s.status === "confirmed").length,
      active: seasonalSeries.filter(s => s.status === "active").length,
      completed: seasonalSeries.filter(s => s.status === "completed").length,
      rejected: seasonalSeries.filter(s => s.status === "rejected").length,
    };
  };

  const statusCounts = getStatusCounts();

  const resetCreateForm = () => {
    setCreateFormData({
      facilityId: "",
      courtId: "",
      startDate: "",
      endDate: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
      price: "",
      status: "confirmed",
      paymentStatus: "pending",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {facilities.length > 0 && (
            <FacilityPicker
              facilities={facilities.map(f => ({ id: f.id, name: f.name }))}
              organizationId={organizationId}
              selectedFacilityId={selectedFacility}
              onFacilityChange={(facilityId) => setSelectedFacility(facilityId)}
            />
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="default" className="whitespace-nowrap">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("createSeries")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[95vw] sm:!max-w-2xl lg:!max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("form.title")}</DialogTitle>
                <DialogDescription>
                  {t("form.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facility-select">{t("form.facility")} *</Label>
                    <Select
                      value={createFormData.facilityId}
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, facilityId: value, courtId: "" }))}
                    >
                      <SelectTrigger id="facility-select">
                        <SelectValue placeholder={t("form.selectFacility")} />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities.map(facility => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="court-select">{t("form.court")} *</Label>
                    <Select
                      value={createFormData.courtId}
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, courtId: value }))}
                      disabled={!createFormData.facilityId}
                    >
                      <SelectTrigger id="court-select">
                        <SelectValue placeholder={createFormData.facilityId ? t("form.selectCourt") : t("form.selectFacilityFirst")} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCourtsForCreate.map(court => (
                          <SelectItem key={court.id} value={court.id}>
                            {court.sportCategoryName} - {court.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">{t("form.seasonStartDate")} *</Label>
                    <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !createFormData.startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {createFormData.startDate ? (
                            format(new Date(createFormData.startDate), "PPP")
                          ) : (
                            <span>{t("form.pickDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={createFormData.startDate ? new Date(createFormData.startDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setCreateFormData(prev => ({ 
                                ...prev, 
                                startDate: format(date, "yyyy-MM-dd")
                              }));
                              setStartDatePickerOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const compareDate = new Date(date);
                            compareDate.setHours(0, 0, 0, 0);
                            return compareDate < today;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="end-date">{t("form.seasonEndDate")} *</Label>
                    <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !createFormData.endDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {createFormData.endDate ? (
                            format(new Date(createFormData.endDate), "PPP")
                          ) : (
                            <span>{t("form.pickDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={createFormData.endDate ? new Date(createFormData.endDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setCreateFormData(prev => ({ 
                                ...prev, 
                                endDate: format(date, "yyyy-MM-dd")
                              }));
                              setEndDatePickerOpen(false);
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date < today) return true;
                            if (createFormData.startDate) {
                              const startDate = new Date(createFormData.startDate);
                              startDate.setHours(0, 0, 0, 0);
                              return date < startDate;
                            }
                            return false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="day-of-week">{t("form.dayOfWeek")} *</Label>
                    <Select
                      value={createFormData.dayOfWeek}
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, dayOfWeek: value }))}
                    >
                      <SelectTrigger id="day-of-week">
                        <SelectValue placeholder={t("form.selectDay")} />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start-time">{t("form.startTime")} *</Label>
                    <TimePicker
                      value={createFormData.startTime}
                      onChange={(value) => setCreateFormData(prev => ({ ...prev, startTime: value }))}
                      placeholder={t("form.selectTime")}
                      startHour={7}
                      endHour={23}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">{t("form.endTime")} *</Label>
                    <TimePicker
                      value={createFormData.endTime}
                      onChange={(value) => setCreateFormData(prev => ({ ...prev, endTime: value }))}
                      placeholder={t("form.selectTime")}
                      startHour={7}
                      endHour={23}
                    />
                  </div>
                </div>
                
                {/* Slots, Price, Status, and Payment */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label>{t("summary.numberOfSlots")}</Label>
                    <Input
                      readOnly
                      value={calculateBookingInfo ? `${calculateBookingInfo.numberOfSlots} slots` : "—"}
                      className="bg-gray-50 cursor-default"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">{t("form.price")} (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("form.pricePlaceholder")}
                      value={createFormData.price}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">{t("form.status")}</Label>
                    <Select
                      value={createFormData.status}
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("status.pending")}</SelectItem>
                        <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                        <SelectItem value="active">{t("status.active")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment-status">{t("form.paymentStatus")}</Label>
                    <Select
                      value={createFormData.paymentStatus}
                      onValueChange={(value) => setCreateFormData(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger id="payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("form.paymentPending")}</SelectItem>
                        <SelectItem value="paid">{t("form.paymentPaid")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customer-name">{t("form.customerName")}</Label>
                  <Input
                    id="customer-name"
                    placeholder={t("form.customerNamePlaceholder")}
                    value={createFormData.customerName}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-email">{t("form.customerEmail")}</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder={t("form.customerEmailPlaceholder")}
                      value={createFormData.customerEmail}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">{t("form.customerPhone")}</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      placeholder={t("form.customerPhonePlaceholder")}
                      value={createFormData.customerPhone}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">{t("form.notes")}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("form.notesPlaceholder")}
                    value={createFormData.notes}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetCreateForm();
                  }}>
                    {t("form.cancel")}
                  </Button>
                  <Button onClick={handleCreateSeasonalSeries}>
                    {t("form.create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              {t("stats.totalSeries")}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalSeries}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeSeries} {t("stats.currentlyActive")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              {t("stats.activeSeries")}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.activeSeries}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("stats.currentlyActive")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              {t("stats.pendingSeries")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.pendingSeries}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("stats.awaitingConfirmation")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">
              {t("stats.totalBookings")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalBookings}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("stats.fromAllSeries")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter, Search, and Sort Controls */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label htmlFor="search" className="text-xs md:text-sm">{t("filters.search")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t("filters.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Court Filter */}
            <div className="space-y-2">
              <Label htmlFor="court-filter" className="text-xs md:text-sm">{t("filters.court")}</Label>
              <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                <SelectTrigger id="court-filter">
                  <SelectValue placeholder={t("filters.allCourts")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCourts")}</SelectItem>
                  {filteredCourts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.sportCategoryName} - {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sortBy" className="text-xs md:text-sm">{t("filters.sortBy")}</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">{t("filters.newestFirst")}</SelectItem>
                  <SelectItem value="date-asc">{t("filters.oldestFirst")}</SelectItem>
                  <SelectItem value="bookings-desc">{t("filters.mostBookings")}</SelectItem>
                  <SelectItem value="bookings-asc">{t("filters.leastBookings")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="paymentFilter" className="text-xs md:text-sm">{t("filters.paymentStatus")}</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger id="paymentFilter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allPayments")}</SelectItem>
                  <SelectItem value="pending">{t("filters.paymentPending")}</SelectItem>
                  <SelectItem value="paid">{t("filters.paymentPaid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for status filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-6">
            <TabsTrigger value="all" className="flex-shrink-0">
              {t("tabs.all")} ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-shrink-0">
              {t("tabs.pending")} ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-shrink-0">
              {t("tabs.confirmed")} ({statusCounts.confirmed})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-shrink-0">
              {t("tabs.active")} ({statusCounts.active})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-shrink-0">
              {t("tabs.completed")} ({statusCounts.completed})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-shrink-0">
              {t("tabs.rejected")} ({statusCounts.rejected})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Clear filters button when filters are active */}
          {(searchQuery || selectedCourt !== "all") && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {filteredSeries.length} {t("filters.results").toLowerCase()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCourt("all");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {t("filters.clearFilters")}
              </Button>
            </div>
          )}

          {/* Seasonal Series List */}
          {filteredSeries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("list.noSeries")}
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm md:text-base">
                  {activeTab === "all"
                    ? t("list.createFirst")
                    : t("list.noSeriesForStatus", { 
                        status: activeTab === "pending" ? t("tabs.pending") 
                             : activeTab === "confirmed" ? t("tabs.confirmed")
                             : activeTab === "active" ? t("tabs.active")
                             : t("tabs.completed")
                      })}
                </p>
                {activeTab === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("createSeries")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {filteredSeries.map(series => (
                <Card key={series.seriesId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 md:pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base md:text-lg truncate">
                          {series.courtName} - {series.facilityName}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs md:text-sm">
                          {series.dayOfWeek !== null && (
                            <span className="font-medium">{DAYS_OF_WEEK[series.dayOfWeek]}</span>
                          )}
                          {" "}
                          {new Date(series.startTime).toLocaleTimeString("sl-SI", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(series.endTime).toLocaleTimeString("sl-SI", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {new Date(series.startDate).toLocaleDateString("sl-SI", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(series.endDate).toLocaleDateString("sl-SI", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </CardDescription>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {series.bookingCount} {t("list.bookings")}
                          </Badge>
                        </div>
                      </div>
                      {getStatusBadge(series.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {series.customerName && (
                        <div>
                          <p className="text-sm font-medium">{t("list.customer")}</p>
                          <p className="text-sm text-gray-600">
                            {series.customerName}
                            {series.customerEmail && ` (${series.customerEmail})`}
                          </p>
                        </div>
                      )}
                      {series.notes && (
                        <div>
                          <p className="text-sm font-medium">{t("list.notes")}</p>
                          <p className="text-sm text-gray-600">{series.notes}</p>
                        </div>
                      )}
                      {/* Desktop: inline buttons */}
                      <div className="hidden md:flex items-center gap-2 pt-2 border-t">
                        {series.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(series.seriesId)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {t("actions.confirmSeries")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(series.seriesId)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {t("actions.rejectSeries")}
                            </Button>
                          </>
                        )}
                        {series.customerEmail && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCommunicate(series)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {t("actions.communicate")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `mailto:${series.customerEmail}`}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {t("actions.email")}
                            </Button>
                          </>
                        )}
                      </div>
                      {/* Mobile: dropdown menu */}
                      <div className="flex md:hidden items-center justify-between pt-2 border-t">
                        {series.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(series.seriesId)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {t("actions.confirmSeries")}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("actions.moreActions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {series.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleReject(series.seriesId)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t("actions.rejectSeries")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {series.customerEmail && (
                              <>
                                <DropdownMenuItem onClick={() => handleCommunicate(series)}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  {t("actions.communicate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.location.href = `mailto:${series.customerEmail}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  {t("actions.email")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Communication Dialog */}
      <Dialog open={isCommunicateDialogOpen} onOpenChange={setIsCommunicateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("communicate.title")}</DialogTitle>
            <DialogDescription>
              {t("communicate.description", { email: selectedSeriesForCommunication?.customerEmail || "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="message">{t("communicate.message")}</Label>
              <Textarea
                id="message"
                placeholder={t("communicate.messagePlaceholder")}
                value={communicationMessage}
                onChange={(e) => setCommunicationMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCommunicateDialogOpen(false)}>
                {t("communicate.cancel")}
              </Button>
              <Button onClick={handleSendMessage}>
                <Mail className="h-4 w-4 mr-2" />
                {t("communicate.send")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
