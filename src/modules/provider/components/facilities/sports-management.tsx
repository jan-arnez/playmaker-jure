"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Users, Clock, Settings, CheckCircle, Building2, Star, House, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
  timeSlots: string[]; // ["30min", "45min", "60min", "90min"]
  locationType?: "indoor" | "outdoor";
  createdAt: string;
  updatedAt: string;
}

interface SportsManagementProps {
  facilityId: string;
  sportCategories: SportCategory[];
  onSportCategoryCreate: (sportCategory: Partial<SportCategory>) => Promise<void>;
  onSportCategoryUpdate: (id: string, sportCategory: Partial<SportCategory>) => Promise<void>;
  onSportCategoryDelete: (id: string) => Promise<void>;
  onCourtCreate: (sportCategoryId: string, court: Partial<Court>) => Promise<void>;
  onCourtUpdate: (sportCategoryId: string, courtId: string, court: Partial<Court>) => Promise<void>;
  onCourtDelete: (sportCategoryId: string, courtId: string) => Promise<void>;
}

const SURFACE_TYPES = [
  "Hard Court",
  "Clay Court", 
  "Grass Court",
  "Synthetic",
  "Wood Floor",
  "Concrete",
  "Carpet",
  "Artificial Grass",
  "Other"
];

const TIME_SLOT_OPTIONS = [
  { value: "30min", label: "30 minutes" },
  { value: "45min", label: "45 minutes" },
  { value: "60min", label: "1 hour" },
  { value: "90min", label: "1.5 hours" },
  { value: "120min", label: "2 hours" },
];

