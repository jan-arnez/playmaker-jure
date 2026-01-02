"use client";

import { useState } from "react";
import { Plus, Users, Settings, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateCourtForm } from "./create-court-form";

interface Facility {
  id: string;
  name: string;
  sportCategories: SportCategory[];
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

interface CourtManagementProps {
  facility: Facility;
  selectedCategory: SportCategory | null;
  onCreateCourt: () => void;
  onEditCourt?: (courtId: string, court: Partial<Court>) => Promise<void>;
  onDeleteCourt?: (courtId: string) => Promise<void>;
  onToggleCourtStatus?: (courtId: string, isActive: boolean) => Promise<void>;
}

export function CourtManagement({
  facility,
  selectedCategory,
  onCreateCourt,
  onEditCourt,
  onDeleteCourt,
  onToggleCourtStatus,
}: CourtManagementProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [showCreateCourt, setShowCreateCourt] = useState(false);

  const getCourtStats = () => {
    if (!selectedCategory) {
      const totalCourts = facility.sportCategories.reduce((sum, cat) => sum + cat.courts.length, 0);
      const activeCourts = facility.sportCategories.reduce((sum, cat) => 
        sum + cat.courts.filter(court => court.isActive).length, 0
      );
      return { totalCourts, activeCourts };
    }
    
    const totalCourts = selectedCategory.courts.length;
    const activeCourts = selectedCategory.courts.filter(court => court.isActive).length;
    return { totalCourts, activeCourts };
  };

  const getCourtsToDisplay = () => {
    if (selectedCategory) {
      return selectedCategory.courts;
    }
    
    // Show all courts from all categories
    return facility.sportCategories.flatMap(cat => 
      cat.courts.map(court => ({
        ...court,
        categoryName: cat.name,
        categoryType: cat.type
      }))
    );
  };

  const stats = getCourtStats();
  const courtsToDisplay = getCourtsToDisplay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("courts")} - {facility.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {selectedCategory 
              ? `${t("courtsFor")} ${selectedCategory.name}`
              : t("allCourtsDescription")
            }
          </p>
        </div>
        <Dialog open={showCreateCourt} onOpenChange={setShowCreateCourt}>
          <DialogTrigger asChild>
            <Button onClick={onCreateCourt} disabled={!selectedCategory}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createCourt")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createCourt")}</DialogTitle>
              <DialogDescription>
                {selectedCategory 
                  ? `${t("createCourtFor")} ${selectedCategory.name}`
                  : t("createCourtDescription")
                }
              </DialogDescription>
            </DialogHeader>
            {selectedCategory && (
              <CreateCourtForm
                sportCategoryId={selectedCategory.id}
                onSuccess={() => {
                  setShowCreateCourt(false);
                  // Refresh courts
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("totalCourts")}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("activeCourts")}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCourts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("inactiveCourts")}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourts - stats.activeCourts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courts List */}
      {courtsToDisplay.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courtsToDisplay.map((court) => (
            <Card key={court.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {court.name}
                      <Badge variant={court.isActive ? "default" : "secondary"}>
                        {court.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </CardTitle>
                    {court.description && (
                      <CardDescription className="mt-1">
                        {court.description}
                      </CardDescription>
                    )}
                    {!selectedCategory && 'categoryName' in court && (
                      <Badge variant="outline" className="mt-2">
                        {(court as any).categoryName}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-gray-600">
                  {court.surface && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>{t("surface")}: {court.surface}</span>
                    </div>
                  )}
                  {court.capacity && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{t("capacity")}: {court.capacity}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleCourtStatus?.(court.id, !court.isActive)}
                  >
                    {court.isActive ? t("deactivate") : t("activate")}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Handle view
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCourt?.(court.id, court)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCourt?.(court.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCategory ? t("noCourtsInCategory") : t("noCourtsFound")}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory 
                ? t("noCourtsInCategoryDescription")
                : t("noCourtsDescription")
              }
            </p>
            {selectedCategory && (
              <Button onClick={onCreateCourt}>
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirstCourt")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
