"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditImagesDialogProps {
  facility: {
    id: string;
    imageUrl?: string;
    images?: string[];
  };
  onClose: () => void;
  onSuccess: (data: { imageUrl?: string; images?: string[] }) => Promise<void>;
}

export function EditImagesDialog({ facility, onClose, onSuccess }: EditImagesDialogProps) {
  // Combine imageUrl and images, removing duplicates
  const allImages = [
    ...(facility.imageUrl && !facility.images?.includes(facility.imageUrl) 
      ? [facility.imageUrl] 
      : []),
    ...(facility.images || [])
  ];

  const [images, setImages] = useState<string[]>(allImages);
  const [defaultImage, setDefaultImage] = useState<string | undefined>(facility.imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/facility-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const result = await response.json();
        uploadedUrls.push(result.url);
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
        // If no default image is set, use the first uploaded image
        if (!defaultImage && uploadedUrls.length > 0) {
          setDefaultImage(uploadedUrls[0]);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    if (defaultImage === imageToRemove) {
      setDefaultImage(undefined);
    }
  };

  const setAsDefault = (image: string) => {
    setDefaultImage(image);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSuccess({
        imageUrl: defaultImage,
        images: images.filter(img => img !== defaultImage), // Remove default from images array
      });
      onClose();
    } catch (error) {
      console.error("Error updating images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Images</DialogTitle>
          <DialogDescription>
            Upload and manage facility images. Set one as the default image.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Images</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="flex-1"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>


          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => {
                const isDefault = defaultImage === image;
                return (
                  <div key={index} className="relative group">
                    <div className={`aspect-square w-full bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      isDefault ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                    }`}>
                      <img
                        src={image}
                        alt={`Facility image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isDefault && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-600 text-white">
                            Default
                          </Badge>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {!isDefault && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setAsDefault(image)}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">No images uploaded</p>
              <p className="text-xs text-gray-500">
                Upload images to showcase your facility
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

