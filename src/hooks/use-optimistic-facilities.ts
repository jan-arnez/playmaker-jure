"use client";

import { useCallback } from 'react';
import { useOptimisticMutations } from './use-optimistic-updates';

export interface Facility {
  id: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  status: 'active' | 'inactive' | 'maintenance';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFacilityData {
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  organizationId: string;
}

export interface UpdateFacilityData {
  name?: string;
  description?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
  images?: string[];
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * Optimistic facilities hook for facility CRUD operations
 */
export function useOptimisticFacilities(
  initialFacilities: Facility[] = [],
  options: {
    successMessage?: string;
    errorMessage?: string;
    onFacilityCreated?: (facility: Facility) => void;
    onFacilityUpdated?: (facility: Facility) => void;
    onFacilityDeleted?: (facilityId: string) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const optimisticMutations = useOptimisticMutations(initialFacilities, {
    successMessage: options.successMessage || 'Facility updated successfully',
    errorMessage: options.errorMessage || 'Failed to update facility',
    onSuccess: options.onFacilityCreated,
    onError: options.onError
  });

  const createFacility = useCallback(async (facilityData: CreateFacilityData) => {
    const optimisticFacility: Facility = {
      id: `temp_${Date.now()}`,
      name: facilityData.name,
      description: facilityData.description,
      location: facilityData.location,
      capacity: facilityData.capacity,
      amenities: facilityData.amenities || [],
      images: facilityData.images || [],
      status: 'active',
      organizationId: facilityData.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return optimisticMutations.create(optimisticFacility, async (data) => {
      const response = await fetch('/api/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityData)
      });

      if (!response.ok) {
        throw new Error('Failed to create facility');
      }

      const result = await response.json();
      return result.facility;
    });
  }, [optimisticMutations]);

  const updateFacility = useCallback(async (
    facilityId: string, 
    updates: UpdateFacilityData
  ) => {
    return optimisticMutations.update(facilityId, updates, async (id, updateData) => {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update facility');
      }

      const result = await response.json();
      return result.facility;
    });
  }, [optimisticMutations]);

  const updateFacilityStatus = useCallback(async (
    facilityId: string, 
    status: 'active' | 'inactive' | 'maintenance'
  ) => {
    return updateFacility(facilityId, { status });
  }, [updateFacility]);

  const activateFacility = useCallback(async (facilityId: string) => {
    return updateFacilityStatus(facilityId, 'active');
  }, [updateFacilityStatus]);

  const deactivateFacility = useCallback(async (facilityId: string) => {
    return updateFacilityStatus(facilityId, 'inactive');
  }, [updateFacilityStatus]);

  const setMaintenanceMode = useCallback(async (facilityId: string) => {
    return updateFacilityStatus(facilityId, 'maintenance');
  }, [updateFacilityStatus]);

  const updateFacilityCapacity = useCallback(async (
    facilityId: string, 
    capacity: number
  ) => {
    return updateFacility(facilityId, { capacity });
  }, [updateFacility]);

  const updateFacilityAmenities = useCallback(async (
    facilityId: string, 
    amenities: string[]
  ) => {
    return updateFacility(facilityId, { amenities });
  }, [updateFacility]);

  const updateFacilityImages = useCallback(async (
    facilityId: string, 
    images: string[]
  ) => {
    return updateFacility(facilityId, { images });
  }, [updateFacility]);

  const deleteFacility = useCallback(async (facilityId: string) => {
    return optimisticMutations.remove(facilityId, async (id) => {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete facility');
      }

      return { success: true };
    });
  }, [optimisticMutations]);

  const getFacilityById = useCallback((facilityId: string) => {
    return optimisticMutations.data.find(facility => facility.id === facilityId);
  }, [optimisticMutations.data]);

  const getFacilitiesByStatus = useCallback((status: string) => {
    return optimisticMutations.data.filter(facility => facility.status === status);
  }, [optimisticMutations.data]);

  const getFacilitiesByOrganization = useCallback((organizationId: string) => {
    return optimisticMutations.data.filter(facility => facility.organizationId === organizationId);
  }, [optimisticMutations.data]);

  const getActiveFacilities = useCallback(() => {
    return getFacilitiesByStatus('active');
  }, [getFacilitiesByStatus]);

  const getInactiveFacilities = useCallback(() => {
    return getFacilitiesByStatus('inactive');
  }, [getFacilitiesByStatus]);

  const getMaintenanceFacilities = useCallback(() => {
    return getFacilitiesByStatus('maintenance');
  }, [getFacilitiesByStatus]);

  const searchFacilities = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return optimisticMutations.data.filter(facility => 
      facility.name.toLowerCase().includes(lowercaseQuery) ||
      facility.description?.toLowerCase().includes(lowercaseQuery) ||
      facility.location?.toLowerCase().includes(lowercaseQuery)
    );
  }, [optimisticMutations.data]);

  const getFacilitiesByAmenity = useCallback((amenity: string) => {
    return optimisticMutations.data.filter(facility => 
      facility.amenities?.includes(amenity)
    );
  }, [optimisticMutations.data]);

  const getFacilitiesByCapacity = useCallback((minCapacity: number) => {
    return optimisticMutations.data.filter(facility => 
      facility.capacity && facility.capacity >= minCapacity
    );
  }, [optimisticMutations.data]);

  return {
    facilities: optimisticMutations.data,
    isOptimistic: optimisticMutations.isOptimistic,
    getOptimisticItem: optimisticMutations.getOptimisticItem,
    rollbackOptimistic: optimisticMutations.rollbackOptimistic,
    rollbackAll: optimisticMutations.rollbackAll,
    clearErrors: optimisticMutations.clearErrors,
    
    // Facility operations
    createFacility,
    updateFacility,
    updateFacilityStatus,
    activateFacility,
    deactivateFacility,
    setMaintenanceMode,
    updateFacilityCapacity,
    updateFacilityAmenities,
    updateFacilityImages,
    deleteFacility,
    
    // Query helpers
    getFacilityById,
    getFacilitiesByStatus,
    getFacilitiesByOrganization,
    getActiveFacilities,
    getInactiveFacilities,
    getMaintenanceFacilities,
    searchFacilities,
    getFacilitiesByAmenity,
    getFacilitiesByCapacity
  };
}