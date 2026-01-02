"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Building2, MapPin, Phone, Mail, Users, Calendar, Settings, Eye, Edit, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { CreateFacilityForm } from "./create-facility-form";
// import { SportCategoryManagement } from "./sport-category-management";
// import { CourtManagement } from "./court-management";

interface Facility {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  facilities: string[];
  sportCategories: SportCategory[];
  _count: {
    bookings: number;
  };
}

interface SportCategory {
  id: string;
  name: string;
  description?: string;
  type: "indoor" | "outdoor";
  courts: Court[];
}

interface Court {
  id: string;
  name: string;
  description?: string;
  surface?: string;
  capacity?: number;
  isActive: boolean;
}

interface EnhancedFacilityManagementProps {
  organizationId: string;
  userRole: string;
  facilities: Facility[];
  onCreateFacility?: (facility: Partial<Facility>) => Promise<void>;
  onEditFacility?: (facilityId: string, facility: Partial<Facility>) => Promise<void>;
  onDeleteFacility?: (facilityId: string) => Promise<void>;
  onViewFacility?: (facilityId: string) => void;
}

export function EnhancedFacilityManagement({
  organizationId,
  userRole,
  facilities = [],
  onCreateFacility,
  onEditFacility,
  onDeleteFacility,
  onViewFacility,
}: EnhancedFacilityManagementProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SportCategory | null>(null);
  const [filterType, setFilterType] = useState<"all" | "indoor" | "outdoor">("all");
  const [showCreateFacility, setShowCreateFacility] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateCourt, setShowCreateCourt] = useState(false);

  const canManageFacilities = userRole === "owner" || userRole === "admin";

  // Filter facilities based on search term and type
  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    
    return matchesSearch && facility.sportCategories.some(cat => cat.type === filterType);
  });

  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category: SportCategory) => {
    setSelectedCategory(category);
  };

  const getFacilityStats = (facility: Facility) => {
    const totalCourts = facility.sportCategories.reduce((sum, cat) => sum + cat.courts.length, 0);
    const activeCourts = facility.sportCategories.reduce((sum, cat) => 
      sum + cat.courts.filter(court => court.isActive).length, 0
    );
    const indoorCategories = facility.sportCategories.filter(cat => cat.type === "indoor").length;
    const outdoorCategories = facility.sportCategories.filter(cat => cat.type === "outdoor").length;

    return {
      totalCourts,
      activeCourts,
      indoorCategories,
      outdoorCategories,
      totalBookings: facility._count.bookings
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("facilities")}
          </h1>
          <p className="text-gray-600 mt-1">{t("manageYourFacilities")}</p>
        </div>
        {canManageFacilities && (
          <Dialog open={showCreateFacility} onOpenChange={setShowCreateFacility}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {t("createFacility")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("createFacility")}</DialogTitle>
                <DialogDescription>
                  {t("createFacilityDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <p>Create Facility Form - Coming Soon</p>
                <Button onClick={() => setShowCreateFacility(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t("searchFacilities")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={(value: "all" | "indoor" | "outdoor") => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("filterByType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            <SelectItem value="indoor">{t("indoor")}</SelectItem>
            <SelectItem value="outdoor">{t("outdoor")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Facilities List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t("facilities")} ({filteredFacilities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredFacilities.map((facility) => {
                  const stats = getFacilityStats(facility);
                  return (
                    <div
                      key={facility.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedFacility?.id === facility.id ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => handleFacilitySelect(facility)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {facility.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {facility.city}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {stats.totalCourts} {t("courts")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {stats.totalBookings} {t("bookings")}
                            </Badge>
                          </div>
                        </div>
                        {canManageFacilities && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewFacility?.(facility.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredFacilities.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{t("noFacilitiesFound")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sport Categories and Courts Management */}
        <div className="lg:col-span-2">
          {selectedFacility ? (
            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">{t("sportCategories")}</TabsTrigger>
                <TabsTrigger value="courts">{t("courts")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="categories" className="mt-6">
                <div className="p-4">
                  <p>Sport Category Management - Coming Soon</p>
                  <p>Selected Facility: {selectedFacility.name}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="courts" className="mt-6">
                <div className="p-4">
                  <p>Court Management - Coming Soon</p>
                  <p>Selected Facility: {selectedFacility.name}</p>
                  {selectedCategory && <p>Selected Category: {selectedCategory.name}</p>}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("selectFacility")}
                </h3>
                <p className="text-gray-500">
                  {t("selectFacilityDescription")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
