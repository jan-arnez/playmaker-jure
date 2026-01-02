"use client";

import { useState } from "react";
import { Upload, X, Plus, Clock, Euro, Users, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getEmptyWorkingHours } from "@/lib/working-hours";

interface CreateFacilityDialogProps {
  organizationId: string;
  onClose: () => void;
  onSuccess: (facility: any) => void;
}

// Only the amenities that are actually used in the facilities page filters
const FACILITY_AMENITIES = [
  { id: "parking", label: "Free Parking", icon: "🚗" },
  { id: "showers", label: "Showers", icon: "🚿" },
  { id: "lockers", label: "Lockers", icon: "🔒" },
  { id: "cafe", label: "Cafe", icon: "☕" },
  { id: "lighting", label: "Lighting", icon: "💡" },
];

const SURFACE_TYPES = [
  "Hard Court",
  "Clay Court", 
  "Grass Court",
  "Synthetic",
  "Wood",
  "Concrete",
  "Carpet",
  "Artificial Grass",
  "Other"
];


export function CreateFacilityDialog({ organizationId, onClose, onSuccess }: CreateFacilityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    
    // Facility Details
    locationType: "indoor" as "indoor" | "outdoor",
    surface: "",
    capacity: "",
    pricePerHour: "",
    currency: "EUR",
    status: "active" as "active" | "inactive" | "maintenance",
    
    // Images and Amenities
    images: [] as string[],
    facilities: [] as string[],
    
    // Working Hours
    workingHours: getEmptyWorkingHours(),
    
    // Rules
    rules: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Facility name is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
    }
    
    if (step === 2) {
      if (formData.capacity && isNaN(Number(formData.capacity))) {
        newErrors.capacity = "Capacity must be a number";
      }
      if (formData.pricePerHour && isNaN(Number(formData.pricePerHour))) {
        newErrors.pricePerHour = "Price must be a number";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create facility");
      }

      const facility = await response.json();
      onSuccess(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      setErrors({ submit: "Failed to create facility. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, amenityId]
        : prev.facilities.filter(id => id !== amenityId)
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }));
  };

  const steps = [
    { number: 1, title: "Basic Information", description: "Facility name, location, and contact details" },
    { number: 2, title: "Facility Details", description: "Type, capacity, pricing, and amenities" },
    { number: 3, title: "Working Hours", description: "Set operating hours for each day" },
    { number: 4, title: "Rules & Policies", description: "Facility rules and policies" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Facility</h2>
            <p className="text-gray-600">Step {currentStep} of 4: {steps[currentStep - 1].title}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.number 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {step.number}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? "text-blue-600" : "text-gray-500"
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter facility name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your facility"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Website URL"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="locationType">Location Type</Label>
                  <Select 
                    value={formData.locationType} 
                    onValueChange={(value: "indoor" | "outdoor") => 
                      setFormData(prev => ({ ...prev, locationType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indoor">Indoor</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface Type</Label>
                  <Select 
                    value={formData.surface} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, surface: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select surface type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SURFACE_TYPES.map((surface) => (
                        <SelectItem key={surface} value={surface}>
                          {surface}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                      placeholder="Max capacity"
                      className="pl-10"
                    />
                  </div>
                  {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price per Hour</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="pricePerHour"
                      type="number"
                      step="0.01"
                      value={formData.pricePerHour}
                      onChange={(e) => setFormData(prev => ({ ...prev, pricePerHour: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                  {errors.pricePerHour && <p className="text-sm text-red-500">{errors.pricePerHour}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {FACILITY_AMENITIES.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.facilities.includes(amenity.id)}
                        onCheckedChange={(checked) => 
                          handleAmenityChange(amenity.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <span className="text-lg">{amenity.icon}</span>
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {Object.entries(formData.workingHours).map(([day, hours]) => (
                  <Card key={day}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="font-medium capitalize w-20">{day}</h3>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!hours.closed}
                              onCheckedChange={(checked) => 
                                handleWorkingHoursChange(day, "closed", !checked)
                              }
                            />
                            <span className="text-sm text-gray-600">
                              {hours.closed ? "Closed" : "Open"}
                            </span>
                          </div>
                        </div>
                        {!hours.closed && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => 
                                handleWorkingHoursChange(day, "open", e.target.value)
                              }
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => 
                                handleWorkingHoursChange(day, "close", e.target.value)
                              }
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rules">Facility Rules & Policies</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder="Enter facility rules, policies, and important information for customers..."
                  rows={8}
                />
                <p className="text-sm text-gray-500">
                  Include important information like dress codes, booking policies, cancellation rules, etc.
                </p>
              </div>
            </div>
          )}

          {errors.submit && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handlePrevious}
          >
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Facility"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
