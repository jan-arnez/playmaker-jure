"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComprehensiveFacilityManagement } from "@/modules/provider/components/facilities/comprehensive-facility-management";

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
  organizationId: string;
  sportCategories: {
    id: string;
    name: string;
    description?: string;
    type: "indoor" | "outdoor";
    createdAt: string;
    updatedAt: string;
    courts: {
      id: string;
      name: string;
      description?: string;
      surface?: string;
      capacity?: number;
      isActive: boolean;
      timeSlots: string[];
      locationType?: "indoor" | "outdoor";
      workingHours?: any;
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
      createdAt: string;
      updatedAt: string;
    }[];
  }[];
  _count: {
    bookings: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FacilitiesClientProps {
  organizationId: string;
  userRole: string;
  facilities: Facility[];
}

export function FacilitiesClient({ organizationId, userRole, facilities: initialFacilities }: FacilitiesClientProps) {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Update facilities state when initialFacilities changes
  useEffect(() => {
    setFacilities(initialFacilities);
  }, [initialFacilities]);

  const refreshFacilities = async () => {
    setIsLoading(true);
    try {
      // Refresh the page to get updated data from server
      router.refresh();
    } catch (error) {
      console.error("Error refreshing facilities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFacility = async (facilityData: any) => {
    // Handle facility creation
    console.log("Creating facility:", facilityData);
    // After creation, refresh the data
    await refreshFacilities();
  };

  const handleEditFacility = async (facilityId: string, facilityData: any) => {
    // Handle facility editing
    console.log("Editing facility:", facilityId, facilityData);
    // After editing, refresh the data
    await refreshFacilities();
  };

  const handleDeleteFacility = async (facilityId: string) => {
    // Handle facility deletion
    console.log("Deleting facility:", facilityId);
    // After deletion, refresh the data
    await refreshFacilities();
  };

  const handleViewFacility = (facilityId: string) => {
    // Handle facility viewing
    console.log("Viewing facility:", facilityId);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Updating facilities...</span>
          </div>
        </div>
      )}
      <ComprehensiveFacilityManagement
        organizationId={organizationId}
        userRole={userRole}
        facilities={facilities}
        onCreateFacility={handleCreateFacility}
        onEditFacility={handleEditFacility}
        onDeleteFacility={handleDeleteFacility}
        onViewFacility={handleViewFacility}
      />
    </div>
  );
}
