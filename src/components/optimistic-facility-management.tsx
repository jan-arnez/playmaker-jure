"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimisticButton, OptimisticBadge, OptimisticIndicator, OptimisticList } from '@/components/ui/optimistic-indicator';
import { useOptimisticFacilities, Facility } from '@/hooks/use-optimistic-facilities';
import { 
  Building, 
  MapPin, 
  Users, 
  Star, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface OptimisticFacilityManagementProps {
  initialFacilities: Facility[];
  organizationId: string;
  onFacilityUpdate?: (facility: Facility) => void;
  onFacilityDelete?: (facilityId: string) => void;
  onError?: (error: string) => void;
}

export function OptimisticFacilityManagement({
  initialFacilities,
  organizationId,
  onFacilityUpdate,
  onFacilityDelete,
  onError
}: OptimisticFacilityManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFacility, setEditingFacility] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    facilities,
    isOptimistic,
    createFacility,
    updateFacility,
    updateFacilityStatus,
    activateFacility,
    deactivateFacility,
    setMaintenanceMode,
    deleteFacility,
    getFacilitiesByStatus,
    searchFacilities,
    rollbackOptimistic,
    clearErrors
  } = useOptimisticFacilities(initialFacilities, {
    successMessage: 'Facility updated successfully!',
    errorMessage: 'Failed to update facility. Please try again.',
    onFacilityUpdated: onFacilityUpdate,
    onFacilityDeleted: onFacilityDelete,
    onError: (error) => onError?.(error.message)
  });

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = searchQuery === '' || 
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || facility.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateFacility = async (data: {
    name: string;
    description?: string;
    location?: string;
    capacity?: number;
    amenities?: string[];
  }) => {
    try {
      await createFacility({
        ...data,
        organizationId
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create facility:', error);
    }
  };

  const handleUpdateFacility = async (facilityId: string, updates: Partial<Facility>) => {
    try {
      await updateFacility(facilityId, updates);
      setEditingFacility(null);
    } catch (error) {
      console.error('Failed to update facility:', error);
    }
  };

  const handleStatusChange = async (facilityId: string, status: 'active' | 'inactive' | 'maintenance') => {
    try {
      await updateFacilityStatus(facilityId, status);
    } catch (error) {
      console.error('Failed to update facility status:', error);
    }
  };

  const handleDelete = async (facilityId: string) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        await deleteFacility(facilityId);
      } catch (error) {
        console.error('Failed to delete facility:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const renderFacilityItem = (facility: Facility, index: number) => (
    <Card key={facility.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">{facility.name}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <OptimisticBadge
              isOptimistic={isOptimistic(facility.id)}
              status={isOptimistic(facility.id) ? 'pending' : 'success'}
              className={getStatusColor(facility.status)}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon(facility.status)}
                <span className="capitalize">{facility.status}</span>
              </div>
            </OptimisticBadge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Description */}
          {facility.description && (
            <p className="text-sm text-gray-600">{facility.description}</p>
          )}

          {/* Location */}
          {facility.location && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{facility.location}</span>
            </div>
          )}

          {/* Capacity */}
          {facility.capacity && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Capacity: {facility.capacity} people</span>
            </div>
          )}

          {/* Amenities */}
          {facility.amenities && facility.amenities.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Amenities:</p>
              <div className="flex flex-wrap gap-1">
                {facility.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              {facility.status === 'active' && (
                <OptimisticButton
                  size="sm"
                  variant="outline"
                  isOptimistic={isOptimistic(facility.id)}
                  onClick={() => handleStatusChange(facility.id, 'maintenance')}
                >
                  Set Maintenance
                </OptimisticButton>
              )}
              {facility.status === 'inactive' && (
                <OptimisticButton
                  size="sm"
                  variant="outline"
                  isOptimistic={isOptimistic(facility.id)}
                  onClick={() => handleStatusChange(facility.id, 'active')}
                >
                  Activate
                </OptimisticButton>
              )}
              {facility.status === 'maintenance' && (
                <OptimisticButton
                  size="sm"
                  variant="outline"
                  isOptimistic={isOptimistic(facility.id)}
                  onClick={() => handleStatusChange(facility.id, 'active')}
                >
                  Complete Maintenance
                </OptimisticButton>
              )}
            </div>

            <div className="flex space-x-2">
              <OptimisticButton
                size="sm"
                variant="ghost"
                isOptimistic={isOptimistic(facility.id)}
                onClick={() => setEditingFacility(facility.id)}
              >
                <Edit className="h-4 w-4" />
              </OptimisticButton>
              <OptimisticButton
                size="sm"
                variant="ghost"
                isOptimistic={isOptimistic(facility.id)}
                onClick={() => handleDelete(facility.id)}
              >
                <Trash2 className="h-4 w-4" />
              </OptimisticButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Facility Management</h2>
          <p className="text-gray-600">Manage your facilities and their status</p>
        </div>
        <div className="flex space-x-2">
          <OptimisticButton
            onClick={() => setIsCreating(true)}
            isOptimistic={false}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Facility
          </OptimisticButton>
          <Button
            variant="outline"
            size="sm"
            onClick={clearErrors}
          >
            Clear Errors
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {getFacilitiesByStatus('active').length}
            </div>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {getFacilitiesByStatus('maintenance').length}
            </div>
            <p className="text-sm text-gray-600">Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {getFacilitiesByStatus('inactive').length}
            </div>
            <p className="text-sm text-gray-600">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Facilities List */}
      <OptimisticList
        items={filteredFacilities.map(facility => ({
          id: facility.id,
          isOptimistic: isOptimistic(facility.id),
          status: isOptimistic(facility.id) ? 'pending' : 'success',
          data: facility
        }))}
        renderItem={renderFacilityItem}
        emptyMessage="No facilities found"
      />

      {/* Create Facility Modal */}
      {isCreating && (
        <CreateFacilityModal
          onClose={() => setIsCreating(false)}
          onCreate={handleCreateFacility}
        />
      )}

      {/* Edit Facility Modal */}
      {editingFacility && (
        <EditFacilityModal
          facility={facilities.find(f => f.id === editingFacility)!}
          onClose={() => setEditingFacility(null)}
          onUpdate={handleUpdateFacility}
        />
      )}
    </div>
  );
}

// Create Facility Modal Component
function CreateFacilityModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    capacity: '',
    amenities: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Facility</CardTitle>
          <CardDescription>Add a new facility to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter facility name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter facility description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter facility location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Enter capacity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="WiFi, Parking, etc."
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                Create Facility
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Facility Modal Component
function EditFacilityModal({ facility, onClose, onUpdate }: {
  facility: Facility;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Facility>) => void;
}) {
  const [formData, setFormData] = useState({
    name: facility.name,
    description: facility.description || '',
    location: facility.location || '',
    capacity: facility.capacity?.toString() || '',
    amenities: facility.amenities?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(facility.id, {
      ...formData,
      capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : []
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Facility</CardTitle>
          <CardDescription>Update facility information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter facility name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter facility description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter facility location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Enter capacity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="WiFi, Parking, etc."
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="submit" className="flex-1">
                Update Facility
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
