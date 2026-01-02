"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { OptimizedImage } from "@/components/optimized-image";
import { 
  Plus, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock, 
  Eye,
  Edit,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sun
} from "lucide-react";

const DEFAULT_FACILITY_IMAGE = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SportsCourtsSection } from "./sports-courts-section";
// EditBasicInfoDialog moved to Settings page
import { EditHoursDialog } from "./edit-hours-dialog";
import { EditImagesDialog } from "./edit-images-dialog";
import { EditContentRulesDialog } from "./edit-content-rules-dialog";
import { parseWorkingHours, formatDayHours, DAY_ORDER, DAY_LABELS_SHORT } from "@/lib/working-hours";

interface Facility {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  imageUrl?: string;
  images: string[];
  locationType?: "indoor" | "outdoor";
  surface?: string;
  facilities: string[];
  workingHours?: any;
  rules?: string;
  capacity?: number;
  pricePerHour?: number;
  currency: string;
  status: "active" | "inactive" | "maintenance";
  sportCategories: SportCategory[];
  _count: {
    bookings: number;
  };
  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

interface ComprehensiveFacilityManagementProps {
  organizationId: string;
  userRole: string;
  facilities: Facility[];
  onCreateFacility?: (facility: Partial<Facility>) => Promise<void>;
  onEditFacility?: (facilityId: string, facility: Partial<Facility>) => Promise<void>;
  onDeleteFacility?: (facilityId: string) => Promise<void>;
  onViewFacility?: (facilityId: string) => void;
}

const STORAGE_KEY_PREFIX = "selectedFacility_";

// Only the amenities that are actually used in the facilities page filters
const FACILITY_AMENITIES = [
  { id: "parking", label: "Free Parking", icon: "🚗" },
  { id: "showers", label: "Showers", icon: "🚿" },
  { id: "lockers", label: "Lockers", icon: "🔒" },
  { id: "cafe", label: "Cafe", icon: "☕" },
  { id: "lighting", label: "Lighting", icon: "💡" },
];


// Helper functions for status colors and icons
const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "inactive": return "bg-gray-100 text-gray-800";
    case "maintenance": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active": return <CheckCircle className="h-4 w-4" />;
    case "inactive": return <XCircle className="h-4 w-4" />;
    case "maintenance": return <AlertCircle className="h-4 w-4" />;
    default: return <XCircle className="h-4 w-4" />;
  }
};

