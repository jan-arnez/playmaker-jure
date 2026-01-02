"use client";

import { Building2, Calendar, Users, Settings, Eye, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress"; // Component doesn't exist
import { useTranslations } from "next-intl";

interface Facility {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  imageUrl?: string;
  status: "active" | "inactive" | "maintenance";
  todayBookings: number;
  totalBookings: number;
  occupancyRate: number;
  sportCategories: Array<{
    id: string;
    name: string;
    courts: Array<{
      id: string;
      name: string;
      isActive: boolean;
    }>;
  }>;
}

interface FacilitiesGridProps {
  facilities: Facility[];
  onViewFacility?: (facilityId: string) => void;
  onManageFacility?: (facilityId: string) => void;
  onAddBooking?: (facilityId: string) => void;
  onCreateFacility?: () => void;
  canManageFacilities?: boolean;
}

export function FacilitiesGrid({
  facilities = [],
  onViewFacility,
  onManageFacility,
  onAddBooking,
  onCreateFacility,
  canManageFacilities = false,
}: FacilitiesGridProps) {
  const t = useTranslations("ProviderModule.dashboard");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case "maintenance":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const totalCourts = facilities.reduce((sum, facility) => 
    sum + facility.sportCategories.reduce((catSum, category) => 
      catSum + category.courts.length, 0), 0
  );

  const activeCourts = facilities.reduce((sum, facility) => 
    sum + facility.sportCategories.reduce((catSum, category) => 
      catSum + category.courts.filter(court => court.isActive).length, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Facilities</h2>
          <p className="text-xs text-gray-600">
            {facilities.length} facilities • {activeCourts}/{totalCourts} courts
          </p>
        </div>
        {canManageFacilities && onCreateFacility && (
          <Button onClick={onCreateFacility} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        )}
      </div>

      {/* Facilities Grid */}
      {facilities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Facilities Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first facility to start managing bookings
            </p>
            {canManageFacilities && onCreateFacility && (
              <Button onClick={onCreateFacility}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Facility
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {facilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{facility.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{facility.city}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(facility.status)}
                    <Badge className={`${getStatusColor(facility.status)} text-xs`}>
                      {facility.status}
                    </Badge>
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {facility.todayBookings}
                    </div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getOccupancyColor(facility.occupancyRate)}`}>
                      {facility.occupancyRate}%
                    </div>
                    <div className="text-xs text-gray-500">Occupancy</div>
                  </div>
                </div>

                {/* Sport Categories - Compact */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {facility.sportCategories.slice(0, 2).map((category) => (
                      <Badge key={category.id} variant="secondary" className="text-xs">
                        {category.name}
                      </Badge>
                    ))}
                    {facility.sportCategories.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{facility.sportCategories.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Compact */}
                <div className="flex space-x-1">
                  {onViewFacility && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => onViewFacility(facility.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  )}
                  {onAddBooking && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => onAddBooking(facility.id)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
