"use client";

import { useState } from "react";
import { Plus, Home, Sun, Users, Settings, Edit, Trash2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateSportCategoryForm } from "./create-sport-category-form";

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

interface SportCategoryManagementProps {
  facility: Facility;
  onCategorySelect: (category: SportCategory) => void;
  selectedCategory: SportCategory | null;
  onCreateCategory: () => void;
  onEditCategory?: (categoryId: string, category: Partial<SportCategory>) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export function SportCategoryManagement({
  facility,
  onCategorySelect,
  selectedCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: SportCategoryManagementProps) {
  // const t = useTranslations("ProviderModule.facilities");
  const t = (key: string) => key;
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const getCategoryStats = (category: SportCategory) => {
    const totalCourts = category.courts.length;
    const activeCourts = category.courts.filter(court => court.isActive).length;
    return { totalCourts, activeCourts };
  };

  const indoorCategories = facility.sportCategories.filter(cat => cat.type === "indoor");
  const outdoorCategories = facility.sportCategories.filter(cat => cat.type === "outdoor");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("sportCategories")} - {facility.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {t("manageSportCategoriesDescription")}
          </p>
        </div>
        <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
          <DialogTrigger asChild>
            <Button onClick={onCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createCategory")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createSportCategory")}</DialogTitle>
              <DialogDescription>
                {t("createSportCategoryDescription")}
              </DialogDescription>
            </DialogHeader>
            <CreateSportCategoryForm
              facilityId={facility.id}
              onSuccess={() => {
                setShowCreateCategory(false);
                // Refresh categories
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Indoor Categories */}
      {indoorCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="h-5 w-5" />
            {t("indoorCategories")} ({indoorCategories.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indoorCategories.map((category) => {
              const stats = getCategoryStats(category);
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory?.id === category.id 
                      ? "ring-2 ring-blue-500 bg-blue-50" 
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => onCategorySelect(category)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        <Home className="h-3 w-3 mr-1" />
                        {t("indoor")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{stats.totalCourts} {t("courts")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span>{stats.activeCourts} {t("active")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle view
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory?.(category.id, category);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory?.(category.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Outdoor Categories */}
      {outdoorCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5" />
            {t("outdoorCategories")} ({outdoorCategories.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outdoorCategories.map((category) => {
              const stats = getCategoryStats(category);
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory?.id === category.id 
                      ? "ring-2 ring-blue-500 bg-blue-50" 
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => onCategorySelect(category)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        <Sun className="h-3 w-3 mr-1" />
                        {t("outdoor")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{stats.totalCourts} {t("courts")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span>{stats.activeCourts} {t("active")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle view
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory?.(category.id, category);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory?.(category.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {facility.sportCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("noCategoriesFound")}
            </h3>
            <p className="text-gray-500 mb-4">
              {t("noCategoriesDescription")}
            </p>
            <Button onClick={onCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createFirstCategory")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