export function ComprehensiveFacilityManagement({
  organizationId,
  userRole,
  facilities = [],
  onCreateFacility,
  onEditFacility,
  onDeleteFacility,
  onViewFacility,
}: ComprehensiveFacilityManagementProps) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showCreateFacility, setShowCreateFacility] = useState(false);

  const [showEditHours, setShowEditHours] = useState(false);
  const [showEditImages, setShowEditImages] = useState(false);
  const [showEditContentRules, setShowEditContentRules] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Get storage key based on organization
  const storageKey = `${STORAGE_KEY_PREFIX}${organizationId}`;

  // Auto-select facility: check localStorage first, then fall back to first facility
  useEffect(() => {
    if (facilities.length === 0) {
      setSelectedFacility(null);
      return;
    }

    // Try to get from localStorage first
    if (typeof window !== "undefined") {
      const savedFacilityId = localStorage.getItem(storageKey);
      if (savedFacilityId) {
        const savedFacility = facilities.find(f => f.id === savedFacilityId);
        if (savedFacility) {
          setSelectedFacility(savedFacility);
          return;
        }
      }
    }

    // If no saved selection or saved facility doesn't exist, use first facility
    if (!selectedFacility) {
      setSelectedFacility(facilities[0]);
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, facilities[0].id);
      }
    } else {
      // Update selected facility with fresh data if it still exists
      const updatedFacility = facilities.find(f => f.id === selectedFacility.id);
      if (updatedFacility) {
        setSelectedFacility(updatedFacility);
      } else if (facilities.length > 0) {
        // If selected facility was deleted, select first available
        setSelectedFacility(facilities[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, facilities[0].id);
        }
      } else {
        setSelectedFacility(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilities, storageKey]);

  const canManageFacilities = userRole === "owner" || userRole === "admin";

  // Translation hook for internationalization
  const t = useTranslations("ProviderModule");



  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      {/* Header with Facility Picker in Top Right */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-foreground">
            {t("facilityManagement.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("facilityManagement.subtitle")}
          </p>
        </div>
        
        {/* Facility Picker - Top Right */}
        <div className="flex items-center gap-3">
          {facilities.length > 0 && (
            <Select 
              value={selectedFacility?.id || ""} 
              onValueChange={(facilityId) => {
                if (facilityId === "add-new") {
                  setShowCreateFacility(true);
                } else {
                  const facility = facilities.find(f => f.id === facilityId);
                  if (facility) {
                    setSelectedFacility(facility);
                    // Save to localStorage
                    if (typeof window !== "undefined") {
                      localStorage.setItem(storageKey, facilityId);
                    }
                  }
                }
              }}
            >
              <SelectTrigger className="w-80">
                <SelectValue placeholder={t("facilityManagement.selectFacility")} />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{facility.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {canManageFacilities && (
                  <>
                    <Separator className="my-2" />
                    <SelectItem value="add-new" className="text-blue-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>{t("facilityManagement.addNewFacility")}</span>
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Essential Info and Working Hours - Side by Side */}
      {selectedFacility && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Essential Info Section */}
          <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("facilityDetails.essentialInfo")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Extract locale from pathname (e.g., /en/provider/... -> en)
                      const locale = pathname.split('/')[1] || 'en';
                      router.push(`/${locale}/facilities/${selectedFacility.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("facilityDetails.viewFacilityPage")}
                  </Button>
                  {canManageFacilities && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Extract locale and org slug from pathname (e.g., /en/provider/org-slug/facilities)
                        const pathParts = pathname.split('/');
                        const locale = pathParts[1] || 'en';
                        const orgSlug = pathParts[3] || '';
                        router.push(`/${locale}/provider/${orgSlug}/settings`);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t("facilityDetails.editBasicInfo")}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Facility Name */}
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t("facilityDetails.facilityName")}</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      {selectedFacility.name}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{t("facilityDetails.address")}</p>
                    <p className="text-sm text-gray-900">
                      {selectedFacility.address}, {selectedFacility.city}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {selectedFacility.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{t("facilityDetails.phone")}</p>
                      <p className="text-sm text-gray-900">{selectedFacility.phone}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {selectedFacility.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{t("facilityDetails.email")}</p>
                      <p className="text-sm text-gray-900">{selectedFacility.email}</p>
                    </div>
                  </div>
                )}

                {/* Website */}
                {selectedFacility.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{t("facilityDetails.website")}</p>
                      <a 
                        href={selectedFacility.website.startsWith('http') ? selectedFacility.website : `https://${selectedFacility.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedFacility.website}
                      </a>
                    </div>
                  </div>
                )}

                {/* Show message if no phone or email */}
                {!selectedFacility.phone && !selectedFacility.email && !selectedFacility.website && (
                  <p className="text-sm text-gray-500 italic">{t("facilityDetails.noContactInfo")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Working Hours Section */}
          <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  {t("facilityDetails.workingHours")}
                </CardTitle>
                {canManageFacilities && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditHours(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("facilityDetails.editHours")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const hours = parseWorkingHours(selectedFacility.workingHours);
                
                if (!hours) {
                  return (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm italic">{t("facilityDetails.noWorkingHours")}</p>
                      <p className="text-xs mt-1">{t("facilityDetails.configureHours")}</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-1">
                    {DAY_ORDER.map((day) => {
                      const dayHours = hours[day];
                      return (
                        <div key={day} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium text-gray-700 w-12">
                            {DAY_LABELS_SHORT[day]}
                          </span>
                          <span className={`text-sm ${dayHours?.closed ? 'text-gray-500' : 'text-gray-900'}`}>
                            {formatDayHours(dayHours, "Closed")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Images and Description & Rules - Side by Side */}
      {selectedFacility && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images Section */}
          <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("images.title")}</CardTitle>
                {canManageFacilities && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditImages(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("images.editImages")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Combine imageUrl (if exists) with images array, removing duplicates
                const allImages = [
                  ...(selectedFacility.imageUrl && !selectedFacility.images?.includes(selectedFacility.imageUrl) 
                    ? [selectedFacility.imageUrl] 
                    : []),
                  ...(selectedFacility.images || [])
                ];

                return allImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {allImages.map((image, index) => {
                        const isDefault = selectedFacility.imageUrl === image;
                        return (
                          <div key={index} className="relative group">
                              <div className={`relative aspect-square w-full bg-muted rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                                isDefault ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-transparent hover:border-border hover:shadow-sm'
                              }`}>
                                <OptimizedImage
                                  src={image}
                                  fallbackSrc={DEFAULT_FACILITY_IMAGE}
                                  alt={`Facility image ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                              {isDefault && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-blue-600 text-white">
                                    {t("images.defaultBadge")}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">{t("images.noImages")}</p>
                    <p className="text-xs text-gray-500 mb-4">
                      {t("images.noImagesDesc")}
                    </p>
                    {canManageFacilities && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditImages(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t("images.uploadImages")}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Description and Rules Section */}
          <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("content.title")}</CardTitle>
                {canManageFacilities && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditContentRules(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("content.editContent")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">{t("content.description")}</TabsTrigger>
                  <TabsTrigger value="rules">{t("content.rules")}</TabsTrigger>
                </TabsList>
                
                {/* Description Tab */}
                <TabsContent value="description" className="mt-4">
                  {selectedFacility.description ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedFacility.description}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm mb-2">{t("content.noDescription")}</p>
                      {canManageFacilities && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditContentRules(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("content.addDescription")}
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Rules Tab */}
                <TabsContent value="rules" className="mt-4">
                  {selectedFacility.rules ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedFacility.rules}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm mb-2">{t("content.noRules")}</p>
                      {canManageFacilities && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditContentRules(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {t("content.addRules")}
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sports & Courts Management Section */}
      {selectedFacility && (
        <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <CardContent className="p-6">
            <SportsCourtsSection
              facilityId={selectedFacility.id}
              sportCategories={selectedFacility.sportCategories}
              workingHours={selectedFacility.workingHours}
              canManage={canManageFacilities}
              onRefresh={() => {
                // Trigger page refresh to get updated data
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Facility Selected */}
      {!selectedFacility && facilities.length === 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("facilityManagement.noFacilitiesTitle")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {canManageFacilities
                ? t("facilityManagement.noFacilitiesDesc")
                : t("facilityManagement.noFacilitiesDescMember")}
            </p>
            {canManageFacilities && (
              <Button
                onClick={() => setShowCreateFacility(true)}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t("facilityManagement.createFirstFacility")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Facility Dialogs */}
      {showCreateFacility && (
        <div className="text-center p-8">
          <p className="text-gray-500">Create Facility Dialog - Coming Soon</p>
        </div>
      )}

      {/* Focused Edit Dialogs */}

      {showEditHours && selectedFacility && (
        <EditHoursDialog
          facility={selectedFacility}
          onClose={() => setShowEditHours(false)}
          onSuccess={async (workingHours) => {
            const response = await fetch(`/api/facilities/${selectedFacility.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workingHours }),
            });
            if (!response.ok) throw new Error("Failed to update");
            const updated = await response.json();
            if (onEditFacility) await onEditFacility(selectedFacility.id, updated);
            router.refresh();
          }}
        />
      )}

      {showEditImages && selectedFacility && (
        <EditImagesDialog
          facility={selectedFacility}
          onClose={() => setShowEditImages(false)}
          onSuccess={async (data) => {
            const response = await fetch(`/api/facilities/${selectedFacility.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update");
            const updated = await response.json();
            if (onEditFacility) await onEditFacility(selectedFacility.id, updated);
            router.refresh();
          }}
        />
      )}

      {showEditContentRules && selectedFacility && (
        <EditContentRulesDialog
          facility={selectedFacility}
          onClose={() => setShowEditContentRules(false)}
          onSuccess={async (data) => {
            const response = await fetch(`/api/facilities/${selectedFacility.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to update");
            const updated = await response.json();
            if (onEditFacility) await onEditFacility(selectedFacility.id, updated);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}