export function SportsManagement({
  facilityId,
  sportCategories = [],
  onSportCategoryCreate,
  onSportCategoryUpdate,
  onSportCategoryDelete,
  onCourtCreate,
  onCourtUpdate,
  onCourtDelete,
}: SportsManagementProps) {
  // Hardcoded sport categories for development
  const hardcodedSportCategories: SportCategory[] = [
    {
      id: "hardcoded-tennis",
      name: "Tennis",
      type: "outdoor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      courts: [
        {
          id: "court-1",
          name: "Court 1",
          surface: "Hard Court",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "court-2", 
          name: "Court 2",
          surface: "Clay Court",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    },
    {
      id: "hardcoded-volleyball",
      name: "Volleyball",
      type: "indoor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      courts: [
        {
          id: "volleyball-court-1",
          name: "Court 1",
          surface: "Wood Floor",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "volleyball-court-2",
          name: "Court 2", 
          surface: "Wood Floor",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "volleyball-court-3",
          name: "Court 3",
          surface: "Wood Floor",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "volleyball-court-4",
          name: "Court 4",
          surface: "Wood Floor",
          isActive: true,
          timeSlots: ["60min"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    }
  ];

  // Use real sport categories from database
  console.log("Received sport categories:", sportCategories);
  const displaySportCategories = sportCategories;
  console.log("Using sport categories:", displaySportCategories);
  const [selectedSportCategory, setSelectedSportCategory] = useState<SportCategory | null>(
    displaySportCategories.length > 0 ? displaySportCategories[0] : null
  );
  const [showCreateSport, setShowCreateSport] = useState(false);
  const [showEditSport, setShowEditSport] = useState(false);
  const [showCreateCourt, setShowCreateCourt] = useState(false);
  const [editingSport, setEditingSport] = useState<SportCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSport = async (sportData: Partial<SportCategory>) => {
    setIsLoading(true);
    try {
      await onSportCategoryCreate(sportData);
      setShowCreateSport(false);
    } catch (error) {
      console.error("Error creating sport category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSport = async (sportData: Partial<SportCategory>) => {
    if (!editingSport) return;
    
    setIsLoading(true);
    try {
      await onSportCategoryUpdate(editingSport.id, sportData);
      setShowEditSport(false);
      setEditingSport(null);
    } catch (error) {
      console.error("Error updating sport category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSport = async (sportId: string) => {
    if (!confirm("Are you sure you want to delete this sport category? This will also delete all associated courts.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onSportCategoryDelete(sportId);
      if (selectedSportCategory?.id === sportId) {
        setSelectedSportCategory(null);
      }
    } catch (error) {
      console.error("Error deleting sport category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourt = async (courtData: Partial<Court>) => {
    if (!selectedSportCategory) {
      console.error("No sport category selected for court creation");
      return;
    }
    
    console.log("Creating court for sport category:", selectedSportCategory.id, "with data:", courtData);
    
    setIsLoading(true);
    try {
      await onCourtCreate(selectedSportCategory.id, courtData);
      setShowCreateCourt(false);
    } catch (error) {
      console.error("Error creating court:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourt = async (courtId: string, courtData: Partial<Court>) => {
    if (!selectedSportCategory) return;
    
    setIsLoading(true);
    try {
      await onCourtUpdate(selectedSportCategory.id, courtId, courtData);
    } catch (error) {
      console.error("Error updating court:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!selectedSportCategory) return;
    
    if (!confirm("Are you sure you want to delete this court?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onCourtDelete(selectedSportCategory.id, courtId);
    } catch (error) {
      console.error("Error deleting court:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSportStats = (sport: SportCategory) => {
    const totalCourts = sport.courts.length;
    const activeCourts = sport.courts.filter(court => court.isActive).length;
    return { totalCourts, activeCourts };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sports & Courts Management</h2>
          <p className="text-gray-600">Manage sports categories and courts for your facility</p>
        </div>
        <Button onClick={() => setShowCreateSport(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sport Category
        </Button>
      </div>

      {/* No sport categories message */}
      {displaySportCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No sports available for this facility.</p>
          <p className="text-sm text-gray-400">Click "Add Sport Category" to create a sport category first.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Sports List */}
        <div className="lg:col-span-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sport Categories</h3>
            <p className="text-sm text-gray-600">Select a sport to manage its courts</p>
          </div>
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Sports ({displaySportCategories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {displaySportCategories.map((sport) => {
                  const stats = getSportStats(sport);
                  return (
                    <div
                      key={sport.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSportCategory?.id === sport.id ? "bg-green-50 border-l-4 border-l-green-500" : ""
                      }`}
                      onClick={() => setSelectedSportCategory(sport)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 text-sm">
                              {sport.name}
                            </h3>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              {sport.type === "indoor" ? <House className="h-2.5 w-2.5 mr-1" /> : <Sun className="h-2.5 w-2.5 mr-1" />}
                              {sport.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{stats.totalCourts} courts</span>
                            <span>•</span>
                            <span className={stats.activeCourts > 0 ? "text-green-600" : "text-gray-500"}>
                              {stats.activeCourts} active
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSport(sport);
                              setShowEditSport(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSport(sport.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {displaySportCategories.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Settings className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No sports categories yet</p>
                    <p className="text-xs">Add your first sport category to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Court Management */}
        <div className="lg:col-span-3">
          {selectedSportCategory ? (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedSportCategory.name} Courts
                </h3>
                <p className="text-sm text-gray-600">
                  Manage courts for {selectedSportCategory.name.toLowerCase()} - {selectedSportCategory.courts.length} total courts
                </p>
              </div>
              <CourtsManagement
                sportCategory={selectedSportCategory}
                onCreateCourt={() => setShowCreateCourt(true)}
                onEditCourt={handleEditCourt}
                onDeleteCourt={handleDeleteCourt}
              />
            </div>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sport Selected</h3>
                <p className="text-gray-600 mb-4">Choose a sport category from the left panel to manage its courts</p>
                <Button onClick={() => setShowCreateSport(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Sport Category
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 my-6"></div>

      {/* Create Sport Dialog */}
      {showCreateSport && (
        <CreateSportDialog
          facilityId={facilityId}
          onClose={() => setShowCreateSport(false)}
          onSuccess={handleCreateSport}
          isLoading={isLoading}
        />
      )}

      {/* Edit Sport Dialog */}
      {showEditSport && editingSport && (
        <EditSportDialog
          sportCategory={editingSport}
          onClose={() => {
            setShowEditSport(false);
            setEditingSport(null);
          }}
          onSuccess={handleEditSport}
          isLoading={isLoading}
        />
      )}

      {/* Create Court Dialog */}
      {showCreateCourt && selectedSportCategory && (
        <CreateCourtDialog
          sportCategoryId={selectedSportCategory.id}
          existingCourtsCount={selectedSportCategory.courts.length}
          onClose={() => setShowCreateCourt(false)}
          onSuccess={handleCreateCourt}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Courts Management Component
function CourtsManagement({
  sportCategory,
  onCreateCourt,
  onEditCourt,
  onDeleteCourt,
}: {
  sportCategory: SportCategory;
  onCreateCourt: () => void;
  onEditCourt: (courtId: string, court: Partial<Court>) => Promise<void>;
  onDeleteCourt: (courtId: string) => Promise<void>;
}) {
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [showEditCourt, setShowEditCourt] = useState(false);

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowEditCourt(true);
  };

  const handleUpdateCourt = async (courtData: Partial<Court>) => {
    if (!editingCourt) return;
    await onEditCourt(editingCourt.id, courtData);
    setShowEditCourt(false);
    setEditingCourt(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Court Button */}
      <div className="flex justify-end">
        <Button onClick={onCreateCourt} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Court
        </Button>
      </div>

      {/* Courts Grid */}
      {sportCategory.courts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courts yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first {sportCategory.name.toLowerCase()} court
            </p>
            <Button onClick={onCreateCourt}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Court
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sportCategory.courts.map((court) => (
            <Card key={court.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{court.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={court.isActive ? "default" : "secondary"}>
                      {court.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEditCourt(court)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteCourt(court.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {court.locationType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Location</span>
                      <Badge variant={court.locationType === "indoor" ? "default" : "secondary"}>
                        {court.locationType === "indoor" ? (
                          <><House className="h-3 w-3 mr-1 inline" />Indoor</>
                        ) : (
                          <><Sun className="h-3 w-3 mr-1 inline" />Outdoor</>
                        )}
                      </Badge>
                    </div>
                  )}
                  
                  {court.surface && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Surface</span>
                      <span className="text-sm text-gray-600">{court.surface}</span>
                    </div>
                  )}
                  
                  {court.timeSlots.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Time Slot</span>
                      <span className="text-sm text-gray-600">{court.timeSlots[0]}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Court Dialog */}
      {showEditCourt && editingCourt && (
        <EditCourtDialog
          court={editingCourt}
          onClose={() => {
            setShowEditCourt(false);
            setEditingCourt(null);
          }}
          onSuccess={handleUpdateCourt}
        />
      )}
    </div>
  );
}

// Create Sport Dialog Component
function CreateSportDialog({
  facilityId,
  onClose,
  onSuccess,
  isLoading,
}: {
  facilityId: string;
  onClose: () => void;
  onSuccess: (sportCategory: Partial<SportCategory>) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "indoor" as "indoor" | "outdoor",
    defaultPrice: 25,
    advancedPricing: {
      enabled: false,
      tiers: [
        { id: 1, name: "Early Morning", timeRange: "06:00-09:00", price: 20, enabled: false },
        { id: 2, name: "Morning", timeRange: "09:00-12:00", price: 25, enabled: false },
        { id: 3, name: "Afternoon", timeRange: "12:00-18:00", price: 30, enabled: false },
        { id: 4, name: "Evening", timeRange: "18:00-22:00", price: 35, enabled: false },
      ]
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      await onSuccess(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Sport Category</DialogTitle>
          <DialogDescription>
            Create a new sport category for your facility
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sport *</Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tennis">Tennis</SelectItem>
                <SelectItem value="Multi-purpose">Multi-purpose</SelectItem>
                <SelectItem value="Badminton">Badminton</SelectItem>
                <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                <SelectItem value="Volleyball">Volleyball</SelectItem>
                <SelectItem value="Padel">Padel</SelectItem>
                <SelectItem value="Swimming">Swimming</SelectItem>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Squash">Squash</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Location Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: "indoor" | "outdoor") => 
                setFormData(prev => ({ ...prev, type: value }))
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
          
          {/* Default Pricing */}
          <div className="space-y-2">
            <Label htmlFor="defaultPrice">Default Price per Hour (€) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <Input
                id="defaultPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="25.00"
                className="pl-8"
              />
            </div>
          </div>

          {/* Advanced Pricing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Advanced Pricing</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  advancedPricing: { ...prev.advancedPricing, enabled: !prev.advancedPricing.enabled }
                }))}
              >
                {formData.advancedPricing.enabled ? "Hide" : "Show"} Advanced Pricing
              </Button>
            </div>
            
            {formData.advancedPricing.enabled && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Set different prices for different time periods. Check the tiers you want to use.
                </p>
                
                {formData.advancedPricing.tiers.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`tier-${tier.id}-enabled`}
                        checked={tier.enabled}
                        onCheckedChange={(checked: boolean) => {
                          const newTiers = formData.advancedPricing.tiers.map(t => 
                            t.id === tier.id ? { ...t, enabled: checked as boolean } : t
                          );
                          setFormData(prev => ({ 
                            ...prev, 
                            advancedPricing: { ...prev.advancedPricing, tiers: newTiers }
                          }));
                        }}
                      />
                      <Label htmlFor={`tier-${tier.id}-enabled`} className="text-sm font-medium">
                        {tier.name}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Time:</Label>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {tier.timeRange}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Price:</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.price}
                          onChange={(e) => {
                            const newTiers = formData.advancedPricing.tiers.map(t => 
                              t.id === tier.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t
                            );
                            setFormData(prev => ({ 
                              ...prev, 
                              advancedPricing: { ...prev.advancedPricing, tiers: newTiers }
                            }));
                          }}
                          placeholder="0.00"
                          className="w-20 pl-8"
                          disabled={!tier.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
                  <strong>Tip:</strong> If no advanced pricing tiers are enabled, the default price will be used for all time periods.
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Sport Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Sport Dialog Component
function EditSportDialog({
  sportCategory,
  onClose,
  onSuccess,
  isLoading,
}: {
  sportCategory: SportCategory;
  onClose: () => void;
  onSuccess: (sportCategory: Partial<SportCategory>) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: sportCategory.name,
    description: sportCategory.description || "",
    type: sportCategory.type,
    defaultPrice: 25,
    advancedPricing: {
      enabled: false,
      tiers: [
        { id: 1, name: "Early Morning", timeRange: "06:00-09:00", price: 20, enabled: false },
        { id: 2, name: "Morning", timeRange: "09:00-12:00", price: 25, enabled: false },
        { id: 3, name: "Afternoon", timeRange: "12:00-18:00", price: 30, enabled: false },
        { id: 4, name: "Evening", timeRange: "18:00-22:00", price: 35, enabled: false },
      ]
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Sport Category</DialogTitle>
          <DialogDescription>
            Update the sport category details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Sport *</Label>
            <Select
              value={formData.name}
              onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tennis">Tennis</SelectItem>
                <SelectItem value="Multi-purpose">Multi-purpose</SelectItem>
                <SelectItem value="Badminton">Badminton</SelectItem>
                <SelectItem value="Table Tennis">Table Tennis</SelectItem>
                <SelectItem value="Volleyball">Volleyball</SelectItem>
                <SelectItem value="Padel">Padel</SelectItem>
                <SelectItem value="Swimming">Swimming</SelectItem>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Squash">Squash</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Location Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: "indoor" | "outdoor") => 
                setFormData(prev => ({ ...prev, type: value }))
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
          
          {/* Default Pricing */}
          <div className="space-y-2">
            <Label htmlFor="edit-defaultPrice">Default Price per Hour (€) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <Input
                id="edit-defaultPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="25.00"
                className="pl-8"
              />
            </div>
          </div>

          {/* Advanced Pricing Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Advanced Pricing</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  advancedPricing: { ...prev.advancedPricing, enabled: !prev.advancedPricing.enabled }
                }))}
              >
                {formData.advancedPricing.enabled ? "Hide" : "Show"} Advanced Pricing
              </Button>
            </div>
            
            {formData.advancedPricing.enabled && (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Set different prices for different time periods. Check the tiers you want to use.
                </p>
                
                {formData.advancedPricing.tiers.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-4 p-3 border rounded-lg bg-white">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-tier-${tier.id}-enabled`}
                        checked={tier.enabled}
                        onCheckedChange={(checked: boolean) => {
                          const newTiers = formData.advancedPricing.tiers.map(t => 
                            t.id === tier.id ? { ...t, enabled: checked as boolean } : t
                          );
                          setFormData(prev => ({ 
                            ...prev, 
                            advancedPricing: { ...prev.advancedPricing, tiers: newTiers }
                          }));
                        }}
                      />
                      <Label htmlFor={`edit-tier-${tier.id}-enabled`} className="text-sm font-medium">
                        {tier.name}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Time:</Label>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {tier.timeRange}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Price:</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.price}
                          onChange={(e) => {
                            const newTiers = formData.advancedPricing.tiers.map(t => 
                              t.id === tier.id ? { ...t, price: parseFloat(e.target.value) || 0 } : t
                            );
                            setFormData(prev => ({ 
                              ...prev, 
                              advancedPricing: { ...prev.advancedPricing, tiers: newTiers }
                            }));
                          }}
                          placeholder="0.00"
                          className="w-20 pl-8"
                          disabled={!tier.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
                  <strong>Tip:</strong> If no advanced pricing tiers are enabled, the default price will be used for all time periods.
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Sport Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Court Dialog Component
function CreateCourtDialog({
  sportCategoryId,
  existingCourtsCount,
  onClose,
  onSuccess,
  isLoading,
}: {
  sportCategoryId: string;
  existingCourtsCount: number;
  onClose: () => void;
  onSuccess: (court: Partial<Court>) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: `Court ${existingCourtsCount + 1}`,
    surface: "",
    // locationType: "indoor" as "indoor" | "outdoor", // Temporarily disabled
    isActive: true,
    timeSlot: "60min",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess({
      ...formData,
      timeSlots: [formData.timeSlot], // Convert single selection to array
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Court</DialogTitle>
          <DialogDescription>
            Create a new court for this sport category
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`e.g., Court ${existingCourtsCount + 1}, Main Court`}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="surface">Surface Type</Label>
            <Select 
              value={formData.surface} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, surface: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select surface type" />
              </SelectTrigger>
              <SelectContent>
                {SURFACE_TYPES.map((surface) => (
                  <SelectItem key={surface} value={surface}>
                    {surface}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot *</Label>
            <Select
              value={formData.timeSlot}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Court is active and available for booking</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Court Dialog Component
function EditCourtDialog({
  court,
  onClose,
  onSuccess,
}: {
  court: Court;
  onClose: () => void;
  onSuccess: (court: Partial<Court>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: court.name,
    surface: court.surface || "",
    locationType: court.locationType || "indoor" as "indoor" | "outdoor",
    isActive: court.isActive,
    timeSlot: court.timeSlots?.[0] || "60min", // Use first time slot or default
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess({
      ...formData,
      timeSlots: [formData.timeSlot], // Convert single selection to array
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Court</DialogTitle>
          <DialogDescription>
            Update the court details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Court 1, Main Court"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type *</Label>
              <Select 
                value={formData.locationType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, locationType: value as "indoor" | "outdoor" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">
                    <span className="flex items-center gap-1"><House className="h-4 w-4" /> Indoor</span>
                  </SelectItem>
                  <SelectItem value="outdoor">
                    <span className="flex items-center gap-1"><Sun className="h-4 w-4" /> Outdoor</span>
                  </SelectItem>
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
                  <SelectValue placeholder="Select surface type" />
                </SelectTrigger>
                <SelectContent>
                  {SURFACE_TYPES.map((surface) => (
                    <SelectItem key={surface} value={surface}>
                      {surface}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot *</Label>
            <Select
              value={formData.timeSlot}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isActive">Court is active and available for booking</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Court
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
