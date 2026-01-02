"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Amenity {
  id: string;
  label: string;
  icon: string;
  category: string;
  description?: string;
}

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  className?: string;
}

// Only the amenities that are actually used in the facilities page filters
const AMENITIES: Amenity[] = [
  { id: "parking", label: "Free Parking", icon: "🚗", category: "Basic", description: "Free parking available" },
  { id: "showers", label: "Showers", icon: "🚿", category: "Basic", description: "Shower facilities" },
  { id: "lockers", label: "Lockers", icon: "🔒", category: "Basic", description: "Secure storage lockers" },
  { id: "cafe", label: "Cafe", icon: "☕", category: "Food & Drink", description: "Cafe and refreshments" },
  { id: "lighting", label: "Lighting", icon: "💡", category: "Basic", description: "Professional lighting" },
];

const CATEGORIES = [
  "Basic",
  "Food & Drink"
];

export function AmenitiesSelector({ 
  selectedAmenities, 
  onAmenitiesChange, 
  className = "" 
}: AmenitiesSelectorProps) {
  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    if (checked) {
      onAmenitiesChange([...selectedAmenities, amenityId]);
    } else {
      onAmenitiesChange(selectedAmenities.filter(id => id !== amenityId));
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Facility Amenities</h3>
          <p className="text-sm text-gray-600">
            Click to select the amenities your facility offers
          </p>
        </div>
        <Badge variant="secondary">
          {selectedAmenities.length} selected
        </Badge>
      </div>

      {/* Simple Amenities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AMENITIES.map((amenity) => (
          <div 
            key={amenity.id} 
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedAmenities.includes(amenity.id) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleAmenityToggle(amenity.id, !selectedAmenities.includes(amenity.id))}
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                id={amenity.id}
                checked={selectedAmenities.includes(amenity.id)}
                onCheckedChange={(checked) => 
                  handleAmenityToggle(amenity.id, checked as boolean)
                }
                className="pointer-events-none"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{amenity.icon}</span>
                  <Label
                    htmlFor={amenity.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {amenity.label}
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {amenity.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Amenities Summary */}
      {selectedAmenities.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Selected Amenities ({selectedAmenities.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map(amenityId => {
              const amenity = AMENITIES.find(a => a.id === amenityId);
              if (!amenity) return null;
              
              return (
                <Badge key={amenityId} variant="secondary" className="text-xs">
                  <span className="mr-1">{amenity.icon}</span>
                  {amenity.label}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
