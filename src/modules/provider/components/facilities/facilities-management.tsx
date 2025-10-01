"use client";

import {
  Building2,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Facility {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface FacilitiesManagementProps {
  _organization: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  facilities: Facility[];
  onCreateFacility?: () => void;
  onEditFacility?: (facility: Facility) => void;
  onDeleteFacility?: (facilityId: string) => void;
  onViewFacility?: (facilityId: string) => void;
}

export function FacilitiesManagement({
  _organization,
  userRole,
  facilities,
  onCreateFacility,
  onEditFacility,
  onDeleteFacility,
  onViewFacility,
}: FacilitiesManagementProps) {
  const t = useTranslations("ProviderModule.facilities");

  const canManageFacilities = userRole === "owner" || userRole === "admin";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        {canManageFacilities && onCreateFacility && (
          <Button onClick={onCreateFacility} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {t("createFacility")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("totalFacilities")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {facilities.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("facilitiesCreated")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("activeFacilities")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {facilities.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("currentlyActive")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t("recentlyAdded")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {
                facilities.filter((f) => {
                  const createdDate = new Date(f.createdAt);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return createdDate > thirtyDaysAgo;
                }).length
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("last30Days")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("facilitiesList")}</CardTitle>
          <CardDescription>{t("facilitiesListDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {facilities.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("location")}</TableHead>
                    <TableHead>{t("contact")}</TableHead>
                    <TableHead>{t("created")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {facility.name}
                          </div>
                          {facility.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {facility.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{facility.city}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {facility.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {facility.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{facility.phone}</span>
                            </div>
                          )}
                          {facility.email && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span>{facility.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDate(facility.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {onViewFacility && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewFacility(facility.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canManageFacilities && onEditFacility && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditFacility(facility)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canManageFacilities && onDeleteFacility && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteFacility(facility.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
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
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("noFacilities")}
              </h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                {t("noFacilitiesDescription")}
              </p>
              {canManageFacilities && onCreateFacility && (
                <Button onClick={onCreateFacility}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createFirstFacility")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
