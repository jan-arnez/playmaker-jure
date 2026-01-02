"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit, Trash2, Clock, Euro, Settings, CheckCircle, XCircle, Tag, ChevronDown, ChevronUp, Copy, House, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TimePicker } from "@/components/ui/time-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { EditCourtHoursDialog } from "./edit-court-hours-dialog";

interface SportCategory {
  id: string;
  name: string;
  description?: string;
  type: "indoor" | "outdoor";
  courts: Court[];
  createdAt: string;
  updatedAt: string;
}

interface Court {
  id: string;
  name: string;
  description?: string;
  surface?: string;
  capacity?: number;
  isActive: boolean;
  timeSlots: string[];
  locationType?: "indoor" | "outdoor";
  workingHours?: any; // Court-specific working hours (null means use facility default)
  pricing?: {
    mode: "basic" | "advanced";
    basicPrice?: number; // Price per time slot (scales with slot length)
    advancedPricing?: {
      tiers: Array<{
        id: string;
        name: string;
        timeRange: string; // e.g., "09:00-12:00"
        price: number; // Price per time slot for this time range
        enabled: boolean;
      }>;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface SportsCourtsSectionProps {
  facilityId: string;
  sportCategories: SportCategory[];
  workingHours?: any; // Working hours from facility
  canManage: boolean;
  onRefresh: () => void;
}

export function SportsCourtsSection({
  facilityId,
  sportCategories = [],
  workingHours,
  canManage,
  onRefresh,
}: SportsCourtsSectionProps) {
  
  const t = useTranslations("ProviderModule");

  // Translated options using the translation hook
  const SURFACE_TYPES = [
    { value: "clay", label: t("surfaces.clay") },
    { value: "hard", label: t("surfaces.hard") },
    { value: "grass", label: t("surfaces.grass") },
    { value: "synthetic", label: t("surfaces.synthetic") },
    { value: "wood", label: t("surfaces.wood") },
    { value: "sand", label: t("surfaces.sand") },
  ];

  const TIME_SLOT_OPTIONS = [
    { value: "30min", label: t("timeSlotOptions.30min") },
    { value: "45min", label: t("timeSlotOptions.45min") },
    { value: "60min", label: t("timeSlotOptions.60min") },
    { value: "90min", label: t("timeSlotOptions.90min") },
    { value: "120min", label: t("timeSlotOptions.120min") },
  ];

  const SPORT_OPTIONS = [
    t("sportOptions.tennis"),
    t("sportOptions.multipurpose"),
    t("sportOptions.badminton"),
    t("sportOptions.tableTennis"),
    t("sportOptions.volleyball"),
    t("sportOptions.padel"),
    t("sportOptions.swimming"),
    t("sportOptions.football"),
    t("sportOptions.squash"),
    t("sportOptions.basketball"),
    t("sportOptions.pickleball"),
  ];

  // Calculate default time ranges based on working hours
  const getDefaultTimeRanges = () => {
    let openTime = "08:00";
    let closeTime = "22:00";
    
    if (workingHours) {
      try {
        const hours = typeof workingHours === 'string' ? JSON.parse(workingHours) : workingHours;
        // Get first non-closed day's hours as default
        const firstDay = Object.values(hours).find((day: any) => !day?.closed) as any;
        if (firstDay) {
          openTime = firstDay.open || "08:00";
          closeTime = firstDay.close || "22:00";
        }
      } catch (e) {
        // Use defaults if parsing fails
      }
    }
    
    // Ensure times are in full hours format (HH:00) and minimum 7:00
    const formatHour = (time: string) => {
      const [hours] = time.split(':');
      const hour = parseInt(hours, 10);
      const minHour = Math.max(7, hour); // Minimum 7:00
      return `${minHour.toString().padStart(2, '0')}:00`;
    };
    
    return [
      { id: "1", name: "Morning", timeRange: `${formatHour(openTime)}-12:00`, price: 25, enabled: false },
      { id: "2", name: "Afternoon", timeRange: "12:00-16:00", price: 30, enabled: false },
      { id: "3", name: "Evening", timeRange: `16:00-${formatHour(closeTime)}`, price: 35, enabled: false },
    ];
  };
  const [showCreateSport, setShowCreateSport] = useState(false);
  const [showEditSport, setShowEditSport] = useState(false);
  const [showCreateCourt, setShowCreateCourt] = useState(false);
  const [showEditCourt, setShowEditCourt] = useState(false);
  const [showEditCourtHours, setShowEditCourtHours] = useState<{ court: Court }  | null>(null);

  const [selectedSportForCourt, setSelectedSportForCourt] = useState<string | null>(null);
  const [editingSport, setEditingSport] = useState<SportCategory | null>(null);
  const [editingCourt, setEditingCourt] = useState<{ court: Court; sportId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle court active/inactive
  const handleToggleCourtStatus = async (courtId: string, currentStatus: boolean) => {
    if (!canManage) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update court status');
      onRefresh();
    } catch (error) {
      console.error("Error updating court status:", error);
      alert('Failed to update court status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create sport
  const handleCreateSport = async (sportData: Partial<SportCategory>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sport-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sportData,
          facilityId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create sport');
      setShowCreateSport(false);
      onRefresh();
    } catch (error) {
      console.error("Error creating sport:", error);
      alert('Failed to create sport. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update sport
  const handleUpdateSport = async (sportId: string, sportData: Partial<SportCategory>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sport-categories/${sportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sportData),
      });
      
      if (!response.ok) throw new Error('Failed to update sport');
      setShowEditSport(false);
      setEditingSport(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating sport:", error);
      alert('Failed to update sport. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete sport
  const handleDeleteSport = async (sportId: string) => {
    if (!confirm("Are you sure? This will delete all courts for this sport.")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sport-categories/${sportId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error('Failed to delete sport');
      onRefresh();
    } catch (error) {
      console.error("Error deleting sport:", error);
      alert('Failed to delete sport. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create court
  const handleCreateCourt = async (courtData: Partial<Court>) => {
    if (!selectedSportForCourt) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...courtData,
          sportCategoryId: selectedSportForCourt,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create court');
      setShowCreateCourt(false);
      setSelectedSportForCourt(null);
      onRefresh();
    } catch (error) {
      console.error("Error creating court:", error);
      alert('Failed to create court. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update court
  const handleUpdateCourt = async (courtId: string, courtData: Partial<Court>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courtData),
      });
      
      if (!response.ok) throw new Error('Failed to update court');
      setShowEditCourt(false);
      setEditingCourt(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating court:", error);
      alert('Failed to update court. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update court working hours
  const handleUpdateCourtHours = async (courtId: string, workingHours: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours }),
      });
      
      if (!response.ok) throw new Error('Failed to update court working hours');
      setShowEditCourtHours(null);
      onRefresh();
    } catch (error) {
      console.error("Error updating court working hours:", error);
      alert('Failed to update court working hours. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get court working hours display text
  const getCourtWorkingHoursDisplay = (court: Court) => {
    if (court.workingHours === null || court.workingHours === undefined) {
      return t("sportsAndCourts.usesFacilityHours");
    }
    try {
      const hours = typeof court.workingHours === 'string' ? JSON.parse(court.workingHours) : court.workingHours;
      const firstDay = Object.entries(hours).find(([_, day]: [string, any]) => !day?.closed);
      if (firstDay) {
        const [, dayData] = firstDay;
        return `${t("sportsAndCourts.customHours")}: ${(dayData as any).open} - ${(dayData as any).close}`;
      }
      return t("sportsAndCourts.customHours");
    } catch {
      return t("sportsAndCourts.usesFacilityHours");
    }
  };

  // Copy/Duplicate court
  const handleCopyCourt = async (court: Court, sportId: string) => {
    setIsLoading(true);
    try {
      // Find the sport category to get all courts for name generation
      const sportCategory = sportCategories.find(s => s.id === sportId);
      if (!sportCategory) {
        throw new Error('Sport category not found');
      }

      // Generate new court name
      const existingCourtNames = sportCategory.courts.map(c => c.name);
      const baseName = court.name;
      
      // Extract number from court name (e.g., "Court 1" -> 1, "Court" -> null)
      const nameMatch = baseName.match(/^(.+?)\s*(\d+)$/);
      let newName: string;
      
      if (nameMatch) {
        const [, base, numStr] = nameMatch;
        const num = parseInt(numStr, 10);
        let newNum = num + 1;
        
        // Find next available number
        while (existingCourtNames.includes(`${base} ${newNum}`)) {
          newNum++;
        }
        newName = `${base} ${newNum}`;
      } else {
        // If no number, try "Court 2", "Court 3", etc.
        let newNum = 2;
        while (existingCourtNames.includes(`${baseName} ${newNum}`)) {
          newNum++;
        }
        newName = `${baseName} ${newNum}`;
      }

      // Prepare court data with all properties
      // Only include fields that have values (don't send undefined)
      const courtData: any = {
        name: newName,
        sportCategoryId: sportId,
        isActive: court.isActive !== undefined ? court.isActive : true,
        timeSlots: Array.isArray(court.timeSlots) ? court.timeSlots : [],
      };

      // Only add optional fields if they have values
      if (court.description) {
        courtData.description = court.description;
      }
      if (court.surface) {
        courtData.surface = court.surface;
      }
      if (court.locationType) {
        courtData.locationType = court.locationType;
      }
      if (court.capacity !== undefined && court.capacity !== null) {
        courtData.capacity = Number(court.capacity);
      }
      if (court.workingHours !== undefined && court.workingHours !== null) {
        // Send workingHours as-is (object or string, API will handle it)
        courtData.workingHours = court.workingHours;
      }

      console.log("Copying court with data:", JSON.stringify(courtData, null, 2));

      const response = await fetch("/api/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courtData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Failed to copy court:", errorMessage, errorData);
        throw new Error(errorMessage);
      }
      
      onRefresh();
    } catch (error) {
      console.error("Error copying court:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy court. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete court
  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm("Are you sure you want to delete this court?")) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error('Failed to delete court');
      onRefresh();
    } catch (error) {
      console.error("Error deleting court:", error);
      alert('Failed to delete court. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("sportsAndCourts.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {sportCategories.length} {sportCategories.length !== 1 ? t("sportsAndCourts.sports") : t("sportsAndCourts.sport")} • {' '}
            {sportCategories.reduce((sum, sport) => sum + sport.courts.length, 0)} {t("sportsAndCourts.totalCourts")}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowCreateSport(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("sportsAndCourts.addSport")}
          </Button>
        )}
      </div>

      {/* Sports List */}
      {sportCategories.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="bg-muted/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-gray-600 mb-2">{t("sportsAndCourts.noSports")}</p>
            <p className="text-xs text-gray-500 mb-4">
              {t("sportsAndCourts.noSportsDesc")}
            </p>
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateSport(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("sportsAndCourts.addFirstSport")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...sportCategories].sort((a, b) => a.name.localeCompare(b.name)).map((sport) => (
            <Card key={sport.id} className="overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
              <CardHeader className="pb-4 bg-muted/5 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      sport.type === 'indoor' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {sport.type === 'indoor' ? (
                        <House className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Sun className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{sport.name}</CardTitle>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">
                        {sport.type === 'indoor' ? t("dialogs.createCourt.indoor") : t("dialogs.createCourt.outdoor")} • {sport.courts.length} {sport.courts.length !== 1 ? t("sportsAndCourts.courts") : t("sportsAndCourts.court")}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSport(sport);
                          setShowEditSport(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSport(sport.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Courts List */}
                {sport.courts.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    {t("sportsAndCourts.noCourtsForSport")}
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        onClick={() => {
                          setSelectedSportForCourt(sport.id);
                          setShowCreateCourt(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("sportsAndCourts.addCourt")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...sport.courts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((court) => (
                      <div key={court.id} className="group/court bg-card rounded-xl border border-border/60 p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-semibold text-lg text-foreground group-hover/court:text-primary transition-colors">{court.name}</h4>
                              <Badge className={court.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}>
                                {court.isActive ? t("sportsAndCourts.active") : t("sportsAndCourts.inactive")}
                              </Badge>
                            </div>
                            
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{t("sportsAndCourts.location")}:</span>
                                <span className="ml-2 text-foreground capitalize">
                                  {court.locationType ? (court.locationType === 'indoor' ? t("dialogs.createCourt.indoor") : t("dialogs.createCourt.outdoor")) : (sport.type === 'indoor' ? t("dialogs.createCourt.indoor") : t("dialogs.createCourt.outdoor"))}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t("sportsAndCourts.surface")}:</span>
                                <span className="ml-2 text-foreground">
                                  {court.surface ? t(`surfaces.${court.surface}` as any) : t("sportsAndCourts.notSet")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t("sportsAndCourts.timeSlots")}:</span>
                                <span className="ml-2 text-foreground">
                                  {court.timeSlots && court.timeSlots.length > 0
                                    ? court.timeSlots.join(', ')
                                    : t("sportsAndCourts.notSet")}
                                </span>
                              </div>
                              <div className="col-span-1 sm:col-span-2 md:col-span-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{t("sportsAndCourts.workingHoursLabel")}:</span>
                                  <span className="text-foreground">
                                    {getCourtWorkingHoursDisplay(court)}
                                  </span>
                                  {canManage && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2 h-6 px-2"
                                      onClick={() => setShowEditCourtHours({ court })}
                                      aria-label={t("sportsAndCourts.editWorkingHours", { court: court.name })}
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      {t("sportsAndCourts.edit")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                            <PricingPopover court={court} t={t} />
                            
                            {canManage && (
                              <>
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground">{t("sportsAndCourts.status")}</span>
                                  <Switch
                                    checked={court.isActive}
                                    onCheckedChange={() => handleToggleCourtStatus(court.id, court.isActive)}
                                    aria-label={t("sportsAndCourts.toggleCourtStatus", { court: court.name })}
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCourt({ court, sportId: sport.id });
                                    setShowEditCourt(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {t("sportsAndCourts.edit")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCourt(court, sport.id)}
                                  title={t("sportsAndCourts.copy")}
                                  aria-label={t("sportsAndCourts.copyCourt", { court: court.name })}
                                  disabled={isLoading}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCourt(court.id)}
                                  title={t("sportsAndCourts.delete")}
                                  aria-label={t("sportsAndCourts.deleteCourt", { court: court.name })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSportForCourt(sport.id);
                          setShowCreateCourt(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t("sportsAndCourts.addCourtTo", { sport: sport.name })}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Sport Dialog */}
      {showCreateSport && (
        <CreateSportDialog
          onClose={() => setShowCreateSport(false)}
          onSuccess={handleCreateSport}
          isLoading={isLoading}
          t={t}
          sportOptions={SPORT_OPTIONS}
        />
      )}

      {/* Edit Sport Dialog */}
      {showEditSport && editingSport && (
        <EditSportDialog
          sport={editingSport}
          onClose={() => {
            setShowEditSport(false);
            setEditingSport(null);
          }}
          onSuccess={(data) => handleUpdateSport(editingSport.id, data)}
          isLoading={isLoading}
          t={t}
        />
      )}

      {/* Create Court Dialog */}
      {showCreateCourt && selectedSportForCourt && (
        <CreateCourtDialog
          sportName={sportCategories.find(s => s.id === selectedSportForCourt)?.name || t("sportsAndCourts.sport")}
          existingCourtsCount={sportCategories.find(s => s.id === selectedSportForCourt)?.courts.length || 0}
          defaultTimeRanges={getDefaultTimeRanges()}
          onClose={() => {
            setShowCreateCourt(false);
            setSelectedSportForCourt(null);
          }}
          onSuccess={handleCreateCourt}
          isLoading={isLoading}
          t={t}
          surfaceTypes={SURFACE_TYPES}
          timeSlotOptions={TIME_SLOT_OPTIONS}
        />
      )}

      {/* Edit Court Dialog */}
      {showEditCourt && editingCourt && (
        <EditCourtDialog
          court={editingCourt.court}
          sportName={sportCategories.find(s => s.id === editingCourt.sportId)?.name || t("sportsAndCourts.sport")}
          defaultTimeRanges={getDefaultTimeRanges()}
          onClose={() => {
            setShowEditCourt(false);
            setEditingCourt(null);
          }}
          onSuccess={(data) => handleUpdateCourt(editingCourt.court.id, data)}
          isLoading={isLoading}
          t={t}
          surfaceTypes={SURFACE_TYPES}
          timeSlotOptions={TIME_SLOT_OPTIONS}
        />
      )}

      {/* Edit Court Hours Dialog */}
      {showEditCourtHours && (
        <EditCourtHoursDialog
          court={showEditCourtHours.court}
          facilityWorkingHours={workingHours}
          onClose={() => setShowEditCourtHours(null)}
          onSuccess={(hours) => handleUpdateCourtHours(showEditCourtHours.court.id, hours)}
        />
      )}
    </div>
  );
}

// Pricing Popover Component
function PricingPopover({
  court,
  t,
}: {
  court: Court;
  t: any;
}) {
  const pricing = court.pricing || {
    mode: "basic" as const,
    basicPrice: 0,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          title={t("sportsAndCourts.viewPricing")}
          aria-label={t("sportsAndCourts.viewPricing")}
        >
          <Tag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Tag className="h-4 w-4" />
            {t("dialogs.pricing.title", { court: court.name })}
          </div>
        </div>
        <div className="p-4 space-y-4">
           {pricing.mode === "basic" ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dialogs.pricing.basicPricing")}</Label>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm text-foreground">{t("dialogs.pricing.pricePerTimeSlot")}</span>
                  <span className="text-lg font-bold text-primary">
                    €{pricing.basicPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
              

            </div>
           ) : (
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dialogs.pricing.advancedPricing")}</Label>
              
              {pricing.advancedPricing?.tiers && pricing.advancedPricing.tiers.filter(t => t.enabled).length > 0 ? (
                <div className="space-y-2">
                  {pricing.advancedPricing.tiers
                    .filter(tier => tier.enabled)
                    .map((tier) => (
                      <div key={tier.id} className="bg-muted/30 rounded-lg p-2 border border-border/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm text-foreground">{tier.name}</span>
                          <span className="font-bold text-sm text-primary">€{tier.price.toFixed(2)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{tier.timeRange}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {t("dialogs.pricing.noTiersEnabled", { price: pricing.basicPrice?.toFixed(2) })}
                </p>
              )}
            </div>
           )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Create Sport Dialog
function CreateSportDialog({
  onClose,
  onSuccess,
  isLoading,
  t,
  sportOptions,
}: {
  onClose: () => void;
  onSuccess: (sport: Partial<SportCategory>) => Promise<void>;
  isLoading: boolean;
  t: any;
  sportOptions: string[];
}) {
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    // Set default type to "indoor" since it's required by the API but not shown in UI
    await onSuccess({
      ...formData,
      type: "indoor" as "indoor" | "outdoor",
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dialogs.createSport.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.createSport.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialogs.createSport.sportName")}</Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("dialogs.createSport.selectSport")} />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((sport: string) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("dialogs.createSport.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? t("dialogs.createSport.creating") : t("dialogs.createSport.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Sport Dialog
function EditSportDialog({
  sport,
  onClose,
  onSuccess,
  isLoading,
  t,
}: {
  sport: SportCategory;
  onClose: () => void;
  onSuccess: (sport: Partial<SportCategory>) => Promise<void>;
  isLoading: boolean;
  t: any;
}) {
  const [formData, setFormData] = useState({
    name: sport.name,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Keep the existing type since it's required by the API but not shown in UI
    await onSuccess({
      ...formData,
      type: sport.type, // Preserve existing type
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("dialogs.editSport.title")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.editSport.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialogs.editSport.sportName")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("dialogs.editSport.updating") : t("dialogs.editSport.update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Court Dialog
function CreateCourtDialog({
  sportName,
  existingCourtsCount,
  defaultTimeRanges,
  onClose,
  onSuccess,
  isLoading,
  t,
  surfaceTypes,
  timeSlotOptions,
}: {
  sportName: string;
  existingCourtsCount: number;
  defaultTimeRanges: Array<{ id: string; name: string; timeRange: string; price: number; enabled: boolean }>;
  onClose: () => void;
  onSuccess: (court: Partial<Court>) => Promise<void>;
  isLoading: boolean;
  t: any;
  surfaceTypes: Array<{ value: string; label: string }>;
  timeSlotOptions: Array<{ value: string; label: string }>;
}) {
  const [formData, setFormData] = useState({
    name: `${sportName} Court ${existingCourtsCount + 1}`,
    surface: "",
    locationType: "indoor" as "indoor" | "outdoor",
    isActive: true,
    timeSlots: ["60min"] as string[],
    pricing: {
      mode: "basic" as "basic" | "advanced",
      basicPrice: 25,
      advancedPricing: {
        tiers: defaultTimeRanges,
      },
    },
  });
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [customTimeSlot, setCustomTimeSlot] = useState("");
  const [isCustomTimeSlot, setIsCustomTimeSlot] = useState(false);
  
  const updateTierTimeRange = (tierId: string, field: "start" | "end", value: string) => {
    const newTiers = formData.pricing.advancedPricing.tiers.map(tier => {
      if (tier.id === tierId) {
        const [currentStart, currentEnd] = tier.timeRange.split('-');
        const newRange = field === "start" 
          ? `${value}-${currentEnd}` 
          : `${currentStart}-${value}`;
        return { ...tier, timeRange: newRange };
      }
      return tier;
    });
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess(formData);
  };

  const setTimeSlot = (slot: string) => {
    if (slot === "custom") {
      setIsCustomTimeSlot(true);
      // Keep current custom value if it exists, otherwise empty
      if (customTimeSlot) {
        setFormData(prev => ({
          ...prev,
          timeSlots: [customTimeSlot]
        }));
      }
    } else {
      setIsCustomTimeSlot(false);
      setFormData(prev => ({
        ...prev,
        timeSlots: [slot] // Single selection - always an array with one item
      }));
    }
  };

  const handleCustomTimeSlotChange = (value: string) => {
    setCustomTimeSlot(value);
    // Format: should end with "min" or be a number
    const formattedValue = value.trim();
    if (formattedValue) {
      // If it's just a number, add "min"
      const finalValue = /^\d+$/.test(formattedValue) ? `${formattedValue}min` : formattedValue;
      setFormData(prev => ({
        ...prev,
        timeSlots: [finalValue]
      }));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Court</DialogTitle>
          <DialogDescription>
            Create a new court for {sportName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Court Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`e.g., ${sportName} Court ${existingCourtsCount + 1}`}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type *</Label>
              <Select 
                value={formData.locationType} 
                onValueChange={(value: "indoor" | "outdoor") => 
                  setFormData(prev => ({ ...prev, locationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="surface">Surface Type</Label>
              <Select 
                value={formData.surface} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, surface: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface" />
                </SelectTrigger>
                <SelectContent>
                  {surfaceTypes.map((surface: { value: string; label: string }) => (
                    <SelectItem key={surface.value} value={surface.value}>
                      {surface.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Time Slot *</Label>
            <RadioGroup
              value={isCustomTimeSlot ? "custom" : (formData.timeSlots[0] || "")}
              onValueChange={setTimeSlot}
              className="grid grid-cols-2 gap-2"
            >
              {timeSlotOptions.map((option: { value: string; label: string }) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`time-${option.value}`} />
                  <Label htmlFor={`time-${option.value}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="time-custom" />
                <Label htmlFor="time-custom" className="text-sm font-normal cursor-pointer">
                  Custom
                </Label>
              </div>
            </RadioGroup>
            {isCustomTimeSlot && (
              <div className="mt-2">
                <Input
                  placeholder="e.g., 15min, 180min"
                  value={customTimeSlot}
                  onChange={(e) => handleCustomTimeSlotChange(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter duration in minutes (e.g., 15, 180) or with "min" suffix (e.g., 15min, 180min)
                </p>
              </div>
            )}
            {!formData.timeSlots[0] && (
              <Alert>
                <AlertDescription className="text-xs">
                  Please select a time slot
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Pricing Section */}
          <Separator />
          <div className="space-y-4">
            <Label className="text-base font-semibold">Pricing</Label>
            
            {/* Pricing Mode Selection */}
            <RadioGroup
              value={formData.pricing.mode}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, mode: value as "basic" | "advanced" }
                }));
                setShowAdvancedPricing(value === "advanced");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="pricing-basic" />
                <Label htmlFor="pricing-basic" className="font-normal cursor-pointer">
                  Basic Pricing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="pricing-advanced" />
                <Label htmlFor="pricing-advanced" className="font-normal cursor-pointer">
                  Advanced Pricing
                </Label>
              </div>
            </RadioGroup>

            {/* Basic Pricing */}
            {formData.pricing.mode === "basic" && (
              <div className="space-y-2">
                <Label htmlFor="basicPrice">Price per Time Slot (€) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="basicPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing.basicPrice}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        basicPrice: parseFloat(e.target.value) || 0
                      }
                    }))}
                    placeholder="25.00"
                    className="pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This price applies to all selected time slots. The price you enter is the price for the duration of each time slot (e.g., if you set €25 and have 60min slots, each 60min booking costs €25).
                </p>
              </div>
            )}

            {/* Advanced Pricing */}
            {formData.pricing.mode === "advanced" && (
              <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3">
                  Set different prices for different time periods. The price you enter applies to each time slot booking during that time period.
                </p>
                
                {formData.pricing.advancedPricing.tiers.map((tier) => {
                  const [startTime, endTime] = tier.timeRange.split('-');
                  return (
                    <div key={tier.id} className="p-3 border border-border/50 rounded-lg bg-card space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`tier-${tier.id}-enabled`}
                          checked={tier.enabled}
                          onCheckedChange={(checked: boolean) => {
                            const newTiers = formData.pricing.advancedPricing.tiers.map(t => 
                              t.id === tier.id ? { ...t, enabled: checked as boolean } : t
                            );
                            setFormData(prev => ({
                              ...prev,
                              pricing: {
                                ...prev.pricing,
                                advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
                              }
                            }));
                          }}
                        />
                        <Label htmlFor={`tier-${tier.id}-enabled`} className="text-sm font-medium">
                          {tier.name}
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Start Time</Label>
                          <TimePicker
                            value={startTime}
                            onChange={(value) => updateTierTimeRange(tier.id, "start", value)}
                            disabled={!tier.enabled}
                            placeholder="Start time"
                            startHour={7}
                            endHour={23}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">End Time</Label>
                          <TimePicker
                            value={endTime}
                            onChange={(value) => updateTierTimeRange(tier.id, "end", value)}
                            disabled={!tier.enabled}
                            placeholder="End time"
                            startHour={7}
                            endHour={23}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Price (€)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">€</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tier.price}
                              onChange={(e) => {
                                const newTiers = formData.pricing.advancedPricing.tiers.map(t => 
                                  t.id === tier.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t
                                );
                                setFormData(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
                                  }
                                }));
                              }}
                              placeholder="0.00"
                              className="w-full pl-8 text-sm"
                              disabled={!tier.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Note:</strong> If no advanced pricing tiers are enabled, the basic price will be used for all time periods.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
            />
            <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
              Court is active and available for booking
            </Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.timeSlots[0]}>
              {isLoading ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Court Dialog
function EditCourtDialog({
  court,
  sportName,
  defaultTimeRanges,
  onClose,
  onSuccess,
  isLoading,
  t,
  surfaceTypes,
  timeSlotOptions,
}: {
  court: Court;
  sportName: string;
  defaultTimeRanges: Array<{ id: string; name: string; timeRange: string; price: number; enabled: boolean }>;
  onClose: () => void;
  onSuccess: (court: Partial<Court>) => Promise<void>;
  isLoading: boolean;
  t: any;
  surfaceTypes: Array<{ value: string; label: string }>;
  timeSlotOptions: Array<{ value: string; label: string }>;
}) {
  // Use existing pricing tiers if available, otherwise use defaults
  const existingTiers = court.pricing?.advancedPricing?.tiers || defaultTimeRanges;
  
  const [formData, setFormData] = useState({
    name: court.name,
    surface: court.surface || "",
    locationType: (court.locationType || "indoor") as "indoor" | "outdoor",
    isActive: court.isActive,
    timeSlots: court.timeSlots || ["60min"],
    pricing: court.pricing ? {
      mode: court.pricing.mode || "basic",
      basicPrice: court.pricing.basicPrice || 25,
      advancedPricing: {
        tiers: existingTiers,
      },
    } : {
      mode: "basic" as "basic" | "advanced",
      basicPrice: 25,
      advancedPricing: {
        tiers: defaultTimeRanges,
      },
    },
  });
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(
    court.pricing?.mode === "advanced" || false
  );
  
  // Check if current time slot is custom (not in standard options)
  const currentTimeSlot = court.timeSlots?.[0] || "60min";
  const isCustomTimeSlotInitial = !timeSlotOptions.some((opt: { value: string }) => opt.value === currentTimeSlot);
  const [customTimeSlot, setCustomTimeSlot] = useState(isCustomTimeSlotInitial ? currentTimeSlot : "");
  const [isCustomTimeSlot, setIsCustomTimeSlot] = useState(isCustomTimeSlotInitial);
  
  const updateTierTimeRange = (tierId: string, field: "start" | "end", value: string) => {
    const newTiers = formData.pricing.advancedPricing.tiers.map(tier => {
      if (tier.id === tierId) {
        const [currentStart, currentEnd] = tier.timeRange.split('-');
        const newRange = field === "start" 
          ? `${value}-${currentEnd}` 
          : `${currentStart}-${value}`;
        return { ...tier, timeRange: newRange };
      }
      return tier;
    });
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess(formData);
  };

  const setTimeSlot = (slot: string) => {
    if (slot === "custom") {
      setIsCustomTimeSlot(true);
      // Keep current custom value if it exists, otherwise empty
      if (customTimeSlot) {
        setFormData(prev => ({
          ...prev,
          timeSlots: [customTimeSlot]
        }));
      }
    } else {
      setIsCustomTimeSlot(false);
      setFormData(prev => ({
        ...prev,
        timeSlots: [slot] // Single selection - always an array with one item
      }));
    }
  };

  const handleCustomTimeSlotChange = (value: string) => {
    setCustomTimeSlot(value);
    // Format: should end with "min" or be a number
    const formattedValue = value.trim();
    if (formattedValue) {
      // If it's just a number, add "min"
      const finalValue = /^\d+$/.test(formattedValue) ? `${formattedValue}min` : formattedValue;
      setFormData(prev => ({
        ...prev,
        timeSlots: [finalValue]
      }));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Court</DialogTitle>
          <DialogDescription>
            Update court details for {sportName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Court Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type *</Label>
              <Select 
                value={formData.locationType} 
                onValueChange={(value: "indoor" | "outdoor") => 
                  setFormData(prev => ({ ...prev, locationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Indoor</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="surface">Surface Type</Label>
              <Select 
                value={formData.surface} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, surface: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface" />
                </SelectTrigger>
                <SelectContent>
                  {surfaceTypes.map((surface: { value: string; label: string }) => (
                    <SelectItem key={surface.value} value={surface.value}>
                      {surface.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Time Slot *</Label>
            <RadioGroup
              value={isCustomTimeSlot ? "custom" : (formData.timeSlots[0] || "")}
              onValueChange={setTimeSlot}
              className="grid grid-cols-2 gap-2"
            >
              {timeSlotOptions.map((option: { value: string; label: string }) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`edit-time-${option.value}`} />
                  <Label htmlFor={`edit-time-${option.value}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="edit-time-custom" />
                <Label htmlFor="edit-time-custom" className="text-sm font-normal cursor-pointer">
                  Custom
                </Label>
              </div>
            </RadioGroup>
            {isCustomTimeSlot && (
              <div className="mt-2">
                <Input
                  placeholder="e.g., 15min, 180min"
                  value={customTimeSlot}
                  onChange={(e) => handleCustomTimeSlotChange(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter duration in minutes (e.g., 15, 180) or with "min" suffix (e.g., 15min, 180min)
                </p>
              </div>
            )}
            {!formData.timeSlots[0] && (
              <Alert>
                <AlertDescription className="text-xs">
                  Please select a time slot
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Pricing Section */}
          <Separator />
          <div className="space-y-4">
            <Label className="text-base font-semibold">Pricing</Label>
            
            {/* Pricing Mode Selection */}
            <RadioGroup
              value={formData.pricing.mode}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, mode: value as "basic" | "advanced" }
                }));
                setShowAdvancedPricing(value === "advanced");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="edit-pricing-basic" />
                <Label htmlFor="edit-pricing-basic" className="font-normal cursor-pointer">
                  Basic Pricing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="edit-pricing-advanced" />
                <Label htmlFor="edit-pricing-advanced" className="font-normal cursor-pointer">
                  Advanced Pricing
                </Label>
              </div>
            </RadioGroup>

            {/* Basic Pricing */}
            {formData.pricing.mode === "basic" && (
              <div className="space-y-2">
                <Label htmlFor="edit-basicPrice">Price per Time Slot (€) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="edit-basicPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing.basicPrice || 0}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        basicPrice: parseFloat(e.target.value) || 0
                      }
                    }))}
                    placeholder="25.00"
                    className="pl-8"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This price applies to all selected time slots. The price you enter is the price for the duration of each time slot (e.g., if you set €25 and have 60min slots, each 60min booking costs €25).
                </p>
              </div>
            )}

            {/* Advanced Pricing */}
            {formData.pricing.mode === "advanced" && (
              <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3">
                  Set different prices for different time periods. The price you enter applies to each time slot booking during that time period.
                </p>
                
                {formData.pricing.advancedPricing.tiers.map((tier) => {
                  const [startTime, endTime] = tier.timeRange.split('-');
                  return (
                    <div key={tier.id} className="p-3 border border-border/50 rounded-lg bg-card space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-tier-${tier.id}-enabled`}
                          checked={tier.enabled}
                          onCheckedChange={(checked: boolean) => {
                            const newTiers = formData.pricing.advancedPricing.tiers.map(t => 
                              t.id === tier.id ? { ...t, enabled: checked as boolean } : t
                            );
                            setFormData(prev => ({
                              ...prev,
                              pricing: {
                                ...prev.pricing,
                                advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
                              }
                            }));
                          }}
                        />
                        <Label htmlFor={`edit-tier-${tier.id}-enabled`} className="text-sm font-medium">
                          {tier.name}
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Start Time</Label>
                          <TimePicker
                            value={startTime}
                            onChange={(value) => updateTierTimeRange(tier.id, "start", value)}
                            disabled={!tier.enabled}
                            placeholder="Start time"
                            startHour={7}
                            endHour={23}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">End Time</Label>
                          <TimePicker
                            value={endTime}
                            onChange={(value) => updateTierTimeRange(tier.id, "end", value)}
                            disabled={!tier.enabled}
                            placeholder="End time"
                            startHour={7}
                            endHour={23}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Price (€)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tier.price}
                              onChange={(e) => {
                                const newTiers = formData.pricing.advancedPricing.tiers.map(t => 
                                  t.id === tier.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t
                                );
                                setFormData(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    advancedPricing: { ...prev.pricing.advancedPricing, tiers: newTiers }
                                  }
                                }));
                              }}
                              placeholder="0.00"
                              className="w-full pl-8 text-sm"
                              disabled={!tier.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Note:</strong> If no advanced pricing tiers are enabled, the basic price will be used for all time periods.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
            />
            <Label htmlFor="edit-isActive" className="text-sm font-normal cursor-pointer">
              Court is active and available for booking
            </Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.timeSlots[0]}>
              {isLoading ? "Updating..." : "Update Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



